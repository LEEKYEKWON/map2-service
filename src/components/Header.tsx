'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const NAV_MENUS = [
  { name: '버스킹', href: '/busking' },
  { name: '커뮤니티', href: '/community' },
  { name: '레슨', href: '/lesson' },
  { name: '실시간이벤트', href: '/event' },
  { name: '나요기', href: '/nayogi' },
  { name: '핫스팟', href: '/garden' },
]

export default function Header() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-blue-600">Map2</h1>
          </Link>
          {/* PC 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-6">
            {NAV_MENUS.map(menu => (
              <Link key={menu.href} href={menu.href} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                {menu.name}
              </Link>
            ))}
            {user ? (
              <>
                <span className="text-gray-700 px-2">
                  {user.name}님
                  {user.isBusker && <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">버스커</span>}
                  {user.isBusiness && <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">자영업자</span>}
                  {user.role === 'ADMIN' && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">관리자</span>}
                </span>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className="text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">관리자</Link>
                )}
                <button onClick={logout} className="text-gray-500 hover:text-red-600 transition-colors ml-2">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-500 hover:text-blue-600 transition-colors">로그인</Link>
                <Link href="/auth/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ml-2">회원가입</Link>
              </>
            )}
          </nav>
          {/* 모바일 햄버거 메뉴 버튼 */}
          <button
            className="md:hidden flex items-center px-2 py-1 text-gray-700 hover:text-blue-600 focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="메뉴 열기"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      {/* 모바일 메뉴 드롭다운 */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="flex flex-col px-4 py-4 space-y-3">
            {NAV_MENUS.map(menu => (
              <Link
                key={menu.href}
                href={menu.href}
                className="text-gray-700 hover:text-blue-600 font-medium text-lg py-2 border-b border-gray-100 last:border-b-0"
                onClick={() => setMobileMenuOpen(false)}
              >
                {menu.name}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-3 mt-2 flex flex-col space-y-2">
              {user ? (
                <>
                  <span className="text-gray-700">
                    {user.name}님
                    {user.isBusker && <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">버스커</span>}
                    {user.isBusiness && <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">자영업자</span>}
                    {user.role === 'ADMIN' && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">관리자</span>}
                  </span>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" className="text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>관리자</Link>
                  )}
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-gray-500 hover:text-red-600 transition-colors text-left">로그아웃</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-500 hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
                  <Link href="/auth/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" onClick={() => setMobileMenuOpen(false)}>회원가입</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
} 