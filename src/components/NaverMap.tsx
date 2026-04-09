'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'

interface Marker {
  id: string
  latitude: number
  longitude: number
  title: string
  content?: string
  color?: string
}

interface SearchResult {
  roadAddress: string
  jibunAddress: string
  englishAddress: string
  latitude: number
  longitude: number
  distance: number
}

interface NaverMapProps {
  markers?: Marker[]
  onMapClick?: (lat: number, lng: number) => void
  onMarkerClick?: (markerId: string) => void // 마커 직접 클릭 처리
  selectedMarkerId?: string | null
  height?: string
  moveToMarker?: string | null // 리스트 클릭시 지도 이동을 위한 별도 prop
  onMoveComplete?: () => void // 이동 완료 후 콜백
  tempMarker?: { lat: number, lng: number } | null // 임시 마커 위치
  onTempMarkerClick?: () => void // 임시 마커 클릭 핸들러
  // 검색 결과에서 마커 등록을 위한 콜백
  onSearchResultSelect?: (lat: number, lng: number, address: string) => void
  showAddressSearch?: boolean
}

declare global {
  interface Window {
    naver: any
    navermap_authFailure?: () => void
  }
}

export default function NaverMap({
  markers = [],
  onMapClick,
  onMarkerClick,
  selectedMarkerId,
  height = '500px',
  moveToMarker,
  onMoveComplete,
  tempMarker,
  onTempMarkerClick,
  onSearchResultSelect,
  showAddressSearch = true
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const naverMapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const prevSelectedMarkerIdRef = useRef<string | null>(null) // 이전 선택된 마커 ID 추적
  const tempMarkerRef = useRef<any>(null) // 임시 마커 참조
  const searchMarkerRef = useRef<any>(null) // 검색 마커 참조
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null)

  // SVG 마커 아이콘 생성 함수
  const createMarkerIcon = (isSelected: boolean, baseColor?: string) => {
    // 기본 색깔 설정 (공유텃밭: 녹색, 핫스팟: 보라색)
    let markerColor = '#0000FF' // 기본 파란색
    
    if (baseColor === 'green') {
      markerColor = '#22C55E' // 공유텃밭 - 녹색
    } else if (baseColor === 'purple') {
      markerColor = '#8B5CF6' // 핫스팟 - 보라색
    } else if (baseColor === 'orange') {
      markerColor = '#F97316' // 주황색
    }
    
    // 선택된 마커는 더 진한 색상으로
    if (isSelected) {
      if (baseColor === 'green') {
        markerColor = '#16A34A' // 진한 녹색
      } else if (baseColor === 'purple') {
        markerColor = '#7C3AED' // 진한 보라색  
      } else if (baseColor === 'orange') {
        markerColor = '#2563EB' // 선택된 축제 마커 - 파란색
      } else {
        markerColor = '#FF0000' // 기본 빨간색
      }
    }
    
    const svgIcon = `
      <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C9.373 2 4 7.373 4 14c0 8.5 12 22 12 22s12-13.5 12-22c0-6.627-5.373-12-12-12z" 
              fill="${markerColor}" 
              stroke="white" 
              stroke-width="2"/>
        <circle cx="16" cy="14" r="4" fill="white"/>
      </svg>
    `
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIcon)}`
  }

  // 임시 마커 아이콘 생성 함수 (주황색)
  const createTempMarkerIcon = () => {
    const svgIcon = `
      <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C9.373 2 4 7.373 4 14c0 8.5 12 22 12 22s12-13.5 12-22c0-6.627-5.373-12-12-12z" 
              fill="#FF8C00" 
              stroke="white" 
              stroke-width="2"/>
        <circle cx="16" cy="14" r="4" fill="white"/>
        <text x="16" y="18" text-anchor="middle" fill="white" font-size="8" font-weight="bold">+</text>
      </svg>
    `
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIcon)}`
  }

  // 검색 마커 아이콘 생성 함수 (빨간색)
  const createSearchMarkerIcon = () => {
    const svgIcon = `
      <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C9.373 2 4 7.373 4 14c0 8.5 12 22 12 22s12-13.5 12-22c0-6.627-5.373-12-12-12z" 
              fill="#EF4444" 
              stroke="white" 
              stroke-width="2"/>
        <circle cx="16" cy="14" r="4" fill="white"/>
        <text x="16" y="18" text-anchor="middle" fill="white" font-size="8" font-weight="bold">검</text>
      </svg>
    `
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIcon)}`
  }

  // 클라이언트에서만 마운트되도록 설정
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 마커들의 중심점 계산
  const getMapCenter = () => {
    if (markers.length === 0) {
      // 마커가 없으면 서울 중심 (한국의 중심부)
      return { lat: 37.5665, lng: 126.9780 }
    }
    
    // 마커들의 중심점 계산
    const avgLat = markers.reduce((sum, marker) => sum + marker.latitude, 0) / markers.length
    const avgLng = markers.reduce((sum, marker) => sum + marker.longitude, 0) / markers.length
    
    return { lat: avgLat, lng: avgLng }
  }

  // 네이버 지도 스크립트 로딩 (최적화)
  useEffect(() => {
    if (!isMounted) return

    const loadNaverMapScript = () => {
      // 이미 로드된 경우
      if (window.naver && window.naver.maps) {
        setIsLoaded(true)
        setIsLoading(false)
        return
      }

      // 스크립트가 이미 추가된 경우
      if (document.getElementById('naver-map-script')) {
        return
      }

      // 인증 실패 감지 함수 설정
      if (!window.navermap_authFailure) {
        window.navermap_authFailure = () => {
          console.error('네이버 지도 API 인증 실패: Client ID를 확인해주세요')
          setIsLoading(false)
          setIsLoaded(false)
        }
      }

      const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '6xglqifxeg'
      console.log('🔑 네이버 지도 API 키:', clientId)

      const script = document.createElement('script')
      script.id = 'naver-map-script'
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`
      script.async = true
      
      script.onload = () => {
        console.log('✅ 네이버 지도 스크립트 로딩 성공')
        setIsLoaded(true)
        setIsLoading(false)
      }
      
      script.onerror = () => {
        console.error('❌ 네이버 지도 로딩 실패')
        setIsLoading(false)
        setIsLoaded(false)
      }

      document.head.appendChild(script)
    }

    loadNaverMapScript()
  }, [isMounted])

  // 지도 초기화 (한 번만 실행)
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !isMounted || naverMapRef.current) return

    try {
      const center = getMapCenter()
      const mapOptions = {
        center: new window.naver.maps.LatLng(center.lat, center.lng),
        zoom: 11,
        mapTypeControl: false,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT
        },
        // 지도 이동 및 줌 제한 설정
        disableKineticPan: false,
        disableDoubleClickZoom: false,
        disableDoubleTapZoom: false,
        disableTwoFingerTapZoom: false
      }

      naverMapRef.current = new window.naver.maps.Map(mapRef.current, mapOptions)

      // 지도 클릭 이벤트 (지도 자동 이동 완전 차단)
      if (onMapClick) {
        console.log('🗺️ 지도 클릭 이벤트 리스너 등록됨')
        window.naver.maps.Event.addListener(naverMapRef.current, 'click', (e: any) => {
          console.log('🗺️ 지도 클릭됨!')
          
          // 이벤트 전파 차단
          if (e.domEvent) {
            e.domEvent.preventDefault()
            e.domEvent.stopPropagation()
          }
          
          const lat = e.coord.lat()
          const lng = e.coord.lng()
          console.log('📍 클릭 좌표:', { lat, lng })
          console.log('📞 onMapClick 함수 호출 중...')
          onMapClick(lat, lng)
          console.log('✅ onMapClick 함수 호출 완료')
          
          // 지도 이동 방지를 위해 return false
          return false
        })
        // 모바일 대응: tap 이벤트도 등록
        window.naver.maps.Event.addListener(naverMapRef.current, 'tap', (e: any) => {
          console.log('🗺️ 지도 탭(tap)됨!')
          // 모바일 tap 이벤트는 preventDefault/stopPropagation을 호출하지 않음
          const lat = e.coord.lat()
          const lng = e.coord.lng()
          console.log('📍 탭 좌표:', { lat, lng })
          console.log('📞 onMapClick 함수 호출 중...(tap)')
          onMapClick(lat, lng)
          console.log('✅ onMapClick 함수 호출 완료 (tap)')
          return false
        })
      } else {
        console.log('❌ onMapClick이 없어서 지도 클릭 이벤트 등록 안됨')
      }

    } catch (error) {
      console.error('❌ 지도 초기화 오류:', error)
      setIsLoaded(false)
      setIsLoading(false)
    }
  }, [isLoaded, isMounted])

  // 마커 업데이트 - selectedMarkerId 변경시 즉시 업데이트
  useEffect(() => {
    if (!naverMapRef.current || !window.naver || !isMounted) return

    console.log('🔄 마커 업데이트 시작:', { 
      markersCount: markers.length, 
      selectedMarkerId,
      existingMarkersCount: markersRef.current.length
    })

    // 기존 마커가 있고 마커 수가 같다면 변경된 마커만 업데이트
    if (markersRef.current.length === markers.length && markersRef.current.length > 0) {
      console.log('🔄 변경된 마커만 업데이트 모드')
      
      // 변경된 마커 찾기 및 업데이트
      let hasChanges = false
      markersRef.current.forEach((existingMarker, index) => {
        const markerData = markers[index]
        if (markerData) {
          const isSelected = selectedMarkerId === markerData.id
          const wasSelected = existingMarker._isSelected || false
          
          // 선택 상태가 변경된 마커만 재생성
          if (isSelected !== wasSelected) {
            hasChanges = true
            console.log(`🔄 마커 재생성: ${markerData.id}, 선택됨: ${isSelected}`)
            
            // 기존 마커 제거
            existingMarker.setMap(null)
            
            // 새 마커 생성
            const iconUrl = createMarkerIcon(isSelected, markerData.color)
            
            const newMarker = new window.naver.maps.Marker({
              position: new window.naver.maps.LatLng(markerData.latitude, markerData.longitude),
              map: naverMapRef.current,
              title: markerData.title,
              icon: {
                url: iconUrl,
                size: new window.naver.maps.Size(32, 32),
                scaledSize: new window.naver.maps.Size(32, 32),
                anchor: new window.naver.maps.Point(16, 32)
              }
            })
            
            // 선택 상태 저장
            newMarker._isSelected = isSelected
            
            // 마커 클릭 이벤트
            window.naver.maps.Event.addListener(newMarker, 'click', (e: any) => {
              console.log('🖱️ 마커 클릭됨:', markerData.id)
              
              if (e.domEvent) {
                e.domEvent.preventDefault()
                e.domEvent.stopPropagation()
                e.domEvent.stopImmediatePropagation()
              }
              
              if (onMarkerClick) {
                console.log('📞 onMarkerClick 호출:', markerData.id)
                onMarkerClick(markerData.id)
              }
              
              return false
            })
            
            // 배열에서 교체
            markersRef.current[index] = newMarker
          }
        }
      })
      
      if (hasChanges) {
        console.log('✅ 변경된 마커 업데이트 완료')
      } else {
        console.log('🔄 변경사항 없음, 업데이트 스킵')
      }
      return
    }

    // 마커 수가 다르거나 처음 로딩일 때는 새로 생성
    console.log('🔄 새 마커 생성 모드')

    // 기존 마커 제거
    markersRef.current.forEach(marker => {
      marker.setMap(null)
    })
    markersRef.current = []

    // 새 마커 추가
    markers.forEach(markerData => {
      try {
        const isSelected = selectedMarkerId === markerData.id
        const iconUrl = createMarkerIcon(isSelected, markerData.color)
        
        console.log(`📍 마커 생성: ${markerData.id}, 선택됨: ${isSelected}, 아이콘: ${iconUrl}`)
        
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(markerData.latitude, markerData.longitude),
          map: naverMapRef.current,
          title: markerData.title,
          icon: {
            url: iconUrl,
            size: new window.naver.maps.Size(32, 32),
            scaledSize: new window.naver.maps.Size(32, 32),
            anchor: new window.naver.maps.Point(16, 32)
          }
        })

        // 선택 상태 저장
        marker._isSelected = isSelected

        // 마커 클릭 이벤트 (지도 이동 완전 차단)
        window.naver.maps.Event.addListener(marker, 'click', (e: any) => {
          console.log('🖱️ 마커 클릭됨:', markerData.id)
          
          // 모든 이벤트 전파 차단
          if (e.domEvent) {
            e.domEvent.preventDefault()
            e.domEvent.stopPropagation()
            e.domEvent.stopImmediatePropagation()
          }
          
          // 마커 클릭 직접 처리 - 좌표 비교 없이 ID로 직접 처리
          if (onMarkerClick) {
            console.log('📞 onMarkerClick 호출:', markerData.id)
            onMarkerClick(markerData.id)
          }
          
          // 지도 이동 방지
          return false
        })

        markersRef.current.push(marker)
      } catch (error) {
        console.error('마커 생성 오류:', error)
      }
    })
    
    console.log('✅ 마커 업데이트 완료')
  }, [markers, selectedMarkerId, isMounted]) // markers와 selectedMarkerId 모두 추가하되 중복 실행 방지 로직으로 최적화

  // 리스트 클릭시에만 지도 이동
  useEffect(() => {
    if (!naverMapRef.current || !moveToMarker || !markers.length || !isMounted) return
    
    // 이동할 마커 찾기
    const targetMarker = markers.find(marker => marker.id === moveToMarker)
    if (targetMarker) {
      // 리스트에서 클릭한 경우에만 지도 이동
      const targetLatLng = new window.naver.maps.LatLng(targetMarker.latitude, targetMarker.longitude)
      naverMapRef.current.setCenter(targetLatLng)
      naverMapRef.current.setZoom(16)
      
      // 이동 완료 후 콜백 호출 (moveToMarker 초기화를 위해)
      if (onMoveComplete) {
        setTimeout(() => {
          onMoveComplete()
        }, 100) // 지도 이동 애니메이션을 고려한 지연
      }
    }
  }, [moveToMarker, markers, isMounted, onMoveComplete])

  // 임시 마커 관리
  useEffect(() => {
    if (!naverMapRef.current || !window.naver || !isMounted) return

    // 기존 임시 마커 제거
    if (tempMarkerRef.current) {
      tempMarkerRef.current.setMap(null)
      tempMarkerRef.current = null
    }

    // 새로운 임시 마커 생성
    if (tempMarker) {
      try {
        const iconUrl = createTempMarkerIcon()
        
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(tempMarker.lat, tempMarker.lng),
          map: naverMapRef.current,
          title: '여기에 등록하시겠습니까?',
          icon: {
            url: iconUrl,
            size: new window.naver.maps.Size(32, 40),
            scaledSize: new window.naver.maps.Size(32, 40),
            anchor: new window.naver.maps.Point(16, 40)
          }
        })

        // 임시 마커 클릭 이벤트
        if (onTempMarkerClick) {
          window.naver.maps.Event.addListener(marker, 'click', (e: any) => {
            if (e.domEvent) {
              e.domEvent.preventDefault()
              e.domEvent.stopPropagation()
              e.domEvent.stopImmediatePropagation()
            }
            
            onTempMarkerClick()
            return false
          })
        }

        tempMarkerRef.current = marker
      } catch (error) {
        console.error('임시 마커 생성 오류:', error)
      }
    }
  }, [tempMarker, isMounted, onTempMarkerClick])

  // 주소 검색 API 호출
  const searchAddress = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/geocoding?query=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.success) {
        setSearchResults(data.results)
        setShowSearchResults(true)
      } else {
        setSearchResults([])
        setShowSearchResults(true)
        alert(data.message || '검색 결과가 없습니다.')
      }
    } catch (error) {
      console.error('주소 검색 오류:', error)
      alert('주소 검색 중 오류가 발생했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  // 검색 결과 선택 처리
  const handleSearchResultSelect = (result: SearchResult) => {
    setSelectedSearchResult(result)
    
    // 검색 마커 표시
    if (naverMapRef.current && window.naver) {
      // 기존 검색 마커 제거
      if (searchMarkerRef.current) {
        searchMarkerRef.current.setMap(null)
      }

      // 새 검색 마커 생성
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(result.latitude, result.longitude),
        map: naverMapRef.current,
        title: result.roadAddress || result.jibunAddress,
        icon: {
          url: createSearchMarkerIcon(),
          size: new window.naver.maps.Size(32, 40),
          scaledSize: new window.naver.maps.Size(32, 40),
          anchor: new window.naver.maps.Point(16, 40)
        }
      })

      searchMarkerRef.current = marker

      // 지도를 검색 결과 위치로 이동
      naverMapRef.current.setCenter(new window.naver.maps.LatLng(result.latitude, result.longitude))
      naverMapRef.current.setZoom(16)
    }

    setShowSearchResults(false)
  }

  // 검색 마커에서 실제 마커 등록
  const handleRegisterFromSearch = () => {
    if (selectedSearchResult && onSearchResultSelect) {
      const address = selectedSearchResult.roadAddress || selectedSearchResult.jibunAddress
      onSearchResultSelect(selectedSearchResult.latitude, selectedSearchResult.longitude, address)
      
      // 검색 마커 제거
      if (searchMarkerRef.current) {
        searchMarkerRef.current.setMap(null)
        searchMarkerRef.current = null
      }
      
      setSelectedSearchResult(null)
    }
  }

  // 검색 취소
  const handleSearchCancel = () => {
    // 검색 마커 제거
    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null)
      searchMarkerRef.current = null
    }
    
    setSelectedSearchResult(null)
    setShowSearchResults(false)
    setSearchQuery('')
    setSearchResults([])
  }

  // 마운트되지 않은 경우 로딩 표시
  if (!isMounted) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">지도 준비 중...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">지도 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div 
        className="flex items-center justify-center bg-red-50 rounded-lg border border-red-200"
        style={{ height }}
      >
        <div className="text-center text-red-600">
          <p className="font-medium">지도 로딩 실패</p>
          <p className="text-sm">네이버 지도 API 키를 확인해주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        style={{ height }} 
        className="w-full rounded-lg overflow-hidden shadow-lg"
      />

      {/* 주소 검색창 */}
      {showAddressSearch && (
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    searchAddress(searchQuery)
                  }
                }}
                placeholder="주소를 검색하세요 (예: 명동, 중앙로15길125, 서울시 중구)"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSearching}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {isSearching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : (
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
            </div>
            <button
              onClick={() => searchAddress(searchQuery)}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              검색
            </button>
            {(selectedSearchResult || showSearchResults) && (
              <button
                onClick={handleSearchCancel}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
            )}
          </div>
        </div>

        {/* 검색 결과 목록 */}
        {showSearchResults && (
          <div className="mt-2 bg-white rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="p-2">
                <div className="text-sm text-gray-600 mb-2 px-2">
                  검색 결과 {searchResults.length}개
                </div>
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleSearchResultSelect(result)}
                    className="p-3 hover:bg-gray-50 cursor-pointer rounded-md border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 text-sm">
                      {result.roadAddress || result.jibunAddress}
                    </div>
                    {result.roadAddress && result.jibunAddress && result.roadAddress !== result.jibunAddress && (
                      <div className="text-xs text-gray-500 mt-1">
                        {result.jibunAddress}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 선택된 검색 결과 액션 */}
        {selectedSearchResult && (
          <div className="mt-2 bg-white rounded-lg shadow-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">
                  📍 {selectedSearchResult.roadAddress || selectedSearchResult.jibunAddress}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  검색된 위치입니다. 이 위치에 마커를 등록하시겠습니까?
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-3">
              {onSearchResultSelect && (
                <button
                  onClick={handleRegisterFromSearch}
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  여기에 등록하기
                </button>
              )}
              <button
                onClick={handleSearchCancel}
                className="px-3 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* 현재 위치 버튼 */}
      <button
        onClick={() => {
          if (navigator.geolocation && naverMapRef.current) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                const currentLatLng = new window.naver.maps.LatLng(lat, lng)
                naverMapRef.current.setCenter(currentLatLng)
                naverMapRef.current.setZoom(16)
              },
              () => {
                alert('현재 위치를 가져올 수 없습니다.')
              }
            )
          }
        }}
        className="absolute bottom-4 right-4 bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-colors"
        title="현재 위치로 이동"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  )
} 