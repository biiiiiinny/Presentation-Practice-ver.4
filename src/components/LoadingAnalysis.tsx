import { useState, useEffect } from 'react';
import { Loader2, Eye, User, Mic, FileText, ChevronRight } from 'lucide-react';

interface LoadingAnalysisProps {
  onComplete: (selfEvaluation: Record<string, number>) => void;
}

export function LoadingAnalysis({ onComplete }: LoadingAnalysisProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('영상 업로드 중...');
  const [isComplete, setIsComplete] = useState(false);
  const [selfEvaluation, setSelfEvaluation] = useState({
    eyeContact: 0,
    posture: 0,
    voice: 0,
    content: 0
  });

  const steps = [
    '영상 업로드 중...',
    '음성 데이터 추출 중...',
    '시선 및 자세 분석 중...',
    '발표 내용 분석 중...',
    '종합 평가 생성 중...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsComplete(true);
          return 100;
        }
        return prev + 1;
      });
    }, 80); // 약 8초 정도 소요

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stepIndex = Math.floor(progress / 20);
    if (stepIndex < steps.length) {
      setCurrentStep(steps[stepIndex]);
    }
  }, [progress]);

  const handleRatingChange = (category: string, rating: number) => {
    setSelfEvaluation(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  const isAllRated = Object.values(selfEvaluation).every(v => v > 0);

  const handleViewResults = () => {
    onComplete(selfEvaluation);
  };

  const categories = [
    {
      key: 'eyeContact',
      label: '시선 처리',
      icon: Eye,
      description: '청중과의 아이컨택은 적절했나요?',
      color: 'text-blue-600'
    },
    {
      key: 'posture',
      label: '자세 및 제스처',
      icon: User,
      description: '발표 자세와 제스처가 자연스러웠나요?',
      color: 'text-green-600'
    },
    {
      key: 'voice',
      label: '음성 및 표현',
      icon: Mic,
      description: '절거나 잉여표현 없이 명확했나요?',
      color: 'text-purple-600'
    },
    {
      key: 'content',
      label: '발표 내용',
      icon: FileText,
      description: '내용 전달이 효과적이었나요?',
      color: 'text-orange-600'
    }
  ];

  const [showSelfEvaluation, setShowSelfEvaluation] = useState(false);

  useEffect(() => {
    if (isComplete) {
      setShowSelfEvaluation(true);
    }
  }, [isComplete]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        {/* 분석 중 표시 */}
        {!showSelfEvaluation && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 rounded-full mb-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                AI 분석 진행 중
              </h2>
              <p className="text-slate-600">{currentStep}</p>
            </div>

            {/* 프로그레스 바 */}
            <div className="relative">
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-center mt-2 font-semibold text-slate-700">
                {progress}%
              </div>
            </div>
          </div>
        )}

        {/* 자기평가 */}
        {showSelfEvaluation && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                자기평가를 진행해주세요
              </h3>
              <p className="text-slate-600 text-sm">
                분석이 완료되면 AI 평가와 비교할 수 있습니다
              </p>
            </div>

            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category.key} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-2 rounded-lg bg-slate-50 ${category.color}`}>
                      <category.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">
                        {category.label}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  {/* 별점 선택 */}
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingChange(category.key, rating)}
                        className={`group relative w-12 h-12 rounded-lg border-2 font-semibold transition-all ${
                          selfEvaluation[category.key as keyof typeof selfEvaluation] >= rating
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700 scale-110'
                            : 'border-slate-300 text-slate-400 hover:border-yellow-400 hover:bg-yellow-50'
                        }`}
                      >
                        {rating}
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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

            {/* 완료 상태 표시 */}
            {isComplete && isAllRated && (
              <div className="mt-6">
                <button
                  onClick={handleViewResults}
                  className="w-full group px-8 py-4 bg-blue-900 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-blue-800 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <span>결과 확인하기</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {isComplete && !isAllRated && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                <p className="text-orange-700 font-semibold">
                  모든 항목을 평가하면 결과를 확인할 수 있습니다
                </p>
              </div>
            )}

            {!isComplete && isAllRated && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-700 font-semibold">
                  ✓ 자기평가가 완료되었습니다. 분석이 완료될 때까지 기다려주세요...
                </p>
              </div>
            )}

            {!isComplete && !isAllRated && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-blue-700 text-sm">
                  분석이 진행되는 동안 자기평가를 완료해주세요 ({Object.values(selfEvaluation).filter(v => v > 0).length}/4)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}