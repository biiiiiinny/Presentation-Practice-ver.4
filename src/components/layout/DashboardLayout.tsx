import { Outlet, useNavigate } from 'react-router-dom';
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
    handleRetry
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

  const handleRetryClick = (id: string) => {
    handleRetry(id);
    navigate('/presentation/new');
  };
  
  const handleNewPresentationClick = () => {
    handleNewPresentation();
    navigate('/presentation/new');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNewPresentation={handleNewPresentationClick}
        onSelectSession={handleSessionSelect}
        onDeleteSession={handleDeleteSession}
        onToggleFavorite={handleToggleFavorite}
        onNavigateToProfile={handleNavigateToProfile}
        onNavigateToSettings={handleNavigateToSettings}
        onLogout={handleLogout}
        onRetry={handleRetryClick}
      />
      <div className="flex-1 overflow-auto flex flex-col">
        {/* 상단 네비게이션 바 */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-end">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="공지사항"
            >
              <Bell className="w-7 h-7 text-slate-700" />
              {/* 알림 뱃지 */}
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            </button>

            {/* 공지사항 드롭다운 */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                <div className="p-5 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900">공지사항</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-5 hover:bg-slate-50 cursor-pointer border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-slate-900 mb-1">새로운 피드백 기능 추가</p>
                        <p className="text-sm text-slate-600 mb-2">
                          발표 내용 분석 정확도가 향상되었습니다.
                        </p>
                        <p className="text-xs text-slate-400">2024년 2월 10일</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 hover:bg-slate-50 cursor-pointer border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 bg-slate-300 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-slate-900 mb-1">시스템 점검 안내</p>
                        <p className="text-sm text-slate-600 mb-2">
                          2월 15일 새벽 2시~4시 시스템 점검이 진행됩니다.
                        </p>
                        <p className="text-xs text-slate-400">2024년 2월 8일</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 bg-slate-300 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-slate-900 mb-1">서비스 이용 가이드</p>
                        <p className="text-sm text-slate-600 mb-2">
                          효과적인 발표 연습을 위한 가이드를 확인하세요.
                        </p>
                        <p className="text-xs text-slate-400">2024년 2월 5일</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-200 text-center">
                  <button className="text-base text-blue-600 hover:text-blue-700 font-semibold">
                    모두 보기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 페이지 컨텐츠 */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}