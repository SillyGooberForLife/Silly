import { FibonacciValue, Group } from '@/types'

export const fibonacciSequence: FibonacciValue[] = ['☕', '1', '2', '3', '5', '8', '13', '21']

export const groupColors = {
  G: {
    bg: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
    border: 'border-blue-500',
    text: 'text-blue-600',
    light: 'bg-blue-50'
  },
  F: {
    bg: 'bg-emerald-500',
    hover: 'hover:bg-emerald-600',
    border: 'border-emerald-500',
    text: 'text-emerald-600',
    light: 'bg-emerald-50'
  },
  B: {
    bg: 'bg-purple-500',
    hover: 'hover:bg-purple-600',
    border: 'border-purple-500',
    text: 'text-purple-600',
    light: 'bg-purple-50'
  }
}

export const groupNames = {
  G: 'General',
  F: 'Frontend', 
  B: 'Backend'
}
