// ============================================================================
// Attempt Service (재발표 시도 관련 API)
// ============================================================================

import apiClient, { isMockMode } from './client';
import {
  Attempt,
  CreateAttemptRequest,
  CreateAttemptResponse,
  ApiResponse,
} from '../types/api';

// ─── Mock 데이터 ─────────────────────────────────────────────────────────

const MOCK_ATTEMPTS: Attempt[] = [
  {
    id: 1,
    sessionId: 1,
    videoUrl: 'https://example.com/video1.mp4',
    overallScore: 86,
    selfEvaluation: JSON.stringify({ accuracy: 20, logic: 30, creativity: 40, cooperation: 10 }),
    aiAnalysis: JSON.stringify({ gaze: {}, voice: {}, posture: {}, content: {} }),
    createdAt: '2024-01-28T00:00:00Z',
  },
];

// ─── Attempt Service ─────────────────────────────────────────────────────

export const AttemptService = {
  /**
   * 재발표 시도 생성 (영상 업로드 포함)
   */
  createAttempt: async (
    data: CreateAttemptRequest
  ): Promise<CreateAttemptResponse> => {
    if (isMockMode()) {
      console.log('🔶 Mock 모드: 시도 생성', data);

      const newAttempt: Attempt = {
        id: Date.now(),
        sessionId: data.sessionId,
        videoUrl: data.videoFile ? URL.createObjectURL(data.videoFile) : undefined,
        overallScore: 86, // Mock 점수
        selfEvaluation: JSON.stringify(data.selfEvaluation),
        aiAnalysis: JSON.stringify({
          gaze: { score: 85, feedback: 'Mock 시선 피드백' },
          voice: { score: 87, feedback: 'Mock 음성 피드백' },
          posture: { score: 84, feedback: 'Mock 자세 피드백' },
          content: { score: 88, feedback: 'Mock 내용 피드백' },
        }),
        createdAt: new Date().toISOString(),
      };

      MOCK_ATTEMPTS.unshift(newAttempt);

      return {
        success: true,
        attempt: newAttempt,
        message: '시도가 생성되었습니다.',
      };
    }

    console.log('🔵 API 모드: 시도 생성 (멀티파트 업로드)');

    // FormData로 변환 (영상 파일 포함)
    const formData = new FormData();
    formData.append('sessionId', data.sessionId.toString());
    formData.append('selfEvaluation', JSON.stringify(data.selfEvaluation));
    if (data.videoFile) {
      formData.append('videoFile', data.videoFile);
    }

    const response = await apiClient.post<CreateAttemptResponse>(
      '/api/attempts',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * 세션의 모든 시도 조회
   */
  getAttemptsBySession: async (sessionId: number): Promise<Attempt[]> => {
    if (isMockMode()) {
      console.log('🔶 Mock 모드: 시도 목록 조회', sessionId);

      return MOCK_ATTEMPTS.filter((a) => a.sessionId === sessionId);
    }

    console.log('🔵 API 모드: 시도 목록 조회', sessionId);
    const response = await apiClient.get<ApiResponse<Attempt[]>>(
      `/api/sessions/${sessionId}/attempts`
    );
    return response.data.data!;
  },

  /**
   * 시도 상세 조회
   */
  getAttempt: async (id: number): Promise<Attempt> => {
    if (isMockMode()) {
      console.log('🔶 Mock 모드: 시도 상세 조회', id);

      const attempt = MOCK_ATTEMPTS.find((a) => a.id === id);
      if (!attempt) {
        throw new Error('시도를 찾을 수 없습니다.');
      }
      return attempt;
    }

    console.log('🔵 API 모드: 시도 상세 조회', id);
    const response = await apiClient.get<ApiResponse<Attempt>>(
      `/api/attempts/${id}`
    );
    return response.data.data!;
  },

  /**
   * 시도 삭제
   */
  deleteAttempt: async (id: number): Promise<ApiResponse> => {
    if (isMockMode()) {
      console.log('🔶 Mock 모드: 시도 삭제', id);

      const index = MOCK_ATTEMPTS.findIndex((a) => a.id === id);
      if (index !== -1) {
        MOCK_ATTEMPTS.splice(index, 1);
      }

      return {
        success: true,
        message: '시도가 삭제되었습니다.',
      };
    }

    console.log('🔵 API 모드: 시도 삭제', id);
    const response = await apiClient.delete<ApiResponse>(`/api/attempts/${id}`);
    return response.data;
  },
};

// 소문자 인스턴스 export (실제 사용용)
export const attemptService = AttemptService;