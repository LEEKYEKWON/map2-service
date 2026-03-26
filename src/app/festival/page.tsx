'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import NaverMap from '@/components/NaverMap'
import PostBoard from '@/components/PostBoard'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'

dayjs.locale('ko')

interface FestivalEvent {
  id: string
  name: string
  startDate: string
  endDate: string
  description: string
  imageUrl?: string
  linkUrl?: string | null
  latitude: number
  longitude: number
  userId: string
  user: {
    id: string
    name: string
    role: string
  }
}

export default function FestivalPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<FestivalEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<FestivalEvent | null>(null)
  const [moveToMarker, setMoveToMarker] = useState<string | null>(null)
  const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number } | null>(null)
  const [showLocationGuide, setShowLocationGuide] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isAdmin = user?.role === 'ADMIN'

  const [formData, setFormData] = useState({
    name: '',
    startDate: dayjs().add(1, 'day').hour(10).minute(0).format('YYYY-MM-DDTHH:mm'),
    endDate: dayjs().add(3, 'day').hour(18).minute(0).format('YYYY-MM-DDTHH:mm'),
    description: '',
    imageUrl: '',
    linkUrl: '',
    latitude: 37.5665,
    longitude: 126.978
  })

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/festival')
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      } else {
        setError('축제 정보를 불러오는데 실패했습니다.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      const element = document.getElementById(`event-${selectedEvent.id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
      }
    }
  }, [selectedEvent])

  useEffect(() => {
    if (moveToMarker) {
      const timer = setTimeout(() => setMoveToMarker(null), 100)
      return () => clearTimeout(timer)
    }
  }, [moveToMarker])

  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        document.getElementById('festival-form')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        })
      }, 100)
    }
  }, [showForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }
    if (!isAdmin) {
      setError('관리자만 등록할 수 있습니다.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const url = selectedEvent ? `/api/festival/${selectedEvent.id}` : '/api/festival'
      const method = selectedEvent ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: user.email,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString()
        })
      })

      if (response.ok) {
        setSuccess(selectedEvent ? '축제 정보가 수정되었습니다.' : '축제가 등록되었습니다.')
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
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!user || !isAdmin || !confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/festival/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })

      if (response.ok) {
        setSuccess('축제가 삭제되었습니다.')
        fetchEvents()
        setSelectedEvent(null)
      } else {
        const data = await response.json()
        setError(data.error || '삭제에 실패했습니다.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: dayjs().add(1, 'day').hour(10).minute(0).format('YYYY-MM-DDTHH:mm'),
      endDate: dayjs().add(3, 'day').hour(18).minute(0).format('YYYY-MM-DDTHH:mm'),
      description: '',
      imageUrl: '',
      linkUrl: '',
      latitude: 37.5665,
      longitude: 126.978
    })
  }

  const handleMarkerClick = (markerId: string) => {
    setTempMarker(null)
    setShowLocationGuide(false)

    const clicked = events.find((ev) => ev.id === markerId)
    if (clicked) {
      setSelectedEvent(selectedEvent?.id === clicked.id ? null : clicked)
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedEvent(null)
    if (!isAdmin) return

    setTempMarker({ lat, lng })
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
    setShowLocationGuide(true)
    setShowForm(false)
    setTimeout(() => setShowLocationGuide(false), 8000)
  }

  const handleTempMarkerClick = () => {
    if (tempMarker) {
      setShowForm(true)
      setShowLocationGuide(false)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setSelectedEvent(null)
    setTempMarker(null)
    setShowLocationGuide(false)
    resetForm()
  }

  const handleSearchResultSelect = (lat: number, lng: number, address: string) => {
    if (!isAdmin) return
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
    setShowForm(true)
    setSelectedEvent(null)
    setTempMarker(null)
    setShowLocationGuide(false)
    setSuccess(`📍 선택된 위치: ${address}`)
    setTimeout(() => {
      document.getElementById('festival-form')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      })
    }, 100)
  }

  const mapMarkers = events.map((event) => ({
    id: event.id,
    latitude: event.latitude,
    longitude: event.longitude,
    title: event.name,
    content: event.description,
    color: 'orange' as const
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">전국 축제, 지도에서 한눈에!</h2>
          <p className="text-gray-600">진행 중이거나 예정된 축제 일정을 지도에서 확인하세요.</p>
          {!isAdmin && (
            <p className="text-sm text-amber-800 mt-2">축제 등록은 관리자만 할 수 있습니다.</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={() => setError('')} className="float-right text-red-400 hover:text-red-600">
              ×
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
            {success}
            <button onClick={() => setSuccess('')} className="float-right text-green-400 hover:text-green-600">
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">축제 지도</h3>
                {isAdmin && (
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
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    {showForm ? '취소' : '+ 축제 등록'}
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
                onSearchResultSelect={isAdmin ? handleSearchResultSelect : undefined}
                height="500px"
              />

              {showLocationGuide && isAdmin && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-orange-800">
                    🎪 이 위치에 축제를 등록하시겠어요?
                  </div>
                  <p className="mt-2 text-sm text-orange-700">
                    아래 <strong>여기에 등록하기</strong>를 누르거나 주황색 마커를 눌러 일정을 입력하세요.
                  </p>
                </div>
              )}

              {showLocationGuide && isAdmin && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex space-x-2">
                  <button
                    onClick={handleTempMarkerClick}
                    className="bg-orange-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-orange-700 font-medium"
                  >
                    여기에 등록하기
                  </button>
                  <button
                    onClick={() => {
                      setTempMarker(null)
                      setShowLocationGuide(false)
                    }}
                    className="bg-gray-300 text-gray-700 px-6 py-3 rounded-full shadow-lg hover:bg-gray-400 font-medium"
                  >
                    취소
                  </button>
                </div>
              )}

              {showForm && isAdmin && (
                <div id="festival-form" className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {selectedEvent ? '축제 수정' : '새 축제 등록'}
                  </h4>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="text"
                      placeholder="축제명"
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">시작 일시</label>
                        <input
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">종료 일시</label>
                        <input
                          type="datetime-local"
                          value={formData.endDate}
                          onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                          required
                        />
                      </div>
                    </div>
                    <textarea
                      placeholder="축제 설명"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      required
                    />
                    <input
                      type="url"
                      placeholder="이미지 URL (선택)"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                      type="url"
                      placeholder="관련 링크 (공식 홈페이지·SNS 등, 선택)"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData((p) => ({ ...p, linkUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="any"
                        placeholder="위도"
                        value={formData.latitude}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, latitude: parseFloat(e.target.value) || 0 }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="경도"
                        value={formData.longitude}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, longitude: parseFloat(e.target.value) || 0 }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50"
                      >
                        {loading ? '처리 중...' : selectedEvent ? '수정' : '등록'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelForm}
                        className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                      >
                        취소
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">축제 목록 ({events.length})</h3>
              <div className="space-y-3 max-h-[520px] overflow-y-auto">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>표시할 축제가 없습니다.</p>
                    <p className="text-sm mt-2">종료된 일정은 목록에 나오지 않습니다.</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      id={`event-${event.id}`}
                      onClick={() => {
                        setSelectedEvent(event)
                        setMoveToMarker(event.id)
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedEvent?.id === event.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{event.name}</h4>
                        {isAdmin && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedEvent(event)
                                setFormData({
                                  name: event.name,
                                  startDate: dayjs(event.startDate).format('YYYY-MM-DDTHH:mm'),
                                  endDate: dayjs(event.endDate).format('YYYY-MM-DDTHH:mm'),
                                  description: event.description,
                                  imageUrl: event.imageUrl || '',
                                  linkUrl: event.linkUrl || '',
                                  latitude: event.latitude,
                                  longitude: event.longitude
                                })
                                setShowForm(true)
                              }}
                              className="text-xs text-amber-700 hover:text-amber-900"
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
                        📅 {dayjs(event.startDate).format('MM/DD HH:mm')} ~{' '}
                        {dayjs(event.endDate).format('MM/DD HH:mm')}
                      </p>
                      <p className="text-xs text-gray-600 mb-1">👤 {event.user.name}</p>
                      <div className="text-xs text-gray-500 line-clamp-2">{event.description}</div>
                      {event.linkUrl && (
                        <a
                          href={event.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-amber-700 hover:text-amber-900 underline mt-1 inline-block"
                        >
                          🔗 관련 링크
                        </a>
                      )}
                      {event.imageUrl && (
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          className="w-full h-32 object-cover rounded-lg mt-2"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <PostBoard category="FESTIVAL" title="전국 축제" color="amber" />
      </div>
    </div>
  )
}
