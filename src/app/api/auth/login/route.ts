import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 간단한 유효성 검사
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isBusker: true,
        isBusiness: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '존재하지 않는 계정입니다.' },
        { status: 401 }
      )
    }

    // 비밀번호 검증
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 비밀번호 제외하고 사용자 정보 반환
    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBusker: user.isBusker,
      isBusiness: user.isBusiness
    }

    return NextResponse.json(
      { 
        message: '로그인이 완료되었습니다.',
        user: userInfo
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('로그인 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 