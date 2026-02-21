import { CheckCircle, AlertTriangle, Star, Play, StopCircle } from 'lucide-react';

interface TimelineEvent {
  time: string;
  event: string;
  type: 'start' | 'good' | 'excellent' | 'warning' | 'end';
  confidence: number;
}

interface TimelineProps {
  data: TimelineEvent[];
}

export function Timeline({ data }: TimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Play className="w-5 h-5" />;
      case 'excellent':
        return <Star className="w-5 h-5" />;
      case 'good':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'end':
        return <StopCircle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
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
    <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 border border-slate-200">
      <div className="relative">
        {data.map((item, index) => (
          <div key={index} className="relative flex gap-4 sm:gap-6 pb-8 last:pb-0">
            {/* 타임라인 라인 */}
            {index !== data.length - 1 && (
              <div className={`absolute left-[22px] top-12 w-0.5 h-full ${getLineColor(item.type)}`} />
            )}

            {/* 시간 */}
            <div className="flex-shrink-0 w-16 pt-2">
              <span className="font-mono text-sm font-semibold text-slate-900">
                {item.time}
              </span>
            </div>

            {/* 아이콘 */}
            <div className={`flex-shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center z-10 ${getEventColor(item.type)}`}>
              {getEventIcon(item.type)}
            </div>

            {/* 이벤트 정보 */}
            <div className="flex-1 pt-1">
              <div className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {item.event}
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
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
                      <span className="text-xs font-semibold text-slate-600 min-w-[45px]">
                        {item.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-slate-600">잘함 (90%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-600">양호 (75-89%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-slate-600">보통 (60-74%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-slate-600">주의 (~59%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
