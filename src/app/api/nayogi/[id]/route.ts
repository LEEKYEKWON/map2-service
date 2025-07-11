import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT: 나요기 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { email, title, description, imageUrl, latitude, longitude } = await request.json()
    const { id } = await params
    const eventId = id

    // 필수 필드 검증
    if (!email || !title || !description || !latitude || !longitude) {
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

    // 기존 나요기 확인
    const existingEvent = await prisma.nayogiEvent.findUnique({
      where: { id: eventId }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: '나요기를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 만료된 나요기인지 확인
    if (existingEvent.expiresAt < new Date()) {
      return NextResponse.json(
        { error: '만료된 나요기는 수정할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 권한 확인 (본인 또는 관리자만 수정 가능)
    if (existingEvent.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '수정 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 수정 시 새로운 24시간 만료 시간 설정
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // 나요기 수정
    const updatedEvent = await prisma.nayogiEvent.update({
      where: { id: eventId },
      data: {
        title,
        description,
        imageUrl: imageUrl || null,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        expiresAt // 새로운 만료 시간
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

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error('나요기 수정 오류:', error)
    return NextResponse.json(
      { error: '나요기 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 나요기 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { email } = await request.json()
    const { id } = await params
    const eventId = id

    if (!email) {
      return NextResponse.json(
        { error: '이메일이 필요합니다.' },
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

    // 기존 나요기 확인
    const existingEvent = await prisma.nayogiEvent.findUnique({
      where: { id: eventId }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: '나요기를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (본인 또는 관리자만 삭제 가능)
    if (existingEvent.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 나요기 삭제
    await prisma.nayogiEvent.delete({
      where: { id: eventId }
    })

    return NextResponse.json({ message: '나요기가 삭제되었습니다.' })
  } catch (error) {
    console.error('나요기 삭제 오류:', error)
    return NextResponse.json(
      { error: '나요기 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
} 