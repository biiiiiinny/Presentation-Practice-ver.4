import { useState } from 'react';
import { 
  Plus, 
  History, 
  User, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Trash2,
  Clock,
  Star,
  LogOut,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Bell,
  LayoutDashboard
} from 'lucide-react';
import { Session, Notification } from '../contexts/AppContext';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewPresentation: () => void;
  onNavigateToDashboard: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  onLogout: () => void;
  showNotifications: boolean;
  onToggleNotifications: () => void;
  isAnalyzing: boolean;
  analysisProgress: number;
  currentPresentationTopic: string;
  analysisCompleted: boolean;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onClearAllNotifications: () => void;
  onDeleteAttempt: (sessionId: string, attemptId: string) => void;
  onSelectAttempt?: (sessionId: string, attemptId: string) => void;
}

export function Sidebar({
  sessions,
  currentSessionId,
  isCollapsed,
  onToggleCollapse,
  onNewPresentation,
  onNavigateToDashboard,
  onSelectSession,
  onDeleteSession,
  onToggleFavorite,
  onNavigateToProfile,
  onNavigateToSettings,
  onLogout,
  showNotifications,
  onToggleNotifications,
  isAnalyzing,
  analysisProgress,
  currentPresentationTopic,
  analysisCompleted,
  notifications,
  onNotificationClick,
  onClearAllNotifications,
  onDeleteAttempt,
  onSelectAttempt,
}: SidebarProps) {
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div 
      className={`h-screen bg-slate-900 text-white flex flex-col border-r border-slate-700 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* 새 발표 버튼과 접기 버튼 */}
      <div className="p-2 border-b border-slate-700">
        <div className="flex flex-col gap-1">
          {/* 사이드바 접기/펼치기 */}
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-left overflow-hidden"
            title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            {isCollapsed
              ? <ChevronRight className="w-5 h-5 flex-shrink-0" />
              : <ChevronLeft className="w-5 h-5 flex-shrink-0" />
            }
            {!isCollapsed && (
              <span className="text-sm whitespace-nowrap">접기</span>
            )}
          </button>

          {/* 대시보드 */}
          <button
            onClick={onNavigateToDashboard}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-left overflow-hidden"
            title="대시보드"
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm whitespace-nowrap">대시보드</span>
            )}
          </button>

          {/* 새 발표 */}
          <button
            onClick={onNewPresentation}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-600 rounded-lg transition-colors text-left overflow-hidden"
            title="새 발표"
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm whitespace-nowrap">새 발표</span>
            )}
          </button>
        </div>
      </div>

      {/* 세션 목록 */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto scrollbar-hide p-2 animate-fadeIn" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          {sortedSessions.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-400 px-3 py-2">최근 발표</h3>
              {sortedSessions.map(session => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={currentSessionId === session.id}
                  onSelect={() => onSelectSession(session.id)}
                  onDelete={() => onDeleteSession(session.id)}
                  onToggleFavorite={() => onToggleFavorite(session.id)}
                  onSelectAttempt={onSelectAttempt}
                  onDeleteAttempt={onDeleteAttempt}
                />
              ))}
            </div>
          )}

          {sessions.length === 0 && (
            <div className="text-center py-8 px-4">
              <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">아직 발표 기록이 없습니다</p>
              <p className="text-xs text-slate-500 mt-1">새 발표를 시작해보세요</p>
            </div>
          )}
        </div>
      )}

      {/* 닫혔을 때 공간 채우기 */}
      {isCollapsed && <div className="flex-1" />}

      {/* 분석 진행 상태 - 하단 메뉴 바로 위 */}
      {!isCollapsed && isAnalyzing && (
        <div className="p-2 border-t border-slate-700">
          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              {analysisCompleted ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-xs font-semibold text-green-400 truncate">
                    {currentPresentationTopic} 분석 완료!
                  </p>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {currentPresentationTopic} 분석 진행 중
                  </p>
                </>
              )}
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ease-out ${
                  analysisCompleted ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            {analysisCompleted ? (
              <p className="text-xs text-green-400 mt-1 text-center font-medium">
                발표 분석이 완료되었습니다.
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-1 text-center">{analysisProgress}%</p>
            )}
          </div>
        </div>
      )}

      {/* 하단 메뉴 */}
      <div className="p-2 border-t border-slate-700 space-y-1">
        <div className="relative">
          <button
            onClick={onToggleNotifications}
            className="w-full relative flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-left overflow-hidden"
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className={`text-sm whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                알림
              </span>
            )}
            {/* 알림 마크 (빨간 점) - 읽지 않은 알림이 있을 때만 표시 */}
            {unreadCount > 0 && (
              <span className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* 알림 드롭다운 */}
          {showNotifications && (
            <div className={`absolute mb-2 w-96 bg-white rounded-lg shadow-xl border border-slate-200 z-50 text-slate-900 ${ 
              isCollapsed
                ? 'left-full top-0 ml-2'
                : 'bottom-full left-0'
            }`}>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">알림</h3>
                {notifications.length > 0 && (
                  <button 
                    onClick={onClearAllNotifications}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    모두 지우기
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">알림이 없습니다</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className="p-5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                      onClick={() => onNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${
                          notification.isRead ? 'bg-slate-300' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className={`text-base mb-1 ${
                            notification.isRead ? 'text-slate-700' : 'font-semibold text-slate-900'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-slate-600 mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(notification.date).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={onNavigateToProfile}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-left overflow-hidden"
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className={`text-sm whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              마이페이지
            </span>
          )}
        </button>
        <button
          onClick={onNavigateToSettings}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-left overflow-hidden"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className={`text-sm whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              설정
            </span>
          )}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-800 rounded-lg transition-colors text-left group overflow-hidden"
        >
          <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-300 flex-shrink-0" />
          {!isCollapsed && (
            <span className={`text-sm text-red-400 group-hover:text-red-300 whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              로그아웃
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onSelectAttempt?: (sessionId: string, attemptId: string) => void;
  onDeleteAttempt: (sessionId: string, attemptId: string) => void;
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onToggleFavorite,
  onSelectAttempt,
  onDeleteAttempt,
}: SessionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMultipleAttempts = session.attempts && session.attempts.length > 1;

  return (
    <div
      className={`relative rounded-lg transition-colors mb-1 ${
        isActive ? 'bg-slate-800' : ''
      }`}
    >
      {/* 메인 세션 */}
      <div
        className="group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-800 rounded-lg"
        onClick={onSelect}
      >
        {/* 즐겨찾기 아이콘 (맨 앞, 항상 표시) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
          title={session.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
        >
          <Star className={`w-4 h-4 ${session.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium truncate">{session.title}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{new Date(session.date).toLocaleDateString('ko-KR')}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {hasMultipleAttempts && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title={isExpanded ? '접기' : '펼치기'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          
          {(isActive) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('이 발표 기록을 삭제하시겠습니까?')) {
                  onDelete();
                }
              }}
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              title="삭제"
            >
              <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* 재발표 이력 */}
      {isExpanded && hasMultipleAttempts && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-2">
          {session.attempts.map((attempt, index) => (
            <div
              key={attempt.id}
              className="group px-3 py-1.5 rounded text-xs hover:bg-slate-800 cursor-pointer"
              onClick={() => onSelectAttempt && onSelectAttempt(session.id, attempt.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-slate-300 font-medium">
                    {index + 1}회차
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    {new Date(attempt.date).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('이 재발표 기록을 삭제하시겠습니까?')) {
                      onDeleteAttempt(session.id, attempt.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-all"
                  title="삭제"
                >
                  <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}