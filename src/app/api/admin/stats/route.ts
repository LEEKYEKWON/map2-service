import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAdminApiAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const role = searchParams.get('role')

    // 관리자 권한 체크
    if (!checkAdminApiAuth(email, role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const now = new Date()

    // 모든 통계 데이터 병렬 조회
    const [
      totalUsers,
      totalPosts,
      totalBuskingEvents,
      totalCommunityEvents,
      totalLessonEvents,
      totalBusinesses,
      totalRealtimeEvents,
      totalNayogiEvents,
      totalGardens,
      totalHotspots
    ] = await Promise.all([
      // 사용자 수
      prisma.user.count(),

      // 게시글 수
      prisma.post.count(),

      // 버스킹 이벤트 수 (현재 시간 이후의 이벤트만)
      prisma.buskingEvent.count({
        where: {
          dateTime: {
            gte: now
          }
        }
      }),

      // 커뮤니티 이벤트 수 (실제 콘텐츠)
      prisma.communityEvent.count(),

      // 레슨 이벤트 수 (실제 콘텐츠)
      prisma.lessonEvent.count(),

      // 매장 수
      prisma.business.count(),

      // 실시간 이벤트 수
      prisma.realtimeEvent.count(),

      // 나요기 수
      prisma.nayogiEvent.count(),

      // 공유텃밭 수
      prisma.garden.count(),

      // 핫스팟 수
      prisma.hotspot.count()
    ])

    return NextResponse.json({
      totalUsers,
      totalPosts,
      totalBusking: totalBuskingEvents,
      totalBusiness: totalBusinesses,
      totalEvents: totalRealtimeEvents,
      totalCommunity: totalCommunityEvents,
      totalLesson: totalLessonEvents,
      totalNayogi: totalNayogiEvents,
      totalGarden: totalGardens,
      totalHotspot: totalHotspots
    })

  } catch (error) {
    console.error('관리자 통계 조회 오류:', error)
    return NextResponse.json({ error: '통계 조회에 실패했습니다.' }, { status: 500 })
  }
} 