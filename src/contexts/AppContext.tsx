import { createContext, useContext, useState, ReactNode } from 'react';

export interface Attempt {
  id: string;
  date: string;
  score: number;
  selfEvaluation?: Record<string, number>;
  videoFile?: File | null;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  score: number;
  isFavorite?: boolean;
  formData?: any;
  attempts: Attempt[]; // 재발표 이력들
  selfEvaluation?: Record<string, number>;
}

interface AppContextType {
  // 인증
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  
  // 로그인 정보 (입력값 유지용)
  savedLoginEmail: string;
  savedLoginPassword: string;
  saveLoginInfo: (email: string, password: string) => void;
  
  // 세션 관리
  sessions: Session[];
  setSessions: (sessions: Session[] | ((prev: Session[]) => Session[])) => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  
  // 발표 데이터
  currentFormData: any;
  setCurrentFormData: (data: any) => void;
  selfEvaluation: Record<string, number>;
  setSelfEvaluation: (evaluation: Record<string, number>) => void;
  
  // 사이드바
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (value: boolean) => void;
  
  // 헬퍼 함수들
  handleSelectSession: (id: string) => void;
  handleDeleteSession: (id: string) => void;
  handleToggleFavorite: (id: string) => void;
  handleNewPresentation: () => void;
  addOrUpdateSession: (evaluation: Record<string, number>) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selfEvaluation, setSelfEvaluation] = useState<Record<string, number>>({});
  const [currentFormData, setCurrentFormData] = useState<any>(null);
  const [savedLoginEmail, setSavedLoginEmail] = useState('');
  const [savedLoginPassword, setSavedLoginPassword] = useState('');
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      title: 'AI 챗봇 서비스 개발',
      date: '2024-01-28',
      score: 86,
      isFavorite: true,
      formData: {
        topic: 'AI 챗봇 서비스 개발',
        purpose: 'team',
        criteria: { accuracy: 20, logic: 30, creativity: 40, cooperation: 10 },
        audienceKnowledge: 'medium',
        timeLimit: '10',
        feedbackTone: 'default'
      },
      attempts: [
        {
          id: '1-1',
          date: '2024-01-28',
          score: 86,
          selfEvaluation: { accuracy: 20, logic: 30, creativity: 40, cooperation: 10 }
        }
      ]
    },
    {
      id: '2',
      title: '머신러닝 프로젝트 소개',
      date: '2024-01-27',
      score: 82,
      isFavorite: false,
      formData: {
        topic: '머신러닝 프로젝트 소개',
        purpose: 'personal',
        criteria: { accuracy: 25, logic: 35, creativity: 30, delivery: 10 },
        audienceKnowledge: 'low',
        timeLimit: '15',
        feedbackTone: 'kind'
      },
      attempts: [
        {
          id: '2-1',
          date: '2024-01-27',
          score: 82,
          selfEvaluation: { accuracy: 25, logic: 35, creativity: 30, delivery: 10 }
        }
      ]
    },
    {
      id: '3',
      title: '데이터베이스 설계 발표',
      date: '2024-01-25',
      score: 88,
      isFavorite: false,
      formData: {
        topic: '데이터베이스 설계 발표',
        purpose: 'info',
        criteria: { accuracy: 30, logic: 40, creativity: 20, structure: 10 },
        audienceKnowledge: 'high',
        timeLimit: '12',
        feedbackTone: 'honest'
      },
      attempts: [
        {
          id: '3-1',
          date: '2024-01-25',
          score: 88,
          selfEvaluation: { accuracy: 30, logic: 40, creativity: 20, structure: 10 }
        }
      ]
    },
    {
      id: '4',
      title: '웹 프론트엔드 개발 현황',
      date: '2024-01-20',
      score: 79,
      isFavorite: false,
      formData: {
        topic: '웹 프론트엔드 개발 현황',
        purpose: 'proposal',
        criteria: { accuracy: 15, logic: 25, creativity: 40, delivery: 20 },
        audienceKnowledge: 'medium',
        timeLimit: '8',
        feedbackTone: 'default'
      },
      attempts: [
        {
          id: '4-1',
          date: '2024-01-20',
          score: 79,
          selfEvaluation: { accuracy: 15, logic: 25, creativity: 40, delivery: 20 }
        }
      ]
    }
  ]);

  const handleSelectSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setCurrentFormData(session.formData);
      setSelfEvaluation(session.selfEvaluation || {});
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const handleToggleFavorite = (id: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
    ));
  };

  const handleNewPresentation = () => {
    setCurrentSessionId(null);
    setCurrentFormData(null);
    setSelfEvaluation({});
  };

  const addOrUpdateSession = (evaluation: Record<string, number>) => {
    let targetSessionId: string;
    
    if (currentSessionId) {
      // 재발표: 기존 세션 업데이트
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              date: new Date().toISOString(), 
              score: 86,
              selfEvaluation: evaluation,
              attempts: [
                ...s.attempts,
                {
                  id: `${currentSessionId}-${s.attempts.length + 1}`,
                  date: new Date().toISOString(),
                  score: 86,
                  selfEvaluation: evaluation
                }
              ]
            }
          : s
      ));
      targetSessionId = currentSessionId;
    } else {
      // 새 발표: 새로운 세션 생성
      const newSessionId = Date.now().toString();
      const newSession: Session = {
        id: newSessionId,
        title: currentFormData?.topic || '새로운 발표',
        date: new Date().toISOString(),
        score: 86,
        isFavorite: false,
        formData: currentFormData,
        selfEvaluation: evaluation,
        attempts: [
          {
            id: `${newSessionId}-1`,
            date: new Date().toISOString(),
            score: 86,
            selfEvaluation: evaluation
          }
        ]
      };
      
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSessionId);
      targetSessionId = newSessionId;
    }
    setSelfEvaluation(evaluation);
    return targetSessionId; // 세션 ID 반환
  };

  const value: AppContextType = {
    isLoggedIn,
    setIsLoggedIn,
    savedLoginEmail,
    savedLoginPassword,
    saveLoginInfo: (email: string, password: string) => {
      setSavedLoginEmail(email);
      setSavedLoginPassword(password);
    },
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    currentFormData,
    setCurrentFormData,
    selfEvaluation,
    setSelfEvaluation,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    handleSelectSession,
    handleDeleteSession,
    handleToggleFavorite,
    handleNewPresentation,
    addOrUpdateSession
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}