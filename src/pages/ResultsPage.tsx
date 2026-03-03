import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { useState, useRef } from 'react';
import { Timeline } from '../components/Timeline';
import { ComparisonChart } from '../components/ComparisonChart';
import { Eye, Mic, User, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { sessions, selfEvaluation, setCurrentSessionId } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTab, setActiveTab] = useState<'overall' | 'eye' | 'voice' | 'posture'>('overall');

  const currentSession = sessions.find(s => s.id === id);

  // 세션을 찾지 못하면 대시보드로 리다이렉트
  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            세션을 찾을 수 없습니다
          </h2>
          <p className="text-slate-600 mb-4">
            요청하신 발표 세션이 존재하지 않습니다.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const timelineData = [
    { time: '0:00', event: '발표 시작', type: 'start', confidence: 95 },
    { time: '0:30', event: '도입부 - 주제 소개', type: 'good', confidence: 90 },
    { time: '1:45', event: '본론 1 - 문제 정의', type: 'good', confidence: 88 },
    { time: '3:20', event: '시선 분산 감지', type: 'warning', confidence: 65 },
    { time: '4:10', event: '본론 2 - 해결방안', type: 'good', confidence: 85 },
    { time: '5:30', event: '말속도 빠름 감지', type: 'warning', confidence: 70 },
    { time: '6:45', event: '본론 3 - 기대효과', type: 'good', confidence: 92 },
    { time: '8:00', event: '결론 및 마무리', type: 'excellent', confidence: 95 },
    { time: '8:30', event: '발표 종료', type: 'end', confidence: 93 }
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
      text: '문제 정의부터 시작하겠습니다. 효과적인 발표를 위해서는 시선 처리, 음성 톤, 자세 등 다양한 요소가 필요합니다.'
    },
    {
      time: '3:20',
      text: '하지만 이러한 요소들을 스스로 파악하고 개선하기는 어렵습니다.'
    },
    {
      time: '4:10',
      text: '우리의 해결방안은 AI를 활용한 실시간 분석입니다. 사용자의 발표 영상을 업로드하면 자동으로 분석이 진행됩니다.'
    },
    {
      time: '5:30',
      text: '시선 처리, 음성 분석, 자세 분석, 그리고 발표 내용까지 종합적으로 평가합니다.'
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

  // 자기평가 vs AI 평가 비교 데이터
  const evaluation = currentSession.selfEvaluation || selfEvaluation;
  const comparisonData = [
    { category: '시선', self: (evaluation.eyeContact || 3) * 20, ai: 85 },
    { category: '음성', self: (evaluation.voice || 4) * 20, ai: 78 },
    { category: '자세', self: (evaluation.posture || 4) * 20, ai: 92 },
    { category: '내용', self: (evaluation.content || 5) * 20, ai: 88 }
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
    setCurrentSessionId(id || null);
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
                <p className="text-2xl font-bold text-blue-900">180 <span className="text-sm font-normal">단어/분</span></p>
                <p className="text-xs text-blue-700 mt-1">권장: 150단어/분</p>
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

      case 'eye':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">시선 처리</h3>
                <p className="text-sm text-slate-600">점수: 85점</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-2">분석 결과</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                전반적으로 청중과 좋은 아이컨택을 유지했습니다. 다만, 발표 중반부(3-5분)에 
                슬라이드를 자주 보는 경향이 있었습니다. 정면 응시 비율은 78%로 양호한 편입니다.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">개선 제안</h4>
              {[
                '슬라이드 내용을 더 숙지하여 자신감 있게 청중을 바라보세요',
                '청중의 여러 방향을 골고루 응시하는 것이 좋습니다',
                '3-5분 구간에서 시선 처리에 더 집중하세요'
              ].map((suggestion, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <p className="text-sm text-blue-900">{suggestion}</p>
                </div>
              ))}
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
                <p className="text-sm text-slate-600">점수: 78점</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-2">분석 결과</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                음량과 발음은 명확했으나, 말하는 속도가 다소 빠른 편입니다. 
                평균 속도는 분당 180단어로, 권장 속도(150단어)보다 빠릅니다. 
                전반적인 톤과 강약 조절은 적절했습니다.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">개선 제안</h4>
              {[
                '중요한 내용은 천천히 강조하며 말하세요',
                '문장 사이에 자연스러운 쉼을 두세요',
                '발화 속도를 분당 150단어 수준으로 조절하세요'
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
                <h3 className="text-lg font-bold text-slate-900">자세 및 제스처</h3>
                <p className="text-sm text-slate-600">점수: 92점</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-2">분석 결과</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                안정적인 자세를 유지했고, 제스처를 효과적으로 사용했습니다. 
                자연스러운 손동작이 발표에 생동감을 더했으며, 전반적으로 자신감 있는 
                몸동작이 관찰되었습니다.
              </p>
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
            {currentSession.videoUrl ? (
              <video
                ref={videoRef}
                controls
                className="w-full h-full object-contain"
                src={currentSession.videoUrl}
              >
                <source src={currentSession.videoUrl} type="video/mp4" />
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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">타임라인</h2>
                <span className="text-xs text-slate-500">클릭 시 해당 시점 이동</span>
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
              onClick={() => setActiveTab('eye')}
              className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'eye'
                  ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-4 h-4" />
              시선
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