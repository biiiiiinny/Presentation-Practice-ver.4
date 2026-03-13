// ============================================================================
// Notification Service (알림 관련 API)
// ============================================================================

import apiClient, { isMockMode } from './client';
import { Notification, ApiResponse } from '../types/api';

// ─── Mock 데이터 ─────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [];

// ─── Notification Service ────────────────────────────────────────────────

export const NotificationService = {
  /**
   * 알림 목록 조회
   */
  getNotifications: async (): Promise<Notification[]> => {
    if (isMockMode()) {
      console.log('🔶 Mock 모드: 알림 목록 조회');
      return MOCK_NOTIFICATIONS;
    }

    console.log('🔵 API 모드: 알림 목록 조회');
    const response = await apiClient.get<ApiResponse<Notification[]>>(
      '/api/notifications'
    );
    return response.data.data!;
  },

  /**
   * 알림 읽음 처리
   */
  markAsRead: async (id: number): Promise<ApiResponse> => {
    if (isMockMode()) {
      console.log('🔶 Mock 모드: 알림 읽음 처리', id);

      const notification = MOCK_NOTIFICATIONS.find((n) => n.id === id);
      if (notification) {
        notification.isRead = true;
      }

      return {
        success: true,
        message: '알림이 읽음 처리되었습니다.',
      };
    }

    console.log('🔵 API 모드: 알림 읽음 처리', id);
    const response = await apiClient.put<ApiResponse>(
      `/api/notifications/${id}/read`
    );
    return response.data;
  },

  /**
   * 모든 알림 삭제
   */
  clearAll: async (): Promise<ApiResponse> => {
    if (isMockMode()) {
      console.log('🔶 Mock 모드: 모든 알림 삭제');

      MOCK_NOTIFICATIONS.length = 0;

      return {
        success: true,
        message: '모든 알림이 삭제되었습니다.',
      };
    }

    console.log('🔵 API 모드: 모든 알림 삭제');
    const response = await apiClient.delete<ApiResponse>('/api/notifications');
    return response.data;
  },

  /**
   * 알림 생성 (백엔드에서 자동 생성하지만, 테스트용으로 제공)
   */
  createNotification: async (
    sessionId: number,
    title: string,
    message: string
  ): Promise<ApiResponse> => {
    if (isMockMode()) {
      console.log('🔶 Mock 모드: 알림 생성', sessionId, title);

      const newNotification: Notification = {
        id: Date.now(),
        memberId: 1,
        sessionId,
        title,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      MOCK_NOTIFICATIONS.unshift(newNotification);

      return {
        success: true,
        message: '알림이 생성되었습니다.',
      };
    }

    console.log('🔵 API 모드: 알림 생성');
    const response = await apiClient.post<ApiResponse>('/api/notifications', {
      sessionId,
      title,
      message,
    });
    return response.data;
  },
};

// 소문자 인스턴스 export (실제 사용용)
export const notificationService = NotificationService;