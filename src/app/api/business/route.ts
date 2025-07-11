import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        user: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(businesses)
  } catch (error) {
    console.error('Business 조회 실패:', error)
    return NextResponse.json({ error: '매장 목록을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!user.isBusiness && user.role !== 'ADMIN') {
      return NextResponse.json({ error: '자영업자만 매장을 등록할 수 있습니다.' }, { status: 403 })
    }

    // 중복 매장명 확인 (같은 사용자)
    const existingBusiness = await prisma.business.findFirst({
      where: {
        name,
        userId: user.id
      }
    })

    if (existingBusiness) {
      return NextResponse.json({ error: '이미 등록된 매장명입니다.' }, { status: 400 })
    }

    // 매장 생성
    const business = await prisma.business.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        userId: user.id
      },
      include: {
        user: {
          select: { id: true, name: true, role: true }
        }
      }
    })

    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    console.error('Business 생성 실패:', error)
    return NextResponse.json({ error: '매장 등록에 실패했습니다.' }, { status: 500 })
  }
} 