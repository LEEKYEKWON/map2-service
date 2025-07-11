import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT: 레슨 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { email, name, category, description, imageUrl, latitude, longitude } = await request.json()
    const { id } = await params

    // 필수 필드 검증
    if (!email || !name || !category || !description || !latitude || !longitude) {
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

    // 기존 레슨 확인
    const existingEvent = await prisma.lessonEvent.findUnique({
      where: { id: id }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: '레슨을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (본인 또는 관리자만 수정 가능)
    if (existingEvent.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '수정 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 레슨 수정
    const updatedEvent = await prisma.lessonEvent.update({
      where: { id: id },
      data: {
        name,
        category,
        description,
        imageUrl: imageUrl || null,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString())
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
    console.error('레슨 수정 오류:', error)
    return NextResponse.json(
      { error: '레슨 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 레슨 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { email } = await request.json()
    const { id } = await params

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

    // 기존 레슨 확인
    const existingEvent = await prisma.lessonEvent.findUnique({
      where: { id: id }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: '레슨을 찾을 수 없습니다.' },
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

    // 레슨 삭제
    await prisma.lessonEvent.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: '레슨이 삭제되었습니다.' })
  } catch (error) {
    console.error('레슨 삭제 오류:', error)
    return NextResponse.json(
      { error: '레슨 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
} 