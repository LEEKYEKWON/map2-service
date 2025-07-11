import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, isBusker, isBusiness, isAdmin } = await request.json()

    // 간단한 유효성 검사
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(password)

    // 사용자 생성 (단순화된 구조)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: isAdmin ? 'ADMIN' : 'USER',
        isBusker: Boolean(isBusker),
        isBusiness: Boolean(isBusiness)
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBusker: true,
        isBusiness: true
      }
    })

    return NextResponse.json(
      { 
        message: '회원가입이 완료되었습니다.',
        user 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('회원가입 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 