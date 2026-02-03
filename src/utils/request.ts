import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'
import router from '@/router'

export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean
}

export interface ResponseData<T = any> {
  code: number
  message: string
  data: T
}

export interface HttpError extends Error {
  response?: AxiosResponse<ResponseData>
  status?: number
  code?: number
}

class HttpRequest {
  private instance: AxiosInstance
  private baseURL: string = import.meta.env.VITE_API_BASE_URL || '/api'

  constructor() {
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig & RequestConfig) => {
        const token = localStorage.getItem('token')
        if (token && !config.skipAuth) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )

    this.instance.interceptors.response.use(
      (response: AxiosResponse<ResponseData>) => {
        return response.data as any
      },
      (error: AxiosError<ResponseData>) => {
        const httpError: HttpError = new Error(error.message) as HttpError
        httpError.response = error.response
        httpError.status = error.response?.status

        if (error.response) {
          const { status, data } = error.response

          switch (status) {
            case 408:
              localStorage.removeItem('token')
              router.push('/login')
              httpError.message = 'Token已过期，请重新登录'
              break
            case 401:
              httpError.message = data?.message || '未授权，请先登录'
              break
            case 403:
              httpError.message = data?.message || '拒绝访问'
              break
            case 404:
              httpError.message = data?.message || '请求的资源不存在'
              break
            case 500:
              httpError.message = data?.message || '服务器内部错误'
              break
            default:
              httpError.message = data?.message || `请求失败: ${status}`
          }

          httpError.code = data?.code
        } else if (error.request) {
          httpError.message = '网络连接失败，请检查网络设置'
        }

        return Promise.reject(httpError)
      }
    )
  }

  public get<T = any>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.instance.get(url, config)
  }

  public post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.instance.post(url, data, config)
  }

  public put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.instance.put(url, data, config)
  }
}

export default new HttpRequest()
