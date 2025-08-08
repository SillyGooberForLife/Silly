// In-memory store for rooms (resets on deployment, but works for demo)
interface RoomData {
  code: string
  state: any
  lastUpdated: number
}

class RoomStore {
  private rooms = new Map<string, RoomData>()
  private subscribers = new Map<string, Set<(data: any) => void>>()

  setRoom(code: string, state: any) {
    this.rooms.set(code, {
      code,
      state,
      lastUpdated: Date.now()
    })
    
    // Notify all subscribers
    const roomSubscribers = this.subscribers.get(code)
    if (roomSubscribers) {
      roomSubscribers.forEach(callback => {
        try {
          callback(state)
        } catch (error) {
          console.error('Error notifying subscriber:', error)
        }
      })
    }
  }

  getRoom(code: string): any | null {
    const room = this.rooms.get(code)
    return room ? room.state : null
  }

  subscribe(roomCode: string, callback: (data: any) => void) {
    if (!this.subscribers.has(roomCode)) {
      this.subscribers.set(roomCode, new Set())
    }
    this.subscribers.get(roomCode)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const roomSubscribers = this.subscribers.get(roomCode)
      if (roomSubscribers) {
        roomSubscribers.delete(callback)
        if (roomSubscribers.size === 0) {
          this.subscribers.delete(roomCode)
        }
      }
    }
  }

  getRooms(): string[] {
    return Array.from(this.rooms.keys())
  }

  deleteRoom(code: string) {
    this.rooms.delete(code)
    this.subscribers.delete(code)
  }

  // Clean up old rooms (older than 24 hours)
  cleanup() {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    for (const [code, room] of this.rooms.entries()) {
      if (now - room.lastUpdated > maxAge) {
        this.deleteRoom(code)
      }
    }
  }
}

export const roomStore = new RoomStore()

// Clean up every hour
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => roomStore.cleanup(), 60 * 60 * 1000)
}
