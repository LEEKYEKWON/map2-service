'use client'

import { useState } from 'react'

interface Marker {
  id: string
  latitude: number
  longitude: number
  title: string
  content?: string
}

interface MockMapProps {
  markers?: Marker[]
  onMapClick?: (lat: number, lng: number) => void
  selectedMarkerId?: string | null
  height?: string
  center?: { lat: number; lng: number }
}

export default function MockMap({
  markers = [],
  onMapClick,
  selectedMarkerId,
  height = '500px',
  center = { lat: 37.5665, lng: 126.9780 }
}: MockMapProps) {
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null)

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // 클릭 위치를 위도/경도로 변환 (임시 계산)
    const lat = center.lat + (0.01 * (250 - y) / 250) // 중심에서 위아래로 0.01도 범위
    const lng = center.lng + (0.01 * (x - 250) / 250) // 중심에서 좌우로 0.01도 범위
    
    setClickPosition({ x, y })
    
    // 3초 후에 클릭 위치 표시 제거
    setTimeout(() => {
      setClickPosition(null)
    }, 3000)
    
    if (onMapClick) {
      onMapClick(lat, lng)
    }
  }

  return (
    <div className="relative">
      <div 
        className="w-full bg-gradient-to-br from-green-100 to-blue-100 rounded-lg overflow-hidden shadow-lg cursor-crosshair relative"
        style={{ height }}
        onClick={handleMapClick}
      >
        {/* 배경 그리드 */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ccc" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* 지도 중심 표시 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>

        {/* 마커들 */}
        {markers.map((marker, index) => {
          // 위도/경도를 화면 좌표로 변환 (임시 계산)
          const x = 250 + ((marker.longitude - center.lng) / 0.01) * 250
          const y = 250 - ((marker.latitude - center.lat) / 0.01) * 250
          
          const isSelected = selectedMarkerId === marker.id
          
          return (
            <div
              key={marker.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                isSelected ? 'scale-110 z-20' : 'z-10 hover:scale-105'
              }`}
              style={{ 
                left: `${Math.max(0, Math.min(100, (x / 500) * 100))}%`,
                top: `${Math.max(0, Math.min(100, (y / 500) * 100))}%`
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (onMapClick) {
                  onMapClick(marker.latitude, marker.longitude)
                }
              }}
            >
              <div className={`
                px-3 py-2 rounded-full text-white text-xs font-bold shadow-lg
                ${isSelected ? 'bg-blue-600' : 'bg-red-500'}
              `}>
                🎵 {marker.title}
              </div>
            </div>
          )
        })}

        {/* 클릭 위치 표시 */}
        {clickPosition && (
          <div
            className="absolute w-3 h-3 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ping"
            style={{ 
              left: clickPosition.x, 
              top: clickPosition.y 
            }}
          />
        )}

        {/* 지도 정보 오버레이 */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow-md p-3">
          <div className="text-xs text-gray-600">
            <div className="font-semibold mb-2">📍 임시 지도 (테스트용)</div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>일반 이벤트</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
              <span>선택된 이벤트</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
              <span>클릭 위치</span>
            </div>
          </div>
        </div>

        {/* 좌표 정보 */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow-md p-2">
          <div className="text-xs text-gray-600">
            <div>중심: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}</div>
            <div>마커 수: {markers.length}개</div>
          </div>
        </div>

        {/* 지도 클릭 안내 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="text-center text-gray-500 bg-white/80 rounded-lg p-4">
            <div className="text-sm font-medium mb-1">임시 지도</div>
            <div className="text-xs">지도를 클릭하여 위치 선택</div>
            <div className="text-xs text-blue-600 mt-1">
              나중에 네이버 지도로 교체 예정
            </div>
          </div>
        </div>
      </div>

      {/* 현재 위치 버튼 */}
      <button
        onClick={() => {
          if (onMapClick) {
            // 서울 시청 좌표로 이동
            onMapClick(37.5665, 126.9780)
          }
        }}
        className="absolute bottom-4 right-4 bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-colors"
        title="서울 시청으로 이동"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  )
} 