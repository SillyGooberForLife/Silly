import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2, Check, X } from 'lucide-react'

interface TaskEditorProps {
  currentTask: string
  onTaskUpdate: (task: string) => void
  isAdmin: boolean
}

export function TaskEditor({ currentTask, onTaskUpdate, isAdmin }: TaskEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(currentTask)

  const handleSave = () => {
    onTaskUpdate(editValue.trim() || 'Untitled Task')
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(currentTask)
    setIsEditing(false)
  }

  if (!isAdmin && !currentTask) return null

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">Current Task</label>
      {isEditing ? (
        <div className="flex gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Enter task name..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleSave} className="px-3">
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="px-3">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
          <span className="flex-1 font-medium text-gray-900">
            {currentTask || 'Untitled Task'}
          </span>
          {isAdmin && (
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="px-2">
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
