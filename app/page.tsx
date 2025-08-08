'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useRoomState } from '@/hooks/useRoomState'
import { MenuScreen } from '@/components/screens/MenuScreen'
import { WaitingScreen } from '@/components/screens/WaitingScreen'
import { VotingScreen } from '@/components/screens/VotingScreen'
import { RevealScreen } from '@/components/screens/RevealScreen'
import { User, Group, FibonacciValue, Vote, RoomState, Screen } from '@/types'
import { groupNames } from '@/constants'

export default function FibonacciVotingApp() {
  const { toast } = useToast()
  const { saveRoomState, loadRoomState, updateUserInRoom, updateRoomScreen, submitUserVotes } = useRoomState()
  
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu')
  const [currentUser, setCurrentUser] = useState<User>({
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    groups: [],
    isAdmin: false,
    isOnline: true,
    lastSeen: Date.now()
  })
  const [roomCode, setRoomCode] = useState('')
  const [joinRoomCode, setJoinRoomCode] = useState('')
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [userVotes, setUserVotes] = useState<{[key: string]: FibonacciValue}>({})
  const [showAdmin, setShowAdmin] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [votingComplete, setVotingComplete] = useState(false)

  // Polling for room updates
  useEffect(() => {
    if (!roomCode) return

    const pollInterval = setInterval(() => {
      const state = loadRoomState(roomCode)
      if (state) {
        updateUserInRoom(roomCode, currentUser, setRoomState)
        
        // Clean up offline users (not seen for 30 seconds)
        const now = Date.now()
        const activeUsers = state.users.filter(u => now - u.lastSeen < 30000)
        
        if (activeUsers.length !== state.users.length) {
          const updatedState = {
            ...state,
            users: activeUsers,
            lastUpdated: now
          }
          saveRoomState(updatedState)
          setRoomState(updatedState)
        } else {
          setRoomState(state)
        }
        
        // Sync screen state for non-admin users
        if (!currentUser.isAdmin && state.currentScreen !== currentScreen) {
          setCurrentScreen(state.currentScreen)
          if (state.currentScreen === 'voting') {
            setUserVotes({})
            setSelectedGroup(null)
            setVotingComplete(false)
          }
        }
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [roomCode, currentUser, currentScreen, loadRoomState, updateUserInRoom, saveRoomState])

  // Load room from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const roomParam = urlParams.get('room')
    if (roomParam) {
      setJoinRoomCode(roomParam)
    }
  }, [])

  // Generate room code
  const generateRoomCode = () => {
    const code = Math.random().toString(36).substr(2, 6).toUpperCase()
    setRoomCode(code)
    
    const adminUser = { ...currentUser, isAdmin: true, lastSeen: Date.now() }
    setCurrentUser(adminUser)
    
    const newRoomState: RoomState = {
      code,
      currentScreen: 'waiting',
      users: [adminUser],
      votes: [],
      adminId: adminUser.id,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    }
    
    saveRoomState(newRoomState)
    setRoomState(newRoomState)
    
    // Update URL
    window.history.pushState({}, '', `?room=${code}`)
    
    toast({
      title: "Room Created!",
      description: `Room code: ${code}`,
    })
  }

  // Join room
  const joinRoom = async () => {
    if (!joinRoomCode || !currentUser.name || currentUser.groups.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please enter your name, select groups, and provide a room code.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    const existingRoom = loadRoomState(joinRoomCode)
    if (!existingRoom) {
      setIsLoading(false)
      toast({
        title: "Room Not Found",
        description: "The room code you entered doesn't exist.",
        variant: "destructive"
      })
      return
    }

    setTimeout(() => {
      setRoomCode(joinRoomCode)
      const newUser = { ...currentUser, isOnline: true, lastSeen: Date.now() }
      setCurrentUser(newUser)
      
      updateUserInRoom(joinRoomCode, newUser, setRoomState)
      setCurrentScreen(existingRoom.currentScreen)
      setIsLoading(false)
      
      window.history.pushState({}, '', `?room=${joinRoomCode}`)
      
      toast({
        title: "Joined Room!",
        description: `Welcome to room ${joinRoomCode}`,
      })
    }, 1000)
  }

  // Create room and go to waiting
  const createRoom = async () => {
    if (!currentUser.name || currentUser.groups.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and select at least one group.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    setTimeout(() => {
      generateRoomCode()
      setCurrentScreen('waiting')
      setIsLoading(false)
    }, 800)
  }

  // Vote for Fibonacci number
  const voteForNumber = (value: FibonacciValue) => {
    if (!selectedGroup) {
      toast({
        title: "Select a Group",
        description: "Please select a group before voting.",
        variant: "destructive"
      })
      return
    }
    
    const voteKey = selectedGroup
    
    // If clicking the same value, deselect it
    if (userVotes[voteKey] === value) {
      setUserVotes(prev => {
        const newVotes = { ...prev }
        delete newVotes[voteKey]
        return newVotes
      })
      
      toast({
        title: "Vote Removed",
        description: `${groupNames[selectedGroup]} vote cleared`,
      })
      return
    }
    
    // Otherwise, set the new vote
    setUserVotes(prev => ({
      ...prev,
      [voteKey]: value
    }))

    toast({
      title: "Vote Recorded",
      description: `${groupNames[selectedGroup]}: ${value}`,
    })
  }

  // Submit all votes
  const submitVotes = () => {
    const newVotes: Vote[] = []
    let voteCount = 0
    
    currentUser.groups.forEach(group => {
      if (userVotes[group]) {
        newVotes.push({
          userId: currentUser.id,
          userName: currentUser.name,
          group,
          value: userVotes[group],
          timestamp: Date.now()
        })
        voteCount++
      }
    })
    
    if (newVotes.length === 0) {
      toast({
        title: "No Votes to Submit",
        description: "Please cast at least one vote before submitting.",
        variant: "destructive"
      })
      return
    }
    
    submitUserVotes(roomCode, newVotes, currentUser.id, setRoomState)
    setVotingComplete(true)
    
    toast({
      title: "Votes Submitted!",
      description: `${voteCount} vote${voteCount > 1 ? 's' : ''} submitted successfully.`,
    })
  }

  // Copy room code
  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy room code",
        variant: "destructive"
      })
    }
  }

  // Admin functions
  const proceedToVoting = () => {
    updateRoomScreen(roomCode, 'voting', setRoomState)
    setCurrentScreen('voting')
    setUserVotes({})
    setSelectedGroup(null)
    setVotingComplete(false)
    
    toast({
      title: "Voting Started",
      description: "New voting round has begun!",
    })
  }

  const proceedToReveal = () => {
    updateRoomScreen(roomCode, 'reveal', setRoomState)
    setCurrentScreen('reveal')
    
    toast({
      title: "Results Revealed",
      description: "Voting results are now visible to all participants.",
    })
  }

  const backToWaiting = () => {
    updateRoomScreen(roomCode, 'waiting', setRoomState)
    setCurrentScreen('waiting')
  }

  // Handle vote updates in reveal screen
  const handleVoteUpdate = (group: Group, value: FibonacciValue | null) => {
    if (value === null) {
      setUserVotes(prev => {
        const newVotes = { ...prev }
        delete newVotes[group]
        return newVotes
      })
    } else {
      setUserVotes(prev => ({ ...prev, [group]: value }))
    }
  }

  // Get current users and votes from room state
  const users = roomState?.users || []
  const votes = roomState?.votes || []

  // Render appropriate screen
  if (currentScreen === 'menu') {
    return (
      <MenuScreen
        currentUser={currentUser}
        joinRoomCode={joinRoomCode}
        isLoading={isLoading}
        onUserUpdate={setCurrentUser}
        onJoinRoomCodeChange={setJoinRoomCode}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
      />
    )
  }

  if (currentScreen === 'waiting') {
    return (
      <WaitingScreen
        roomCode={roomCode}
        users={users}
        currentUser={currentUser}
        showQR={showQR}
        showAdmin={showAdmin}
        onCopyRoomCode={copyRoomCode}
        onToggleQR={() => setShowQR(!showQR)}
        onToggleAdmin={() => setShowAdmin(!showAdmin)}
        onStartVoting={proceedToVoting}
      />
    )
  }

  if (currentScreen === 'voting') {
    return (
      <VotingScreen
        currentUser={currentUser}
        selectedGroup={selectedGroup}
        userVotes={userVotes}
        votingComplete={votingComplete}
        onGroupSelect={setSelectedGroup}
        onVote={voteForNumber}
        onSubmitVotes={submitVotes}
        onShowResults={proceedToReveal}
        onBackToWaiting={backToWaiting}
      />
    )
  }

  if (currentScreen === 'reveal') {
    return (
      <RevealScreen
        currentUser={currentUser}
        userVotes={userVotes}
        votes={votes}
        onVoteUpdate={handleVoteUpdate}
        onUpdateVotes={submitVotes}
        onStartNewRound={proceedToVoting}
        onBackToWaiting={backToWaiting}
      />
    )
  }

  return null
}
