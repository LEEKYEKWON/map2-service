import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = await prisma.realtimeEvent.findUnique({
      where: { id: id },
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

    if (!event) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('RealtimeEvent 조회 실패:', error)
    return NextResponse.json({ error: '이벤트 정보를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { title, description, imageUrl, startDate, endDate, businessId, email } = await request.json()

    // 필수 필드 검증
    if (!title || !description || !startDate || !endDate || !businessId || !email) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    // 날짜 유효성 검증
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: '유효한 날짜를 입력해주세요.' }, { status: 400 })
    }

    if (start >= end) {
      return NextResponse.json({ error: '종료 시간이 시작 시간보다 늦어야 합니다.' }, { status: 400 })
    }

    // 사용자 조회 및 권한 확인
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이벤트 조회
    const event = await prisma.realtimeEvent.findUnique({
      where: { id: id },
      include: { business: true }
    })

    if (!event) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 수정 권한 확인 (본인 또는 관리자)
    if (event.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: '이벤트를 수정할 권한이 없습니다.' }, { status: 403 })
    }

    // 매장 조회 및 소유권 확인 (매장 변경하는 경우)
    if (businessId !== event.businessId) {
      const newBusiness = await prisma.business.findUnique({
        where: { id: businessId }
      })

      if (!newBusiness) {
        return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 })
      }

      if (newBusiness.userId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json({ error: '본인 매장에서만 이벤트를 등록할 수 있습니다.' }, { status: 403 })
      }
    }

    // 이벤트 수정
    const updatedEvent = await prisma.realtimeEvent.update({
      where: { id: id },
      data: {
        title,
        description,
        imageUrl: imageUrl || null,
        startDate: start,
        endDate: end,
        businessId
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

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error('RealtimeEvent 수정 실패:', error)
    return NextResponse.json({ error: '이벤트 수정에 실패했습니다.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: '사용자 정보가 필요합니다.' }, { status: 400 })
    }

    // 사용자 조회 및 권한 확인
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이벤트 조회
    const event = await prisma.realtimeEvent.findUnique({
      where: { id: id }
    })

    if (!event) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 삭제 권한 확인 (본인 또는 관리자)
    if (event.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: '이벤트를 삭제할 권한이 없습니다.' }, { status: 403 })
    }

    // 이벤트 삭제
    await prisma.realtimeEvent.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: '이벤트가 삭제되었습니다.' })
  } catch (error) {
    console.error('RealtimeEvent 삭제 실패:', error)
    return NextResponse.json({ error: '이벤트 삭제에 실패했습니다.' }, { status: 500 })
  }
} 