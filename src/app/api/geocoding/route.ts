import { NextRequest, NextResponse } from 'next/server'

// 로컬 위치 데이터베이스
const locationDatabase = [
  // 지하철역
  { name: '강남역', roadAddress: '서울특별시 강남구 강남대로 지하 396', latitude: 37.4979, longitude: 127.0276 },
  { name: '홍대입구역', roadAddress: '서울특별시 마포구 양화로 지하 188', latitude: 37.5571, longitude: 126.9245 },
  { name: '명동역', roadAddress: '서울특별시 중구 명동2가', latitude: 37.5636, longitude: 126.9827 },
  { name: '서울역', roadAddress: '서울특별시 용산구 한강대로 405', latitude: 37.5547, longitude: 126.9706 },
  { name: '신촌역', roadAddress: '서울특별시 서대문구 신촌로 지하 120', latitude: 37.5556, longitude: 126.9364 },
  { name: '이태원역', roadAddress: '서울특별시 용산구 이태원로 지하 177', latitude: 37.5345, longitude: 126.9947 },
  { name: '건대입구역', roadAddress: '서울특별시 광진구 능동로 지하 289', latitude: 37.5403, longitude: 127.0695 },
  { name: '잠실역', roadAddress: '서울특별시 송파구 올림픽로 지하 265', latitude: 37.5132, longitude: 127.1002 },
  { name: '신림역', roadAddress: '서울특별시 관악구 신림로 지하 340', latitude: 37.4843, longitude: 126.9298 },
  { name: '구로디지털단지역', roadAddress: '서울특별시 구로구 디지털로 지하 300', latitude: 37.4853, longitude: 126.9013 },

  // 주요 건물/랜드마크
  { name: '서울시청', roadAddress: '서울특별시 중구 세종대로 110', latitude: 37.5664, longitude: 126.9779 },
  { name: '롯데타워', roadAddress: '서울특별시 송파구 올림픽로 300', latitude: 37.5125, longitude: 127.1025 },
  { name: '63빌딩', roadAddress: '서울특별시 영등포구 여의도동 60', latitude: 37.5200, longitude: 126.9394 },
  { name: 'N서울타워', roadAddress: '서울특별시 용산구 남산공원길 105', latitude: 37.5512, longitude: 126.9882 },
  { name: '코엑스', roadAddress: '서울특별시 강남구 영동대로 513', latitude: 37.5115, longitude: 127.0595 },
  { name: '동대문디자인플라자', roadAddress: '서울특별시 중구 을지로 281', latitude: 37.5676, longitude: 127.0095 },
  { name: '경복궁', roadAddress: '서울특별시 종로구 사직로 161', latitude: 37.5788, longitude: 126.9770 },
  { name: '덕수궁', roadAddress: '서울특별시 중구 세종대로 99', latitude: 37.5658, longitude: 126.9751 },

  // 대학교
  { name: '서울대학교', roadAddress: '서울특별시 관악구 관악로 1', latitude: 37.4601, longitude: 126.9513 },
  { name: '연세대학교', roadAddress: '서울특별시 서대문구 연세로 50', latitude: 37.5665, longitude: 126.9388 },
  { name: '고려대학교', roadAddress: '서울특별시 성북구 안암로 145', latitude: 37.5894, longitude: 127.0263 },
  { name: '홍익대학교', roadAddress: '서울특별시 마포구 와우산로 94', latitude: 37.5511, longitude: 126.9255 },
  { name: '이화여자대학교', roadAddress: '서울특별시 서대문구 이화여대길 52', latitude: 37.5596, longitude: 126.9470 },
  { name: '성균관대학교', roadAddress: '서울특별시 종로구 성균관로 25-2', latitude: 37.5894, longitude: 126.9921 },

  // 구/지역
  { name: '강남구', roadAddress: '서울특별시 강남구', latitude: 37.5173, longitude: 127.0473 },
  { name: '서초구', roadAddress: '서울특별시 서초구', latitude: 37.4837, longitude: 127.0324 },
  { name: '송파구', roadAddress: '서울특별시 송파구', latitude: 37.5145, longitude: 127.1059 },
  { name: '마포구', roadAddress: '서울특별시 마포구', latitude: 37.5617, longitude: 126.9087 },
  { name: '종로구', roadAddress: '서울특별시 종로구', latitude: 37.5735, longitude: 126.9788 },
  { name: '중구', roadAddress: '서울특별시 중구', latitude: 37.5641, longitude: 126.9979 },
  { name: '용산구', roadAddress: '서울특별시 용산구', latitude: 37.5326, longitude: 126.9902 },
  { name: '성동구', roadAddress: '서울특별시 성동구', latitude: 37.5636, longitude: 127.0374 },
  { name: '광진구', roadAddress: '서울특별시 광진구', latitude: 37.5388, longitude: 127.0821 },
  { name: '구로구', roadAddress: '서울특별시 구로구', latitude: 37.4955, longitude: 126.8875 },

  // 동네/지역
  { name: '명동', roadAddress: '서울특별시 중구 명동', latitude: 37.5636, longitude: 126.9827 },
  { name: '홍대', roadAddress: '서울특별시 마포구 홍익대학교 일대', latitude: 37.5511, longitude: 126.9255 },
  { name: '이태원', roadAddress: '서울특별시 용산구 이태원동', latitude: 37.5345, longitude: 126.9947 },
  { name: '신촌', roadAddress: '서울특별시 서대문구 신촌동', latitude: 37.5556, longitude: 126.9364 },
  { name: '건대', roadAddress: '서울특별시 광진구 건국대학교 일대', latitude: 37.5403, longitude: 127.0695 },
  { name: '잠실', roadAddress: '서울특별시 송파구 잠실동', latitude: 37.5132, longitude: 127.1002 },
  { name: '여의도', roadAddress: '서울특별시 영등포구 여의도동', latitude: 37.5219, longitude: 126.9245 },
  { name: '압구정', roadAddress: '서울특별시 강남구 압구정동', latitude: 37.5272, longitude: 127.0286 },
  { name: '청담', roadAddress: '서울특별시 강남구 청담동', latitude: 37.5172, longitude: 127.0473 },
  { name: '신림', roadAddress: '서울특별시 관악구 신림동', latitude: 37.4843, longitude: 126.9298 },

  // 관광지/공원
  { name: '한강공원', roadAddress: '서울특별시 한강공원', latitude: 37.5326, longitude: 126.9651 },
  { name: '남산', roadAddress: '서울특별시 중구 남산', latitude: 37.5512, longitude: 126.9882 },
  { name: '북한산', roadAddress: '서울특별시 은평구 북한산', latitude: 37.6658, longitude: 126.9781 },
  { name: '올림픽공원', roadAddress: '서울특별시 송파구 올림픽공원', latitude: 37.5219, longitude: 127.1211 },
  { name: '청계천', roadAddress: '서울특별시 중구 청계천로', latitude: 37.5693, longitude: 126.9785 },

  // 경기도 주요 지역 (구리시 포함)
  { name: '구리시', roadAddress: '경기도 구리시', latitude: 37.5943, longitude: 127.1296 },
  { name: '토평동', roadAddress: '경기도 구리시 토평동', latitude: 37.6041, longitude: 127.1396 },
  { name: '수택동', roadAddress: '경기도 구리시 수택동', latitude: 37.6051, longitude: 127.1200 },
  { name: '인창동', roadAddress: '경기도 구리시 인창동', latitude: 37.5893, longitude: 127.1343 },
  { name: '성남시', roadAddress: '경기도 성남시', latitude: 37.4386, longitude: 127.1378 },
  { name: '수원시', roadAddress: '경기도 수원시', latitude: 37.2636, longitude: 127.0286 },
  { name: '고양시', roadAddress: '경기도 고양시', latitude: 37.6584, longitude: 126.8320 },
  { name: '용인시', roadAddress: '경기도 용인시', latitude: 37.2411, longitude: 127.1776 },
  { name: '부천시', roadAddress: '경기도 부천시', latitude: 37.5034, longitude: 126.7660 },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  
  try {
    
    if (!query) {
      return NextResponse.json(
        { error: '검색어를 입력해주세요.' },
        { status: 400 }
      )
    }

    console.log('🔍 네이버 Geocoding 검색 요청:', query)
    console.log('🔑 Client ID:', process.env.NAVER_MAP_CLIENT_ID)
    console.log('🔐 Client Secret 존재 여부:', !!process.env.NAVER_MAP_CLIENT_SECRET)

    // 네이버 Geocoding API 호출 (공식 문서 기준)
    const apiUrl = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`
    console.log('🌐 API URL:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'x-ncp-apigw-api-key-id': process.env.NAVER_MAP_CLIENT_ID || '',
        'x-ncp-apigw-api-key': process.env.NAVER_MAP_CLIENT_SECRET || '',
        'Accept': 'application/json',
      },
    })

    console.log('📡 API 응답 상태:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API 응답 오류:', errorText)
      throw new Error(`Geocoding API 요청 실패: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ API 응답 성공:', data)
    
    // 검색 결과가 없는 경우
    if (!data.addresses || data.addresses.length === 0) {
      return NextResponse.json({
        success: false,
        message: '검색 결과가 없습니다.',
        results: []
      })
    }

    // 검색 결과 정리 (공식 문서 응답 구조에 맞게)
    const results = data.addresses.map((address: any) => ({
      roadAddress: address.roadAddress || '',
      jibunAddress: address.jibunAddress || '',
      englishAddress: address.englishAddress || '',
      latitude: parseFloat(address.y),
      longitude: parseFloat(address.x),
      distance: address.distance || 0
    }))

    return NextResponse.json({
      success: true,
      message: `${results.length}개의 검색 결과를 찾았습니다.`,
      results
    })

  } catch (error) {
    console.error('네이버 Geocoding API 오류:', error)
    console.log('🔄 로컬 데이터베이스로 대체 검색 시도:', query)

    // 로컬 데이터베이스에서 검색 (부분 매칭)
    const localResults = locationDatabase.filter(location => 
      query && (
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.roadAddress.toLowerCase().includes(query.toLowerCase())
      )
    )

    if (localResults.length > 0) {
      console.log(`✅ 로컬 데이터베이스에서 ${localResults.length}개 결과 발견`)
      
      const results = localResults.map(location => ({
        roadAddress: location.roadAddress,
        jibunAddress: location.roadAddress,
        englishAddress: '',
        latitude: location.latitude,
        longitude: location.longitude,
        distance: 0
      }))

      return NextResponse.json({
        success: true,
        message: `${results.length}개의 검색 결과를 찾았습니다. (로컬 데이터)`,
        results
      })
    }

    // 로컬 데이터에서도 찾을 수 없는 경우
    console.log('❌ 로컬 데이터베이스에서도 검색 결과 없음')
    return NextResponse.json({
      success: false,
      message: '검색 결과가 없습니다. 정확한 주소나 지역명을 입력해주세요.',
      results: []
    })
  }
} 