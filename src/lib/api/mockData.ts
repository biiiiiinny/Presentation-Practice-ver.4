// ============================================================================
// Mock Data - 로컬 테스트용 가짜 데이터
// 백엔드 서버가 없을 때 사용
// ============================================================================

import type { User, LoginResponse, RegisterResponse } from '../types/api';

// ─── Mock 사용자 데이터베이스 (로컬 스토리지 사용) ─────────────────────────

const MOCK_USERS_KEY = 'mockUsers';
const MOCK_TOKEN = 'mock_jwt_token_12345';

// Mock 사용자 초기 데이터
const getInitialMockUsers = (): User[] => [
  {
    id: 1,
    email: 'demo@example.com',
    nickname: '데모 사용자',
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
  },
  {
    id: 2,
    email: 'test@example.com',
    nickname: '테스터',
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00',
  },
];

// ─── Mock 사용자 관리 함수 ────────────────────────────────────────────────

export const mockUserDB = {
  // 모든 사용자 조회
  getAll: (): User[] => {
    const users = localStorage.getItem(MOCK_USERS_KEY);
    if (!users) {
      // 초기 사용자가 없으면 초기화
      const initialUsers = getInitialMockUsers();
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(initialUsers));
      
      // 초기 비밀번호도 설정
      const initialPasswords = {
        'demo@example.com': 'demo1234',
        'test@example.com': 'test1234',
      };
      localStorage.setItem('mockPasswords', JSON.stringify(initialPasswords));
      
      return initialUsers;
    }
    return JSON.parse(users);
  },

  // 이메일로 사용자 찾기
  findByEmail: (email: string): User | undefined => {
    const users = mockUserDB.getAll();
    return users.find(u => u.email === email);
  },

  // ID로 사용자 찾기
  findById: (id: number): User | undefined => {
    const users = mockUserDB.getAll();
    return users.find(u => u.id === id);
  },

  // 새 사용자 추가
  create: (email: string, password: string, nickname: string): User => {
    const users = mockUserDB.getAll();
    
    // 다음 ID 계산
    const nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    
    const newUser: User = {
      id: nextId,
      email,
      nickname,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    
    // 비밀번호는 별도 저장 (실제로는 백엔드에서 pw_hash로 저장됨)
    const passwords = JSON.parse(localStorage.getItem('mockPasswords') || '{}');
    passwords[email] = password;
    localStorage.setItem('mockPasswords', JSON.stringify(passwords));
    
    return newUser;
  },

  // 비밀번호 확인
  verifyPassword: (email: string, password: string): boolean => {
    const passwords = JSON.parse(localStorage.getItem('mockPasswords') || '{}');
    return passwords[email] === password;
  },
};

// ─── Mock API 함수 ────────────────────────────────────────────────────────

export const mockAuth = {
  /**
   * Mock 로그인
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    // 네트워크 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = mockUserDB.findByEmail(email);
    
    // 사용자가 없거나 비밀번호가 틀린 경우
    if (!user || !mockUserDB.verifyPassword(email, password)) {
      return {
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      };
    }
    
    // 로그인 성공
    return {
      success: true,
      token: MOCK_TOKEN,
      user,
      message: '로그인 성공',
    };
  },

  /**
   * Mock 회원가입
   */
  register: async (
    email: string,
    password: string,
    nickname: string
  ): Promise<RegisterResponse> => {
    // 네트워크 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 이미 존재하는 이메일인지 확인
    const existingUser = mockUserDB.findByEmail(email);
    if (existingUser) {
      return {
        success: false,
        message: '이미 사용 중인 이메일입니다.',
      };
    }
    
    // 새 사용자 생성
    const newUser = mockUserDB.create(email, password, nickname);
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: newUser,
    };
  },
};

// ─── Mock 데이터 초기화 (개발용) ──────────────────────────────────────────

export const resetMockData = () => {
  localStorage.removeItem(MOCK_USERS_KEY);
  localStorage.removeItem('mockPasswords');
  console.log('Mock 데이터가 초기화되었습니다.');
};