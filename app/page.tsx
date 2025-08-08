'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, QrCode, Users, Settings, RotateCcw, CheckCircle, AlertCircle, Coffee } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type FibonacciValue = '☕' | '1' | '2' | '3' | '5' | '8' | '13' | '21'
type Group = 'G' | 'F' | 'B'
type Screen = 'menu' | 'waiting' | 'voting' | 'reveal'

interface Vote {
  userId: string
  userName: string
  group: Group
  value: FibonacciValue
  timestamp: number
}

interface User {
  id: string
  name: string
  groups: Group[]
  isAdmin: boolean
  isOnline: boolean
  lastSeen: number
}

interface RoomState {
  code: string
  currentScreen: Screen
  users: User[]
  votes: Vote[]
  adminId: string
  createdAt: number
  lastUpdated: number
}

const fibonacciSequence: FibonacciValue[] = ['☕', '1', '2', '3', '5', '8', '13', '21']

const groupColors = {
  G: {
    bg: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
    border: 'border-blue-500',
    text: 'text-blue-600',
    light: 'bg-blue-50'
  },
  F: {
    bg: 'bg-emerald-500',
    hover: 'hover:bg-emerald-600',
    border: 'border-emerald-500',
    text: 'text-emerald-600',
    light: 'bg-emerald-50'
  },
  B: {
    bg: 'bg-purple-500',
    hover: 'hover:bg-purple-600',
    border: 'border-purple-500',
    text: 'text-purple-600',
    light: 'bg-purple-50'
  }
}

const groupNames = {
  G: 'General',
  F: 'Frontend', 
  B: 'Backend'
}

export default function FibonacciVotingApp() {
  const { toast } = useToast()
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

  // Room state management functions
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

  const updateUserInRoom = useCallback((roomCode: string, user: User) => {
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

  const updateRoomScreen = useCallback((roomCode: string, screen: Screen) => {
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

  const submitUserVotes = useCallback((roomCode: string, votes: Vote[]) => {
    const state = loadRoomState(roomCode)
    if (state) {
      // Remove existing votes from this user and add new ones
      const filteredVotes = state.votes.filter(v => v.userId !== currentUser.id)
      const updatedState = {
        ...state,
        votes: [...filteredVotes, ...votes],
        lastUpdated: Date.now()
      }
      
      saveRoomState(updatedState)
      setRoomState(updatedState)
    }
  }, [loadRoomState, saveRoomState, currentUser.id])

  // Polling for room updates
  useEffect(() => {
    if (!roomCode) return

    const pollInterval = setInterval(() => {
      const state = loadRoomState(roomCode)
      if (state) {
        // Update user's last seen
        updateUserInRoom(roomCode, currentUser)
        
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
    }, 2000) // Poll every 2 seconds

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
    
    // Check if room exists
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

    // Simulate joining delay
    setTimeout(() => {
      setRoomCode(joinRoomCode)
      const newUser = { ...currentUser, isOnline: true, lastSeen: Date.now() }
      setCurrentUser(newUser)
      
      updateUserInRoom(joinRoomCode, newUser)
      setCurrentScreen(existingRoom.currentScreen)
      setIsLoading(false)
      
      // Update URL
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

  // Toggle group selection
  const toggleGroup = (group: Group) => {
    setCurrentUser(prev => ({
      ...prev,
      groups: prev.groups.includes(group) 
        ? prev.groups.filter(g => g !== group)
        : [...prev.groups, group]
    }))
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
    
    submitUserVotes(roomCode, newVotes)
    setVotingComplete(true)
    
    toast({
      title: "Votes Submitted!",
      description: `${voteCount} vote${voteCount > 1 ? 's' : ''} submitted successfully.`,
    })
  }

  // Get vote count for current user
  const getVoteCount = () => {
    const userVoteCount = Object.keys(userVotes).length
    const totalGroups = currentUser.groups.length
    return { current: userVoteCount, total: totalGroups }
  }

  // Calculate median
  const calculateMedian = (values: FibonacciValue[]) => {
    const numericValues = values
      .filter(v => v !== '☕')
      .map(v => parseInt(v))
      .sort((a, b) => a - b)
    
    if (numericValues.length === 0) return '☕'
    
    const mid = Math.floor(numericValues.length / 2)
    const median = numericValues.length % 2 === 0
      ? (numericValues[mid - 1] + numericValues[mid]) / 2
      : numericValues[mid]
    
    return median.toString()
  }

  // Get results by group
  const getResultsByGroup = () => {
    const results: {[key in Group]?: {[key in FibonacciValue]?: number}} = {}
    
    if (roomState) {
      roomState.votes.forEach(vote => {
        if (!results[vote.group]) results[vote.group] = {}
        if (!results[vote.group]![vote.value]) results[vote.group]![vote.value] = 0
        results[vote.group]![vote.value]!++
      })
    }
    
    return results
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

  // Generate QR Code using web service
  const generateQR = () => {
    const url = `${window.location.origin}?room=${roomCode}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  }

  // Admin functions
  const proceedToVoting = () => {
    updateRoomScreen(roomCode, 'voting')
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
    updateRoomScreen(roomCode, 'reveal')
    setCurrentScreen('reveal')
    
    toast({
      title: "Results Revealed",
      description: "Voting results are now visible to all participants.",
    })
  }

  const backToWaiting = () => {
    updateRoomScreen(roomCode, 'waiting')
    setCurrentScreen('waiting')
  }

  // Get current users and votes from room state
  const users = roomState?.users || []
  const votes = roomState?.votes || []

  // Menu Screen
  if (currentScreen === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-md mx-auto space-y-6 pt-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Coffee className="w-8 h-8 text-amber-600 mr-2" />
              <h1 className="text-3xl font-bold text-gray-900">Fibonacci Voting</h1>
            </div>
            <p className="text-gray-600">Agile estimation made simple</p>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-xl">Join or Create Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Your Name</label>
                <Input
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                  className="h-12 text-lg"
                />
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Select Your Groups</label>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(groupNames) as Group[]).map(group => (
                    <Button
                      key={group}
                      variant={currentUser.groups.includes(group) ? "default" : "outline"}
                      className={`h-12 justify-start text-left transition-all duration-200 ${
                        currentUser.groups.includes(group) 
                          ? `${groupColors[group].bg} ${groupColors[group].hover} text-white shadow-md` 
                          : `${groupColors[group].border} ${groupColors[group].text} hover:${groupColors[group].light}`
                      }`}
                      onClick={() => toggleGroup(group)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{groupNames[group]}</span>
                        {currentUser.groups.includes(group) && (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <Button 
                  onClick={createRoom}
                  disabled={!currentUser.name || currentUser.groups.length === 0 || isLoading}
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                  {isLoading ? "Creating..." : "Create New Room"}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or join existing</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Input
                    value={joinRoomCode}
                    onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                    placeholder="Room Code"
                    className="h-12 text-lg font-mono"
                    maxLength={6}
                  />
                  <Button 
                    onClick={joinRoom}
                    disabled={!joinRoomCode || !currentUser.name || currentUser.groups.length === 0 || isLoading}
                    className="h-12 px-6 font-semibold"
                  >
                    {isLoading ? "Joining..." : "Join"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Waiting Screen
  if (currentScreen === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-md mx-auto space-y-6 pt-4">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">Room: {roomCode}</CardTitle>
              <p className="text-gray-600">Waiting for participants...</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={copyRoomCode} variant="outline" className="h-12 font-medium">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
                <Button onClick={() => setShowQR(!showQR)} variant="outline" className="h-12 font-medium">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </Button>
              </div>

              {showQR && (
                <div className="text-center p-4 bg-white rounded-lg border">
                  <img src={generateQR() || "/placeholder.svg"} alt="QR Code" className="mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Scan to join room</p>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Participants ({users.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.map(user => (
                    <div key={user.id} className="flex justify-between items-center p-3 bg-white rounded-lg border shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="font-medium">{user.name}</span>
                        {user.isAdmin && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {user.groups.map(group => (
                          <Badge key={group} className={`${groupColors[group].bg} text-white text-xs`}>
                            {group}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {currentUser.isAdmin && (
                <div className="space-y-3 pt-4 border-t">
                  <Button onClick={proceedToVoting} className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700">
                    Start Voting Round
                  </Button>
                  <Button 
                    onClick={() => setShowAdmin(!showAdmin)} 
                    variant="outline" 
                    className="w-full h-12 font-medium"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {showAdmin ? 'Hide' : 'Show'} Admin Panel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Voting Screen
  if (currentScreen === 'voting') {
    const voteCount = getVoteCount()
    const isVoteComplete = voteCount.current === voteCount.total && voteCount.total > 0

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-md mx-auto space-y-6 pt-4">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold">Cast Your Votes</CardTitle>
              <p className="text-gray-600">Select group, then choose your estimate</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Group Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Select Group to Vote</label>
                <div className="grid grid-cols-1 gap-2">
                  {currentUser.groups.map(group => (
                    <Button
                      key={group}
                      variant={selectedGroup === group ? "default" : "outline"}
                      className={`h-12 justify-between transition-all duration-200 ${
                        selectedGroup === group 
                          ? `${groupColors[group].bg} ${groupColors[group].hover} text-white shadow-md` 
                          : `${groupColors[group].border} ${groupColors[group].text} hover:${groupColors[group].light}`
                      } ${votingComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => setSelectedGroup(group)}
                      disabled={votingComplete}
                    >
                      <span className="font-medium">{groupNames[group]}</span>
                      <div className="flex items-center space-x-2">
                        {userVotes[group] && (
                          <Badge className="bg-white text-gray-800 font-bold">
                            {userVotes[group]}
                          </Badge>
                        )}
                        {selectedGroup === group && <CheckCircle className="w-4 h-4" />}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Fibonacci Buttons */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  {selectedGroup ? `Vote for ${groupNames[selectedGroup]}` : 'Select a group first'}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {fibonacciSequence.map(value => (
                    <Button
                      key={value}
                      variant="outline"
                      className={`aspect-square text-xl font-bold transition-all duration-200 ${
                        selectedGroup && userVotes[selectedGroup] === value 
                          ? `${groupColors[selectedGroup].bg} ${groupColors[selectedGroup].hover} text-white shadow-lg scale-105` 
                          : 'hover:scale-105 hover:shadow-md'
                      } ${!selectedGroup || votingComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => voteForNumber(value)}
                      disabled={!selectedGroup || votingComplete}
                    >
                      {value === '☕' ? <Coffee className="w-6 h-6" /> : value}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Vote Status */}
              <Alert className={`${isVoteComplete ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}`}>
                <AlertCircle className={`h-4 w-4 ${isVoteComplete ? 'text-green-600' : 'text-blue-600'}`} />
                <AlertDescription className={`${isVoteComplete ? 'text-green-800' : 'text-blue-800'}`}>
                  <div className="flex justify-between items-center">
                    <span>Votes cast: {voteCount.current}/{voteCount.total}</span>
                    {isVoteComplete && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button 
                onClick={submitVotes}
                className={`w-full h-14 text-lg font-bold transition-all duration-200 ${
                  voteCount.current === 0 
                    ? 'bg-gray-500 hover:bg-gray-600' 
                    : isVoteComplete
                    ? 'bg-green-600 hover:bg-green-700 shadow-lg'
                    : 'bg-blue-600 hover:bg-blue-700'
                } ${votingComplete ? 'opacity-75' : ''}`}
                disabled={votingComplete}
              >
                {votingComplete ? (
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Votes Submitted
                  </div>
                ) : voteCount.current === 0 ? 'Skip Voting' : `Submit ${voteCount.current} Vote${voteCount.current > 1 ? 's' : ''}`}
              </Button>

              {/* Admin Controls */}
              {currentUser.isAdmin && (
                <div className="space-y-2 pt-4 border-t">
                  <Button onClick={proceedToReveal} variant="outline" className="w-full h-12 font-medium">
                    Show Results
                  </Button>
                  <Button onClick={backToWaiting} variant="outline" className="w-full h-12 font-medium">
                    Back to Waiting
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Reveal Screen
  if (currentScreen === 'reveal') {
    const results = getResultsByGroup()
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-md mx-auto space-y-6 pt-4">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">Voting Results</CardTitle>
              <p className="text-gray-600">See how everyone voted</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {(Object.keys(groupNames) as Group[]).map(group => {
                const groupResults = results[group] || {}
                const groupVotes = votes.filter(v => v.group === group).map(v => v.value)
                const median = calculateMedian(groupVotes)
                const hasVotes = Object.keys(groupResults).length > 0
                
                return (
                  <div key={group} className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{backgroundColor: groupColors[group].light}}>
                      <span className={`px-3 py-1 rounded-full text-white font-semibold ${groupColors[group].bg}`}>
                        {groupNames[group]}
                      </span>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Median</div>
                        <div className="font-bold text-lg">{median === '☕' ? <Coffee className="w-5 h-5 inline" /> : median}</div>
                      </div>
                    </div>
                    
                    {hasVotes ? (
                      <div className="grid grid-cols-4 gap-2">
                        {fibonacciSequence.map(value => {
                          const count = groupResults[value] || 0
                          return count > 0 ? (
                            <div key={value} className="text-center p-3 bg-white rounded-lg border shadow-sm">
                              <div className="font-bold text-lg">
                                {value === '☕' ? <Coffee className="w-5 h-5 mx-auto" /> : value}
                              </div>
                              <div className="text-sm text-gray-600">{count}x</div>
                            </div>
                          ) : null
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 italic">
                        No votes cast for this group
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Allow vote changes */}
              <Separator className="my-6" />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Update Your Votes</h3>
                <div className="space-y-3">
                  {currentUser.groups.map(group => (
                    <div key={group} className="p-3 bg-white rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 rounded text-white text-sm font-medium ${groupColors[group].bg}`}>
                          {groupNames[group]}
                        </span>
                        <span className="text-sm text-gray-600">Current: {userVotes[group] || 'None'}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {fibonacciSequence.map(value => (
                          <Button
                            key={value}
                            size="sm"
                            variant={userVotes[group] === value ? "default" : "outline"}
                            className={`aspect-square font-bold transition-all duration-200 ${
                              userVotes[group] === value 
                                ? `${groupColors[group].bg} ${groupColors[group].hover} text-white shadow-md` 
                                : 'hover:scale-105'
                            }`}
                            onClick={() => {
                              const currentVote = userVotes[group]
                              if (currentVote === value) {
                                // Deselect if clicking the same value
                                setUserVotes(prev => {
                                  const newVotes = { ...prev }
                                  delete newVotes[group]
                                  return newVotes
                                })
                              } else {
                                // Select new value
                                setUserVotes(prev => ({ ...prev, [group]: value }))
                              }
                            }}
                          >
                            {value === '☕' ? <Coffee className="w-4 h-4" /> : value}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={submitVotes} className="w-full h-12 font-semibold bg-blue-600 hover:bg-blue-700">
                  Update Votes
                </Button>
              </div>

              {/* Admin Controls */}
              {currentUser.isAdmin && (
                <div className="space-y-3 pt-6 border-t">
                  <Button onClick={proceedToVoting} variant="outline" className="w-full h-12 font-medium">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Start New Round
                  </Button>
                  <Button onClick={backToWaiting} variant="outline" className="w-full h-12 font-medium">
                    Back to Waiting Room
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
