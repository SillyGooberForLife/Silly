import { Button } from '@/components/ui/button'
import { Coffee } from 'lucide-react'
import { FibonacciValue, Group } from '@/types'
import { fibonacciSequence, groupColors } from '@/constants'

interface FibonacciGridProps {
  selectedGroup: Group | null
  userVotes: {[key: string]: FibonacciValue}
  onVote: (value: FibonacciValue) => void
  disabled?: boolean
  sequence?: FibonacciValue[]
  size?: 'sm' | 'md' | 'lg'
}

export function FibonacciGrid({ 
  selectedGroup, 
  userVotes, 
  onVote, 
  disabled = false,
  sequence = fibonacciSequence,
  size = 'lg'
}: FibonacciGridProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {sequence.map(value => (
        <Button
          key={value}
          variant="outline"
          className={`aspect-square ${sizeClasses[size]} font-bold transition-all duration-200 ${
            selectedGroup && userVotes[selectedGroup] === value 
              ? `${groupColors[selectedGroup].bg} ${groupColors[selectedGroup].hover} text-white shadow-lg scale-105` 
              : 'hover:scale-105 hover:shadow-md'
          } ${!selectedGroup || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => onVote(value)}
          disabled={!selectedGroup || disabled}
        >
          {value === '☕' ? <Coffee className={iconSizes[size]} /> : value}
        </Button>
      ))}
    </div>
  )
}
