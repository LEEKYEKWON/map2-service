import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const events = await prisma.realtimeEvent.findMany({
      include: {
        business: {
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        user: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { startDate: 'asc' }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('RealtimeEvent 조회 실패:', error)
    return NextResponse.json({ error: '이벤트 목록을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, imageUrl, startDate, endDate, businessId, email } = await request.json()

    // 필수 필드 검증
    if (!title || !description || !startDate || !endDate || !businessId || !email) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    // 날짜 유효성 검증
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: '유효한 날짜를 입력해주세요.' }, { status: 400 })
    }

    if (start >= end) {
      return NextResponse.json({ error: '종료 시간이 시작 시간보다 늦어야 합니다.' }, { status: 400 })
    }

    if (start < now) {
      return NextResponse.json({ error: '시작 시간은 현재 시간 이후여야 합니다.' }, { status: 400 })
    }

    // 사용자 조회 및 권한 확인
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!user.isBusiness && user.role !== 'ADMIN') {
      return NextResponse.json({ error: '자영업자만 이벤트를 등록할 수 있습니다.' }, { status: 403 })
    }

    // 매장 조회 및 소유권 확인
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    })

    if (!business) {
      return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (business.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: '본인 매장에서만 이벤트를 등록할 수 있습니다.' }, { status: 403 })
    }

    // 이벤트 생성
    const event = await prisma.realtimeEvent.create({
      data: {
        title,
        description,
        imageUrl: imageUrl || null,
        startDate: start,
        endDate: end,
        businessId,
        userId: user.id
      },
      include: {
        business: {
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        user: {
          select: { id: true, name: true, role: true }
        }
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('RealtimeEvent 생성 실패:', error)
    return NextResponse.json({ error: '이벤트 등록에 실패했습니다.' }, { status: 500 })
  }
} 