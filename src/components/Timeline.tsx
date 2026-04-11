import { Play, StopCircle, FileText } from 'lucide-react';

interface TimelineEvent {
  time: string;
  event: string;
  type: 'start' | 'content' | 'end';
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
              <h4 className="text-sm font-semibold text-slate-900">
                {item.event}
              </h4>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}