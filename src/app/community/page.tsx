'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import NaverMap from '@/components/NaverMap'
import PostBoard from '@/components/PostBoard'
import Link from 'next/link'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'

dayjs.extend(relativeTime)
dayjs.locale('ko')

interface CommunityEvent {
  id: string
  name: string
  dateTime: string
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

export default function CommunityPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null)
  const [moveToMarker, setMoveToMarker] = useState<string | null>(null)
  const [tempMarker, setTempMarker] = useState<{ lat: number, lng: number } | null>(null)
  const [showLocationGuide, setShowLocationGuide] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPastEvents, setShowPastEvents] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    dateTime: dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
    description: '',
    imageUrl: '',
    latitude: 37.5665,
    longitude: 126.9780
  })

  // 현재 시간 기준으로 이벤트 필터링
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (showPastEvents) {
        return true // 모든 이벤트 표시
      }
      // 현재 시간 이후 이벤트만 표시
      return dayjs(event.dateTime).isAfter(dayjs())
    })
  }, [events, showPastEvents])

  // 이벤트 목록 조회
  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/community')
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      } else {
        setError('모임을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

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

  // 🎯 커뮤니티 등록 폼 표시 시 자동 스크롤
  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        const formElement = document.getElementById('community-form')
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
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const url = selectedEvent ? `/api/community/${selectedEvent.id}` : '/api/community'
      const method = selectedEvent ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: user.email,
          dateTime: new Date(formData.dateTime).toISOString()
        })
      })

      if (response.ok) {
        setSuccess(selectedEvent ? '모임이 수정되었습니다.' : '모임이 등록되었습니다.')
        setShowForm(false)
        setSelectedEvent(null)
        setTempMarker(null)
        setShowLocationGuide(false)
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
  }, [user, selectedEvent, formData, fetchEvents])

  // 이벤트 삭제
  const handleDelete = useCallback(async (eventId: string) => {
    if (!user || !confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/community/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })

      if (response.ok) {
        setSuccess('모임이 삭제되었습니다.')
        fetchEvents()
      } else {
        const data = await response.json()
        setError(data.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
    }
  }, [user, fetchEvents])

  // 폼 초기화
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      dateTime: dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
      description: '',
      imageUrl: '',
      latitude: 37.5665,
      longitude: 126.9780
    })
  }, [])

  // 마커 직접 클릭 핸들러 - 정확한 ID 매칭
  const handleMarkerClick = useCallback((markerId: string) => {
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
  }, [events, selectedEvent])

  // 지도 클릭 핸들러 - 빈 공간 클릭만 처리
  const handleMapClick = useCallback((lat: number, lng: number) => {
    // 빈 공간 클릭 - 모든 마커 선택 해제
    setSelectedEvent(null)
    
    if (user) {
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
  }, [user])

  // 임시 마커 클릭 핸들러
  const handleTempMarkerClick = useCallback(() => {
    if (tempMarker) {
      setShowForm(true)
      setShowLocationGuide(false)
    }
  }, [tempMarker])

  // 폼 취소 시 임시 마커도 제거
  const handleCancelForm = useCallback(() => {
    setShowForm(false)
    setSelectedEvent(null)
    setTempMarker(null)
    setShowLocationGuide(false)
    resetForm()
  }, [resetForm])

  // 검색 결과에서 위치 선택 시 처리
  const handleSearchResultSelect = useCallback((lat: number, lng: number, address: string) => {
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
      const formElement = document.getElementById('community-form')
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        })
      }
    }, 100)
  }, [])

  // 마커 데이터 변환
  const mapMarkers = useMemo(() => {
    return filteredEvents.map(event => ({
    id: event.id,
    latitude: event.latitude,
    longitude: event.longitude,
    title: event.name,
    content: event.description
  }))
  }, [filteredEvents])

  // 폼 데이터 업데이트 핸들러들을 메모이제이션
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }))
  }, [])

  const handleDateTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, dateTime: e.target.value }))
  }, [])

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, description: e.target.value }))
  }, [])

  const handleImageUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, imageUrl: e.target.value }))
  }, [])

  const handleLatitudeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))
  }, [])

  const handleLongitudeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))
  }, [])

  // 에러 및 성공 메시지 핸들러
  const clearError = useCallback(() => setError(''), [])
  const clearSuccess = useCallback(() => setSuccess(''), [])

  // 토글 핸들러
  const togglePastEvents = useCallback(() => {
    setShowPastEvents(prev => !prev)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* 헤더 및 상단영역 전체 삭제 */}

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 문구 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">커뮤니티 모임, 지도에서 한눈에!</h2>
          <p className="text-gray-600">우리 모임도 지도를 클릭하여 위치와 일정을 등록해보세요.</p>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={clearError} className="float-right text-red-400 hover:text-red-600">×</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
            {success}
            <button onClick={clearSuccess} className="float-right text-green-400 hover:text-green-600">×</button>
          </div>
        )}

        {/* 지도 + 리스트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 지도 영역 (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">커뮤니티 지도</h3>
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
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {showForm ? '취소' : '+ 모임 만들기'}
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
                      <span className="text-orange-800 font-medium">여기에 커뮤니티 모임을 등록하시겠어요?</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 고정된 등록 버튼 */}
              {showLocationGuide && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex space-x-2">
                  <button
                    onClick={handleTempMarkerClick}
                    className="bg-orange-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    여기에 등록하기
                  </button>
                  <button
                    onClick={() => setShowLocationGuide(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-3 rounded-full shadow-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    취소
                  </button>
                </div>
              )}

              {showForm && (
                <div id="community-form" className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {selectedEvent ? '모임 수정' : '새 모임 만들기'}
                  </h4>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="모임명"
                        value={formData.name}
                        onChange={handleNameChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                      <input
                        type="datetime-local"
                        value={formData.dateTime}
                        onChange={handleDateTimeChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <textarea
                      placeholder="모임 설명"
                      rows={3}
                      value={formData.description}
                      onChange={handleDescriptionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                    <input
                      type="url"
                      placeholder="이미지 URL (선택)"
                      value={formData.imageUrl}
                      onChange={handleImageUrlChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="any"
                        placeholder="위도"
                        value={formData.latitude}
                        onChange={handleLatitudeChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="경도"
                        value={formData.longitude}
                        onChange={handleLongitudeChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  모임 목록 ({filteredEvents.length})
              </h3>
                <button
                  onClick={togglePastEvents}
                  className="text-sm text-green-600 hover:text-green-800 transition-colors"
                >
                  {showPastEvents ? '현재 모임만' : '지난 모임도 보기'}
                </button>
              </div>
              
              <div className="space-y-3 max-h-[520px] overflow-y-auto">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>등록된 모임이 없습니다.</p>
                    {user && (
                      <p className="text-sm mt-2">첫 번째 모임을 만들어보세요!</p>
                    )}
                  </div>
                ) : (
                  filteredEvents.map(event => {
                    const isPastEvent = dayjs(event.dateTime).isBefore(dayjs())
                    return (
                    <div
                      key={event.id}
                      id={`event-${event.id}`}
                      onClick={() => {
                        setSelectedEvent(event)
                        setMoveToMarker(event.id)
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedEvent?.id === event.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } ${isPastEvent ? 'opacity-70' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{event.name}</h4>
                            {isPastEvent && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                종료
                              </span>
                            )}
                          </div>
                        {user && (user.id === event.userId || user.role === 'ADMIN') && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedEvent(event)
                                setFormData({
                                  name: event.name,
                                  dateTime: dayjs(event.dateTime).format('YYYY-MM-DDTHH:mm'),
                                  description: event.description,
                                  imageUrl: event.imageUrl || '',
                                  latitude: event.latitude,
                                  longitude: event.longitude
                                })
                                setShowForm(true)
                              }}
                              className="text-xs text-green-600 hover:text-green-800"
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
                      <p className="text-xs text-gray-600 mb-1">
                        📅 {dayjs(event.dateTime).format('MM/DD HH:mm')}
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
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 게시판 영역 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PostBoard 
          category="COMMUNITY" 
          title="커뮤니티" 
          color="green"
        />
      </div>
    </div>
  )
} 