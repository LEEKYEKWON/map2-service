'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Post {
  id: string
  title: string
  content: string
  category: string
  createdAt: string
  user: {
    id: string
    name: string
  }
}

interface PostBoardProps {
  category: 'BUSKING' | 'COMMUNITY' | 'LESSON' | 'EVENT' | 'NAYOGI' | 'GARDEN'
  title: string
  color: string
}

export default function PostBoard({ category, title, color }: PostBoardProps) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })

  // 게시글 목록 조회
  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/posts?category=${category}&page=${currentPage}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      setError('게시글을 불러오는데 실패했습니다.')
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [category, currentPage])

  // 폼 리셋
  const resetForm = () => {
    setFormData({ title: '', content: '' })
    setSelectedPost(null)
    setShowForm(false)
  }

  // 게시글 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const url = selectedPost ? `/api/posts/${selectedPost.id}` : '/api/posts'
      const method = selectedPost ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category,
          email: user.email
        })
      })

      if (response.ok) {
        setSuccess(selectedPost ? '게시글이 수정되었습니다.' : '게시글이 등록되었습니다.')
        resetForm()
        fetchPosts()
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

  // 게시글 삭제
  const handleDelete = async (post: Post) => {
    if (!user) return
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/posts/${post.id}?email=${user.email}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('게시글이 삭제되었습니다.')
        fetchPosts()
      } else {
        const data = await response.json()
        setError(data.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
    }
  }

  // 수정 버튼 클릭
  const handleEdit = (post: Post) => {
    setSelectedPost(post)
    setFormData({
      title: post.title,
      content: post.content
    })
    setShowForm(true)
  }

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 시간 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 첫 번째 줄 추출 함수
  const getFirstLine = (content: string) => {
    return content.split('\n')[0]
  }

  // 게시글 펼치기/접기 토글
  const toggleExpanded = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  // 표시할 내용 가져오기 (첫 번째 줄 + 80자 제한)
  const getDisplayContent = (content: string) => {
    const firstLine = getFirstLine(content)
    if (firstLine.length > 80) {
      return firstLine.substring(0, 80)
    }
    return firstLine
  }

  // 축약이 필요한지 확인하는 함수
  const needsTruncation = (content: string) => {
    const firstLine = getFirstLine(content)
    return content.includes('\n') || firstLine.length > 80
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">💬 {title} 게시판</h3>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? '취소' : '글쓰기'}
          </button>
        )}
      </div>

      {/* 알림 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right text-red-400 hover:text-red-600">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
          {success}
          <button onClick={() => setSuccess('')} className="float-right text-green-400 hover:text-green-600">×</button>
        </div>
      )}

      {/* 글쓰기 폼 */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-semibold text-gray-900 mb-3">
            {selectedPost ? '게시글 수정' : '새 게시글 작성'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <textarea
              placeholder="내용을 입력하세요"
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '처리 중...' : (selectedPost ? '수정' : '등록')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 게시글 목록 */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            아직 작성된 게시글이 없습니다.
            {user && (
              <div className="mt-2">
                <button
                  onClick={() => setShowForm(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  첫 번째 글을 작성해보세요!
                </button>
              </div>
            )}
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900 text-lg">{post.title}</h4>
                {user && (user.id === post.user.id || user.role === 'ADMIN') && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(post)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              <div className="text-gray-700 mb-3">
                {needsTruncation(post.content) ? (
                  <div>
                    <p className="whitespace-pre-wrap">
                      {expandedPosts.has(post.id) 
                        ? post.content 
                        : getDisplayContent(post.content) + (getDisplayContent(post.content) !== post.content ? '...' : '')
                      }
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpanded(post.id)
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm mt-1"
                    >
                      {expandedPosts.has(post.id) ? '접기' : '자세히 보기'}
                    </button>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{post.content}</p>
                )}
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>작성자: {post.user.name}</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}