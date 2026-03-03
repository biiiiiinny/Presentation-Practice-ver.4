import { CheckCircle, AlertTriangle, Star, Play, StopCircle } from 'lucide-react';

interface TimelineEvent {
  time: string;
  event: string;
  type: 'start' | 'good' | 'excellent' | 'warning' | 'end';
  confidence: number;
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
      case 'excellent':
        return <Star className="w-4 h-4" />;
      case 'good':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'end':
        return <StopCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'start':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'excellent':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'good':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'warning':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'end':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'start':
        return 'bg-blue-300';
      case 'excellent':
        return 'bg-yellow-300';
      case 'good':
        return 'bg-green-300';
      case 'warning':
        return 'bg-orange-300';
      case 'end':
        return 'bg-purple-300';
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
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 mb-1.5">
                    {item.event}
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          item.confidence >= 90 ? 'bg-green-500' :
                          item.confidence >= 75 ? 'bg-blue-500' :
                          item.confidence >= 60 ? 'bg-yellow-500' :
                          'bg-orange-500'
                        }`}
                        style={{ width: `${item.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 min-w-[40px]">
                      {item.confidence}%
                    </span>
                  </div>
                </div>
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
            <span className="text-slate-600">잘함 (90%+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-slate-600">양호 (75-89%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
            <span className="text-slate-600">보통 (60-74%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
            <span className="text-slate-600">주의 (~59%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}