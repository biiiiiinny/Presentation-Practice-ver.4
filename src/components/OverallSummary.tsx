import { Trophy, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface OverallSummaryProps {
  overallScore: number;
  duration: string;
  strengths: string[];
  improvements: string[];
}

export function OverallSummary({ overallScore, duration, strengths, improvements }: OverallSummaryProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return '우수';
    if (score >= 80) return '양호';
    if (score >= 70) return '보통';
    return '개선 필요';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-12 border border-slate-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 전체 점수 */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
          <Trophy className={`w-12 h-12 ${getScoreColor(overallScore)} mb-3`} />
          <div className="text-5xl font-bold text-slate-900 mb-2">{overallScore}</div>
          <div className={`text-lg font-semibold ${getScoreColor(overallScore)}`}>
            {getScoreLabel(overallScore)}
          </div>
          <div className="flex items-center gap-2 mt-3 text-slate-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{duration}</span>
          </div>
        </div>

        {/* 강점과 개선점 */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 강점 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900">잘한 점</h3>
            </div>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <span className="text-slate-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 개선점 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-slate-900">개선할 점</h3>
            </div>
            <ul className="space-y-2">
              {improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                  <span className="text-slate-700">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
