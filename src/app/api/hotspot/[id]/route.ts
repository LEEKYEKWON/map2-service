import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT: 핫스팟 수정 (관리자만)
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

    // 기존 핫스팟 확인
    const existingHotspot = await prisma.hotspot.findUnique({
      where: { id: id }
    })

    if (!existingHotspot) {
      return NextResponse.json(
        { error: '핫스팟을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 핫스팟 수정
    const updatedHotspot = await prisma.hotspot.update({
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

    return NextResponse.json(updatedHotspot)
  } catch (error) {
    console.error('핫스팟 수정 오류:', error)
    return NextResponse.json(
      { error: '핫스팟 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 핫스팟 삭제 (관리자만)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 기존 핫스팟 확인
    const existingHotspot = await prisma.hotspot.findUnique({
      where: { id: id }
    })

    if (!existingHotspot) {
      return NextResponse.json(
        { error: '핫스팟을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 핫스팟 삭제
    await prisma.hotspot.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: '핫스팟이 삭제되었습니다.' })
  } catch (error) {
    console.error('핫스팟 삭제 오류:', error)
    return NextResponse.json(
      { error: '핫스팟 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
} 