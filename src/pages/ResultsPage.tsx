import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Timeline } from '../components/Timeline';
import { ComparisonChart } from '../components/ComparisonChart';
import { Mic, User, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { sessionId, attemptNumber } = useParams<{ sessionId: string; attemptNumber?: string }>();
  const { sessions, selfEvaluation, setCurrentSessionId } = useApp();
  
  // ✅ 모든 Hook을 최상단에서 호출
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTab, setActiveTab] = useState<'overall' | 'voice' | 'posture'>('overall');

  const currentSession = sessions.find(s => s.id === sessionId);

  // 현재 보여줄 attempt 찾기
  const currentAttempt = currentSession && currentSession.attempts.length > 0
    ? (attemptNumber
        // attemptNumber가 있으면 해당 회차 찾기 (예: "2" → 인덱스 1)
        ? currentSession.attempts[parseInt(attemptNumber) - 1]
        // attemptNumber가 없으면 최신 attempt
        : currentSession.attempts[currentSession.attempts.length - 1])
    : null;

  // 🔍 디버깅
  console.log('🔍 ResultsPage Debug:', {
    sessionId,
    attemptNumber,
    currentSession,
    attemptsCount: currentSession?.attempts.length,
    currentAttempt,
    allAttempts: currentSession?.attempts
  });

  // 자기평가 vs AI 평가 비교 데이터 (항상 호출되어야 함)
  const evaluation = currentAttempt?.selfEvaluation || selfEvaluation;
  const comparisonData = useMemo(() => {
    const eyeContact = evaluation?.eyeContact || 3;
    const voice = evaluation?.voice || 4;
    const posture = evaluation?.posture || 4;
    const content = evaluation?.content || 5;
    
    return [
      { id: `eye-contact-${sessionId}`, category: '시선', self: eyeContact, ai: 4 },
      { id: `voice-${sessionId}`, category: '음성', self: voice, ai: 4 },
      { id: `posture-${sessionId}`, category: '자세', self: posture, ai: 5 },
      { id: `content-${sessionId}`, category: '내용', self: content, ai: 4 }
    ];
  }, [evaluation, sessionId]);

  // 세션을 찾지 못하면 대시보드로 리다이렉트
  useEffect(() => {
    if (!currentSession) {
      navigate('/dashboard');
    }
  }, [currentSession, navigate]);

  // 세션은 있지만 attempt가 없으면 자기평가 페이지로 리다이렉트
  useEffect(() => {
    if (currentSession && currentSession.attempts.length === 0) {
      // 자기평가가 완료되지 않았으므로 자기평가 페이지로 이동
      navigate(`/presentation/${sessionId}/self-evaluation`);
    }
  }, [currentSession, sessionId, navigate]);

  // 모든 Hook 호출 후에 조건 체크
  // 세션을 찾지 못하면
  if (!currentSession) {
    return null; // useEffect에서 리다이렉트 처리
  }

  // attempt를 찾지 못하면 (자기평가 미완료)
  if (!currentAttempt) {
    return null; // useEffect에서 리다이렉트 처리
  }

  // 타임라인 데이터 - 스크립트 기반 발표 내용 구조만
  const timelineData = [
    { time: '0:00', event: '발표 시작', type: 'start' as const },
    { time: '0:30', event: '도입부 - 주제 소개', type: 'content' as const, rating: '상' as const },
    { time: '1:45', event: '본론 1 - 문제 정의', type: 'content' as const, rating: '상' as const },
    { time: '4:10', event: '본론 2 - 해결방안', type: 'content' as const, rating: '중' as const },
    { time: '6:45', event: '본론 3 - 기대효과', type: 'content' as const, rating: '최상' as const },
    { time: '8:00', event: '결론 및 마무리', type: 'content' as const, rating: '최상' as const },
    { time: '8:30', event: '발표 종료', type: 'end' as const }
  ];

  // Mock 스크립트 데이터
  const scriptData = [
    {
      time: '0:00',
      text: '안녕하세요. 오늘 AI 기반 발표 연습 서비스에 대해 소개하겠습니다.'
    },
    {
      time: '0:30',
      text: '현재 많은 학생들과 직장인들이 발표에 대한 두려움을 가지고 있습니다. 우리 서비스는 이러한 문제를 해결하고자 합니다.'
    },
    {
      time: '1:45',
      text: '문제 정부터 시작하겠습니다. 효과적인 발표를 위해서는 시선 처리, 음성 톤, 자세 등 다양한 요소가 필요합니다.'
    },
    {
      time: '4:10',
      text: '우리의 해결방안은 AI를 활용한 실시간 분석입니다. 사용자의 발표 영상을 업로드하면 자동으로 분석이 진행됩니다.'
    },
    {
      time: '6:45',
      text: '기대효과는 다음과 같습니다. 첫째, 객관적인 피드백을 통해 발표 능력을 향상시킬 수 있습니다.'
    },
    {
      time: '8:00',
      text: '둘째, 반복 연습을 통해 자신감을 키울 수 있습니다. 이상으로 발표를 마치겠습니다. 감사합니다.'
    }
  ];

  // 타임라인 클릭 시 비디오 시간 이동
  const handleTimelineClick = (timeString: string) => {
    if (videoRef.current) {
      // "0:30" 형식을 초로 변환
      const [minutes, seconds] = timeString.split(':').map(Number);
      const totalSeconds = minutes * 60 + seconds;
      videoRef.current.currentTime = totalSeconds;
    }
  };

  const handleRetry = () => {
    // 현재 세션을 유지하면서 재발표
    setCurrentSessionId(sessionId || null);
    navigate('/presentation/new');
  };

  // 탭별 콘텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overall':
        return (
          <div className="space-y-6">
            {/* 종합 평가 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">평균 발화 속도</h3>
                <p className="text-2xl font-bold text-blue-900">360 <span className="text-sm font-normal">글자/분</span></p>
                <p className="text-xs text-blue-700 mt-1">권장: 300글자/분</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h3 className="text-sm font-semibold text-green-900 mb-2">정면 응시 비율</h3>
                <p className="text-2xl font-bold text-green-900">78%</p>
                <p className="text-xs text-green-700 mt-1">권장: 70% 이상</p>
              </div>
            </div>

            {/* 종합 평가 텍스트 */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">종합 평가</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                전반적으로 안정적인 발표였습니다. 명확한 논리 구조와 효과적인 제스처 활용이 돋보였으며, 
                청중과의 아이컨택도 양호한 편입니다. 다만 말하는 속도가 다소 빠르고, 중반부에 시선 처리가 
                산만해지는 경향이 있었습니다.
              </p>
            </div>

            {/* 굿 포인트 */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                굿 포인트
              </h3>
              <div className="space-y-2">
                {[
                  '명확한 논리 구조로 메시지 전달',
                  '효과적인 제스처와 손동작 활용',
                  '안정적인 자세 유지',
                  '좋은 발음과 명확한 음량'
                ].map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    <p className="text-sm text-green-900">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 개선점 */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                개선점
              </h3>
              <div className="space-y-2">
                {[
                  '말하는 속도를 조절하여 청중이 따라올 수 있도록 하세요',
                  '중반부 시선 처리에 집중이 필요합니다',
                  '중요한 내용은 천천히 강조하며 말하세요',
                  '문장 사이에 자연스러운 쉼을 두세요'
                ].map((point, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 flex-shrink-0" />
                    <p className="text-sm text-orange-900">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 자기평가 vs AI 평가 */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">자기평가 vs AI 평가</h3>
              <ComparisonChart data={comparisonData} />
            </div>
          </div>
        );

      case 'voice':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Mic className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">음성 분석</h3>
                <span className="inline-block px-3 py-1 bg-blue-500 text-white rounded text-sm font-semibold mt-1">
                  상
                </span>
              </div>
            </div>

            {/* 5가지 평가 항목 */}
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">발음 명확도</h4>
                  <span className="px-2 py-0.5 bg-green-500 text-white rounded text-xs font-semibold">최상</span>
                </div>
                <p className="text-xs text-slate-600">발음이 명확하고 정확합니다</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">음량 적절성</h4>
                  <span className="px-2 py-0.5 bg-green-500 text-white rounded text-xs font-semibold">최상</span>
                </div>
                <p className="text-xs text-slate-600">적절한 음량을 유지했습니다</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">말하기 속도</h4>
                  <span className="px-2 py-0.5 bg-yellow-500 text-white rounded text-xs font-semibold">중</span>
                </div>
                <p className="text-xs text-slate-600">분당 360자로 다소 빠른 편입니다 (권장: 300자)</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">톤 변화</h4>
                  <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-semibold">상</span>
                </div>
                <p className="text-xs text-slate-600">적절한 톤 변화로 생동감 있는 발표</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">강약 조절</h4>
                  <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-semibold">상</span>
                </div>
                <p className="text-xs text-slate-600">중요한 부분에서 강조를 잘 활용했습니다</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">개선 제안</h4>
              {[
                '중요한 내용은 천천히 강조하며 말하세요',
                '문장 사이에 자연스러운 쉼을 두세요',
                '발화 속도를 분당 300자 수준으로 조절하세요'
              ].map((suggestion, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                  <p className="text-sm text-purple-900">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'posture':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <User className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">자세 및 응시</h3>
                <span className="inline-block px-3 py-1 bg-green-500 text-white rounded text-sm font-semibold mt-1">
                  최상
                </span>
              </div>
            </div>

            {/* 5가지 평가 항목 */}
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">자세 안정성</h4>
                  <span className="px-2 py-0.5 bg-green-500 text-white rounded text-xs font-semibold">최상</span>
                </div>
                <p className="text-xs text-slate-600">안정적인 자세를 유지했습니다</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">제스처 활용</h4>
                  <span className="px-2 py-0.5 bg-green-500 text-white rounded text-xs font-semibold">최상</span>
                </div>
                <p className="text-xs text-slate-600">효과적인 제스처와 손동작 활용</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">정면 응시 비율</h4>
                  <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-semibold">상</span>
                </div>
                <p className="text-xs text-slate-600">78% 정면 응시 (권장: 70% 이상)</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">시선 분산</h4>
                  <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-semibold">상</span>
                </div>
                <p className="text-xs text-slate-600">청중의 여러 방향을 적절히 응시</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">자신감 표현</h4>
                  <span className="px-2 py-0.5 bg-green-500 text-white rounded text-xs font-semibold">최상</span>
                </div>
                <p className="text-xs text-slate-600">자신감 있는 몸동작이 관찰됨</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">개선 제안</h4>
              {[
                '현재 수준을 유지하세요',
                '가끔 무대를 이동하며 역동성을 더할 수 있습니다',
                '제스처의 크기를 청중 규모에 맞게 조절하세요'
              ].map((suggestion, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-green-50 rounded-lg p-3 border border-green-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                  <p className="text-sm text-green-900">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* 새 레이아웃: 왼쪽(영상+타임라인) / 오른쪽(피드백 전체 높이) */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">

        {/* 왼쪽 컬럼: 영상(상단) + 타임라인(하단) */}
        <div className="flex flex-col gap-4 w-1/2 min-w-0">

          {/* 왼쪽 상단: 영상 플레이어 */}
          <div className="bg-black rounded-xl shadow-lg overflow-hidden flex items-center justify-center" style={{ flex: '0 0 52%' }}>
            {currentAttempt.videoUrl ? (
              <video
                ref={videoRef}
                controls
                className="w-full h-full object-contain"
                src={currentAttempt.videoUrl}
              >
                <source src={currentAttempt.videoUrl} type="video/mp4" />
                브라우저가 비디오를 지원하지 않습니다.
              </video>
            ) : (
              <div className="text-white text-center p-8">
                <p className="text-lg mb-2">업로드된 영상이 없습니다</p>
                <p className="text-sm text-slate-400">새 발표를 시작하여 영상을 업로드해주세요</p>
              </div>
            )}
          </div>

          {/* 왼쪽 하단: 타임라인 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <h2 className="text-base font-bold text-slate-900">타임라인</h2>
                {/* 범례 */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-slate-600">최상</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-slate-600">상</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-slate-600">중</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-slate-600">하</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-slate-600">최하</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="px-3 py-1.5 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-1.5 text-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                다시 연습하기
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <Timeline data={timelineData} onTimeClick={handleTimelineClick} />
            </div>
          </div>
        </div>

        {/* 오른쪽 컬럼: 피드백 패널 (전체 높이) */}
        <div className="w-1/2 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-h-0">
          {/* 탭 네비게이션 */}
          <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
            <button
              onClick={() => setActiveTab('overall')}
              className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors ${
                activeTab === 'overall'
                  ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              종합
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'voice'
                  ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Mic className="w-4 h-4" />
              음성
            </button>
            <button
              onClick={() => setActiveTab('posture')}
              className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'posture'
                  ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              자세
            </button>
          </div>

          {/* 콘텐츠 영역 (스크롤 가능) */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {/* 탭 콘텐츠 */}
            <div className="p-6">
              {renderTabContent()}
            </div>

            {/* 스크립트 - 종합 탭에서만 표시 */}
            {activeTab === 'overall' && (
              <div className="p-6 pt-0">
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">발표 스크립트</h3>
                  <div className="space-y-4">
                    {scriptData.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-16">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono font-semibold">
                            {item.time}
                          </span>
                        </div>
                        <p className="flex-1 text-slate-700 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}