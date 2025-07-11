import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdminApiAuth } from '@/lib/auth'

// 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    // 관리자 권한 체크
    if (!checkAdminApiAuth(email, role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const skip = (page - 1) * limit

    // 검색 조건
    const where = search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    } : {}

    // 사용자 목록과 총 개수 조회
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isBusker: true,
          isBusiness: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })

  } catch (error) {
    console.error('사용자 목록 조회 오류:', error)
    return NextResponse.json({ error: '사용자 목록 조회에 실패했습니다.' }, { status: 500 })
  }
}

// 사용자 정보 수정
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const role = searchParams.get('role')

    // 관리자 권한 체크
    if (!checkAdminApiAuth(email, role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { userId, updates } = await request.json()

    if (!userId || !updates) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBusker: true,
        isBusiness: true
      }
    })

    return NextResponse.json({ 
      message: '사용자 정보가 성공적으로 업데이트되었습니다.',
      user: updatedUser 
    })

  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error)
    return NextResponse.json({ error: '사용자 정보 업데이트에 실패했습니다.' }, { status: 500 })
  }
} 