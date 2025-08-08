export type FibonacciValue = '☕' | '1' | '2' | '3' | '5' | '8' | '13' | '21'
export type Group = 'G' | 'F' | 'B'
export type Screen = 'menu' | 'waiting' | 'voting' | 'reveal'

export interface Vote {
  userId: string
  userName: string
  group: Group
  value: FibonacciValue
  timestamp: number
}

export interface User {
  id: string
  name: string
  groups: Group[]
  isAdmin: boolean
  isOnline: boolean
  lastSeen: number
}

export interface UserSubmission {
  userId: string
  userName: string
  timestamp: number
  hasVotes: boolean
}

export interface RoomState {
  code: string
  currentScreen: Screen
  users: User[]
  votes: Vote[]
  submissions: UserSubmission[] // Track who has submitted
  adminId: string
  createdAt: number
  lastUpdated: number
  currentTask?: string
}

export interface AppState {
  currentScreen: Screen
  currentUser: User
  roomCode: string
  joinRoomCode: string
  roomState: RoomState | null
  selectedGroup: Group | null
  userVotes: {[key: string]: FibonacciValue}
  showAdmin: boolean
  showQR: boolean
  isLoading: boolean
  votingComplete: boolean
}
