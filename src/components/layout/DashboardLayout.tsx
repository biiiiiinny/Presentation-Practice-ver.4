import { Outlet, useNavigate } from 'react-router';
import { Sidebar } from '../Sidebar';
import { useApp } from '../../contexts/AppContext';
import { Notification } from '../../contexts/AppContext';
import { Bell } from 'lucide-react';
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
    navigate(`/presentation/results/${id}`);
  };

  const handleAttemptSelect = (sessionId: string, attemptId: string) => {
    handleSelectSession(sessionId);
    navigate(`/presentation/results/${sessionId}/${attemptId}`);
  };

  const handleNewPresentationClick = () => {
    handleNewPresentation();
    navigate('/presentation/new');
  };

  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };

  const handleNotificationClick = (notification: Notification) => {
    // 알림을 읽음 처리
    markNotificationAsRead(notification.id);
    // 알림 드롭다운 닫기
    setShowNotifications(false);
    // 해당 세션으로 이동
    handleSelectSession(notification.sessionId);
    navigate(`/presentation/results/${notification.sessionId}`);
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