import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

export interface Attempt {
  id: string;
  date: string;
  score: number;
  videoFile?: File | null;
  videoUrl?: string;
  analysisResults?: {
    speechRate: number;
    eyeContact: number;
    duration: string;
    confidence: number;
    fillerWordCount?: number;
    silenceRatio?: number;
    pitchScore?: number;
    habitualBehaviorCount?: number;
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
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
  analysisProgress: number;
  setAnalysisProgress: (value: number) => void;
  currentPresentationTopic: string;
  setCurrentPresentationTopic: (topic: string) => void;
  analysisCompleted: boolean;
  setAnalysisCompleted: (value: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (value: boolean) => void;
  handleSelectSession: (id: string) => void;
  handleDeleteSession: (id: string) => void;
  handleDeleteAttempt: (sessionId: string, attemptId: string) => void;
  handleToggleFavorite: (id: string) => void;
  handleNewPresentation: () => void;
  createSession: (formData: any) => string;
  startAnalysis: (topic: string) => void;
  completeAnalysis: () => void;
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
  const [currentFormData, setCurrentFormData] = useState<any>(null);
  const [savedLoginEmail, setSavedLoginEmail] = useState('');
  const [savedLoginPassword, setSavedLoginPassword] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentPresentationTopic, setCurrentPresentationTopic] = useState('');
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notifiedAchievementsRef = useRef<Set<string>>(new Set());
  const isFirstAchievementCheck = useRef(true);

  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
          analysisResults: {
            speechRate: 350, eyeContact: 82, duration: '9:15', confidence: 80,
            fillerWordCount: 5, silenceRatio: 10, pitchScore: 72, habitualBehaviorCount: 3
          }
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
          analysisResults: {
            speechRate: 480, eyeContact: 45, duration: '6:20', confidence: 48,
            fillerWordCount: 18, silenceRatio: 3, pitchScore: 32, habitualBehaviorCount: 11
          }
        },
        {
          id: '2-2',
          date: '2024-01-28',
          score: 91,
          analysisResults: {
            speechRate: 340, eyeContact: 88, duration: '14:30', confidence: 85,
            fillerWordCount: 3, silenceRatio: 12, pitchScore: 78, habitualBehaviorCount: 2
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
          analysisResults: {
            speechRate: 320, eyeContact: 85, duration: '11:30', confidence: 82,
            fillerWordCount: 4, silenceRatio: 12, pitchScore: 76, habitualBehaviorCount: 2
          }
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
          analysisResults: {
            speechRate: 420, eyeContact: 70, duration: '7:45', confidence: 68,
            fillerWordCount: 9, silenceRatio: 6, pitchScore: 58, habitualBehaviorCount: 5
          }
        }
      ]
    }
  ]);

  // ─── 업적 달성 감지 → 알림 추가 ─────────────────────────────────────────
  useEffect(() => {
    const totalPresentations = sessions.length;
    const totalRetries = sessions.reduce((sum, s) => sum + (s.attempts.length - 1), 0);

    const achievements = [
      { title: '첫 발표 완료',    achieved: totalPresentations >= 1 },
      { title: '첫 재발표 완료',  achieved: totalRetries >= 1 },
      { title: '5번째 발표 달성', achieved: totalPresentations >= 5 },
    ];

    if (isFirstAchievementCheck.current) {
      isFirstAchievementCheck.current = false;
      achievements.forEach(({ title, achieved }) => {
        if (achieved) notifiedAchievementsRef.current.add(title);
      });
      return;
    }

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
  const createSessionFromRefs = (): number => {
    const formData = currentFormDataRef.current;
    const sessionId = currentSessionIdRef.current;
    const videoUrl = formData?.videoFile
      ? URL.createObjectURL(formData.videoFile)
      : undefined;

    let attemptNumber = 1;

    if (sessionId) {
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          attemptNumber = s.attempts.length + 1;

          const hash = sessionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const seed = hash + attemptNumber;

          const baseSpeechRate = 350 + (seed % 30);
          const baseEyeContact = 75 + (seed % 10);
          const baseDurationMin = 8 + (seed % 2);
          const baseDurationSec = (seed % 4) * 15;
          const baseConfidence = 72 + (seed % 15);
          const baseFillerCount = 6 + (seed % 5);
          const baseSilenceRatio = 8 + (seed % 6);
          const basePitchScore = 55 + (seed % 20);
          const baseHabitualCount = 5 + (seed % 4);

          let speechRate, eyeContact, durationMin, durationSec, confidence;
          let fillerWordCount, silenceRatio, pitchScore, habitualBehaviorCount;

          if (attemptNumber === 1) {
            speechRate = baseSpeechRate;
            eyeContact = baseEyeContact;
            durationMin = baseDurationMin;
            durationSec = baseDurationSec;
            confidence = baseConfidence;
            fillerWordCount = baseFillerCount;
            silenceRatio = baseSilenceRatio;
            pitchScore = basePitchScore;
            habitualBehaviorCount = baseHabitualCount;
          } else {
            speechRate = baseSpeechRate - 30 - (seed % 20);
            eyeContact = Math.min(95, baseEyeContact + 5 + (seed % 10));
            const totalSec = (baseDurationMin * 60 + baseDurationSec) + 30 + (seed % 30);
            durationMin = Math.floor(totalSec / 60);
            durationSec = totalSec % 60;
            confidence = Math.min(95, baseConfidence + 10 + (seed % 8));
            fillerWordCount = Math.max(1, baseFillerCount - 3);
            silenceRatio = Math.min(15, baseSilenceRatio + 2);
            pitchScore = Math.min(95, basePitchScore + 15);
            habitualBehaviorCount = Math.max(0, baseHabitualCount - 3);
          }

          return {
            ...s,
            date: new Date().toISOString(),
            score: 86,
            videoUrl: videoUrl || s.videoUrl,
            attempts: [
              ...s.attempts,
              {
                id: `${sessionId}-${attemptNumber}`,
                date: new Date().toISOString(),
                score: 86,
                videoUrl: videoUrl,
                analysisResults: {
                  speechRate, eyeContact,
                  duration: `${durationMin}:${durationSec.toString().padStart(2, '0')}`,
                  confidence, fillerWordCount, silenceRatio, pitchScore, habitualBehaviorCount
                }
              }
            ]
          };
        }
        return s;
      }));
      addNotification(sessionId, formData?.topic || '발표');
    }
    return attemptNumber;
  };

  // ─── 분석 완료 후 UI 정리 ─────────────────────────────────────────────────
  const finishAnalysisUI = () => {
    setAnalysisCompleted(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setCurrentPresentationTopic('');
      setAnalysisCompleted(false);
    }, 2000);
  };

  // ─── startAnalysis ────────────────────────────────────────────────────────
  const startAnalysis = (topic: string) => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    setCurrentPresentationTopic(topic);
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisCompleted(false);

    let progress = 0;
    analysisIntervalRef.current = setInterval(() => {
      progress += 1;
      setAnalysisProgress(progress);

      if (progress >= 100) {
        clearInterval(analysisIntervalRef.current!);
        analysisIntervalRef.current = null;
        createSessionFromRefs();
        finishAnalysisUI();
      }
    }, 80);
  };

  const completeAnalysis = () => {
    setAnalysisCompleted(true);
  };

  const handleSelectSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setCurrentFormData(session.formData);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
  };

  const handleDeleteAttempt = (sessionId: string, attemptId: string) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, attempts: s.attempts.filter(a => a.id !== attemptId) }
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
  };

  const addNotification = (sessionId: string, title: string) => {
    setNotifications(prev => [{
      id: Date.now().toString(),
      sessionId,
      title,
      message: '발표 분석이 완료되었습니다.',
      date: new Date().toISOString(),
      isRead: false
    }, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // ─── createSession: 발표 설정 완료 시 세션 먼저 생성 ─────────────────────
  const createSession = (formData: any): string => {
    if (currentSessionId) {
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId ? { ...s, formData } : s
      ));
      return currentSessionId;
    }

    const newId = Date.now().toString();
    const newSession: Session = {
      id: newId,
      title: formData?.topic || '새로운 발표',
      date: new Date().toISOString(),
      score: 0,
      isFavorite: false,
      formData,
      attempts: []
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
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    handleSelectSession,
    handleDeleteSession,
    handleDeleteAttempt,
    handleToggleFavorite,
    handleNewPresentation,
    isAnalyzing,
    setIsAnalyzing,
    analysisProgress,
    setAnalysisProgress,
    currentPresentationTopic,
    setCurrentPresentationTopic,
    analysisCompleted,
    setAnalysisCompleted,
    startAnalysis,
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
