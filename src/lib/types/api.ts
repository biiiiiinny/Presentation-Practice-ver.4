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
