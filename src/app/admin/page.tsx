'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { checkAdminAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalBusking: 0,
    totalBusiness: 0,
    totalEvents: 0,
    totalCommunity: 0,
    totalLesson: 0,
    totalNayogi: 0,
    totalGarden: 0,
    totalHotspot: 0
  })

  // 사용자 관리 상태
  const [users, setUsers] = useState<any[]>([])
  const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [usersLoading, setUsersLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // 게시글 관리 상태
  const [posts, setPosts] = useState<any[]>([])
  const [postsPagination, setPostsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsSearchTerm, setPostsSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  // 콘텐츠 관리 상태
  const [contents, setContents] = useState<any[]>([])
  const [contentsLoading, setContentsLoading] = useState(false)
  const [selectedContentType, setSelectedContentType] = useState('busking')
  const [contentStats, setContentStats] = useState({
    busking: 0,
    community: 0,
    lesson: 0,
    business: 0,
    events: 0,
    nayogi: 0,
    garden: 0,
    hotspot: 0
  })

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!checkAdminAuth(user)) {
      alert('관리자 권한이 필요합니다.')
      router.push('/')
      return
    }

    setLoading(false)
    fetchStats()
  }, [user, router])

  // 활성 탭 변경 시 데이터 로드
  useEffect(() => {
    if (!user || loading) return
    
    if (activeTab === 'users') {
      fetchUsers(1, searchTerm)
    } else if (activeTab === 'posts') {
      fetchPosts(1, postsSearchTerm, selectedCategory)
    } else if (activeTab === 'content') {
      fetchContents(selectedContentType)
    }
  }, [activeTab, user, loading])

  // 검색어 변경 시 사용자 목록 갱신
  useEffect(() => {
    if (activeTab === 'users' && !loading) {
      const timeoutId = setTimeout(() => {
        fetchUsers(1, searchTerm)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, activeTab, loading])

  // 게시글 검색어 변경 시 목록 갱신
  useEffect(() => {
    if (activeTab === 'posts' && !loading) {
      const timeoutId = setTimeout(() => {
        fetchPosts(1, postsSearchTerm, selectedCategory)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [postsSearchTerm, selectedCategory, activeTab, loading])

  // 콘텐츠 타입 변경 시 목록 갱신
  useEffect(() => {
    if (activeTab === 'content' && !loading) {
      fetchContents(selectedContentType)
    }
  }, [selectedContentType, activeTab, loading])

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/stats?email=${user?.email}&role=${user?.role}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('통계 조회 실패:', error)
    }
  }

  // 사용자 목록 조회
  const fetchUsers = async (page = 1, search = '') => {
    setUsersLoading(true)
    try {
      const response = await fetch(
        `/api/admin/users?email=${user?.email}&role=${user?.role}&page=${page}&limit=20&search=${search}`
      )
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setUsersPagination(data.pagination)
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  // 사용자 정보 업데이트
  const updateUser = async (userId: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/users?email=${user?.email}&role=${user?.role}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates })
      })

      if (response.ok) {
        const data = await response.json()
        // 사용자 목록 갱신
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u))
        alert(data.message)
      } else {
        const errorData = await response.json()
        alert(errorData.error || '사용자 정보 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('사용자 정보 수정 실패:', error)
      alert('사용자 정보 수정에 실패했습니다.')
    }
  }

  // 게시글 목록 조회
  const fetchPosts = async (page = 1, search = '', category = 'ALL') => {
    setPostsLoading(true)
    try {
      // 모든 카테고리의 게시글을 가져오기 위해 각 카테고리별로 요청
      const categories = ['BUSKING', 'COMMUNITY', 'LESSON', 'EVENT', 'NAYOGI', 'GARDEN']
      const allPosts: any[] = []
      
      if (category === 'ALL') {
        // 모든 카테고리 조회
        for (const cat of categories) {
          const response = await fetch(`/api/posts?category=${cat}&page=1&limit=100`)
          if (response.ok) {
            const data = await response.json()
            allPosts.push(...data.posts.map((post: any) => ({ ...post, category: cat })))
          }
        }
      } else {
        // 특정 카테고리 조회
        const response = await fetch(`/api/posts?category=${category}&page=${page}&limit=20`)
        if (response.ok) {
          const data = await response.json()
          allPosts.push(...data.posts.map((post: any) => ({ ...post, category })))
        }
      }

      // 검색 필터링
      let filteredPosts = allPosts
      if (search) {
        filteredPosts = allPosts.filter(post => 
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.content.toLowerCase().includes(search.toLowerCase()) ||
          post.user.name.toLowerCase().includes(search.toLowerCase())
        )
      }

      // 페이지네이션
      const total = filteredPosts.length
      const totalPages = Math.ceil(total / 20)
      const startIndex = (page - 1) * 20
      const endIndex = startIndex + 20
      const paginatedPosts = filteredPosts.slice(startIndex, endIndex)

      setPosts(paginatedPosts)
      setPostsPagination({ page, limit: 20, total, totalPages })
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error)
    } finally {
      setPostsLoading(false)
    }
  }

  // 게시글 삭제
  const deletePost = async (postId: string) => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/posts/${postId}?email=${user?.email}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('게시글이 삭제되었습니다.')
        fetchPosts(postsPagination.page, postsSearchTerm, selectedCategory)
      } else {
        const errorData = await response.json()
        alert(errorData.error || '게시글 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('게시글 삭제 실패:', error)
      alert('게시글 삭제에 실패했습니다.')
    }
  }

  // 콘텐츠 목록 조회
  const fetchContents = async (type: string) => {
    setContentsLoading(true)
    try {
      const response = await fetch(`/api/${type}`)
      if (response.ok) {
        const data = await response.json()
        setContents(data)
        
        // 콘텐츠 통계 업데이트
        setContentStats(prev => ({
          ...prev,
          [type]: data.length
        }))
      }
    } catch (error) {
      console.error(`${type} 목록 조회 실패:`, error)
    } finally {
      setContentsLoading(false)
    }
  }

  // 콘텐츠 삭제
  const deleteContent = async (type: string, id: string) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/${type}/${id}?email=${user?.email}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('항목이 삭제되었습니다.')
        fetchContents(selectedContentType)
      } else {
        const errorData = await response.json()
        alert(errorData.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-sm text-gray-600">전체 서비스 관리 및 통계</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">안녕하세요, {user?.name}님</span>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                메인으로
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 네비게이션 메뉴 */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`pb-2 px-1 text-sm font-medium ${
                  activeTab === 'dashboard' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                대시보드
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`pb-2 px-1 text-sm font-medium ${
                  activeTab === 'users' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                사용자 관리
              </button>
              <button 
                onClick={() => setActiveTab('posts')}
                className={`pb-2 px-1 text-sm font-medium ${
                  activeTab === 'posts' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                게시글 관리
              </button>
              <button 
                onClick={() => setActiveTab('content')}
                className={`pb-2 px-1 text-sm font-medium ${
                  activeTab === 'content' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                콘텐츠 관리
              </button>
              <button 
                onClick={() => setActiveTab('statistics')}
                className={`pb-2 px-1 text-sm font-medium ${
                  activeTab === 'statistics' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                통계 분석
              </button>
              <button 
                onClick={() => setActiveTab('system')}
                className={`pb-2 px-1 text-sm font-medium ${
                  activeTab === 'system' 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                시스템 관리
              </button>
            </nav>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'dashboard' && (
          <>
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">전체 사용자</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">📝</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">전체 게시글</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">🎵</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">버스킹</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalBusking}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold">🏢</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">매장</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalBusiness}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 추가 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">실시간이벤트</p>
            <p className="text-xl font-bold text-orange-600">{stats.totalEvents}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">커뮤니티</p>
            <p className="text-xl font-bold text-blue-600">{stats.totalCommunity}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">레슨</p>
            <p className="text-xl font-bold text-green-600">{stats.totalLesson}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">나요기</p>
            <p className="text-xl font-bold text-yellow-600">{stats.totalNayogi}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">공유텃밭</p>
            <p className="text-xl font-bold text-green-600">{stats.totalGarden}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">핫스팟</p>
            <p className="text-xl font-bold text-red-600">{stats.totalHotspot}</p>
          </div>
        </div>

            {/* 최근 활동 */}
            <div className="mt-8 bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">최근 활동</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">전체 시스템 정상 운영 중</span>
                    <span className="text-sm font-medium text-green-600">정상</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">데이터베이스 연결 상태</span>
                    <span className="text-sm font-medium text-green-600">정상</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">게시판 시스템</span>
                    <span className="text-sm font-medium text-green-600">정상</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 사용자 관리 탭 */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* 헤더 및 검색 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">사용자 관리</h3>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder="이름 또는 이메일로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="text-sm text-gray-600">
                    총 {usersPagination.total}명
                  </div>
                </div>
              </div>
            </div>

            {/* 사용자 목록 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {usersLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">사용자 목록을 불러오는 중...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            사용자 정보
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            권한
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            활동 수
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            가입일
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((userData) => (
                          <tr key={userData.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                                <div className="text-sm text-gray-500">{userData.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-2">
                                <select
                                  value={userData.role}
                                  onChange={(e) => updateUser(userData.id, { role: e.target.value })}
                                  className="text-sm border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="USER">일반 사용자</option>
                                  <option value="ADMIN">관리자</option>
                                </select>
                                <div className="flex space-x-2">
                                  <label className="flex items-center text-xs">
                                    <input
                                      type="checkbox"
                                      checked={userData.isBusker}
                                      onChange={(e) => updateUser(userData.id, { isBusker: e.target.checked })}
                                      className="mr-1"
                                    />
                                    버스커
                                  </label>
                                  <label className="flex items-center text-xs">
                                    <input
                                      type="checkbox"
                                      checked={userData.isBusiness}
                                      onChange={(e) => updateUser(userData.id, { isBusiness: e.target.checked })}
                                      className="mr-1"
                                    />
                                    사업자
                                  </label>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="space-y-1 text-xs">
                                <div className="text-gray-500">활동 수 집계 중...</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(userData.createdAt).toLocaleDateString('ko-KR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                userData.role === 'ADMIN' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {userData.role === 'ADMIN' ? '관리자' : '일반'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 페이지네이션 */}
                  {usersPagination.totalPages > 1 && (
                    <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                      <div className="text-sm text-gray-700">
                        전체 {usersPagination.total}명 중 {((usersPagination.page - 1) * usersPagination.limit) + 1}-{Math.min(usersPagination.page * usersPagination.limit, usersPagination.total)} 표시
                      </div>
                      <div className="flex space-x-2">
                        {Array.from({ length: Math.min(usersPagination.totalPages, 5) }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => fetchUsers(page, searchTerm)}
                            className={`px-3 py-1 rounded text-sm ${
                              page === usersPagination.page
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 게시글 관리 탭 */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* 헤더 및 검색 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">게시글 관리</h3>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ALL">전체 카테고리</option>
                    <option value="BUSKING">버스킹</option>
                    <option value="COMMUNITY">커뮤니티</option>
                    <option value="LESSON">레슨</option>
                    <option value="EVENT">실시간이벤트</option>
                    <option value="NAYOGI">나요기</option>
                    <option value="GARDEN">공유텃밭&핫스팟</option>
                  </select>
                  <input
                    type="text"
                    placeholder="제목, 내용, 작성자로 검색..."
                    value={postsSearchTerm}
                    onChange={(e) => setPostsSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="text-sm text-gray-600">
                    총 {postsPagination.total}개
                  </div>
                </div>
              </div>
            </div>

            {/* 게시글 목록 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {postsLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">게시글 목록을 불러오는 중...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            게시글 정보
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            카테고리
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            작성자
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            작성일
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            관리
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {posts.map((post) => (
                          <tr key={post.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="max-w-xs">
                                <div className="text-sm font-medium text-gray-900 truncate">{post.title}</div>
                                <div className="text-sm text-gray-500 truncate">{post.content.substring(0, 100)}...</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                post.category === 'BUSKING' ? 'bg-purple-100 text-purple-800' :
                                post.category === 'COMMUNITY' ? 'bg-green-100 text-green-800' :
                                post.category === 'LESSON' ? 'bg-blue-100 text-blue-800' :
                                post.category === 'EVENT' ? 'bg-red-100 text-red-800' :
                                post.category === 'NAYOGI' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {post.category === 'BUSKING' ? '버스킹' :
                                 post.category === 'COMMUNITY' ? '커뮤니티' :
                                 post.category === 'LESSON' ? '레슨' :
                                 post.category === 'EVENT' ? '실시간이벤트' :
                                 post.category === 'NAYOGI' ? '나요기' :
                                 '공유텃밭&핫스팟'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{post.user.name}</div>
                              <div className="text-sm text-gray-500">{post.user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => deletePost(post.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 페이지네이션 */}
                  {postsPagination.totalPages > 1 && (
                    <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                      <div className="text-sm text-gray-700">
                        전체 {postsPagination.total}개 중 {((postsPagination.page - 1) * postsPagination.limit) + 1}-{Math.min(postsPagination.page * postsPagination.limit, postsPagination.total)} 표시
                      </div>
                      <div className="flex space-x-2">
                        {Array.from({ length: Math.min(postsPagination.totalPages, 5) }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => fetchPosts(page, postsSearchTerm, selectedCategory)}
                            className={`px-3 py-1 rounded text-sm ${
                              page === postsPagination.page
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 콘텐츠 관리 탭 */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* 헤더 및 컨트롤 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">콘텐츠 관리</h3>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedContentType}
                    onChange={(e) => setSelectedContentType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="busking">버스킹 이벤트</option>
                    <option value="community">커뮤니티 이벤트</option>
                    <option value="lesson">레슨 이벤트</option>
                    <option value="business">매장 정보</option>
                    <option value="event">실시간 이벤트</option>
                    <option value="nayogi">나요기</option>
                    <option value="garden">공유텃밭</option>
                    <option value="hotspot">핫스팟</option>
                  </select>
                  <div className="text-sm text-gray-600">
                    총 {contentStats[selectedContentType as keyof typeof contentStats]}개
                  </div>
                </div>
              </div>
            </div>

            {/* 콘텐츠 목록 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {contentsLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">콘텐츠를 불러오는 중...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          기본 정보
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          위치
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          생성일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          관리
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contents.map((content) => (
                        <tr key={content.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <div className="text-sm font-medium text-gray-900 truncate">{content.name || content.title}</div>
                              <div className="text-sm text-gray-500 truncate">{content.description}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {content.latitude && content.longitude ? (
                              <div>
                                <div>위도: {content.latitude.toFixed(6)}</div>
                                <div>경도: {content.longitude.toFixed(6)}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(content.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => deleteContent(selectedContentType, content.id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 통계 분석 탭 */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">상세 통계 분석</h3>
              
              {/* 전체 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
                  <div className="text-sm text-gray-600">총 사용자</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.totalPosts}</div>
                  <div className="text-sm text-gray-600">총 게시글</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.totalBusking + stats.totalBusiness + stats.totalEvents + stats.totalNayogi}</div>
                  <div className="text-sm text-gray-600">총 콘텐츠</div>
                </div>
              </div>

              {/* 메뉴별 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">메뉴별 콘텐츠 수</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">🎵 버스킹</span>
                      <span className="font-semibold">{stats.totalBusking}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">🏢 매장</span>
                      <span className="font-semibold">{stats.totalBusiness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">🔥 실시간이벤트</span>
                      <span className="font-semibold">{stats.totalEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">📍 나요기</span>
                      <span className="font-semibold">{stats.totalNayogi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">🌱 공유텃밭</span>
                      <span className="font-semibold">{stats.totalGarden}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">🌟 핫스팟</span>
                      <span className="font-semibold">{stats.totalHotspot}</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">게시글 카테고리별</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">🎵 버스킹</span>
                      <span className="font-semibold">{stats.totalCommunity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">👥 커뮤니티</span>
                      <span className="font-semibold">{stats.totalCommunity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">📚 레슨</span>
                      <span className="font-semibold">{stats.totalLesson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">🔥 실시간이벤트</span>
                      <span className="font-semibold">{stats.totalEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">📍 나요기</span>
                      <span className="font-semibold">{stats.totalNayogi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">🌱 공유텃밭&핫스팟</span>
                      <span className="font-semibold">{stats.totalGarden}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 시스템 상태 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">시스템 상태</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                    <div className="text-sm text-gray-600">데이터베이스</div>
                    <div className="text-xs text-green-600">정상</div>
                  </div>
                  <div className="text-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                    <div className="text-sm text-gray-600">API 서버</div>
                    <div className="text-xs text-green-600">정상</div>
                  </div>
                  <div className="text-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                    <div className="text-sm text-gray-600">파일 시스템</div>
                    <div className="text-xs text-green-600">정상</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 시스템 관리 탭 */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">시스템 관리</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 백업 관리 */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">백업 관리</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">마지막 백업</span>
                      <span className="text-sm font-medium">2024-01-15 02:00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">다음 백업</span>
                      <span className="text-sm font-medium">2024-01-16 02:00</span>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      수동 백업 실행
                    </button>
                  </div>
                </div>

                {/* 시스템 정보 */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">시스템 정보</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">서버 상태</span>
                      <span className="text-sm font-medium text-green-600">정상</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">서버 시간</span>
                      <span className="text-sm font-medium">{new Date().toLocaleString('ko-KR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">데이터베이스</span>
                      <span className="text-sm font-medium text-green-600">연결됨</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">버전</span>
                      <span className="text-sm font-medium">v1.0.0</span>
                    </div>
                  </div>
                </div>

                {/* 로그 관리 */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">로그 관리</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">오늘 로그</span>
                      <span className="text-sm font-medium">1,234 건</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">오류 로그</span>
                      <span className="text-sm font-medium text-red-600">3 건</span>
                    </div>
                    <button className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors">
                      로그 다운로드
                    </button>
                  </div>
                </div>

                {/* 캐시 관리 */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">캐시 관리</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">캐시 크기</span>
                      <span className="text-sm font-medium">45.2 MB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">마지막 정리</span>
                      <span className="text-sm font-medium">2시간 전</span>
                    </div>
                    <button className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors">
                      캐시 정리
                    </button>
                  </div>
                </div>
              </div>

              {/* 긴급 관리 */}
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-3">⚠️ 긴급 관리</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors">
                    시스템 재시작
                  </button>
                  <button className="bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors">
                    유지보수 모드
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 