// src/app/api/cron/backup/route.ts
import { scheduledBackup } from '@/app/actions'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 segundos máximo

export async function GET(request: Request) {
  // Verificar secret key para seguridad
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET_KEY
  
  if (secret && authHeader !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  try {
    const result = await scheduledBackup()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}