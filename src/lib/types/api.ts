// ============================================================================
// API 타입 정의 (데이터베이스 구조 기반)
// ============================================================================

// ─── Member (회원) 관련 타입 ─────────────────────────────────────────────
// 데이터베이스: member 테이블
export interface User {
  id: number;              // BIGINT (PK)
  email: string;           // VARCHAR(120)
  nickname: string;        // VARCHAR(40)
  createdAt: string;       // DATETIME (created_at) - ISO 8601 형식
  updatedAt: string;       // DATETIME (updated_at) - ISO 8601 형식
}

// ─── Auth 관련 요청 타입 ──────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;        // 프론트에서 평문으로 전송 (백엔드에서 pw_hash 처리)
}

export interface RegisterRequest {
  email: string;
  password: string;        // 프론트에서 평문으로 전송 (백엔드에서 pw_hash 처리)
  nickname: string;
}

// ─── Auth 관련 응답 타입 ──────────────────────────────────────────────────

export interface LoginResponse {
  success: boolean;
  token?: string;          // JWT 토큰
  user?: User;
  message?: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  user?: User;
}

// ─── Presentation Session (발표 세션) 관련 타입 ─────────────────────────
// 데이터베이스: presentation_session 테이블

export interface PresentationSession {
  id: number;                    // BIGINT (PK)
  memberId: number;              // BIGINT (FK -> member.id)
  title: string;                 // VARCHAR(200) - 발표 주제
  purpose: string;               // VARCHAR(50) - team/personal/info/proposal
  audienceKnowledge: string;     // VARCHAR(50) - low/medium/high
  timeLimit: number;             // INT - 발표 시간 제한(분)
  feedbackTone: string;          // VARCHAR(50) - kind/default/honest
  criteria: string;              // JSON - 평가 기준 { accuracy: 20, logic: 30, ... }
  isFavorite: boolean;           // BOOLEAN - 즐겨찾기 여부
  createdAt: string;             // DATETIME
  updatedAt: string;             // DATETIME
}

// ─── Attempt (재발표 시도) 관련 타입 ─────────────────────────────────────
// 데이터베이스: attempt 테이블

export interface Attempt {
  id: number;                    // BIGINT (PK)
  sessionId: number;             // BIGINT (FK -> presentation_session.id)
  videoUrl?: string;             // VARCHAR(500) - 영상 URL (S3 등)
  overallScore: number;          // INT - 전체 점수
  selfEvaluation?: string;       // JSON - 자기평가 점수
  aiAnalysis?: string;           // JSON - AI 분석 결과
  createdAt: string;             // DATETIME
}

// ─── Notification (알림) 관련 타입 ────────────────────────────────────────
// 데이터베이스: notification 테이블

export interface Notification {
  id: number;                    // BIGINT (PK)
  memberId: number;              // BIGINT (FK -> member.id)
  sessionId: number;             // BIGINT (FK -> presentation_session.id)
  title: string;                 // VARCHAR(200)
  message: string;               // TEXT
  isRead: boolean;               // BOOLEAN
  createdAt: string;             // DATETIME
}

// ─── 발표 세션 생성 요청 ───────────────────────────────────────────────────

export interface CreateSessionRequest {
  title: string;
  purpose: string;
  audienceKnowledge: string;
  timeLimit: number;
  feedbackTone: string;
  criteria: Record<string, number>;  // { accuracy: 20, logic: 30, ... }
}

export interface CreateSessionResponse {
  success: boolean;
  session?: PresentationSession;
  message?: string;
}

// ─── 재발표 시도 생성 요청 ─────────────────────────────────────────────────

export interface CreateAttemptRequest {
  sessionId: number;
  videoFile?: File;              // 멀티파트 업로드 시 사용
  selfEvaluation: Record<string, number>;
}

export interface CreateAttemptResponse {
  success: boolean;
  attempt?: Attempt;
  message?: string;
}

// ─── AI 분석 요청/응답 ─────────────────────────────────────────────────────

export interface AnalyzeVideoRequest {
  attemptId: number;
}

export interface AnalyzeVideoResponse {
  success: boolean;
  analysis?: {
    gaze: any;           // 시선 분석 결과
    voice: any;          // 음성 분석 결과
    posture: any;        // 자세 분석 결과
    content: any;        // 내용 분석 결과
    overallScore: number;
  };
  message?: string;
}

// ─── 사용자 프로필 관련 ────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  nickname?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  user?: User;
  message?: string;
}

// ─── 공통 API 응답 타입 ───────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  status: number;
  message: string;
  timestamp?: string;
  path?: string;
}

// ─── 리스트 조회 응답 (페이지네이션 지원) ──────────────────────────────────

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}