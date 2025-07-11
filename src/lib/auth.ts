import bcrypt from 'bcryptjs'
import { User } from '@prisma/client'

// 비밀번호 해시화
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

// 비밀번호 검증
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

// 권한 체크 함수들 (단순화)
export const canCreateBusking = (user: User): boolean => {
  return user.role === 'ADMIN' || user.isBusker
}

export const canCreateBusiness = (user: User): boolean => {
  return user.role === 'ADMIN' || user.isBusiness
}

export const canCreateCommunity = (user: User): boolean => {
  return user.role === 'ADMIN' || user.role === 'USER'
}

export const canCreateLesson = (user: User): boolean => {
  return user.role === 'ADMIN' || user.role === 'USER'
}

export const canCreateNayogi = (user: User): boolean => {
  return user.role === 'ADMIN' || user.role === 'USER'
}

export const isAdmin = (user: User): boolean => {
  return user.role === 'ADMIN'
}

// 관리자 권한 체크 함수들
export const checkAdminAuth = (user: AuthUser | null): boolean => {
  if (!user) return false
  return user.role === 'ADMIN'
}

export const requireAdminAuth = (user: AuthUser | null): AuthUser => {
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }
  if (user.role !== 'ADMIN') {
    throw new Error('관리자 권한이 필요합니다.')
  }
  return user
}

// 관리자 API 권한 체크 (Next.js API 라우트용)
export const checkAdminApiAuth = (email: string | null, userRole: string | null): boolean => {
  if (!email || !userRole) return false
  return userRole === 'ADMIN'
}

// 사용자 타입 (클라이언트용)
export type AuthUser = {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
  isBusker: boolean
  isBusiness: boolean
} 