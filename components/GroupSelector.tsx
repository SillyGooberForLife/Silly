import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle } from 'lucide-react'
import { Group } from '@/types'
import { groupColors, groupNames } from '@/constants'

interface GroupSelectorProps {
  selectedGroups: Group[]
  onToggleGroup: (group: Group) => void
  disabled?: boolean
  title?: string
  className?: string
}

export function GroupSelector({ 
  selectedGroups, 
  onToggleGroup, 
  disabled = false, 
  title = "Select Your Groups",
  className = ""
}: GroupSelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700">{title}</label>
      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(groupNames) as Group[]).map(group => (
          <Button
            key={group}
            variant={selectedGroups.includes(group) ? "default" : "outline"}
            className={`h-12 justify-start text-left transition-all duration-200 ${
              selectedGroups.includes(group) 
                ? `${groupColors[group].bg} ${groupColors[group].hover} text-white shadow-md` 
                : `${groupColors[group].border} ${groupColors[group].text} hover:${groupColors[group].light}`
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => onToggleGroup(group)}
            disabled={disabled}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{groupNames[group]}</span>
              {selectedGroups.includes(group) && (
                <CheckCircle className="w-5 h-5" />
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}
