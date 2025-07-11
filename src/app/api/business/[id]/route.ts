import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, role: true }
        },
        realtimeEvents: {
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json(business)
  } catch (error) {
    console.error('Business 조회 실패:', error)
    return NextResponse.json({ error: '매장 정보를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, address, latitude, longitude, email } = await request.json()

    // 필수 필드 검증
    if (!name || !address || !email) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    // 좌표 유효성 검증
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json({ error: '유효한 좌표를 입력해주세요.' }, { status: 400 })
    }

    // 사용자 조회 및 권한 확인
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 매장 조회
    const business = await prisma.business.findUnique({
      where: { id }
    })

    if (!business) {
      return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 수정 권한 확인 (본인 또는 관리자)
    if (business.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: '매장을 수정할 권한이 없습니다.' }, { status: 403 })
    }

    // 중복 매장명 확인 (다른 매장과 중복되지 않는지)
    const existingBusiness = await prisma.business.findFirst({
      where: {
        name,
        userId: user.id,
        id: { not: id }
      }
    })

    if (existingBusiness) {
      return NextResponse.json({ error: '이미 등록된 매장명입니다.' }, { status: 400 })
    }

    // 매장 수정
    const updatedBusiness = await prisma.business.update({
      where: { id },
      data: {
        name,
        address,
        latitude,
        longitude
      },
      include: {
        user: {
          select: { id: true, name: true, role: true }
        }
      }
    })

    return NextResponse.json(updatedBusiness)
  } catch (error) {
    console.error('Business 수정 실패:', error)
    return NextResponse.json({ error: '매장 수정에 실패했습니다.' }, { status: 500 })
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

    // 매장 조회
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        realtimeEvents: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: '매장을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 삭제 권한 확인 (본인 또는 관리자)
    if (business.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: '매장을 삭제할 권한이 없습니다.' }, { status: 403 })
    }

    // 연관된 이벤트가 있는지 확인
    if (business.realtimeEvents.length > 0) {
      // 관련 이벤트들도 함께 삭제
      await prisma.realtimeEvent.deleteMany({
        where: { businessId: id }
      })
    }

    // 매장 삭제
    await prisma.business.delete({
      where: { id }
    })

    return NextResponse.json({ message: '매장이 삭제되었습니다.' })
  } catch (error) {
    console.error('Business 삭제 실패:', error)
    return NextResponse.json({ error: '매장 삭제에 실패했습니다.' }, { status: 500 })
  }
} 