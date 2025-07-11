import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PostCategory } from '@prisma/client'

// GET: 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as PostCategory | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = category ? { category } : {}

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.post.count({ where })
    ])

    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('게시글 조회 오류:', error)
    return NextResponse.json(
      { error: '게시글을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 새 게시글 작성
export async function POST(request: NextRequest) {
  try {
    const { title, content, category, email } = await request.json()

    // 필수 필드 검증
    if (!title || !content || !category || !email) {
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
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 유효한 카테고리인지 확인
    const validCategories = ['BUSKING', 'COMMUNITY', 'LESSON', 'EVENT', 'NAYOGI', 'GARDEN']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다.' },
        { status: 400 }
      )
    }

    // 게시글 생성
    const post = await prisma.post.create({
      data: {
        title,
        content,
        category: category as PostCategory,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('게시글 작성 오류:', error)
    return NextResponse.json(
      { error: '게시글 작성에 실패했습니다.' },
      { status: 500 }
    )
  }
} 