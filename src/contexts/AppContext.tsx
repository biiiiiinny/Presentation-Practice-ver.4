import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

export interface Attempt {
  id: string;
  date: string;
  score: number;
  selfEvaluation?: Record<string, number>;
  videoFile?: File | null;
  videoUrl?: string;
  analysisResults?: {
    speechRate: number; // 발화 속도 (글자/분)
    eyeContact: number; // 정면 응시 비율 (%)
    duration: string; // 발표 시간 (M:SS)
    confidence: number; // 자신감 지수 (점수)
  };
}

export interface Session {
  id: string;
  title: string;
  date: string;
  score: number;
  isFavorite?: boolean;
  formData?: any;
  attempts: Attempt[];
  selfEvaluation?: Record<string, number>;
  videoUrl?: string;
}

export interface Notification {
  id: string;
  sessionId: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

interface AppContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  savedLoginEmail: string;
  savedLoginPassword: string;
  saveLoginInfo: (email: string, password: string) => void;
  userEmail: string;
  sessions: Session[];
  setSessions: (sessions: Session[] | ((prev: Session[]) => Session[])) => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  currentFormData: any;
  setCurrentFormData: (data: any) => void;
  selfEvaluation: Record<string, number>;
  setSelfEvaluation: (evaluation: Record<string, number>) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
  analysisProgress: number;
  setAnalysisProgress: (value: number) => void;
  currentPresentationTopic: string;
  setCurrentPresentationTopic: (topic: string) => void;
  selfEvaluationCompleted: boolean;
  setSelfEvaluationCompleted: (value: boolean) => void;
  analysisCompleted: boolean;
  setAnalysisCompleted: (value: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (value: boolean) => void;
  handleSelectSession: (id: string) => void;
  handleDeleteSession: (id: string) => void;
  handleDeleteAttempt: (sessionId: string, attemptId: string) => void;
  handleToggleFavorite: (id: string) => void;
  handleNewPresentation: () => void;
  addOrUpdateSession: (evaluation: Record<string, number>) => string;
  createSession: (formData: any) => string;
  // 새 분석 흐름
  startAnalysis: (topic: string) => void;
  completeSelfEvaluation: (evaluation: Record<string, number>) => void;
  completeAnalysis: () => void;
  // 알림 관련
  notifications: Notification[];
  addNotification: (sessionId: string, title: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentPresentationTopic, setCurrentPresentationTopic] = useState('');
  const [selfEvaluationCompleted, setSelfEvaluationCompleted] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ─── 업적 알림 추적 ──────────────────────────────────────────────────────
  const notifiedAchievementsRef = useRef<Set<string>>(new Set());
  const isFirstAchievementCheck = useRef(true);

  // ─── Refs: 페이지 이동 후에도 유지 ───────────────────────────────────────
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 자기평가가 먼저 완료됐을 때 임시 저장 (분석 완료 시 세션 생성에 사용)
  const pendingSelfEvaluationRef = useRef<Record<string, number> | null>(null);
  // 분석이 먼저 완료됐을 때 플래그
  const pendingAnalysisRef = useRef(false);
  // createSessionFromRefs 내에서 최신 상태값 참조
  const currentFormDataRef = useRef<any>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => { currentFormDataRef.current = currentFormData; }, [currentFormData]);
  useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);

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
          selfEvaluation: { eyeContact: 4, voice: 4, posture: 5, content: 4 }
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
          score: 52,
          selfEvaluation: { eyeContact: 2, voice: 2, posture: 2, content: 3 },
          analysisResults: {
            speechRate: 480,   // 빠름 (기준 초과 +80)
            eyeContact: 45,    // 낮음 (기준 70% 미달)
            duration: '6:20',  // 짧음 (목표 15분 대비 미달)
            confidence: 48     // 낮음 (기준 70점 미달)
          }
        },
        {
          id: '2-2',
          date: '2024-01-28',
          score: 91,
          selfEvaluation: { eyeContact: 5, voice: 5, posture: 4, content: 5 },
          analysisResults: {
            speechRate: 340,   // 적정 (기준 범위 내)
            eyeContact: 88,    // 높음 (기준 초과)
            duration: '14:30', // 적정 (목표 15분 근접)
            confidence: 85     // 높음 (기준 초과)
          }
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
          selfEvaluation: { eyeContact: 5, voice: 4, posture: 5, content: 4 }
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
          selfEvaluation: { eyeContact: 3, voice: 3, posture: 4, content: 4 }
        }
      ]
    }
  ]);

  // ─── 업적 달성 감지 → 알림 추가 ─────────────────────────────────────────
  useEffect(() => {
    const totalPresentations = sessions.length;
    const totalRetries = sessions.reduce((sum, s) => sum + (s.attempts.length - 1), 0);

    const achievements = [
      { title: '첫 발표 완료',     achieved: totalPresentations >= 1 },
      { title: '첫 재발표 완료',   achieved: totalRetries >= 1 },
      { title: '5번째 발표 달성', achieved: totalPresentations >= 5 },
    ];

    if (isFirstAchievementCheck.current) {
      // 앱 최초 로드 시: 이미 달성된 업적은 알림 없이 시드만 등록
      isFirstAchievementCheck.current = false;
      achievements.forEach(({ title, achieved }) => {
        if (achieved) notifiedAchievementsRef.current.add(title);
      });
      return;
    }

    // 이후 sessions 변경 시: 새로 달성된 업적에만 알림 추가
    achievements.forEach(({ title, achieved }) => {
      if (achieved && !notifiedAchievementsRef.current.has(title)) {
        notifiedAchievementsRef.current.add(title);
        setNotifications(prev => [{
          id: Date.now().toString(),
          sessionId: 'achievement',
          title: '🏆 업적 달성',
          message: `"${title}" 업적을 달성했습니다! 마이페이지에서 확인하세요.`,
          date: new Date().toISOString(),
          isRead: false,
        }, ...prev]);
      }
    });
  }, [sessions]);

  // ─── 세션 생성 (ref 기반으로 최신 formData / sessionId 사용) ─────────────
  const createSessionFromRefs = (evaluation: Record<string, number>): number => {
    const formData = currentFormDataRef.current;
    const sessionId = currentSessionIdRef.current;
    const videoUrl = formData?.videoFile
      ? URL.createObjectURL(formData.videoFile)
      : undefined;

    let attemptNumber = 1;

    if (sessionId) {
      // 기존 세션에 attempt 추가 (첫 발표 또는 재발표)
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          attemptNumber = s.attempts.length + 1;
          
          // sessionId를 기반으로 일관성 있는 분석 결과 생성
          const hash = sessionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const seed = hash + attemptNumber;
          
          // 1회차 기본값
          const baseSpeechRate = 350 + (seed % 30);
          const baseEyeContact = 75 + (seed % 10);
          const baseDurationMin = 8 + (seed % 2);
          const baseDurationSec = (seed % 4) * 15;
          const baseConfidence = 72 + (seed % 15);
          
          // 2회차 이상이면 개선된 값
          let speechRate, eyeContact, durationMin, durationSec, confidence;
          
          if (attemptNumber === 1) {
            speechRate = baseSpeechRate;
            eyeContact = baseEyeContact;
            durationMin = baseDurationMin;
            durationSec = baseDurationSec;
            confidence = baseConfidence;
          } else {
            speechRate = baseSpeechRate - 30 - (seed % 20); // 발화 속도 감소 (개선)
            eyeContact = baseEyeContact + 5 + (seed % 10); // 정면 응시 증가
            const totalSec = (baseDurationMin * 60 + baseDurationSec) + 30 + (seed % 30);
            durationMin = Math.floor(totalSec / 60);
            durationSec = totalSec % 60;
            confidence = baseConfidence + 10 + (seed % 8); // 자신감 증가
          }
          
          return {
            ...s,
            date: new Date().toISOString(),
            score: 86,
            selfEvaluation: evaluation,
            videoUrl: videoUrl || s.videoUrl,
            attempts: [
              ...s.attempts,
              {
                id: `${sessionId}-${attemptNumber}`,
                date: new Date().toISOString(),
                score: 86,
                selfEvaluation: evaluation,
                videoUrl: videoUrl,
                analysisResults: {
                  speechRate: speechRate,
                  eyeContact: eyeContact,
                  duration: `${durationMin}:${durationSec.toString().padStart(2, '0')}`,
                  confidence: confidence
                }
              }
            ]
          };
        }
        return s;
      }));
      // 알림 생성
      addNotification(sessionId, formData?.topic || '발표');
    }
    setSelfEvaluation(evaluation);
    return attemptNumber;
  };

  // ─── 분석 완료 후 상태 정리 (2초 뒤 progressbar 숨김) ─────────────────────
  const finishAnalysisUI = () => {
    setAnalysisCompleted(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setCurrentPresentationTopic('');
      setSelfEvaluationCompleted(false);
      setAnalysisCompleted(false);
    }, 2000);
  };

  // ─── startAnalysis: AppContext에서 타이머 관리 (페이지 이동 무관) ──────────
  const startAnalysis = (topic: string) => {
    // 기존 타이머 정리
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    // 상태 초기화
    pendingSelfEvaluationRef.current = null;
    pendingAnalysisRef.current = false;
    setCurrentPresentationTopic(topic);
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setSelfEvaluationCompleted(false);
    setAnalysisCompleted(false);

    // 로컬 카운터로 진행률 추적 (setState updater 안에 side-effect 넣지 않음)
    let progress = 0;
    analysisIntervalRef.current = setInterval(() => {
      progress += 1;
      setAnalysisProgress(progress);

      if (progress >= 100) {
        clearInterval(analysisIntervalRef.current!);
        analysisIntervalRef.current = null;

        if (pendingSelfEvaluationRef.current) {
          // 케이스 1: 자기평가가 이미 완료 → 즉시 세션 생성 후 UI 정리
          createSessionFromRefs(pendingSelfEvaluationRef.current);
          pendingSelfEvaluationRef.current = null;
          finishAnalysisUI();
        } else {
          // 케이스 2: 자기평가 아직 진행 중 → 대기 플래그 세우기
          pendingAnalysisRef.current = true;
        }
      }
    }, 80); // 약 8초 (100 steps × 80ms)
  };

  // ─── completeSelfEvaluation: 자기평가 완료 처리 ──────────────────────────
  const completeSelfEvaluation = (evaluation: Record<string, number>) => {
    setSelfEvaluation(evaluation);
    setSelfEvaluationCompleted(true);

    if (pendingAnalysisRef.current) {
      // 케이스 2 완성: 분석이 이미 완료돼 있었음 → 즉시 세션 생성 + UI 정리
      pendingAnalysisRef.current = false;
      createSessionFromRefs(evaluation);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setCurrentPresentationTopic('');
      setSelfEvaluationCompleted(false);
      setAnalysisCompleted(false);
    } else {
      // 케이스 1 대기 중: 분석 아직 진행 중 → 임시 저장
      // 분석 완료 시 startAnalysis 인터벌에서 세션 생성
      pendingSelfEvaluationRef.current = evaluation;
    }
    // 어느 케이스든 navigate('/dashboard')는 SelfEvaluationPage에서 호출
  };

  const completeAnalysis = () => {
    setAnalysisCompleted(true);
  };

  // ─── 기존 addOrUpdateSession (레거시 / 하위호환) ─────────────────────────
  const addOrUpdateSession = (evaluation: Record<string, number>) => {
    let targetSessionId: string;
    const videoUrl = currentFormData?.videoFile
      ? URL.createObjectURL(currentFormData.videoFile)
      : undefined;

    if (currentSessionId) {
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId
          ? {
              ...s,
              date: new Date().toISOString(),
              score: 86,
              selfEvaluation: evaluation,
              videoUrl: videoUrl || s.videoUrl,
              attempts: [
                ...s.attempts,
                {
                  id: `${currentSessionId}-${s.attempts.length + 1}`,
                  date: new Date().toISOString(),
                  score: 86,
                  selfEvaluation: evaluation,
                  videoUrl: videoUrl
                }
              ]
            }
          : s
      ));
      targetSessionId = currentSessionId;
    } else {
      const newSessionId = Date.now().toString();
      const newSession: Session = {
        id: newSessionId,
        title: currentFormData?.topic || '새로운 발표',
        date: new Date().toISOString(),
        score: 86,
        isFavorite: false,
        formData: currentFormData,
        selfEvaluation: evaluation,
        videoUrl,
        attempts: [
          {
            id: `${newSessionId}-1`,
            date: new Date().toISOString(),
            score: 86,
            selfEvaluation: evaluation,
            videoUrl: videoUrl
          }
        ]
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSessionId);
      targetSessionId = newSessionId;
    }
    setSelfEvaluation(evaluation);
    return targetSessionId;
  };

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
    if (currentSessionId === id) setCurrentSessionId(null);
  };

  const handleDeleteAttempt = (sessionId: string, attemptId: string) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId
        ? {
            ...s,
            attempts: s.attempts.filter(a => a.id !== attemptId)
          }
        : s
    ));
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

  // ─── 알림 관련 함수 ───────────────────────────────────────────────────
  const addNotification = (sessionId: string, title: string) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      sessionId,
      title,
      message: '발표 분석이 완료되었습니다.',
      date: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // ─── createSession: 발표 설정 완료 시 세션 먼저 생성 (자기평가 전) ─────────
  const createSession = (formData: any): string => {
    // 재발표인 경우: 기존 세션 ID 유지, formData만 업데이트
    if (currentSessionId) {
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId
          ? { ...s, formData }
          : s
      ));
      return currentSessionId;
    }
    
    // 새 발표인 경우: 새 세션 생성
    const newId = Date.now().toString();
    const newSession: Session = {
      id: newId,
      title: formData?.topic || '새로운 발표',
      date: new Date().toISOString(),
      score: 0, // 아직 분석 전
      isFavorite: false,
      formData,
      selfEvaluation: {},
      attempts: [] // 빈 배열로 시작! 분석 완료 시 첫 attempt 추가됨
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    return newId;
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
    userEmail: savedLoginEmail,
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
    handleDeleteAttempt,
    handleToggleFavorite,
    handleNewPresentation,
    addOrUpdateSession,
    isAnalyzing,
    setIsAnalyzing,
    analysisProgress,
    setAnalysisProgress,
    currentPresentationTopic,
    setCurrentPresentationTopic,
    selfEvaluationCompleted,
    setSelfEvaluationCompleted,
    analysisCompleted,
    setAnalysisCompleted,
    startAnalysis,
    completeSelfEvaluation,
    completeAnalysis,
    notifications,
    addNotification,
    markNotificationAsRead,
    clearAllNotifications,
    createSession,
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