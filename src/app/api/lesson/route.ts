import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: 레슨 목록 조회
export async function GET() {
  try {
    const events = await prisma.lessonEvent.findMany({
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
    console.error('레슨 조회 오류:', error)
    return NextResponse.json(
      { error: '레슨을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 새 레슨 등록
export async function POST(request: NextRequest) {
  try {
    const { email, name, category, description, imageUrl, latitude, longitude } = await request.json()

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

    // 레슨 생성
    const event = await prisma.lessonEvent.create({
      data: {
        name,
        category,
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
    console.error('레슨 등록 오류:', error)
    return NextResponse.json(
      { error: '레슨 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
} 