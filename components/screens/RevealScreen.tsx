import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RotateCcw, Coffee } from 'lucide-react'
import { FibonacciGrid } from '@/components/FibonacciGrid'
import { User, Group, FibonacciValue, Vote } from '@/types'
import { groupColors, groupNames, fibonacciSequence } from '@/constants'
import { getResultsByGroup, calculateMedian } from '@/utils/voting'

interface RevealScreenProps {
  currentUser: User
  userVotes: {[key: string]: FibonacciValue}
  votes: Vote[]
  onVoteUpdate: (group: Group, value: FibonacciValue | null) => void
  onUpdateVotes: () => void
  onStartNewRound: () => void
  onBackToWaiting: () => void
}

export function RevealScreen({
  currentUser,
  userVotes,
  votes,
  onVoteUpdate,
  onUpdateVotes,
  onStartNewRound,
  onBackToWaiting
}: RevealScreenProps) {
  const results = getResultsByGroup({ votes } as any)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-md mx-auto space-y-6 pt-4">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">Voting Results</CardTitle>
            <p className="text-gray-600">See how everyone voted</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {(Object.keys(groupNames) as Group[]).map(group => {
              const groupResults = results[group] || {}
              const groupVotes = votes.filter(v => v.group === group).map(v => v.value)
              const median = calculateMedian(groupVotes)
              const hasVotes = Object.keys(groupResults).length > 0
              
              return (
                <div key={group} className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{backgroundColor: groupColors[group].light}}>
                    <span className={`px-3 py-1 rounded-full text-white font-semibold ${groupColors[group].bg}`}>
                      {groupNames[group]}
                    </span>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Median</div>
                      <div className="font-bold text-lg">{median === '☕' ? <Coffee className="w-5 h-5 inline" /> : median}</div>
                    </div>
                  </div>
                  
                  {hasVotes ? (
                    <div className="grid grid-cols-4 gap-2">
                      {fibonacciSequence.map(value => {
                        const count = groupResults[value] || 0
                        return count > 0 ? (
                          <div key={value} className="text-center p-3 bg-white rounded-lg border shadow-sm">
                            <div className="font-bold text-lg">
                              {value === '☕' ? <Coffee className="w-5 h-5 mx-auto" /> : value}
                            </div>
                            <div className="text-sm text-gray-600">{count}x</div>
                          </div>
                        ) : null
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 italic">
                      No votes cast for this group
                    </div>
                  )}
                </div>
              )
            })}

            {/* Allow vote changes */}
            <Separator className="my-6" />
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Update Your Votes</h3>
              <div className="space-y-3">
                {currentUser.groups.map(group => (
                  <div key={group} className="p-3 bg-white rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded text-white text-sm font-medium ${groupColors[group].bg}`}>
                        {groupNames[group]}
                      </span>
                      <span className="text-sm text-gray-600">Current: {userVotes[group] || 'None'}</span>
                    </div>
                    <FibonacciGrid
                      selectedGroup={group}
                      userVotes={userVotes}
                      onVote={(value) => {
                        const currentVote = userVotes[group]
                        if (currentVote === value) {
                          onVoteUpdate(group, null) // Deselect
                        } else {
                          onVoteUpdate(group, value) // Select new value
                        }
                      }}
                      sequence={fibonacciSequence} // Updated to show all numbers
                      size="sm"
                    />
                  </div>
                ))}
              </div>
              <Button onClick={onUpdateVotes} className="w-full h-12 font-semibold bg-blue-600 hover:bg-blue-700">
                Update Votes
              </Button>
            </div>

            {/* Admin Controls */}
            {currentUser.isAdmin && (
              <div className="space-y-3 pt-6 border-t">
                <Button onClick={onStartNewRound} variant="outline" className="w-full h-12 font-medium">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start New Round
                </Button>
                <Button onClick={onBackToWaiting} variant="outline" className="w-full h-12 font-medium">
                  Back to Waiting Room
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
