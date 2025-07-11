import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: 핫스팟 목록 조회
export async function GET() {
  try {
    const hotspots = await prisma.hotspot.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(hotspots)
  } catch (error) {
    console.error('핫스팟 조회 오류:', error)
    return NextResponse.json(
      { error: '핫스팟을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 새 핫스팟 등록 (관리자만)
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

    // 핫스팟 생성 (관리자 권한 체크는 프론트엔드에서 처리)
    const hotspot = await prisma.hotspot.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString())
      }
    })

    return NextResponse.json(hotspot, { status: 201 })
  } catch (error) {
    console.error('핫스팟 등록 오류:', error)
    return NextResponse.json(
      { error: '핫스팟 등록에 실패했습니다.' },
      { status: 500 }
    )
  }
} 