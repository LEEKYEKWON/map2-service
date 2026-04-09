'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import NaverMap from '@/components/NaverMap'
import PostBoard from '@/components/PostBoard'
import Link from 'next/link'

interface Hotspot {
  id: string
  name: string
  description?: string | null
  imageUrl?: string
  linkUrl?: string
  latitude: number
  longitude: number
}

export default function GardenPage() {
  const { user } = useAuth()
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [selectedItem, setSelectedItem] = useState<Hotspot | null>(null)
  const [moveToMarker, setMoveToMarker] = useState<string | null>(null)
  const [tempMarker, setTempMarker] = useState<{ lat: number, lng: number } | null>(null)
  const [showLocationGuide, setShowLocationGuide] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [listSearchQuery, setListSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    latitude: 37.5665,
    longitude: 126.9780
  })

  // 관리자 권한 체크
  const isAdmin = user?.role === 'ADMIN'

  // 데이터 조회
  const fetchData = async () => {
    try {
      const response = await fetch('/api/hotspot')
      
      if (response.ok) {
        const data = await response.json()
        setHotspots(data)
      }
    } catch (error) {
      setError('데이터를 불러오는데 실패했습니다.')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 등록/수정
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      setError('관리자만 등록할 수 있습니다.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const url = selectedItem ? `/api/hotspot/${selectedItem.id}` : '/api/hotspot'
      const method = selectedItem ? 'PUT' : 'POST'

      const body = {
        name: formData.name,
        description: formData.description,
        imageUrl: formData.imageUrl,
        linkUrl: formData.linkUrl,
        latitude: formData.latitude,
        longitude: formData.longitude
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setSuccess(selectedItem ? '핫스팟이 수정되었습니다.' : '핫스팟이 등록되었습니다.')
        setShowForm(false)
        setSelectedItem(null)
        setTempMarker(null)
        setShowLocationGuide(false)
        resetForm()
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

  // 삭제
  const handleDelete = async (item: Hotspot) => {
    if (!isAdmin || !confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/hotspot/${item.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('핫스팟이 삭제되었습니다.')
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
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      latitude: 37.5665,
      longitude: 126.9780
    })
  }

  // 마커 클릭 핸들러
  const handleMarkerClick = (markerId: string) => {
    setTempMarker(null)
    setShowLocationGuide(false)
    
    const clickedItem = hotspots.find(item => item.id === markerId)
    if (clickedItem) {
      if (selectedItem?.id === clickedItem.id) {
        setSelectedItem(null)
      } else {
        setSelectedItem(clickedItem)
      }
    }
  }

  // 지도 클릭 핸들러
  const handleMapClick = (lat: number, lng: number) => {
    setSelectedItem(null)
    
    if (user && isAdmin) {
      setTempMarker({ lat, lng })
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }))
      setShowLocationGuide(true)
    }
  }

  // 임시 마커 클릭 핸들러
  const handleTempMarkerClick = () => {
      setShowForm(true)
    setTempMarker(null)
      setShowLocationGuide(false)
  }

  // 폼 취소
  const handleCancelForm = () => {
    setShowForm(false)
    setSelectedItem(null)
    setTempMarker(null)
    setShowLocationGuide(false)
    resetForm()
  }

  // 검색 결과 선택 핸들러
  const handleSearchResultSelect = (lat: number, lng: number, address: string) => {
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng
    })
    
    // 등록 폼 표시
    setShowForm(true)
    setSelectedItem(null)
    setTempMarker(null)
    setShowLocationGuide(false)
    
    // 성공 메시지 표시
    setSuccess(`📍 선택된 위치: ${address}`)
    
    // 폼 영역으로 스크롤
    setTimeout(() => {
      const formElement = document.getElementById('garden-form')
      if (formElement) {
        formElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        })
      }
    }, 100)
  }
  
  // 마커 데이터
  const mapMarkers = hotspots.map(item => ({
    id: item.id,
    latitude: item.latitude,
    longitude: item.longitude,
    title: item.name,
    content: item.description || '',
    color: 'blue'
  }))

  const filteredHotspots = hotspots.filter((item) => {
    const query = listSearchQuery.trim().toLowerCase()
    if (!query) return true
    return (
      item.name.toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query) ||
      (item.linkUrl || '').toLowerCase().includes(query)
    )
  })

  // 선택된 아이템으로 자동 스크롤
  useEffect(() => {
    if (selectedItem) {
      const element = document.getElementById(`item-${selectedItem.id}`)
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'start'
        })
      }
    }
  }, [selectedItem])

  // moveToMarker 리셋
  useEffect(() => {
    if (moveToMarker) {
      const timer = setTimeout(() => setMoveToMarker(null), 100)
      return () => clearTimeout(timer)
    }
  }, [moveToMarker])

  // 핫스팟 등록 폼 표시 시 자동 스크롤
  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        const formElement = document.getElementById('garden-form')
        if (formElement) {
          formElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          })
        }
      }, 100)
    }
  }, [showForm])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 및 상단영역 전체 삭제 */}

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">SNS 명소를 지도에서 한눈에!</h2>
        </div>

        {!isAdmin && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
            ℹ️ 핫스팟은 관리자만 등록할 수 있습니다.
          </div>
        )}

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
                <h3 className="text-lg font-semibold text-gray-900">지도</h3>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (showForm) {
                        handleCancelForm()
                      } else {
                        setShowForm(true)
                        setSelectedItem(null)
                        setTempMarker(null)
                        setShowLocationGuide(false)
                        resetForm()
                      }
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {showForm ? '취소' : '+ 핫스팟 등록'}
                  </button>
                )}
              </div>
              
              <NaverMap
                markers={mapMarkers}
                onMapClick={handleMapClick}
                onMarkerClick={handleMarkerClick}
                selectedMarkerId={selectedItem?.id || null}
                moveToMarker={moveToMarker}
                onMoveComplete={() => setMoveToMarker(null)}
                tempMarker={tempMarker}
                onTempMarkerClick={handleTempMarkerClick}
                onSearchResultSelect={handleSearchResultSelect}
                showAddressSearch={isAdmin}
                height="500px"
              />

              {/* 위치 안내 메시지 */}
              {showLocationGuide && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-orange-800 font-medium">여기에 핫스팟을 등록하시겠어요?</span>
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
            </div>
          </div>

          {/* 리스트 영역 (1/3) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4 h-[572px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  핫스팟 목록 ({hotspots.length}개)
                </h3>
              </div>
              <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                <p>정확한 주소가 없는 곳은 가까운 건물이나 도로상의 주소를 기재하였으니 참고만 해주세요.</p>
                <p className="mt-1">지도에 표기된 마커의 위치가 정확한 위치입니다.</p>
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  placeholder="핫스팟명/설명/링크 검색"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-3 flex-1 min-h-0 overflow-y-auto">
                {filteredHotspots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {hotspots.length === 0 ? (
                      <>
                        <div className="mb-2">🗺️</div>
                        <p>등록된 핫스팟이 없습니다.</p>
                        {isAdmin && <p className="text-sm">지도를 클릭해서 첫 번째 핫스팟을 등록해보세요!</p>}
                      </>
                    ) : (
                      <p>검색 결과가 없습니다.</p>
                    )}
                  </div>
                ) : (
                  filteredHotspots.map((item) => (
                    <div
                      key={item.id}
                      id={`item-${item.id}`}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedItem?.id === item.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => {
                        setMoveToMarker(item.id)
                        setSelectedItem(selectedItem?.id === item.id ? null : item)
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                        {isAdmin && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedItem(item)
                                setFormData({
                                  name: item.name,
                                  description: item.description || '',
                                  imageUrl: item.imageUrl || '',
                                  linkUrl: item.linkUrl || '',
                                  latitude: item.latitude,
                                  longitude: item.longitude
                                })
                                setShowForm(true)
                                setTempMarker(null)
                                setShowLocationGuide(false)
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-xs"
                            >
                              수정
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(item)
                              }}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                      
                      {item.description && (
                      <div className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {item.description.length > 50 ? (
                          <div>
                            <span>{item.description.substring(0, 50)}...</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                alert(item.description)
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium ml-1"
                            >
                              자세히 보기
                            </button>
                          </div>
                        ) : (
                          item.description
                        )}
                      </div>
                      )}
                      
                      {item.linkUrl && (
                        <a
                          href={item.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          🔗 관련 링크
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 등록/수정 폼 */}
        {showForm && isAdmin && (
          <div id="garden-form" className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedItem ? '핫스팟 수정' : '핫스팟 등록'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                  <input
                    type="text"
                    placeholder="핫스팟 이름"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
                  <input
                    type="url"
                    placeholder="이미지 URL (선택사항)"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">관련링크</label>
                <input
                  type="url"
                  placeholder="관련링크 (블로그/인스타 등)"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택사항)</label>
                <textarea
                  placeholder="설명 (선택사항)"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">위도 *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="위도"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">경도 *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="경도"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? '처리중...' : (selectedItem ? '수정하기' : '등록하기')}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 게시판 */}
        <div className="mt-8">
          <PostBoard category="GARDEN" title="핫스팟" color="indigo" />
        </div>
      </div>
    </div>
  )
} 