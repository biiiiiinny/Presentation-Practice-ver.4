import { Outlet, useNavigate } from 'react-router';
import { Sidebar } from '../Sidebar';
import { useApp } from '../../contexts/AppContext';
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
    handleToggleFavorite,
    handleNewPresentation,
    isAnalyzing,
    analysisProgress,
    currentPresentationTopic,
    analysisCompleted
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

  const handleNewPresentationClick = () => {
    handleNewPresentation();
    navigate('/presentation/new');
  };

  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
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
        onDeleteSession={handleDeleteSession}
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
      />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}