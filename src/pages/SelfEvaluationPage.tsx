import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Eye, User, Mic, FileText, Loader2 } from 'lucide-react';

export default function SelfEvaluationPage() {
  const navigate = useNavigate();
  const {
    startAnalysis,
    completeSelfEvaluation,
    currentFormData,
    analysisCompleted,
    selfEvaluationCompleted,
  } = useApp();

  const [selfEvaluation, setSelfEvaluation] = useState({
    eyeContact: 0,
    posture: 0,
    voice: 0,
    content: 0
  });

  // 자기평가 페이지 진입 시 AppContext의 분석 타이머 시작
  useEffect(() => {
    const topic = currentFormData?.topic || '새로운 발표';
    startAnalysis(topic);
    // startAnalysis는 AppContext에서 관리되므로 cleanup 불필요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 분석이 먼저 완료됐을 때: 자기평가가 아직 진행 중이면 아무것도 안 함
  // (분석 완료 후 자기평가 완료 시 AppContext가 세션 생성)

  const handleRatingChange = (category: string, rating: number) => {
    setSelfEvaluation(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  const isAllRated = Object.values(selfEvaluation).every(v => v > 0);

  const handleComplete = () => {
    // 자기평가 결과를 AppContext에 저장
    // AppContext가 분석 상태에 따라 즉시 세션 생성 or 대기 처리
    completeSelfEvaluation(selfEvaluation);
    // 분석 완료 여부와 무관하게 대시보드로 즉시 이동
    navigate('/dashboard');
  };

  const categories = [
    {
      key: 'eyeContact',
      label: '시선 처리',
      icon: Eye,
      description: '청중과의 아이컨택은 적절했나요?',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      key: 'posture',
      label: '자세 및 제스처',
      icon: User,
      description: '발표 자세와 제스처가 자연스러웠나요?',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      key: 'voice',
      label: '음성 및 표현',
      icon: Mic,
      description: '절거나 잉여표현 없이 명확했나요?',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      key: 'content',
      label: '발표 내용',
      icon: FileText,
      description: '내용 전달이 효과적이었나요?',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const ratedCount = Object.values(selfEvaluation).filter(v => v > 0).length;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              자기평가를 진행해주세요
            </h2>
            <p className="text-slate-600 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              AI 분석이 백그라운드에서 진행 중입니다. 자기평가를 먼저 완료하셔도 됩니다.
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {categories.map((category) => (
              <div
                key={category.key}
                className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className={`p-3 rounded-lg ${category.bgColor}`}>
                    <category.icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">
                      {category.label}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* 별점 선택 */}
                <div className="flex items-center justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRatingChange(category.key, rating)}
                      className={`group relative w-14 h-14 rounded-lg border-2 font-semibold text-lg transition-all ${
                        selfEvaluation[category.key as keyof typeof selfEvaluation] >= rating
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700 scale-110 shadow-md'
                          : 'border-slate-300 text-slate-400 hover:border-yellow-400 hover:bg-yellow-50 hover:scale-105'
                      }`}
                    >
                      {rating}
                      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {rating === 1 && '매우 부족'}
                        {rating === 2 && '부족'}
                        {rating === 3 && '보통'}
                        {rating === 4 && '좋음'}
                        {rating === 5 && '매우 좋음'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 완료 버튼 */}
          {isAllRated ? (
            <button
              onClick={handleComplete}
              className="w-full group px-8 py-4 bg-blue-900 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-blue-800 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <span>평가 완료</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-blue-700 font-semibold">
                모든 항목을 평가해주세요 ({ratedCount}/4)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
