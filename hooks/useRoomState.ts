import { useCallback, useEffect, useRef } from 'react'
import { RoomState, User, Vote, Screen } from '@/types'

export function useRoomState() {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)

  const saveRoomState = useCallback(async (state: RoomState) => {
    try {
      const response = await fetch(`/api/rooms/${state.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to save room state:', error)
      // Fallback to localStorage
      localStorage.setItem(`room_${state.code}`, JSON.stringify(state))
    }
  }, [])

  const loadRoomState = useCallback(async (code: string): Promise<RoomState | null> => {
    try {
      const response = await fetch(`/api/rooms/${code}`)
      
      if (response.ok) {
        return await response.json()
      } else if (response.status === 404) {
        return null
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to load room state:', error)
      // Fallback to localStorage
      const stored = localStorage.getItem(`room_${code}`)
      return stored ? JSON.parse(stored) : null
    }
  }, [])

  const subscribeToRoom = useCallback((roomCode: string, onUpdate: (state: RoomState) => void, onConnectionChange?: (connected: boolean) => void) => {
    console.log('Starting polling for room:', roomCode)
    
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    let consecutiveErrors = 0
    const maxErrors = 3

    const poll = async () => {
      try {
        const state = await loadRoomState(roomCode)
        if (state) {
          // Only update if the state has actually changed
          if (state.lastUpdated > lastUpdateRef.current) {
            lastUpdateRef.current = state.lastUpdated
            onUpdate(state)
          }
          consecutiveErrors = 0
          onConnectionChange?.(true)
        }
      } catch (error) {
        console.error('Polling error:', error)
        consecutiveErrors++
        
        if (consecutiveErrors >= maxErrors) {
          onConnectionChange?.(false)
        }
      }
    }

    // Initial poll
    poll()
    
    // Poll every 1.5 seconds for responsive updates
    pollingIntervalRef.current = setInterval(poll, 1500)
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      lastUpdateRef.current = 0
    }
  }, [loadRoomState])

  const updateUserInRoom = useCallback(async (roomCode: string, user: User, setRoomState: (state: RoomState) => void) => {
    const state = await loadRoomState(roomCode)
    if (state) {
      const updatedUsers = state.users.map(u => 
        u.id === user.id ? { ...user, lastSeen: Date.now() } : u
      )
      
      // Add user if not exists
      if (!updatedUsers.find(u => u.id === user.id)) {
        updatedUsers.push({ ...user, lastSeen: Date.now() })
      }
      
      const updatedState = {
        ...state,
        users: updatedUsers,
        lastUpdated: Date.now()
      }
      
      await saveRoomState(updatedState)
      setRoomState(updatedState)
    }
  }, [loadRoomState, saveRoomState])

  const updateRoomScreen = useCallback(async (roomCode: string, screen: Screen, setRoomState: (state: RoomState) => void) => {
    const state = await loadRoomState(roomCode)
    if (state) {
      const updatedState = {
        ...state,
        currentScreen: screen,
        lastUpdated: Date.now()
      }
      
      if (screen === 'voting') {
        // Clear votes when starting new voting round
        updatedState.votes = []
      }
      
      await saveRoomState(updatedState)
      setRoomState(updatedState)
    }
  }, [loadRoomState, saveRoomState])

  const submitUserVotes = useCallback(async (roomCode: string, votes: Vote[], currentUserId: string, setRoomState: (state: RoomState) => void) => {
    const state = await loadRoomState(roomCode)
    if (state) {
      // Remove existing votes from this user and add new ones
      const filteredVotes = state.votes.filter(v => v.userId !== currentUserId)
      const updatedState = {
        ...state,
        votes: [...filteredVotes, ...votes],
        lastUpdated: Date.now()
      }
      
      await saveRoomState(updatedState)
      setRoomState(updatedState)
    }
  }, [loadRoomState, saveRoomState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  return {
    saveRoomState,
    loadRoomState,
    subscribeToRoom,
    updateUserInRoom,
    updateRoomScreen,
    submitUserVotes
  }
}
