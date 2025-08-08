import { NextRequest, NextResponse } from 'next/server'
import { roomStore } from '@/lib/roomStore'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const roomCode = params.code
  const room = roomStore.getRoom(roomCode)
  
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }
  
  return NextResponse.json(room)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const roomCode = params.code
  const data = await request.json()
  
  roomStore.setRoom(roomCode, data)
  
  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const roomCode = params.code
  roomStore.deleteRoom(roomCode)
  
  return NextResponse.json({ success: true })
}
