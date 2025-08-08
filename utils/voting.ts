import { FibonacciValue, Group, Vote, RoomState } from '@/types'

export function calculateMedian(values: FibonacciValue[]): string {
  if (values.length === 0) return '☕'
  
  // Separate coffee votes from numeric votes
  const coffeeCount = values.filter(v => v === '☕').length
  const numericValues = values
    .filter(v => v !== '☕')
    .map(v => parseInt(v))
    .sort((a, b) => a - b)
  
  // If all votes are coffee, return coffee
  if (numericValues.length === 0) return '☕'
  
  // If more than half are coffee, return coffee
  if (coffeeCount > values.length / 2) return '☕'
  
  // Calculate median of numeric values only
  const mid = Math.floor(numericValues.length / 2)
  const median = numericValues.length % 2 === 0
    ? (numericValues[mid - 1] + numericValues[mid]) / 2
    : numericValues[mid]
  
  // Return as string, handling decimal medians
  return median % 1 === 0 ? median.toString() : median.toFixed(1)
}

export function getResultsByGroup(roomState: RoomState | null): {[key in Group]?: {[key in FibonacciValue]?: number}} {
  const results: {[key in Group]?: {[key in FibonacciValue]?: number}} = {}
  
  if (roomState) {
    roomState.votes.forEach(vote => {
      if (!results[vote.group]) results[vote.group] = {}
      if (!results[vote.group]![vote.value]) results[vote.group]![vote.value] = 0
      results[vote.group]![vote.value]!++
    })
  }
  
  return results
}

export function getVoteCount(userVotes: {[key: string]: FibonacciValue}, totalGroups: number) {
  const userVoteCount = Object.keys(userVotes).length
  return { current: userVoteCount, total: totalGroups }
}

export function generateQRCode(roomCode: string): string {
  const url = `${window.location.origin}?room=${roomCode}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
}
