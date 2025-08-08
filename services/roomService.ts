// Mock network storage using a simple in-memory store
// In a real app, this would be replaced with actual API calls

interface NetworkStorage {
  [key: string]: string
}

// Simulate network storage with a global object
// In production, this would be a real database/API
const mockNetworkStorage: NetworkStorage = {}

// Simulate network delay
const networkDelay = () => new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))

export class RoomService {
  static async saveRoom(roomCode: string, data: any): Promise<void> {
    await networkDelay()
    mockNetworkStorage[`room_${roomCode}`] = JSON.stringify(data)
    
    // Also save to localStorage as backup
    localStorage.setItem(`room_${roomCode}`, JSON.stringify(data))
  }

  static async loadRoom(roomCode: string): Promise<any | null> {
    await networkDelay()
    
    // Try network storage first
    const networkData = mockNetworkStorage[`room_${roomCode}`]
    if (networkData) {
      return JSON.parse(networkData)
    }
    
    // Fallback to localStorage
    const localData = localStorage.getItem(`room_${roomCode}`)
    if (localData) {
      const parsed = JSON.parse(localData)
      // Sync to network storage
      mockNetworkStorage[`room_${roomCode}`] = localData
      return parsed
    }
    
    return null
  }

  static async getRoomList(): Promise<string[]> {
    await networkDelay()
    return Object.keys(mockNetworkStorage)
      .filter(key => key.startsWith('room_'))
      .map(key => key.replace('room_', ''))
  }

  static async deleteRoom(roomCode: string): Promise<void> {
    await networkDelay()
    delete mockNetworkStorage[`room_${roomCode}`]
    localStorage.removeItem(`room_${roomCode}`)
  }
}
