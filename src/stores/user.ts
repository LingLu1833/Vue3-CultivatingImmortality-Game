import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import request from '@/utils/request'
import router from '@/router'

export interface UserInfo {
  id: string
  username: string
  email?: string
  roles?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: UserInfo
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
  }

  const clearAuth = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  const register = async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await request.post<AuthResponse>('/api/auth/register', data)
    return response.data
  }

  const login = async (data: LoginRequest): Promise<void> => {
    const response = await request.post<AuthResponse>('/api/auth/login', data)
    const { token: newToken, user } = response.data
    setToken(newToken)
    setUserInfo(user)
  }

  const logout = async (): Promise<void> => {
    try {
      await request.post('/api/auth/logout')
    } finally {
      clearAuth()
      router.push('/login')
    }
  }

  const fetchUserInfo = async (): Promise<void> => {
    const response = await request.get<UserInfo>('/api/auth/me')
    setUserInfo(response.data)
  }

  const initAuth = async (): Promise<void> => {
    if (token.value) {
      try {
        await fetchUserInfo()
      } catch (error) {
        clearAuth()
      }
    }
  }

  return {
    token,
    userInfo,
    isAuthenticated,
    setToken,
    setUserInfo,
    clearAuth,
    register,
    login,
    logout,
    fetchUserInfo,
    initAuth
  }
})
