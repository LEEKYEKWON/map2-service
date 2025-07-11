import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: 공유텃밭 목록 조회
export async function GET() {
  try {
    const gardens = await prisma.garden.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(gardens)
  } catch (error) {
    console.error('공유텃밭 조회 오류:', error)
    return NextResponse.json(
      { error: '공유텃밭을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 새 공유텃밭 등록 (관리자만)
export async function POST(request: NextRequest) {
  try {
    const { name, description, imageUrl, linkUrl, latitude, longitude } = await request.json()

    // 필수 필드 검증
    if (!name || !latitude || !longitude) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 공유텃밭 생성 (관리자 권한 체크는 프론트엔드에서 처리)
    const garden = await prisma.garden.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString())
      }
    })

    return NextResponse.json(garden, { status: 201 })
  } catch (error) {
    console.error('공유텃밭 등록 오류:', error)
    return NextResponse.json(
      { error: '공유텃밭 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
} 