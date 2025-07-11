'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import NaverMap from '@/components/NaverMap'
import PostBoard from '@/components/PostBoard'
import Link from 'next/link'
import dayjs from 'dayjs'

interface LessonEvent {
  id: string
  name: string
  category: string
  description: string
  imageUrl?: string
  latitude: number
  longitude: number
  userId: string
  user: {
    id: string
    name: string
    role: string
  }
}

export default function LessonPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<LessonEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<LessonEvent | null>(null)
  const [moveToMarker, setMoveToMarker] = useState<string | null>(null) // 리스트 클릭시 지도 이동용
  const [tempMarker, setTempMarker] = useState<{ lat: number, lng: number } | null>(null) // 임시 마커
  const [showLocationGuide, setShowLocationGuide] = useState(false) // 위치 안내 메시지
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    imageUrl: '',
    latitude: 37.5665,
    longitude: 126.9780
  })

  // 레슨 카테고리 목록
  const lessonCategories = [
    '피아노', '기타(악기)', '바이올린', '드럼', '보컬',
    '댄스', '요가', '필라테스', '수영', '테니스',
    '영어', '중국어', '일본어', '수학', '과학',
    '미술', '요리', '사진', '기타(기타)'
  ]

  // 이벤트 목록 조회
  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/lesson')
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      } else {
        setError('레슨을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  // 선택된 이벤트로 자동 스크롤
  useEffect(() => {
    if (selectedEvent) {
      const element = document.getElementById(`event-${selectedEvent.id}`)
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'start'
        })
      }
    }
  }, [selectedEvent])

  // moveToMarker 사용 후 리셋
  useEffect(() => {
    if (moveToMarker) {
      const timer = setTimeout(() => setMoveToMarker(null), 100)
      return () => clearTimeout(timer)
    }
  }, [moveToMarker])

  // 🎯 레슨 등록 폼 표시 시 자동 스크롤
  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        const formElement = document.getElementById('lesson-form')
        if (formElement) {
          formElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          })
        }
      }, 100) // 폼 렌더링 완료 대기
    }
  }, [showForm])

  // 이벤트 등록/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const url = selectedEvent ? `/api/lesson/${selectedEvent.id}` : '/api/lesson'
      const method = selectedEvent ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: user.email
        })
      })

      if (response.ok) {
        setSuccess(selectedEvent ? '레슨이 수정되었습니다.' : '레슨이 등록되었습니다.')
        setShowForm(false)
        setSelectedEvent(null)
        setTempMarker(null) // 임시 마커 제거
        setShowLocationGuide(false) // 안내 메시지 제거
        resetForm()
        fetchEvents()
      } else {
        const data = await response.json()
        setError(data.error || '작업에 실패했습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 이벤트 삭제
  const handleDelete = async (eventId: string) => {
    if (!user || !confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/lesson/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })

      if (response.ok) {
        setSuccess('레슨이 삭제되었습니다.')
        fetchEvents()
      } else {
        const data = await response.json()
        setError(data.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
    }
  }

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      imageUrl: '',
      latitude: 37.5665,
      longitude: 126.9780
    })
  }

  // 마커 직접 클릭 핸들러 - 정확한 ID 매칭
  const handleMarkerClick = (markerId: string) => {
    // 임시 마커 제거 (기존 마커 클릭시)
    setTempMarker(null)
    setShowLocationGuide(false)
    
    const clickedEvent = events.find(event => event.id === markerId)
    if (clickedEvent) {
      // 마커 클릭 - 토글 방식으로 선택/해제
      if (selectedEvent?.id === clickedEvent.id) {
        setSelectedEvent(null) // 같은 마커 클릭시 선택 해제
      } else {
        setSelectedEvent(clickedEvent) // 다른 마커 선택
      }
    }
  }

  // 지도 클릭 핸들러 - 빈 공간 클릭만 처리
  const handleMapClick = (lat: number, lng: number) => {
    // 빈 공간 클릭 - 모든 마커 선택 해제
    setSelectedEvent(null)
    
    if (user && (user.role === 'ADMIN' || true)) {
      // 임시 마커 생성
      setTempMarker({ lat, lng })
      
      // 폼 데이터에 좌표 설정
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }))
      
      // 안내 메시지 표시
      setShowLocationGuide(true)
      
      // 폼이 열려있지 않다면 닫기
      setShowForm(false)
      
      // 8초 후 안내 메시지 자동 숨김
      setTimeout(() => {
        setShowLocationGuide(false)
      }, 8000)
    }
  }

  // 임시 마커 클릭 핸들러
  const handleTempMarkerClick = () => {
    if (tempMarker) {
      setShowForm(true)
      setShowLocationGuide(false)
    }
  }

  // 폼 취소 시 임시 마커도 제거
  const handleCancelForm = () => {
    setShowForm(false)
    setSelectedEvent(null)
    setTempMarker(null)
    setShowLocationGuide(false)
    resetForm()
  }

  // 검색 결과에서 위치 선택 시 처리
  const handleSearchResultSelect = (lat: number, lng: number, address: string) => {
    // 폼 데이터에 위치 정보 설정
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }))
    
    // 등록 폼 표시
    setShowForm(true)
    setSelectedEvent(null)
    setTempMarker(null)
    setShowLocationGuide(false)
    
    // 성공 메시지 표시
    setSuccess(`📍 선택된 위치: ${address}`)
    
    // 폼 영역으로 스크롤
    setTimeout(() => {
      const formElement = document.getElementById('lesson-form')
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        })
      }
    }, 100)
  }

  // 마커 데이터 변환
  const mapMarkers = events.map(event => ({
    id: event.id,
    latitude: event.latitude,
    longitude: event.longitude,
    title: event.name,
    content: `${event.category} - ${event.description}`
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold text-blue-600">Map2</Link>
              <div className="text-gray-300">|</div>
              <h1 className="text-xl font-semibold text-gray-900">레슨</h1>
            </div>
            
            {/* 상단 메뉴 */}
            <nav className="hidden md:flex space-x-6">
              <Link href="/busking" className="text-gray-600 hover:text-blue-600 transition-colors">버스킹</Link>
              <Link href="/community" className="text-gray-600 hover:text-blue-600 transition-colors">커뮤니티</Link>
              <Link href="/lesson" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1">레슨</Link>
              <Link href="/event" className="text-gray-600 hover:text-blue-600 transition-colors">실시간이벤트</Link>
              <Link href="/nayogi" className="text-gray-600 hover:text-blue-600 transition-colors">나요기</Link>
              <Link href="/garden" className="text-gray-600 hover:text-blue-600 transition-colors">핫스팟</Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <span className="text-sm text-gray-600">안녕하세요, {user.name}님!</span>
              ) : (
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700">
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 문구 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">레슨 정보, 지도에서 한눈에!</h2>
          <p className="text-gray-600">다양한 레슨과 강의를 지도에 등록해보세요.</p>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={() => setError('')} className="float-right text-red-400 hover:text-red-600">×</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
            {success}
            <button onClick={() => setSuccess('')} className="float-right text-green-400 hover:text-green-600">×</button>
          </div>
        )}

        {/* 지도 + 리스트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 지도 영역 (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">레슨 지도</h3>
                {user && (
                  <button
                    onClick={() => {
                      if (showForm) {
                        handleCancelForm()
                      } else {
                        setShowForm(true)
                        setSelectedEvent(null)
                        setTempMarker(null)
                        setShowLocationGuide(false)
                        resetForm()
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showForm ? '취소' : '+ 레슨 등록'}
                  </button>
                )}
              </div>
              
              <NaverMap
                markers={mapMarkers}
                onMapClick={handleMapClick}
                onMarkerClick={handleMarkerClick}
                selectedMarkerId={selectedEvent?.id || null}
                moveToMarker={moveToMarker}
                onMoveComplete={() => setMoveToMarker(null)}
                tempMarker={tempMarker}
                onTempMarkerClick={handleTempMarkerClick}
                onSearchResultSelect={handleSearchResultSelect}
                height="500px"
              />

              {/* 위치 안내 메시지 */}
              {showLocationGuide && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-orange-800 font-medium">여기에 레슨을 등록하시겠어요?</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleTempMarkerClick}
                        className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
                      >
                        여기에 등록하기
                      </button>
                      <button
                        onClick={() => setShowLocationGuide(false)}
                        className="text-orange-600 hover:text-orange-800 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showForm && (
                <div id="lesson-form" className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {selectedEvent ? '레슨 수정' : '새 레슨 등록'}
                  </h4>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="레슨명"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">카테고리 선택</option>
                        {lessonCategories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      placeholder="레슨 설명"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <input
                      type="url"
                      placeholder="이미지 URL (선택)"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="any"
                        placeholder="위도"
                        value={formData.latitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="경도"
                        value={formData.longitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? '처리 중...' : (selectedEvent ? '수정' : '등록')}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelForm}
                        className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* 리스트 영역 (1/3) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                레슨 목록 ({events.length})
              </h3>
              
              <div className="space-y-3 max-h-[520px] overflow-y-auto">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>등록된 레슨이 없습니다.</p>
                    {user && (
                      <p className="text-sm mt-2">첫 번째 레슨을 등록해보세요!</p>
                    )}
                  </div>
                ) : (
                  events.map(event => (
                    <div
                      key={event.id}
                      id={`event-${event.id}`}
                      onClick={() => {
                        setSelectedEvent(event)
                        setMoveToMarker(event.id)
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedEvent?.id === event.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{event.name}</h4>
                        {user && (user.id === event.userId || user.role === 'ADMIN') && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedEvent(event)
                                setFormData({
                                  name: event.name,
                                  category: event.category,
                                  description: event.description,
                                  imageUrl: event.imageUrl || '',
                                  latitude: event.latitude,
                                  longitude: event.longitude
                                })
                                setShowForm(true)
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              수정
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(event.id)
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 mb-1 font-semibold">
                        📚 {event.category}
                      </p>
                      <p className="text-xs text-gray-600 mb-1">
                        👤 {event.user.name}
                      </p>
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {event.description.length > 50 ? (
                          <div>
                            <span>{event.description.substring(0, 50)}...</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                alert(event.description)
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium ml-1"
                            >
                              자세히 보기
                            </button>
                          </div>
                        ) : (
                          event.description
                        )}
                      </div>
                      {event.imageUrl && (
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 게시판 영역 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PostBoard 
          category="LESSON" 
          title="레슨" 
          color="blue"
        />
      </div>
    </div>
  )
} 