import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 케이플 계정을 관리자로 업그레이드하는 임시 API
export async function POST(request: NextRequest) {
  try {
    // 케이플 계정 찾기
    const keplUser = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: '케이플' } },
          { email: { contains: 'kepl' } },
          { name: { contains: 'kepl' } }
        ]
      }
    })

    if (!keplUser) {
      return NextResponse.json({ 
        error: '케이플 계정을 찾을 수 없습니다.',
        message: '현재 등록된 모든 사용자를 관리자로 업그레이드할까요?'
      }, { status: 404 })
    }

    // 관리자로 업그레이드
    const updatedUser = await prisma.user.update({
      where: { id: keplUser.id },
      data: { 
        role: 'ADMIN',
        isBusker: true,
        isBusiness: true
      }
    })

    return NextResponse.json({ 
      message: `${updatedUser.name} 계정이 관리자로 업그레이드되었습니다!`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isBusker: updatedUser.isBusker,
        isBusiness: updatedUser.isBusiness
      },
      needsRefresh: true
    })

  } catch (error) {
    console.error('관리자 업그레이드 오류:', error)
    return NextResponse.json({ error: '업그레이드에 실패했습니다.' }, { status: 500 })
  }
}

// 모든 사용자를 관리자로 업그레이드 (개발용)
export async function PUT(request: NextRequest) {
  try {
    const updatedUsers = await prisma.user.updateMany({
      data: { 
        role: 'ADMIN',
        isBusker: true,
        isBusiness: true
      }
    })

    return NextResponse.json({ 
      message: `${updatedUsers.count}명의 사용자가 모두 관리자로 업그레이드되었습니다!`,
      needsRefresh: true
    })

  } catch (error) {
    console.error('전체 관리자 업그레이드 오류:', error)
    return NextResponse.json({ error: '업그레이드에 실패했습니다.' }, { status: 500 })
  }
} 