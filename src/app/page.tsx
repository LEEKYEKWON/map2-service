'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, logout } = useAuth()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={`text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* 메인 제목 */}
          <div className="flex items-end justify-center mb-6">
            <img src="/logo.png" alt="Map2 로고" className="inline-block w-20 h-20 mr-1" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
              Map<span className="text-blue-600">2</span>
            </h1>
          </div>
          
          {/* 서브 제목 */}
          <p className="text-xl md:text-2xl text-gray-600 mb-4">
            네이버 지도 연동 위치정보 서비스
          </p>
          
          {/* 설명 */}
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            어디 갈지 고민될 때, Map2 지도에서 바로 확인하세요.
            <br />
            ⭐ 정보탭의 관련 링크를 꼭 눌러보기! ⭐
          </p>

          {/* 메뉴 소개 섹션 */}
          <div className={`transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 서비스 카드들 */}

              {/* 전국 축제 - 활성화 */}
              <Link href="/festival" className="block">
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-amber-200">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 15v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900">전국 축제</h3>
                  </div>
                  <p className="text-gray-600">전국 축제 일정, 지도에서 한눈에!</p>
                  <div className="mt-3 text-sm text-amber-600 font-semibold">✓ 이용 가능</div>
                </div>
              </Link>

              {/* 공유텃밭 & 핫스팟 - 활성화 */}
              <Link href="/garden" className="block">
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-indigo-200">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900">핫스팟</h3>
                  </div>
                  <p className="text-gray-600">SNS에서 화제가 되는 명소를 지도에서 한눈에!</p>
                  <div className="mt-3 text-sm text-indigo-600 font-semibold">✓ 이용 가능</div>
                </div>
              </Link>

            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* 왼쪽: 서비스 정보 */}
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <h3 className="text-lg font-bold text-blue-600">Map2</h3>
                              <p className="text-sm text-gray-500">
                  &copy; 2025 Map2. All rights reserved.
                </p>
            </div>

            {/* 오른쪽: 연락처 */}
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-gray-600">
              <span>운영자: 케이플</span>
              <a href="mailto:hayabusak@naver.com" className="hover:text-blue-600 transition-colors">
                📧 hayabusak@naver.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
