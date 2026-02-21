import { LucideIcon, Lightbulb } from 'lucide-react';

interface FeedbackCardProps {
  category: string;
  icon: LucideIcon;
  score: number;
  feedback: string;
  suggestions: string[];
  color: string;
}

export function FeedbackCard({ category, icon: Icon, score, feedback, suggestions, color }: FeedbackCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-slate-200">
      {/* 헤더 */}
      <div className={`${color} p-4 sm:p-5`}>
        <div className="flex items-center justify-between min-h-[48px]">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white text-lg">{category}</h3>
          </div>
          <div className="bg-white/90 px-4 py-2 rounded-full flex-shrink-0">
            <span className="font-bold text-slate-900">{score}점</span>
          </div>
        </div>
      </div>

      {/* 내용 */}
      <div className="p-5">
        {/* 피드백 */}
        <p className="text-slate-700 mb-4 leading-relaxed">{feedback}</p>

        {/* 제안사항 */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-600" />
            <span className="font-semibold text-slate-900 text-sm">개선 제안</span>
          </div>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 text-sm">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}