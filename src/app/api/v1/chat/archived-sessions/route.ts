import { NextResponse } from 'next/server'
import { getArchivedChatSessions } from '@/app/actions/chat'

export async function GET() {
  const result = await getArchivedChatSessions()

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { sessions: result.data },
    { status: 200 }
  )
}

