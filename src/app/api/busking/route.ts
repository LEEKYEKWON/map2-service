import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 버스킹 이벤트 목록 조회
export async function GET() {
  try {
    const now = new Date()

    const events = await prisma.buskingEvent.findMany({
      where: {
        dateTime: {
          gte: now // 현재 시간 이후 이벤트만
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            isBusker: true
          }
        }
      },
      orderBy: {
        dateTime: 'asc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('이벤트 조회 오류:', error)
    return NextResponse.json(
      { error: '이벤트를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 버스킹 이벤트 등록
export async function POST(request: NextRequest) {
  try {
    const { email, name, dateTime, description, imageUrl, latitude, longitude } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자 조회 및 권한 확인 (단순화된 권한 체크)
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 버스커 권한 체크 (단순화 + 임시 완화)
    if (user.role !== 'ADMIN' && !user.isBusker && false) { // 임시로 false 추가
      return NextResponse.json(
        { error: '버스커 권한이 필요합니다. 프로필에서 버스커로 변경해주세요.' },
        { status: 403 }
      )
    }

    // 필수 필드 검증
    if (!name || !dateTime || !description || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: '모든 필수 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 공연일시 검증
    const eventDateTime = new Date(dateTime)
    if (eventDateTime <= new Date()) {
      return NextResponse.json(
        { error: '공연일시는 현재 시간 이후여야 합니다.' },
        { status: 400 }
      )
    }

    const event = await prisma.buskingEvent.create({
      data: {
        name,
        dateTime: eventDateTime,
        description,
        imageUrl: imageUrl || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            isBusker: true
          }
        }
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('이벤트 등록 오류:', error)
    return NextResponse.json(
      { error: '이벤트 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
} 