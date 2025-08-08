import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, QrCode } from 'lucide-react'
import { UserList } from '@/components/UserList'
import { TaskEditor } from '@/components/TaskEditor'
import { User } from '@/types'
import { generateQRCode } from '@/utils/voting'

interface WaitingScreenProps {
  roomCode: string
  users: User[]
  currentUser: User
  currentTask: string
  showQR: boolean
  onCopyRoomCode: () => void
  onToggleQR: () => void
  onTaskUpdate: (task: string) => void
  onStartVoting: () => void
}

export function WaitingScreen({
  roomCode,
  users,
  currentUser,
  currentTask,
  showQR,
  onCopyRoomCode,
  onToggleQR,
  onTaskUpdate,
  onStartVoting
}: WaitingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-md mx-auto space-y-6 pt-4">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold font-mono tracking-wider">
              Room: {roomCode}
            </CardTitle>
            <p className="text-gray-600">Waiting for participants...</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <TaskEditor
              currentTask={currentTask}
              onTaskUpdate={onTaskUpdate}
              isAdmin={currentUser.isAdmin}
            />

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={onCopyRoomCode} variant="outline" className="h-12 font-medium">
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
              <Button onClick={onToggleQR} variant="outline" className="h-12 font-medium">
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
            </div>

            {showQR && (
              <div className="text-center p-4 bg-white rounded-lg border">
                <img src={generateQRCode(roomCode) || "/placeholder.svg"} alt="QR Code" className="mx-auto mb-2" />
                <p className="text-sm text-gray-600">Scan to join room</p>
              </div>
            )}

            <UserList users={users} />

            {currentUser.isAdmin && (
              <div className="space-y-3 pt-4 border-t">
                <Button 
                  onClick={onStartVoting} 
                  className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700"
                  disabled={users.length === 0}
                >
                  Start Voting Round
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
