import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: 커뮤니티 모임 목록 조회
export async function GET() {
  try {
    const events = await prisma.communityEvent.findMany({
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
        dateTime: 'asc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('커뮤니티 모임 조회 오류:', error)
    return NextResponse.json(
      { error: '커뮤니티 모임을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 새 커뮤니티 모임 등록
export async function POST(request: NextRequest) {
  try {
    const { email, name, dateTime, description, imageUrl, latitude, longitude } = await request.json()

    // 필수 필드 검증
    if (!email || !name || !dateTime || !description || !latitude || !longitude) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 모임 일시 검증
    const eventDate = new Date(dateTime)
    const now = new Date()
    
    if (eventDate <= now) {
      return NextResponse.json(
        { error: '모임 일시는 현재 시간보다 나중이어야 합니다.' },
        { status: 400 }
      )
    }

    // 커뮤니티 모임 생성
    const event = await prisma.communityEvent.create({
      data: {
        name,
        dateTime: eventDate,
        description,
        imageUrl: imageUrl || null,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
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
    console.error('커뮤니티 모임 등록 오류:', error)
    return NextResponse.json(
      { error: '커뮤니티 모임 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
} 