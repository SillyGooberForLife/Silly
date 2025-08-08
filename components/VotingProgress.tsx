import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Clock, Users, AlertTriangle, UserX } from 'lucide-react'
import { User, Vote, UserSubmission, Group } from '@/types'
import { groupColors, groupNames } from '@/constants'

interface VotingProgressProps {
  users: User[]
  votes: Vote[]
  submissions: UserSubmission[]
  isAdmin: boolean
}

export function VotingProgress({ users, votes, submissions, isAdmin }: VotingProgressProps) {
  // Calculate voting progress
  const getUserVoteStatus = () => {
    const userVoteMap = new Map<string, Set<Group>>()
    const submissionMap = new Map<string, UserSubmission>()
    
    votes.forEach(vote => {
      if (!userVoteMap.has(vote.userId)) {
        userVoteMap.set(vote.userId, new Set())
      }
      userVoteMap.get(vote.userId)!.add(vote.group)
    })

    submissions.forEach(submission => {
      submissionMap.set(submission.userId, submission)
    })

    return users.map(user => {
      const userVotes = userVoteMap.get(user.id) || new Set()
      const submission = submissionMap.get(user.id)
      const totalGroups = user.groups.length
      const votedGroups = user.groups.filter(group => userVotes.has(group)).length
      const hasSubmitted = !!submission
      
      return {
        ...user,
        votedGroups,
        totalGroups,
        hasSubmitted,
        submission,
        isComplete: hasSubmitted,
        hasPartialVotes: hasSubmitted && votedGroups > 0 && votedGroups < totalGroups,
        hasNoVotes: hasSubmitted && votedGroups === 0,
        isPending: !hasSubmitted
      }
    })
  }

  const userStatuses = getUserVoteStatus()
  const completedUsers = userStatuses.filter(u => u.isComplete).length
  const totalUsers = users.length
  const progressPercentage = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0

  if (!isAdmin) return null

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center text-blue-900">
          <Users className="w-5 h-5 mr-2" />
          Voting Progress
        </h3>
        <Badge className="bg-blue-700 text-white font-semibold px-3 py-1">
          {completedUsers}/{totalUsers} Complete
        </Badge>
      </div>
      
      <Progress value={progressPercentage} className="h-3" />
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {userStatuses.map(user => (
          <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center space-x-3">
              {user.isPending ? (
                <Clock className="w-4 h-4 text-gray-400" />
              ) : user.hasNoVotes ? (
                <UserX className="w-4 h-4 text-gray-600" />
              ) : user.hasPartialVotes ? (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <span className="font-medium text-sm text-gray-900">{user.name}</span>
              {user.hasNoVotes && (
                <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                  Skipped
                </Badge>
              )}
              {user.hasPartialVotes && (
                <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
                  Partial
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">
                {user.hasSubmitted ? `${user.votedGroups}/${user.totalGroups}` : `0/${user.totalGroups}`}
              </span>
              <div className="flex gap-1">
                {user.groups.map(group => (
                  <div
                    key={group}
                    className={`w-3 h-3 rounded-full border ${
                      votes.some(v => v.userId === user.id && v.group === group)
                        ? `${groupColors[group].bg} border-transparent`
                        : user.hasSubmitted
                        ? 'bg-gray-300 border-gray-400' // Skipped groups
                        : 'bg-gray-200 border-gray-300' // Pending
                    }`}
                    title={`${groupNames[group]} - ${
                      votes.some(v => v.userId === user.id && v.group === group) 
                        ? 'Voted' 
                        : user.hasSubmitted 
                        ? 'Skipped' 
                        : 'Pending'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary stats */}
      <div className="pt-3 border-t border-blue-200">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-green-700">
              {userStatuses.filter(u => u.hasSubmitted && !u.hasPartialVotes && !u.hasNoVotes).length}
            </div>
            <div className="text-xs text-gray-600">Full</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-600">
              {userStatuses.filter(u => u.hasPartialVotes).length}
            </div>
            <div className="text-xs text-gray-600">Partial</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-600">
              {userStatuses.filter(u => u.hasNoVotes).length}
            </div>
            <div className="text-xs text-gray-600">Skipped</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-500">
              {userStatuses.filter(u => u.isPending).length}
            </div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
        </div>
      </div>
    </div>
  )
}
