import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdminApiAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const role = searchParams.get('role')
    const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30', 10) || 30))

    if (!checkAdminApiAuth(email, role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const rows = await prisma.dailyVisit.findMany({
      orderBy: { date: 'desc' },
      take: days
    })

    return NextResponse.json({ visits: rows })
  } catch (e) {
    console.error('admin visits GET:', e)
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 })
  }
}
