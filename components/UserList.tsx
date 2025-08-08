import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { User } from '@/types'
import { groupColors } from '@/constants'

interface UserListProps {
  users: User[]
  title?: string
  maxHeight?: string
}

export function UserList({ users, title = "Participants", maxHeight = "max-h-64" }: UserListProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg flex items-center">
        <Users className="w-5 h-5 mr-2 text-blue-600" />
        {title} ({users.length})
      </h3>
      <div className={`space-y-2 ${maxHeight} overflow-y-auto`}>
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
  )
}
