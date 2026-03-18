// ============================================================================
// Session Service (발표 세션 관련 API)
// ============================================================================

import apiClient, { isMockMode } from './client';
import {
  PresentationSession,
  CreateSessionRequest,
  CreateSessionResponse,
  ApiResponse,
  PaginatedResponse,
} from '../types/api';

// ─── Mock 데이터 ─────────────────────────────────────────────────────────

const MOCK_SESSIONS: PresentationSession[] = [
  {
    id: 1,
    memberId: 1,
    title: 'AI 챗봇 서비스 개발',
    purpose: 'team',
    audienceKnowledge: 'medium',
    timeLimit: 10,
    feedbackTone: 'default',
    criteria: JSON.stringify({ accuracy: 20, logic: 30, creativity: 40, cooperation: 10 }),
    isFavorite: true,
    createdAt: '2024-01-28T00:00:00Z',
    updatedAt: '2024-01-28T00:00:00Z',
  },
  {
    id: 2,
    memberId: 1,
    title: '머신러닝 프로젝트 소개',
    purpose: 'personal',
    audienceKnowledge: 'low',
    timeLimit: 15,
    feedbackTone: 'kind',
    criteria: JSON.stringify({ accuracy: 25, logic: 35, creativity: 30, delivery: 10 }),
    isFavorite: false,
    createdAt: '2024-01-27T00:00:00Z',
    updatedAt: '2024-01-27T00:00:00Z',
  },
];

// ─── Session Service ─────────────────────────────────────────────────────

export const SessionService = {
  /**
   * 발표 세션 생성
   */
  createSession: async (
    data: CreateSessionRequest
  ): Promise<CreateSessionResponse> => {
    if (isMockMode()) {
      console.log('Mock 모드: 세션 생성', data);
      
      const newSession: PresentationSession = {
        id: Date.now(),
        memberId: 1,
        title: data.title,
        purpose: data.purpose,
        audienceKnowledge: data.audienceKnowledge,
        timeLimit: data.timeLimit,
        feedbackTone: data.feedbackTone,
        criteria: JSON.stringify(data.criteria),
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      MOCK_SESSIONS.unshift(newSession);

      return {
        success: true,
        session: newSession,
        message: '세션이 생성되었습니다.',
      };
    }

    console.log('API 모드: 세션 생성', data);
    const response = await apiClient.post<CreateSessionResponse>(
      '/api/sessions',
      data
    );
    return response.data;
  },

  /**
   * 세션 목록 조회 (페이지네이션)
   */
  getSessions: async (
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<PresentationSession>> => {
    if (isMockMode()) {
      console.log('Mock 모드: 세션 목록 조회');

      return {
        success: true,
        data: MOCK_SESSIONS,
        pagination: {
          page,
          size,
          totalElements: MOCK_SESSIONS.length,
          totalPages: 1,
        },
      };
    }

    console.log('API 모드: 세션 목록 조회');
    const response = await apiClient.get<PaginatedResponse<PresentationSession>>(
      `/api/sessions?page=${page}&size=${size}`
    );
    return response.data;
  },

  /**
   * 세션 상세 조회
   */
  getSession: async (id: number): Promise<PresentationSession> => {
    if (isMockMode()) {
      console.log('Mock 모드: 세션 상세 조회', id);

      const session = MOCK_SESSIONS.find((s) => s.id === id);
      if (!session) {
        throw new Error('세션을 찾을 수 없습니다.');
      }
      return session;
    }

    console.log('API 모드: 세션 상세 조회', id);
    const response = await apiClient.get<ApiResponse<PresentationSession>>(
      `/api/sessions/${id}`
    );
    return response.data.data!;
  },

  /**
   * 세션 수정
   */
  updateSession: async (
    id: number,
    data: Partial<CreateSessionRequest>
  ): Promise<ApiResponse> => {
    if (isMockMode()) {
      console.log('Mock 모드: 세션 수정', id, data);

      const index = MOCK_SESSIONS.findIndex((s) => s.id === id);
      if (index === -1) {
        throw new Error('세션을 찾을 수 없습니다.');
      }

      MOCK_SESSIONS[index] = {
        ...MOCK_SESSIONS[index],
        ...data,
        criteria: data.criteria ? JSON.stringify(data.criteria) : MOCK_SESSIONS[index].criteria,
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        message: '세션이 수정되었습니다.',
      };
    }

    console.log('API 모드: 세션 수정', id, data);
    const response = await apiClient.put<ApiResponse>(`/api/sessions/${id}`, data);
    return response.data;
  },

  /**
   * 세션 삭제
   */
  deleteSession: async (id: number): Promise<ApiResponse> => {
    if (isMockMode()) {
      console.log('Mock 모드: 세션 삭제', id);

      const index = MOCK_SESSIONS.findIndex((s) => s.id === id);
      if (index !== -1) {
        MOCK_SESSIONS.splice(index, 1);
      }

      return {
        success: true,
        message: '세션이 삭제되었습니다.',
      };
    }

    console.log('API 모드: 세션 삭제', id);
    const response = await apiClient.delete<ApiResponse>(`/api/sessions/${id}`);
    return response.data;
  },

  /**
   * 즐겨찾기 토글
   */
  toggleFavorite: async (id: number): Promise<ApiResponse> => {
    if (isMockMode()) {
      console.log('Mock 모드: 즐겨찾기 토글', id);

      const session = MOCK_SESSIONS.find((s) => s.id === id);
      if (session) {
        session.isFavorite = !session.isFavorite;
      }

      return {
        success: true,
        message: '즐겨찾기가 업데이트되었습니다.',
      };
    }

    console.log('API 모드: 즐겨찾기 토글', id);
    const response = await apiClient.post<ApiResponse>(`/api/sessions/${id}/favorite`);
    return response.data;
  },
};

// 소문자 인스턴스 export (실제 사용용)
export const sessionService = SessionService;