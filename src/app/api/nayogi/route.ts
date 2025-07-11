import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: 나요기 목록 조회 (만료되지 않은 것만)
export async function GET() {
  try {
    const now = new Date()
    
    // 만료된 나요기 먼저 삭제
    await prisma.nayogiEvent.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    })

    // 만료되지 않은 나요기만 조회
    const events = await prisma.nayogiEvent.findMany({
      where: {
        expiresAt: {
          gt: now
        }
      },
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
        createdAt: 'desc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('나요기 조회 오류:', error)
    return NextResponse.json(
      { error: '나요기를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 새 나요기 등록
export async function POST(request: NextRequest) {
  try {
    const { email, title, description, imageUrl, latitude, longitude } = await request.json()

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

    // 24시간 후 만료 시간 계산
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // 나요기 생성
    const event = await prisma.nayogiEvent.create({
      data: {
        title,
        description,
        imageUrl: imageUrl || null,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        userId: user.id,
        expiresAt
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
    console.error('나요기 등록 오류:', error)
    return NextResponse.json(
      { error: '나요기 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
} 