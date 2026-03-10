import { Play, StopCircle, FileText } from 'lucide-react';

interface TimelineEvent {
  time: string;
  event: string;
  type: 'start' | 'content' | 'end';
  rating?: '최하' | '하' | '중' | '상' | '최상';
}

interface TimelineProps {
  data: TimelineEvent[];
  onTimeClick?: (time: string) => void;
}

export function Timeline({ data, onTimeClick }: TimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Play className="w-4 h-4" />;
      case 'end':
        return <StopCircle className="w-4 h-4" />;
      case 'content':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'start':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'end':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'content':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'start':
        return 'bg-blue-300';
      case 'end':
        return 'bg-purple-300';
      case 'content':
        return 'bg-slate-300';
      default:
        return 'bg-slate-300';
    }
  };

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case '최상':
        return 'bg-green-500 text-white';
      case '상':
        return 'bg-blue-500 text-white';
      case '중':
        return 'bg-yellow-500 text-white';
      case '하':
        return 'bg-orange-500 text-white';
      case '최하':
        return 'bg-red-500 text-white';
      default:
        return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="relative">
      {data.map((item, index) => (
        <div 
          key={index} 
          className="relative flex gap-3 pb-6 cursor-pointer"
          onClick={() => onTimeClick?.(item.time)}
        >
          {/* 타임라인 라인 - 마지막 항목에는 표시하지 않음 */}
          {index < data.length - 1 && (
            <div className={`absolute left-[21px] top-6 w-0.5 h-full ${getLineColor(item.type)}`} />
          )}

          {/* 시간 */}
          <div className="flex-shrink-0 w-14 pt-1.5 relative z-10">
            <span className="inline-block px-2 py-0.5 bg-white text-slate-700 rounded text-xs font-medium border border-slate-200 shadow-sm">
              {item.time}
            </span>
          </div>

          {/* 아이콘 */}
          <div className={`flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 relative ${getEventColor(item.type)}`}>
            {getEventIcon(item.type)}
          </div>

          {/* 이벤트 정보 */}
          <div className="flex-1 pt-0.5">
            <div className="bg-slate-50 rounded-lg p-3 hover:bg-blue-50 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-900">
                  {item.event}
                </h4>
                {item.rating && (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRatingColor(item.rating)}`}>
                    {item.rating}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 범례 */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <span className="text-slate-600">최상</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-slate-600">상</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
            <span className="text-slate-600">중</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
            <span className="text-slate-600">하</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <span className="text-slate-600">최하</span>
          </div>
        </div>
      </div>
    </div>
  );
}
