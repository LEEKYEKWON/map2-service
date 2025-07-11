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
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">Map2</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              {user ? (
                <>
                  <span className="text-gray-700 px-4 py-2">
                    안녕하세요, {user.name}님!
                    {user.isBusker && <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">버스커</span>}
                    {user.isBusiness && <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">자영업자</span>}
                    {user.role === 'ADMIN' && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">관리자</span>}
                  </span>
                  {user.role === 'ADMIN' && (
                    <Link 
                      href="/admin"
                      className="text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      관리자
                    </Link>
                  )}
                  <button 
                    onClick={logout}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-500 hover:text-blue-600 transition-colors">
                    로그인
                  </Link>
                  <Link href="/auth/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    회원가입
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={`text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* 메인 제목 */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Map<span className="text-blue-600">2</span>
          </h1>
          
          {/* 서브 제목 */}
          <p className="text-xl md:text-2xl text-gray-600 mb-4">
            네이버 지도 연동 위치정보 서비스
          </p>
          
          {/* 설명 */}
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            네이버 지도에서 찾을 수 없는 유동적인 위치정보를<br />
            지도에서 한눈에 확인하세요
          </p>

          {/* 시작하기 버튼 */}
          <Link 
            href="/busking"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            시작하기
          </Link>
        </div>

        {/* 메뉴 소개 섹션 */}
        <div className={`mt-20 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Map2에서 제공하는 서비스
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 서비스 카드들 */}
            
            {/* 버스킹 - 활성화 */}
            <Link href="/busking" className="block">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-purple-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">버스킹</h3>
                <p className="text-gray-600">버스킹 정보, 지도에서 한눈에!</p>
                <div className="mt-3 text-sm text-purple-600 font-semibold">✓ 이용 가능</div>
              </div>
            </Link>

            {/* 커뮤니티 - 활성화 */}
            <Link href="/community" className="block">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-green-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">커뮤니티</h3>
                <p className="text-gray-600">커뮤니티 정보, 지도에서 한눈에!</p>
                <div className="mt-3 text-sm text-green-600 font-semibold">✓ 이용 가능</div>
              </div>
            </Link>

            {/* 레슨 - 활성화 */}
            <Link href="/lesson" className="block">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-blue-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">레슨</h3>
                <p className="text-gray-600">레슨 정보, 지도에서 한눈에!</p>
                <div className="mt-3 text-sm text-blue-600 font-semibold">✓ 이용 가능</div>
              </div>
            </Link>

            {/* 실시간이벤트 - 활성화 */}
            <Link href="/event" className="block">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-red-200">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">실시간이벤트</h3>
                <p className="text-gray-600">실시간 이벤트 정보, 지도에서 한눈에!</p>
                <div className="mt-3 text-sm text-red-600 font-semibold">✓ 이용 가능</div>
              </div>
            </Link>

            {/* 나요기 - 활성화 */}
            <Link href="/nayogi" className="block">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-yellow-200">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">나요기</h3>
                <p className="text-gray-600">나 요기 있어!</p>
                <div className="mt-3 text-sm text-yellow-600 font-semibold">✓ 이용 가능</div>
              </div>
            </Link>

            {/* 공유텃밭 & 핫스팟 - 활성화 */}
            <Link href="/garden" className="block">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-indigo-200">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">핫스팟</h3>
                <p className="text-gray-600">SNS에서 화제가 되는 명소를 지도에서 한눈에!</p>
                <div className="mt-3 text-sm text-indigo-600 font-semibold">✓ 이용 가능</div>
              </div>
            </Link>
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
