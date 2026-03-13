// ============================================================================
// API Client (Axios 기반)
// Spring Boot 백엔드와 통신하기 위한 클라이언트
// ============================================================================

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// 환경변수에서 설정 가져오기
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'; // 기본값: true (안전한 기본값)

// 디버깅용 로그
console.log('🔧 API 설정:', {
  API_BASE_URL,
  USE_MOCK,
  env: import.meta.env.VITE_USE_MOCK,
});

// ─── Axios 인스턴스 생성 ──────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── 요청 인터셉터 (Request Interceptor) ──────────────────────────────────
// 모든 요청에 JWT 토큰을 자동으로 추가

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── 응답 인터셉터 (Response Interceptor) ─────────────────────────────────
// 에러 처리 및 자동 로그아웃

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // 401 Unauthorized - 토큰 만료 또는 인증 실패
    if (error.response?.status === 401) {
      // 토큰 삭제 및 로그인 페이지로 리다이렉트
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // 로그인 페이지가 아닐 때만 리다이렉트
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ─── 토큰 및 사용자 정보 관리 ─────────────────────────────────────────────

export const authStorage = {
  setToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },

  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  removeToken: () => {
    localStorage.removeItem('authToken');
  },

  setUser: (user: any) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: <T = any>(): T | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  removeUser: () => {
    localStorage.removeItem('user');
  },

  clearAll: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};

// ─── Mock 모드 여부 확인 ──────────────────────────────────────────────────

export const isMockMode = () => USE_MOCK;

export default apiClient;