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
  RotateCcw
} from 'lucide-react';
import { Session } from '../contexts/AppContext';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewPresentation: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  onLogout: () => void;
  onRetry: (id: string) => void;
}

export function Sidebar({
  sessions,
  currentSessionId,
  isCollapsed,
  onToggleCollapse,
  onNewPresentation,
  onSelectSession,
  onDeleteSession,
  onToggleFavorite,
  onNavigateToProfile,
  onNavigateToSettings,
  onLogout,
  onRetry
}: SidebarProps) {
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  const groupSessionsByDate = () => {
    const today: Session[] = [];
    const yesterday: Session[] = [];
    const thisWeek: Session[] = [];
    const older: Session[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    sessions.forEach(session => {
      const sessionDate = new Date(session.date);
      if (sessionDate >= todayStart) {
        today.push(session);
      } else if (sessionDate >= yesterdayStart) {
        yesterday.push(session);
      } else if (sessionDate >= weekStart) {
        thisWeek.push(session);
      } else {
        older.push(session);
      }
    });

    return { today, yesterday, thisWeek, older };
  };

  const { today, yesterday, thisWeek, older } = groupSessionsByDate();

  if (isCollapsed) {
    return (
      <div className="h-screen bg-slate-900 text-white p-2 flex flex-col items-center border-r border-slate-700 transition-all duration-300 ease-in-out w-16">
        <button
          onClick={onToggleCollapse}
          className="p-3 hover:bg-slate-800 rounded-lg transition-colors mb-4"
          title="사이드바 펼치기"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        <button
          onClick={onNewPresentation}
          className="p-3 hover:bg-slate-800 rounded-lg transition-colors mb-4"
          title="새 발표"
        >
          <Plus className="w-5 h-5" />
        </button>

        <div className="flex-1" />

        <div className="flex flex-col gap-2">
          <button
            onClick={onNavigateToProfile}
            className="p-3 hover:bg-slate-800 rounded-lg transition-colors"
            title="마이페이지"
          >
            <User className="w-6 h-6" />
          </button>

          <button
            onClick={onNavigateToSettings}
            className="p-3 hover:bg-slate-800 rounded-lg transition-colors"
            title="설정"
          >
            <Settings className="w-6 h-6" />
          </button>

          <button
            onClick={onLogout}
            className="p-3 hover:bg-red-800 rounded-lg transition-colors"
            title="로그아웃"
          >
            <LogOut className="w-6 h-6 text-red-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-64 bg-slate-900 text-white flex flex-col border-r border-slate-700 transition-all duration-300 ease-in-out">
      {/* 헤더 */}
      <div className="p-3 flex items-center justify-between border-b border-slate-700">
        <button
          onClick={onNewPresentation}
          className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">새 발표</span>
        </button>
        <button
          onClick={onToggleCollapse}
          className="ml-2 p-2 hover:bg-slate-800 rounded-lg transition-colors"
          title="사이드바 접기"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* 세션 목록 */}
      <div className="flex-1 overflow-y-auto p-2">
        {today.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-400 px-3 py-2">오늘</h3>
            {today.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={currentSessionId === session.id}
                isHovered={hoveredSessionId === session.id}
                onSelect={() => onSelectSession(session.id)}
                onDelete={() => onDeleteSession(session.id)}
                onToggleFavorite={() => onToggleFavorite(session.id)}
                onHover={() => setHoveredSessionId(session.id)}
                onLeave={() => setHoveredSessionId(null)}
                onRetry={() => onRetry(session.id)}
              />
            ))}
          </div>
        )}

        {yesterday.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-400 px-3 py-2">어제</h3>
            {yesterday.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={currentSessionId === session.id}
                isHovered={hoveredSessionId === session.id}
                onSelect={() => onSelectSession(session.id)}
                onDelete={() => onDeleteSession(session.id)}
                onToggleFavorite={() => onToggleFavorite(session.id)}
                onHover={() => setHoveredSessionId(session.id)}
                onLeave={() => setHoveredSessionId(null)}
                onRetry={() => onRetry(session.id)}
              />
            ))}
          </div>
        )}

        {thisWeek.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-400 px-3 py-2">최근 7일</h3>
            {thisWeek.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={currentSessionId === session.id}
                isHovered={hoveredSessionId === session.id}
                onSelect={() => onSelectSession(session.id)}
                onDelete={() => onDeleteSession(session.id)}
                onToggleFavorite={() => onToggleFavorite(session.id)}
                onHover={() => setHoveredSessionId(session.id)}
                onLeave={() => setHoveredSessionId(null)}
                onRetry={() => onRetry(session.id)}
              />
            ))}
          </div>
        )}

        {older.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-400 px-3 py-2">이전 발표</h3>
            {older.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={currentSessionId === session.id}
                isHovered={hoveredSessionId === session.id}
                onSelect={() => onSelectSession(session.id)}
                onDelete={() => onDeleteSession(session.id)}
                onToggleFavorite={() => onToggleFavorite(session.id)}
                onHover={() => setHoveredSessionId(session.id)}
                onLeave={() => setHoveredSessionId(null)}
                onRetry={() => onRetry(session.id)}
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

      {/* 하단 메뉴 */}
      <div className="p-2 border-t border-slate-700">
        <button
          onClick={onNavigateToProfile}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-left"
        >
          <User className="w-5 h-5" />
          <span className="text-sm">마이페이지</span>
        </button>
        <button
          onClick={onNavigateToSettings}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-left"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">설정</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-800 rounded-lg transition-colors text-left group"
        >
          <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-300" />
          <span className="text-sm text-red-400 group-hover:text-red-300">로그아웃</span>
        </button>
      </div>
    </div>
  );
}

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onHover: () => void;
  onLeave: () => void;
  onRetry: () => void;
}

function SessionItem({
  session,
  isActive,
  isHovered,
  onSelect,
  onDelete,
  onToggleFavorite,
  onHover,
  onLeave,
  onRetry
}: SessionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMultipleAttempts = session.attempts && session.attempts.length > 1;

  return (
    <div
      className={`relative rounded-lg transition-colors mb-1 ${
        isActive ? 'bg-slate-800' : ''
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* 메인 세션 */}
      <div
        className="group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-800 rounded-lg"
        onClick={onSelect}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {session.isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
            <p className="text-sm font-medium truncate">{session.title}</p>
            {hasMultipleAttempts && (
              <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded flex-shrink-0">
                <RotateCcw className="w-3 h-3" />
                {session.attempts.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{new Date(session.date).toLocaleDateString('ko-KR')}</span>
            <span className="ml-auto">점수: {session.score}</span>
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
          
          {(isHovered || isActive) && (
            <>
              {/* 재발표 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
                title="다시 연습하기"
              >
                <RotateCcw className="w-4 h-4 text-blue-400" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
                title={session.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
              >
                <Star className={`w-4 h-4 ${session.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
              </button>
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
            </>
          )}

        </div>
      </div>

      {/* 재발표 이력 */}
      {isExpanded && hasMultipleAttempts && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-2">
          {session.attempts.map((attempt, index) => (
            <div
              key={attempt.id}
              className="px-3 py-1.5 rounded text-xs hover:bg-slate-800 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-300">
                  {index + 1}회차
                </span>
                <span className="text-slate-400">
                  {attempt.score}점
                </span>
              </div>
              <div className="text-slate-500 mt-0.5">
                {new Date(attempt.date).toLocaleDateString('ko-KR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}