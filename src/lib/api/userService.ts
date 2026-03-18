// ============================================================================
// User Service (사용자 프로필 관련 API)
// ============================================================================

import apiClient, { isMockMode } from './client';
import {
  User,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from '../types/api';

// ─── Mock 데이터 ─────────────────────────────────────────────────────────

let MOCK_USER: User = {
  id: 1,
  email: 'test@example.com',
  nickname: '테스터',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// ─── User Service ────────────────────────────────────────────────────────

export const UserService = {
  /**
   * 현재 로그인한 사용자 정보 조회
   */
  getProfile: async (): Promise<User> => {
    if (isMockMode()) {
      console.log('Mock 모드: 프로필 조회');
      return MOCK_USER;
    }

    console.log('API 모드: 프로필 조회');
    const response = await apiClient.get<User>('/api/user/profile');
    return response.data;
  },

  /**
   * 프로필 수정 (닉네임, 비밀번호 변경)
   */
  updateProfile: async (
    data: UpdateProfileRequest
  ): Promise<UpdateProfileResponse> => {
    if (isMockMode()) {
      console.log('Mock 모드: 프로필 수정', data);

      if (data.nickname) {
        MOCK_USER.nickname = data.nickname;
      }
      MOCK_USER.updatedAt = new Date().toISOString();

      return {
        success: true,
        user: MOCK_USER,
        message: '프로필이 수정되었습니다.',
      };
    }

    console.log('API 모드: 프로필 수정', data);
    const response = await apiClient.put<UpdateProfileResponse>(
      '/api/user/profile',
      data
    );
    return response.data;
  },

  /**
   * 회원 탈퇴
   */
  deleteAccount: async (password: string): Promise<{ success: boolean; message: string }> => {
    if (isMockMode()) {
      console.log('Mock 모드: 회원 탈퇴');

      return {
        success: true,
        message: '회원 탈퇴가 완료되었습니다.',
      };
    }

    console.log('API 모드: 회원 탈퇴');
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      '/api/user/account',
      { data: { password } }
    );
    return response.data;
  },
};

// 소문자 인스턴스 export (실제 사용용)
export const userService = UserService;