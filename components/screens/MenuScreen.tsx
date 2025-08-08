import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Coffee } from 'lucide-react'
import { GroupSelector } from '@/components/GroupSelector'
import { User, Group } from '@/types'

interface MenuScreenProps {
  currentUser: User
  joinRoomCode: string
  isLoading: boolean
  onUserUpdate: (user: User) => void
  onJoinRoomCodeChange: (code: string) => void
  onCreateRoom: () => void
  onJoinRoom: () => void
}

export function MenuScreen({
  currentUser,
  joinRoomCode,
  isLoading,
  onUserUpdate,
  onJoinRoomCodeChange,
  onCreateRoom,
  onJoinRoom
}: MenuScreenProps) {
  const toggleGroup = (group: Group) => {
    onUserUpdate({
      ...currentUser,
      groups: currentUser.groups.includes(group) 
        ? currentUser.groups.filter(g => g !== group)
        : [...currentUser.groups, group]
    })
  }

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
                onChange={(e) => onUserUpdate({ ...currentUser, name: e.target.value })}
                placeholder="Enter your name"
                className="h-12 text-lg"
              />
            </div>
            
            <GroupSelector
              selectedGroups={currentUser.groups}
              onToggleGroup={toggleGroup}
            />

            <Separator className="my-6" />

            <div className="space-y-4">
              <Button 
                onClick={onCreateRoom}
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
                  onChange={(e) => onJoinRoomCodeChange(e.target.value.toUpperCase())}
                  placeholder="Room Code"
                  className="h-12 text-lg font-mono"
                  maxLength={6}
                />
                <Button 
                  onClick={onJoinRoom}
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
