import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { FibonacciGrid } from '@/components/FibonacciGrid'
import { User, Group, FibonacciValue } from '@/types'
import { groupColors, groupNames } from '@/constants'
import { getVoteCount } from '@/utils/voting'

interface VotingScreenProps {
  currentUser: User
  selectedGroup: Group | null
  userVotes: {[key: string]: FibonacciValue}
  votingComplete: boolean
  onGroupSelect: (group: Group) => void
  onVote: (value: FibonacciValue) => void
  onSubmitVotes: () => void
  onShowResults: () => void
  onBackToWaiting: () => void
}

export function VotingScreen({
  currentUser,
  selectedGroup,
  userVotes,
  votingComplete,
  onGroupSelect,
  onVote,
  onSubmitVotes,
  onShowResults,
  onBackToWaiting
}: VotingScreenProps) {
  const voteCount = getVoteCount(userVotes, currentUser.groups.length)
  const isVoteComplete = voteCount.current === voteCount.total && voteCount.total > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-md mx-auto space-y-6 pt-4">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold">Cast Your Votes</CardTitle>
            <p className="text-gray-600">Select group, then choose your estimate</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Group Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Select Group to Vote</label>
              <div className="grid grid-cols-1 gap-2">
                {currentUser.groups.map(group => (
                  <Button
                    key={group}
                    variant={selectedGroup === group ? "default" : "outline"}
                    className={`h-12 justify-between transition-all duration-200 ${
                      selectedGroup === group 
                        ? `${groupColors[group].bg} ${groupColors[group].hover} text-white shadow-md` 
                        : `${groupColors[group].border} ${groupColors[group].text} hover:${groupColors[group].light}`
                    } ${votingComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => onGroupSelect(group)}
                    disabled={votingComplete}
                  >
                    <span className="font-medium">{groupNames[group]}</span>
                    <div className="flex items-center space-x-2">
                      {userVotes[group] && (
                        <Badge className="bg-white text-gray-800 font-bold">
                          {userVotes[group]}
                        </Badge>
                      )}
                      {selectedGroup === group && <CheckCircle className="w-4 h-4" />}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Fibonacci Buttons */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                {selectedGroup ? `Vote for ${groupNames[selectedGroup]}` : 'Select a group first'}
              </label>
              <FibonacciGrid
                selectedGroup={selectedGroup}
                userVotes={userVotes}
                onVote={onVote}
                disabled={votingComplete}
              />
            </div>

            {/* Vote Status */}
            <Alert className={`${isVoteComplete ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}`}>
              <AlertCircle className={`h-4 w-4 ${isVoteComplete ? 'text-green-600' : 'text-blue-600'}`} />
              <AlertDescription className={`${isVoteComplete ? 'text-green-800' : 'text-blue-800'}`}>
                <div className="flex justify-between items-center">
                  <span>Votes cast: {voteCount.current}/{voteCount.total}</span>
                  {isVoteComplete && <CheckCircle className="w-5 h-5 text-green-600" />}
                </div>
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button 
              onClick={onSubmitVotes}
              className={`w-full h-14 text-lg font-bold transition-all duration-200 ${
                voteCount.current === 0 
                  ? 'bg-gray-500 hover:bg-gray-600' 
                  : isVoteComplete
                  ? 'bg-green-600 hover:bg-green-700 shadow-lg'
                  : 'bg-blue-600 hover:bg-blue-700'
              } ${votingComplete ? 'opacity-75' : ''}`}
              disabled={votingComplete}
            >
              {votingComplete ? (
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Votes Submitted
                </div>
              ) : voteCount.current === 0 ? 'Skip Voting' : `Submit ${voteCount.current} Vote${voteCount.current > 1 ? 's' : ''}`}
            </Button>

            {/* Admin Controls */}
            {currentUser.isAdmin && (
              <div className="space-y-2 pt-4 border-t">
                <Button onClick={onShowResults} variant="outline" className="w-full h-12 font-medium">
                  Show Results
                </Button>
                <Button onClick={onBackToWaiting} variant="outline" className="w-full h-12 font-medium">
                  Back to Waiting
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
