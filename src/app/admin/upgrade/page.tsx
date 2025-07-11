'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function AdminUpgradePage() {
  const { user, login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpgrade = async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/upgrade', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok && data.user) {
        // AuthContext 업데이트
        login(data.user)
        setMessage(`성공! ${data.message}`)
        
        // 3초 후 관리자 페이지로 이동
        setTimeout(() => {
          router.push('/admin')
        }, 3000)
      } else {
        setMessage(data.error || '업그레이드에 실패했습니다.')
      }
    } catch (error) {
      setMessage('네트워크 오류가 발생했습니다.')
      console.error('업그레이드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-8">관리자 권한 업그레이드</h1>
        
        {user ? (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-2">현재 사용자:</p>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-sm mt-2">
                현재 권한: <span className="font-semibold">{user.role}</span>
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? '업그레이드 중...' : '관리자 권한으로 업그레이드'}
              </button>
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-center ${
                message.includes('성공') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <div className="text-sm text-gray-500 text-center">
              <p>업그레이드 후 관리자 페이지에 자동으로 이동됩니다.</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
            >
              로그인하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 