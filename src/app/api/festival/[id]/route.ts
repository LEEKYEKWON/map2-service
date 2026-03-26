import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function requireAdmin(user: { role: string } | null) {
  if (!user) return { error: '사용자를 찾을 수 없습니다.', status: 404 as const }
  if (user.role !== 'ADMIN') {
    return { error: '관리자만 수정·삭제할 수 있습니다.', status: 403 as const }
  }
  return null
}

// PUT: 관리자만
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const denied = requireAdmin(user)
    if (denied) {
      return NextResponse.json({ error: denied.error }, { status: denied.status })
    }

    const existing = await prisma.festivalEvent.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: '축제를 찾을 수 없습니다.' }, { status: 404 })
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
        { error: '종료일이 지난 일정으로는 수정할 수 없습니다.' },
        { status: 400 }
      )
    }

    const updated = await prisma.festivalEvent.update({
      where: { id },
      data: {
        name,
        startDate: start,
        endDate: end,
        description,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude))
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error('축제 수정 오류:', error)
    return NextResponse.json({ error: '축제 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE: 관리자만
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    const denied = requireAdmin(user)
    if (denied) {
      return NextResponse.json({ error: denied.error }, { status: denied.status })
    }

    const existing = await prisma.festivalEvent.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: '축제를 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.festivalEvent.delete({
      where: { id }
    })

    return NextResponse.json({ message: '축제가 삭제되었습니다.' })
  } catch (error) {
    console.error('축제 삭제 오류:', error)
    return NextResponse.json({ error: '축제 삭제에 실패했습니다.' }, { status: 500 })
  }
}
