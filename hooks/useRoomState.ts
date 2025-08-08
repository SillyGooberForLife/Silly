import { useCallback } from 'react'
import { RoomState, User, Vote, Screen } from '@/types'

export function useRoomState() {
  const saveRoomState = useCallback((state: RoomState) => {
    localStorage.setItem(`room_${state.code}`, JSON.stringify(state))
  }, [])

  const loadRoomState = useCallback((code: string): RoomState | null => {
    const stored = localStorage.getItem(`room_${code}`)
    if (stored) {
      return JSON.parse(stored)
    }
    return null
  }, [])

  const updateUserInRoom = useCallback((roomCode: string, user: User, setRoomState: (state: RoomState) => void) => {
    const state = loadRoomState(roomCode)
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
      
      saveRoomState(updatedState)
      setRoomState(updatedState)
    }
  }, [loadRoomState, saveRoomState])

  const updateRoomScreen = useCallback((roomCode: string, screen: Screen, setRoomState: (state: RoomState) => void) => {
    const state = loadRoomState(roomCode)
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
      
      saveRoomState(updatedState)
      setRoomState(updatedState)
    }
  }, [loadRoomState, saveRoomState])

  const submitUserVotes = useCallback((roomCode: string, votes: Vote[], currentUserId: string, setRoomState: (state: RoomState) => void) => {
    const state = loadRoomState(roomCode)
    if (state) {
      // Remove existing votes from this user and add new ones
      const filteredVotes = state.votes.filter(v => v.userId !== currentUserId)
      const updatedState = {
        ...state,
        votes: [...filteredVotes, ...votes],
        lastUpdated: Date.now()
      }
      
      saveRoomState(updatedState)
      setRoomState(updatedState)
    }
  }, [loadRoomState, saveRoomState])

  return {
    saveRoomState,
    loadRoomState,
    updateUserInRoom,
    updateRoomScreen,
    submitUserVotes
  }
}
