import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT: 버스킹 이벤트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { email, name, dateTime, description, imageUrl, latitude, longitude } = await request.json()
    const eventId = id

    if (!email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이벤트 조회
    const event = await prisma.buskingEvent.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json(
        { error: '이벤트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (본인 또는 관리자)
    if (event.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '수정 권한이 없습니다.' },
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

    const updatedEvent = await prisma.buskingEvent.update({
      where: { id: eventId },
      data: {
        name,
        dateTime: eventDateTime,
        description,
        imageUrl: imageUrl || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
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

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error('이벤트 수정 오류:', error)
    return NextResponse.json(
      { error: '이벤트 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 버스킹 이벤트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { email } = await request.json()
    const eventId = id

    if (!email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이벤트 조회
    const event = await prisma.buskingEvent.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json(
        { error: '이벤트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (본인 또는 관리자)
    if (event.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    await prisma.buskingEvent.delete({
      where: { id: eventId }
    })

    return NextResponse.json({ message: '이벤트가 삭제되었습니다.' })
  } catch (error) {
    console.error('이벤트 삭제 오류:', error)
    return NextResponse.json(
      { error: '이벤트 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
} 