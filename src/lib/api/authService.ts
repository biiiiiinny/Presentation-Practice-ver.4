import apiClient, { authStorage, isMockMode } from './client';
import { mockAuth } from './mockData';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '../types/api';

// ============================================================================
// Auth Service - 회원가입, 로그인, 로그아웃
// Mock 모드와 실제 API 모드를 환경변수로 전환
// ============================================================================

class AuthService {
  /**
   * 회원가입
   * POST /api/auth/register
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      // ─── Mock 모드 ───────────────────────────────────────────────────
      if (isMockMode()) {
        console.log('🔶 Mock 모드: 회원가입');
        return await mockAuth.register(data.email, data.password, data.nickname);
      }

      // ─── 실제 API 호출 ────────────────────────────────────────────────
      console.log('🔵 API 모드: 회원가입');
      const response = await apiClient.post<RegisterResponse>('/api/auth/register', {
        email: data.email,
        password: data.password,
        nickname: data.nickname,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      
      // Axios 에러 처리
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || '회원가입에 실패했습니다.',
        };
      }
      
      throw error;
    }
  }

  /**
   * 로그인
   * POST /api/auth/login
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      // ─── Mock 모드 ───────────────────────────────────────────────────
      if (isMockMode()) {
        console.log('🔶 Mock 모드: 로그인');
        const response = await mockAuth.login(data.email, data.password);
        
        // Mock 로그인 성공 시 토큰과 사용자 정보 저장
        if (response.success && response.token && response.user) {
          authStorage.setToken(response.token);
          authStorage.setUser(response.user);
        }
        
        return response;
      }

      // ─── 실제 API 호출 ────────────────────────────────────────────────
      console.log('🔵 API 모드: 로그인');
      const response = await apiClient.post<LoginResponse>('/api/auth/login', {
        email: data.email,
        password: data.password,
      });

      // 실제 API 로그인 성공 시 토큰과 사용자 정보 저장
      if (response.data.success && response.data.token && response.data.user) {
        authStorage.setToken(response.data.token);
        authStorage.setUser(response.data.user);
      }

      return response.data;
    } catch (error: any) {
      console.error('로그인 실패:', error);
      
      // Axios 에러 처리
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || '로그인에 실패했습니다.',
        };
      }
      
      throw error;
    }
  }

  /**
   * 로그아웃
   */
  logout() {
    authStorage.clearAll();
    console.log('로그아웃 완료');
  }

  /**
   * 현재 로그인된 사용자 정보 확인
   */
  getCurrentUser(): User | null {
    return authStorage.getUser<User>();
  }

  /**
   * 로그인 상태 확인
   */
  isAuthenticated(): boolean {
    const token = authStorage.getToken();
    return !!token;
  }
}

export const authService = new AuthService();
export default authService;
