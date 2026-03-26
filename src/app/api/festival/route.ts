import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 종료일이 아직 지나지 않은 축제만 (공개)
export async function GET() {
  try {
    const now = new Date()

    const events = await prisma.festivalEvent.findMany({
      where: {
        endDate: {
          gte: now
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('축제 조회 오류:', error)
    return NextResponse.json(
      { error: '축제 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 관리자만 등록
export async function POST(request: NextRequest) {
  try {
    const { email, name, startDate, endDate, description, imageUrl, linkUrl, latitude, longitude } =
      await request.json()

    if (!email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: '관리자만 등록할 수 있습니다.' }, { status: 403 })
    }

    if (
      !name ||
      !startDate ||
      !endDate ||
      !description ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return NextResponse.json({ error: '모든 필수 필드를 입력해주세요.' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: '유효한 날짜를 입력해주세요.' }, { status: 400 })
    }

    if (start >= end) {
      return NextResponse.json({ error: '종료일시는 시작일시보다 늦어야 합니다.' }, { status: 400 })
    }

    if (end <= now) {
      return NextResponse.json(
        { error: '종료일이 지난 일정은 등록할 수 없습니다.' },
        { status: 400 }
      )
    }

    const event = await prisma.festivalEvent.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        description,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude)),
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('축제 등록 오류:', error)
    return NextResponse.json({ error: '축제 등록에 실패했습니다.' }, { status: 500 })
  }
}
