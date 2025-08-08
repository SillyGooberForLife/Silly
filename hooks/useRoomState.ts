import { useCallback } from 'react'
import { RoomState, User, Vote, UserSubmission, Screen } from '@/types'

export function useRoomState() {
  const saveRoomState = useCallback((state: RoomState) => {
    localStorage.setItem(`room_${state.code}`, JSON.stringify(state))
  }, [])

  const loadRoomState = useCallback((code: string): RoomState | null => {
    const stored = localStorage.getItem(`room_${code}`)
    if (stored) {
      const state = JSON.parse(stored)
      // Ensure submissions array exists for backward compatibility
      if (!state.submissions) {
        state.submissions = []
      }
      return state
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
        // Clear votes and submissions when starting new voting round
        updatedState.votes = []
        updatedState.submissions = []
      }
      
      saveRoomState(updatedState)
      setRoomState(updatedState)
    }
  }, [loadRoomState, saveRoomState])

  const updateRoomTask = useCallback((roomCode: string, task: string, setRoomState: (state: RoomState) => void) => {
    const state = loadRoomState(roomCode)
    if (state) {
      const updatedState = {
        ...state,
        currentTask: task,
        lastUpdated: Date.now()
      }
      
      saveRoomState(updatedState)
      setRoomState(updatedState)
    }
  }, [loadRoomState, saveRoomState])

  const submitUserVotes = useCallback((roomCode: string, votes: Vote[], currentUserId: string, currentUserName: string, setRoomState: (state: RoomState) => void) => {
    const state = loadRoomState(roomCode)
    if (state) {
      // Remove existing votes and submission from this user
      const filteredVotes = state.votes.filter(v => v.userId !== currentUserId)
      const filteredSubmissions = state.submissions.filter(s => s.userId !== currentUserId)
      
      // Add new submission record
      const newSubmission: UserSubmission = {
        userId: currentUserId,
        userName: currentUserName,
        timestamp: Date.now(),
        hasVotes: votes.length > 0
      }
      
      const updatedState = {
        ...state,
        votes: [...filteredVotes, ...votes],
        submissions: [...filteredSubmissions, newSubmission],
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
    updateRoomTask,
    submitUserVotes
  }
}
