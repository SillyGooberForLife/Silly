import { Badge } from '@/components/ui/badge'
import { Coffee, TrendingUp } from 'lucide-react'
import { Vote, Group } from '@/types'
import { groupColors, groupNames } from '@/constants'
import { calculateMedian, getResultsByGroup } from '@/utils/voting'

interface VotingSummaryProps {
  votes: Vote[]
  isAdmin: boolean
}

export function VotingSummary({ votes, isAdmin }: VotingSummaryProps) {
  if (!isAdmin || votes.length === 0) return null

  const results = getResultsByGroup({ votes } as any)
  
  // Calculate overall median from ALL votes (not just unique values)
  const allVoteValues = votes.map(v => v.value)
  const overallMedian = calculateMedian(allVoteValues)
  
  // Calculate total number of votes
  const totalVotes = votes.length

  return (
    <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center text-green-800">
          <TrendingUp className="w-5 h-5 mr-2" />
          Current Results
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-green-700">{totalVotes} total votes</span>
          <Badge className="bg-green-600 text-white font-bold">
            Overall: {overallMedian === '☕' ? (
              <div className="flex items-center">
                <Coffee className="w-3 h-3 mr-1" />
                ☕
              </div>
            ) : overallMedian}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {(Object.keys(groupNames) as Group[]).map(group => {
          const groupResults = results[group] || {}
          const groupVotes = votes.filter(v => v.group === group).map(v => v.value)
          const median = calculateMedian(groupVotes)
          const voteCount = groupVotes.length
          
          if (voteCount === 0) return null
          
          return (
            <div key={group} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center space-x-2">
                <Badge className={`${groupColors[group].bg} text-white text-xs`}>
                  {group}
                </Badge>
                <span className="text-sm font-medium">{groupNames[group]}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600">{voteCount} votes</span>
                <Badge variant="outline" className="font-bold">
                  {median === '☕' ? <Coffee className="w-3 h-3" /> : median}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Don't show individual votes during voting phase - only show counts */}
      <div className="pt-2 border-t border-green-200">
        <div className="text-xs text-green-700">
          Vote counts by value - individual votes revealed after voting ends
        </div>
      </div>
    </div>
  )
}
