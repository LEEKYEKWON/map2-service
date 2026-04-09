import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getKstDateString } from '@/lib/kst'

const COOKIE_NAME = 'map2_dv'

export async function POST() {
  try {
    const today = getKstDateString()
    const cookieStore = await cookies()
    if (cookieStore.get(COOKIE_NAME)?.value === today) {
      return NextResponse.json({ ok: true, counted: false })
    }

    await prisma.dailyVisit.upsert({
      where: { date: today },
      create: { date: today, visits: 1 },
      update: { visits: { increment: 1 } }
    })

    const res = NextResponse.json({ ok: true, counted: true })
    res.cookies.set(COOKIE_NAME, today, {
      path: '/',
      maxAge: 60 * 60 * 48,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })
    return res
  } catch (e) {
    console.error('visit POST:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
