import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT: 공유텃밭 수정 (관리자만)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name, description, imageUrl, linkUrl, latitude, longitude } = await request.json()
    const { id } = await params

    // 필수 필드 검증
    if (!name || !latitude || !longitude) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 공유텃밭 확인
    const existingGarden = await prisma.garden.findUnique({
      where: { id: id }
    })

    if (!existingGarden) {
      return NextResponse.json(
        { error: '공유텃밭을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 공유텃밭 수정
    const updatedGarden = await prisma.garden.update({
      where: { id: id },
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString())
      }
    })

    return NextResponse.json(updatedGarden)
  } catch (error) {
    console.error('공유텃밭 수정 오류:', error)
    return NextResponse.json(
      { error: '공유텃밭 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 공유텃밭 삭제 (관리자만)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 기존 공유텃밭 확인
    const existingGarden = await prisma.garden.findUnique({
      where: { id: id }
    })

    if (!existingGarden) {
      return NextResponse.json(
        { error: '공유텃밭을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 공유텃밭 삭제
    await prisma.garden.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: '공유텃밭이 삭제되었습니다.' })
  } catch (error) {
    console.error('공유텃밭 삭제 오류:', error)
    return NextResponse.json(
      { error: '공유텃밭 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
} 