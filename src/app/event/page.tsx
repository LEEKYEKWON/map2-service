'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import NaverMap from '@/components/NaverMap'
import PostBoard from '@/components/PostBoard'
import Link from 'next/link'
import dayjs from 'dayjs'

interface Business {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  userId: string
  user: {
    id: string
    name: string
    role: string
  }
}

interface RealtimeEvent {
  id: string
  title: string
  description: string
  imageUrl?: string
  startDate: string
  endDate: string
  businessId: string
  userId: string
  business: Business
  user: {
    id: string
    name: string
    role: string
  }
}

interface EventWithBusiness extends RealtimeEvent {
  business: Business
}

export default function EventPage() {
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [events, setEvents] = useState<EventWithBusiness[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventWithBusiness | null>(null)
  const [showBusinessForm, setShowBusinessForm] = useState(false)
  
  // 🔧 디버깅: showBusinessForm 상태 변경 추적을 위한 useEffect
  useEffect(() => {
    console.log('🔄 showBusinessForm 상태 변경:', showBusinessForm)
    if (user) {
      console.log('🔄 현재 사용자 정보:', {
        name: user.name,
        role: user.role,
        isBusiness: user.isBusiness,
        계산된_isBusiness: user.isBusiness || user.role === 'ADMIN'
      })
    } else {
      console.log('🔄 현재 사용자: 로그인되지 않음')
    }
  }, [showBusinessForm, user])
  const [showEventForm, setShowEventForm] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'events' | 'businesses'>('events')
  const [moveToMarker, setMoveToMarker] = useState<string | null>(null)
  const [eventType, setEventType] = useState<'event' | 'business'>('event')
  const [tempMarker, setTempMarker] = useState<{ lat: number, lng: number } | null>(null) // 임시 마커
  const [showLocationGuide, setShowLocationGuide] = useState(false) // 위치 안내 메시지
  const [showForm, setShowForm] = useState(false)

  const [businessFormData, setBusinessFormData] = useState({
    name: '',
    address: '',
    latitude: 37.5665,
    longitude: 126.9780
  })

  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    startDate: dayjs().format('YYYY-MM-DDTHH:mm'),
    endDate: dayjs().add(2, 'hour').format('YYYY-MM-DDTHH:mm'),
    businessId: ''
  })

  // 자영업자 권한 체크
  const isBusiness = user?.isBusiness || user?.role === 'ADMIN'

  // 내가 등록한 매장들
  const myBusinesses = businesses.filter(b => b.userId === user?.id || user?.role === 'ADMIN')

  // 데이터 조회
  const fetchData = async () => {
    try {
      const [businessResponse, eventResponse] = await Promise.all([
        fetch('/api/business'),
        fetch('/api/event')
      ])
      
      if (businessResponse.ok) {
        const businessData = await businessResponse.json()
        setBusinesses(businessData)
      }
      
      if (eventResponse.ok) {
        const eventData = await eventResponse.json()
        setEvents(eventData)
      }
    } catch (error) {
      setError('데이터를 불러오는데 실패했습니다.')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 매장 등록/수정
  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isBusiness) {
      setError('자영업자만 매장을 등록할 수 있습니다.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const url = selectedBusiness ? `/api/business/${selectedBusiness.id}` : '/api/business'
      const method = selectedBusiness ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...businessFormData,
          email: user.email
        })
      })

      if (response.ok) {
        setSuccess(selectedBusiness ? '매장이 수정되었습니다.' : '매장이 등록되었습니다.')
        setShowBusinessForm(false)
        setSelectedBusiness(null)
        setTempMarker(null) // 임시 마커 제거
        setShowLocationGuide(false) // 안내 메시지 제거
        resetBusinessForm()
        fetchData()
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

  // 이벤트 등록/수정
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isBusiness) {
      setError('자영업자만 이벤트를 등록할 수 있습니다.')
      return
    }

    if (!eventFormData.businessId) {
      setError('매장을 선택해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const url = selectedEvent ? `/api/event/${selectedEvent.id}` : '/api/event'
      const method = selectedEvent ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventFormData,
          email: user.email,
          startDate: new Date(eventFormData.startDate).toISOString(),
          endDate: new Date(eventFormData.endDate).toISOString()
        })
      })

      if (response.ok) {
        setSuccess(selectedEvent ? '이벤트가 수정되었습니다.' : '이벤트가 등록되었습니다.')
        setShowEventForm(false)
        setSelectedEvent(null)
        resetEventForm()
        fetchData()
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

  // 삭제 함수들
  const handleDeleteBusiness = async (businessId: string) => {
    if (!user || !confirm('정말 삭제하시겠습니까? 관련된 모든 이벤트도 삭제됩니다.')) return

    try {
      const response = await fetch(`/api/business/${businessId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })

      if (response.ok) {
        setSuccess('매장이 삭제되었습니다.')
        fetchData()
      } else {
        const data = await response.json()
        setError(data.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!user || !confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/event/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })

      if (response.ok) {
        setSuccess('이벤트가 삭제되었습니다.')
        fetchData()
      } else {
        const data = await response.json()
        setError(data.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
    }
  }

  // 폼 초기화
  const resetBusinessForm = () => {
    setBusinessFormData({
      name: '',
      address: '',
      latitude: 37.5665,
      longitude: 126.9780
    })
  }

  const resetEventForm = () => {
    setEventFormData({
      title: '',
      description: '',
      imageUrl: '',
      startDate: dayjs().format('YYYY-MM-DDTHH:mm'),
      endDate: dayjs().add(2, 'hour').format('YYYY-MM-DDTHH:mm'),
      businessId: ''
    })
  }

  // 마커 직접 클릭 핸들러 - 정확한 ID 매칭
  const handleMarkerClick = (markerId: string) => {
    // 임시 마커 제거
    setTempMarker(null)
    setShowLocationGuide(false)
    
    if (markerId.startsWith('event-')) {
      const eventId = markerId.replace('event-', '')
      const event = events.find(e => e.id === eventId)
      if (event) {
        // 이벤트 선택 시 다른 선택 해제
        setSelectedEvent(event)
        setSelectedBusiness(null)
        setActiveTab('events') // 이벤트 탭으로 자동 전환
        setMoveToMarker(markerId)
      }
    } else if (markerId.startsWith('business-')) {
      const businessId = markerId.replace('business-', '')
      const business = businesses.find(b => b.id === businessId)
      if (business) {
        // 비즈니스 선택 시 다른 선택 해제
        setSelectedBusiness(business)
        setSelectedEvent(null)
        setActiveTab('businesses') // 매장 탭으로 자동 전환
        setMoveToMarker(markerId)
      }
    }
  }

  // 지도 클릭 핸들러 - 빈 공간 클릭만 처리
  const handleMapClick = (lat: number, lng: number) => {
    console.log('🎯 실시간이벤트 페이지 handleMapClick 호출됨:', { lat, lng })
    
    // 🔧 상태를 실시간으로 다시 확인
    setTimeout(() => {
      console.log('📊 실시간 상태 재확인:', { 
        user: user?.name,
        userRole: user?.role,
        userIsBusiness: user?.isBusiness,
      isBusiness, 
      showBusinessForm, 
      showEventForm,
      '매장등록폼열림': showBusinessForm,
      '이벤트등록폼열림': showEventForm 
    })

    // 매장 등록 모드일 때만 임시 마커 생성
    if (isBusiness && showBusinessForm && !showEventForm) {
      console.log('✅ 임시 마커 생성 조건 충족!')
        console.log('🗺️ 임시마커 위치 설정:', { lat, lng })
      setTempMarker({ lat, lng })
      setBusinessFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }))
      setShowLocationGuide(true)
        console.log('✅ 임시마커 생성 완료!')
    } else {
      console.log('❌ 임시 마커 생성 조건 불충족')
        console.log('🔍 조건 체크:')
        console.log(`  - isBusiness: ${isBusiness} (user.isBusiness: ${user?.isBusiness}, user.role: ${user?.role})`)
        console.log(`  - showBusinessForm: ${showBusinessForm}`)
        console.log(`  - !showEventForm: ${!showEventForm}`)
        
      if (!isBusiness) {
        console.log('🚫 자영업자가 아닙니다.')
          setError('자영업자만 매장을 등록할 수 있습니다.')
        } else if (!showBusinessForm) {
        console.log('🚫 매장 등록 폼이 열려있지 않습니다.')
          console.log('🔧 매장 등록 폼을 자동으로 열겠습니다!')
          setShowBusinessForm(true)
          setShowEventForm(false)
          // 다시 마커 생성 시도
          setTempMarker({ lat, lng })
          setBusinessFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }))
          setShowLocationGuide(true)
          console.log('✅ 임시마커 생성 완료! (자동 폼 열기)')
        } else if (showEventForm) {
        console.log('🚫 이벤트 등록 폼이 열려있습니다.')
          setError('이벤트 등록 모드입니다. 매장 등록을 원한다면 "매장 등록" 버튼을 클릭해주세요.')
      }
    }
    }, 100) // 100ms 지연으로 상태 업데이트 완료 대기
  }

  // 임시 마커 클릭 핸들러
  const handleTempMarkerClick = () => {
    // 매장 등록 폼이 열려있다면 유지, 아니면 폼 열기
    if (!showBusinessForm) {
      setShowBusinessForm(true)
      setShowEventForm(false)
      setSelectedBusiness(null)
      resetBusinessForm()
      // 임시 마커 위치를 폼 데이터에 설정
      if (tempMarker) {
        setBusinessFormData(prev => ({ 
          ...prev, 
          latitude: tempMarker.lat, 
          longitude: tempMarker.lng 
        }))
      }
    }
    setShowLocationGuide(false)
  }

  // 폼 취소 시 임시 마커 제거
  const handleCancelBusinessForm = () => {
    setShowBusinessForm(false)
    setSelectedBusiness(null)
    setTempMarker(null)
    setShowLocationGuide(false)
    resetBusinessForm()
  }

  const handleCancelEventForm = () => {
    setShowEventForm(false)
    setSelectedEvent(null)
    resetEventForm()
  }

  // 검색 결과에서 위치 선택 시 처리 (매장용)
  const handleSearchResultSelect = (lat: number, lng: number, address: string) => {
    // 매장 폼 데이터에 위치 정보 설정
    setBusinessFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address // 주소도 함께 설정
    }))
    
    // 매장 등록 폼 표시
    setShowBusinessForm(true)
    setShowEventForm(false)
    setSelectedBusiness(null)
    setTempMarker(null)
    setShowLocationGuide(false)
    
    // 성공 메시지 표시
    setSuccess(`📍 선택된 위치: ${address}`)
    
    // 폼 영역으로 스크롤
    setTimeout(() => {
      const formElement = document.getElementById('business-form')
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
  const allMarkers = [
    ...businesses.map(business => ({
      id: `business-${business.id}`,
      latitude: business.latitude,
      longitude: business.longitude,
      title: business.name,
      content: business.address,
      color: 'blue'
    })),
    ...events.map(event => ({
      id: `event-${event.id}`,
      latitude: event.business.latitude,
      longitude: event.business.longitude,
      title: event.title,
      content: `${event.business.name} - ${event.description}`,
      color: 'red'
    }))
  ]

  const currentItems = activeTab === 'events' ? events : businesses

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

  // 선택된 비즈니스로 자동 스크롤
  useEffect(() => {
    if (selectedBusiness) {
      const element = document.getElementById(`business-${selectedBusiness.id}`)
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'start'
        })
      }
    }
  }, [selectedBusiness])

  // 🎯 매장 등록 폼 표시 시 자동 스크롤
  useEffect(() => {
    if (showBusinessForm) {
      setTimeout(() => {
        const formElement = document.getElementById('business-form')
        if (formElement) {
          formElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          })
        }
      }, 100) // 폼 렌더링 완료 대기
    }
  }, [showBusinessForm])

  // 🎯 이벤트 등록 폼 표시 시 자동 스크롤
  useEffect(() => {
    if (showEventForm) {
      setTimeout(() => {
        const formElement = document.getElementById('event-form')
        if (formElement) {
          formElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          })
        }
      }, 100) // 폼 렌더링 완료 대기
    }
  }, [showEventForm])

  // moveToMarker 사용 후 리셋
  useEffect(() => {
    if (moveToMarker) {
      const timer = setTimeout(() => setMoveToMarker(null), 100)
      return () => clearTimeout(timer)
    }
  }, [moveToMarker])



  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
      {/* 헤더 및 상단영역 전체 삭제 */}

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 문구 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">실시간 이벤트, 지금 바로!</h2>
          <p className="text-gray-600">자영업자, 프리랜서, 개인사업자 분들의 이벤트를 등록해보세요.</p>
          <p className="text-red-600 font-semibold mt-2">🎉 Map2 오픈 기념! 선착순 300명 3개월간 무료등록!</p>
        </div>



        {/* 자영업자 권한 안내 */}
        {!isBusiness && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            ℹ️ 실시간 이벤트는 자영업자만 등록할 수 있습니다.
          </div>
        )}

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
                <h3 className="text-lg font-semibold text-gray-900">실시간이벤트 지도</h3>
                {isBusiness && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        console.log('🔵 매장 등록 버튼 클릭됨!')
                        console.log('현재 상태:', { showBusinessForm, showEventForm })
                        
                        if (showBusinessForm) {
                          console.log('�� 매장 등록 폼 닫는 중...')
                          setShowBusinessForm(false)
                          setSelectedBusiness(null)
                          resetBusinessForm()
                        } else {
                          console.log('�� 매장 등록 폼 여는 중...')
                          console.log('변경될 상태:', { showBusinessForm: true, showEventForm: false })
                          setShowEventForm(false)
                          setShowBusinessForm(true)
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        showBusinessForm 
                          ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {showBusinessForm ? '취소' : '+ 매장 등록'}
                    </button>
                    <button
                      onClick={() => {
                        if (myBusinesses.length === 0) {
                          setError('먼저 매장을 등록해주세요.')
                          return
                        }
                        setShowEventForm(!showEventForm)
                        setShowBusinessForm(false)
                        setSelectedEvent(null)
                        resetEventForm()
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {showEventForm ? '취소' : '+ 이벤트 등록'}
                    </button>
                  </div>
                )}
              </div>
              
              <NaverMap
                markers={allMarkers}
                onMapClick={handleMapClick}
                onMarkerClick={handleMarkerClick}
                selectedMarkerId={selectedEvent ? `event-${selectedEvent.id}` : null}
                moveToMarker={moveToMarker}
                onMoveComplete={() => setMoveToMarker(null)}
                tempMarker={tempMarker}
                onTempMarkerClick={handleTempMarkerClick}
                onSearchResultSelect={handleSearchResultSelect}
                height="500px"
              />

              {/* 위치 안내 메시지 */}
              {showLocationGuide && tempMarker && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-600">📍</span>
                      <span className="text-sm text-yellow-700">여기에 매장을 등록하시겠어요?</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowLocationGuide(false)
                        setTempMarker(null)
                      }}
                      className="text-yellow-400 hover:text-yellow-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* 매장 등록 폼 */}
              {showBusinessForm && isBusiness && (
                <div id="business-form" className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {selectedBusiness ? '매장 수정' : '새 매장 등록'}
                  </h4>
                  <form onSubmit={handleBusinessSubmit} className="space-y-3">
                    <input
                      type="text"
                      placeholder="매장명"
                      value={businessFormData.name}
                      onChange={(e) => setBusinessFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="매장 주소"
                      value={businessFormData.address}
                      onChange={(e) => setBusinessFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="any"
                        placeholder="위도"
                        value={businessFormData.latitude}
                        onChange={(e) => setBusinessFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="경도"
                        value={businessFormData.longitude}
                        onChange={(e) => setBusinessFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
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
                        {loading ? '처리 중...' : (selectedBusiness ? '수정' : '등록')}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelBusinessForm}
                        className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 이벤트 등록 폼 */}
              {showEventForm && isBusiness && (
                <div id="event-form" className="mt-4 p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {selectedEvent ? '이벤트 수정' : '새 이벤트 등록'}
                  </h4>
                  <form onSubmit={handleEventSubmit} className="space-y-3">
                    <select
                      value={eventFormData.businessId}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, businessId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    >
                      <option value="">매장 선택</option>
                      {myBusinesses.map(business => (
                        <option key={business.id} value={business.id}>
                          {business.name} - {business.address}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="이벤트 제목"
                      value={eventFormData.title}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                    <textarea
                      placeholder="이벤트 설명"
                      rows={3}
                      value={eventFormData.description}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                    <input
                      type="url"
                      placeholder="이미지 URL (선택)"
                      value={eventFormData.imageUrl}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
                        <input
                          type="datetime-local"
                          value={eventFormData.startDate}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
                        <input
                          type="datetime-local"
                          value={eventFormData.endDate}
                          onChange={(e) => setEventFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? '처리 중...' : (selectedEvent ? '수정' : '등록')}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEventForm}
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
              {/* 탭 헤더 */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setActiveTab('events')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'events'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🔥 이벤트 ({events.length})
                </button>
                <button
                  onClick={() => setActiveTab('businesses')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'businesses'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🏪 매장 ({businesses.length})
                </button>
              </div>
              
              <div className="space-y-3 max-h-[520px] overflow-y-auto">
                {currentItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>등록된 {activeTab === 'events' ? '이벤트' : '매장'}이 없습니다.</p>
                  </div>
                ) : (
                  currentItems.map(item => (
                    <div
                      key={item.id}
                      id={`${activeTab === 'events' ? 'event' : 'business'}-${item.id}`}
                      onClick={() => {
                        if (activeTab === 'events') {
                          setSelectedEvent(item as EventWithBusiness)
                          setSelectedBusiness(null)
                          setMoveToMarker(`event-${item.id}`)
                        } else {
                          setSelectedBusiness(item as Business)
                          setSelectedEvent(null)
                          setMoveToMarker(`business-${item.id}`)
                        }
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        activeTab === 'events' 
                          ? (selectedEvent?.id === item.id 
                              ? 'border-red-500 bg-red-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')
                          : (selectedBusiness?.id === item.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50')
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {activeTab === 'events' ? `🔥 ${(item as EventWithBusiness).title}` : `🏪 ${(item as Business).name}`}
                        </h4>
                        {isBusiness && (user.id === (item as any).userId || user.role === 'ADMIN') && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (activeTab === 'events') {
                                  const event = item as EventWithBusiness
                                  setSelectedEvent(event)
                                  setEventFormData({
                                    title: event.title,
                                    description: event.description,
                                    imageUrl: event.imageUrl || '',
                                    startDate: dayjs(event.startDate).format('YYYY-MM-DDTHH:mm'),
                                    endDate: dayjs(event.endDate).format('YYYY-MM-DDTHH:mm'),
                                    businessId: event.businessId
                                  })
                                  setShowEventForm(true)
                                  setShowBusinessForm(false)
                                } else {
                                  const business = item as Business
                                  setSelectedBusiness(business)
                                  setBusinessFormData({
                                    name: business.name,
                                    address: business.address,
                                    latitude: business.latitude,
                                    longitude: business.longitude
                                  })
                                  setShowBusinessForm(true)
                                  setShowEventForm(false)
                                }
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              수정
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (activeTab === 'events') {
                                  handleDeleteEvent(item.id)
                                } else {
                                  handleDeleteBusiness(item.id)
                                }
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {activeTab === 'events' ? (
                        <>
                          <p className="text-xs text-blue-600 mb-1">
                            🏪 {(item as EventWithBusiness).business.name}
                          </p>
                          <p className="text-xs text-gray-600 mb-1">
                            📅 {dayjs((item as EventWithBusiness).startDate).format('MM/DD HH:mm')} ~ {dayjs((item as EventWithBusiness).endDate).format('MM/DD HH:mm')}
                          </p>
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {(item as EventWithBusiness).description.length > 50 ? (
                              <div>
                                <span>{(item as EventWithBusiness).description.substring(0, 50)}...</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    alert((item as EventWithBusiness).description)
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-medium ml-1"
                                >
                                  자세히 보기
                                </button>
                              </div>
                            ) : (
                              (item as EventWithBusiness).description
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-gray-600 mb-1">
                            📍 {(item as Business).address}
                          </p>
                          <p className="text-xs text-gray-600 mb-1">
                            👤 {(item as Business).user.name}
                          </p>
                        </>
                      )}
                      
                      {activeTab === 'events' && (item as EventWithBusiness).imageUrl && (
                        <img
                          src={(item as EventWithBusiness).imageUrl}
                          alt={(item as EventWithBusiness).title}
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
          category="EVENT" 
          title="실시간이벤트" 
          color="red"
        />
      </div>
    </div>
  )
} 