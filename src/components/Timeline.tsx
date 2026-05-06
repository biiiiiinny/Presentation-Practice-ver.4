import { useState } from 'react';
import { Play, StopCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface TimelineEvent {
  time: string;
  event: string;
  type: 'start' | 'content' | 'end';
  script?: string;
}

interface TimelineProps {
  data: TimelineEvent[];
  onTimeClick?: (time: string) => void;
}

export function Timeline({ data, onTimeClick }: TimelineProps) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  const toggle = (idx: number) =>
    setOpenSet(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'start': return <Play className="w-4 h-4" />;
      case 'end':   return <StopCircle className="w-4 h-4" />;
      default:      return <FileText className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'start': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'end':   return 'bg-purple-100 text-purple-700 border-purple-300';
      default:      return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'start': return 'bg-blue-300';
      case 'end':   return 'bg-purple-300';
      default:      return 'bg-slate-300';
    }
  };

  return (
    <div className="relative">
      {data.map((item, index) => {
        const isOpen = openSet.has(index);
        const hasScript = !!item.script;
        return (
          <div key={index} className="relative flex gap-3 pb-6">
            {/* 연결선 */}
            {index < data.length - 1 && (
              <div className={`absolute left-[21px] top-6 w-0.5 h-full ${getLineColor(item.type)}`} />
            )}

            {/* 시간 배지 — 클릭 시 비디오 해당 구간으로 이동 */}
            <div className="flex-shrink-0 w-14 pt-1.5 relative z-10">
              <button
                onClick={() => onTimeClick?.(item.time)}
                className="px-2 py-0.5 bg-white text-slate-700 rounded text-xs font-medium border border-slate-200 shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors w-full text-center"
              >
                {item.time}
              </button>
            </div>

            {/* 아이콘 */}
            <div className={`flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 relative ${getEventColor(item.type)}`}>
              {getEventIcon(item.type)}
            </div>

            {/* 이벤트 카드 */}
            <div className="flex-1 pt-0.5">
              <div
                className={`rounded-lg p-3 transition-colors border ${
                  isOpen
                    ? 'bg-blue-50 border-blue-200'
                    : hasScript
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 cursor-pointer'
                    : 'bg-slate-50 border-transparent'
                }`}
                onClick={() => hasScript && toggle(index)}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">{item.event}</h4>
                  {hasScript && (
                    isOpen
                      ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </div>
                {isOpen && item.script && (
                  <p className="text-xs text-slate-600 leading-relaxed mt-2 pt-2 border-t border-blue-200">
                    {item.script}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
