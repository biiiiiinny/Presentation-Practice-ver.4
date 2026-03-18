import { Outlet, useNavigate } from 'react-router';
import { Sidebar } from '../Sidebar';
import { useApp } from '../../contexts/AppContext';
import { Notification } from '../../contexts/AppContext';
import { useState } from 'react';

export function DashboardLayout() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const {
    sessions,
    currentSessionId,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setIsLoggedIn,
    handleSelectSession,
    handleDeleteSession,
    handleDeleteAttempt,
    handleToggleFavorite,
    handleNewPresentation,
    isAnalyzing,
    analysisProgress,
    currentPresentationTopic,
    analysisCompleted,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
  } = useApp();

  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  const handleNavigateToSettings = () => {
    alert('설정 페이지는 준비 중입니다.');
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      setIsLoggedIn(false);
      navigate('/', { replace: true });
    }
  };

  const handleSessionSelect = (id: string) => {
    handleSelectSession(id);
    // 최신 attempt로 이동
    const session = sessions.find(s => s.id === id);
    const attemptNumber = session?.attempts.length || 1;
    navigate(`/presentation/results/${id}/${attemptNumber}`);
  };

  const handleAttemptSelect = (sessionId: string, attemptId: string) => {
    handleSelectSession(sessionId);
    // attemptId에서 숫자만 추출 (예: "sessionId-2" → "2")
    const attemptNumber = attemptId.split('-').pop();
    navigate(`/presentation/results/${sessionId}/${attemptNumber}`);
  };

  const handleNewPresentationClick = () => {
    handleNewPresentation();
    navigate('/presentation/new');
  };

  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    handleSelectSession(notification.sessionId);
    // 최신 attempt로 이동
    const session = sessions.find(s => s.id === notification.sessionId);
    const attemptNumber = session?.attempts.length || 1;
    navigate(`/presentation/results/${notification.sessionId}/${attemptNumber}`);
  };

  const handleClearAllNotifications = () => {
    if (confirm('모든 알림을 삭제하시겠습니까?')) {
      clearAllNotifications();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNewPresentation={handleNewPresentationClick}
        onNavigateToDashboard={handleNavigateToDashboard}
        onSelectSession={handleSessionSelect}
        onSelectAttempt={handleAttemptSelect}
        onDeleteSession={handleDeleteSession}
        onDeleteAttempt={handleDeleteAttempt}
        onToggleFavorite={handleToggleFavorite}
        onNavigateToProfile={handleNavigateToProfile}
        onNavigateToSettings={handleNavigateToSettings}
        onLogout={handleLogout}
        showNotifications={showNotifications}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
        isAnalyzing={isAnalyzing}
        analysisProgress={analysisProgress}
        currentPresentationTopic={currentPresentationTopic}
        analysisCompleted={analysisCompleted}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onClearAllNotifications={handleClearAllNotifications}
      />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
