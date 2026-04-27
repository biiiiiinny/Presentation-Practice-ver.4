import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { useState, useEffect, useRef } from 'react';
import { Timeline } from '../components/Timeline';
import { VideoPlayer } from '../components/VideoPlayer';
import { Mic, User } from 'lucide-react';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { sessionId, attemptNumber } = useParams<{ sessionId: string; attemptNumber?: string }>();
  const { sessions, setCurrentSessionId } = useApp();

  const [activeTab, setActiveTab] = useState<'overall' | 'voice' | 'posture'>('overall');
  const [currentVideoTime, setCurrentVideoTime] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const overallRef = useRef<HTMLDivElement>(null);
  const voiceRef = useRef<HTMLDivElement>(null);
  const postureRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === sessionId);

  const currentAttempt = currentSession && currentSession.attempts.length > 0
    ? (attemptNumber
        ? currentSession.attempts[parseInt(attemptNumber) - 1]
        : currentSession.attempts[currentSession.attempts.length - 1])
    : null;

  useEffect(() => {
    if (!currentSession) {
      navigate('/dashboard');
    }
  }, [currentSession, navigate]);

  // IntersectionObserver로 스크롤 위치에 따라 활성 탭 업데이트
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id === 'overall' || id === 'voice' || id === 'posture') {
              setActiveTab(id);
            }
          }
        });
      },
      { root: container, threshold: 0.4 }
    );

    if (overallRef.current) observer.observe(overallRef.current);
    if (voiceRef.current) observer.observe(voiceRef.current);
    if (postureRef.current) observer.observe(postureRef.current);

    return () => observer.disconnect();
  }, [currentAttempt]);

  if (!currentSession) return null;
  if (!currentAttempt) {
    navigate('/dashboard');
    return null;
  }

  const analysisResults = currentAttempt?.analysisResults || {
    speechRate: 360,
    eyeContact: 78,
    duration: '8:30',
    confidence: 75
  };

  const timelineData = [
    { time: '0:00', event: '발표 시작', type: 'start' as const },
    { time: '0:30', event: '도입부 - 주제 소개', type: 'content' as const },
    { time: '1:45', event: '본론 1 - 문제 정의', type: 'content' as const },
    { time: '4:10', event: '본론 2 - 해결방안', type: 'content' as const },
    { time: '6:45', event: '본론 3 - 기대효과', type: 'content' as const },
    { time: '8:00', event: '결론 및 마무리', type: 'content' as const },
    { time: '8:30', event: '발표 종료', type: 'end' as const }
  ];

  const scriptData = [
    { time: '0:00', text: '안녕하세요. 오늘 AI 기반 발표 연습 서비스에 대해 소개하겠습니다.' },
    { time: '0:30', text: '현재 많은 학생들과 직장인들이 발표에 대한 두려움을 가지고 있습니다. 우리 서비스는 이러한 문제를 해결하고자 합니다.' },
    { time: '1:45', text: '문제 정부터 시작하겠습니다. 효과적인 발표를 위해서는 시선 처리, 음성 톤, 자세 등 다양한 요소가 필요합니다.' },
    { time: '4:10', text: '우리의 해결방안은 AI를 활용한 실시간 분석입니다. 사용자의 발표 영상을 업로드하면 자동으로 분석이 진행됩니다.' },
    { time: '6:45', text: '기대효과는 다음과 같습니다. 첫째, 객관적인 피드백을 통해 발표 능력을 향상시킬 수 있습니다.' },
    { time: '8:00', text: '둘째, 반복 연습을 통해 자신감을 키울 수 있습니다. 이상으로 발표를 마치겠습니다. 감사합니다.' }
  ];

  const handleTimelineClick = (timeString: string) => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    setCurrentVideoTime(minutes * 60 + seconds);
  };

  const handleRetry = () => {
    setCurrentSessionId(sessionId || null);
    navigate('/presentation/new');
  };

  const scrollToSection = (section: 'overall' | 'voice' | 'posture') => {
    const refMap = { overall: overallRef, voice: voiceRef, posture: postureRef };
    refMap[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">

        {/* 왼쪽 컬럼: 영상 + 타임라인 */}
        <div className="flex flex-col gap-4 w-1/2 min-w-0">
          <div className="bg-black rounded-xl shadow-lg relative" style={{ height: '52vh' }}>
            {currentAttempt.videoUrl ? (
              <VideoPlayer
                videoUrl={currentAttempt.videoUrl}
                currentTime={currentVideoTime}
                onTimeUpdate={setCurrentVideoTime}
                className="rounded-xl overflow-hidden"
              />
            ) : (
              <div className="text-white text-center p-8">
                <p className="text-lg mb-2">업로드된 영상이 없습니다</p>
                <p className="text-sm text-slate-400">새 발표를 시작하여 영상을 업로드해주세요</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-bold text-slate-900">타임라인</h2>
              {currentSession.attempts.length >= 2 ? (
                <button
                  onClick={() => navigate(`/presentation/compare/${sessionId}`)}
                  className="px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm bg-green-700 text-white hover:bg-green-600"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  1회차 vs 2회차 비교
                </button>
              ) : (
                <button
                  onClick={handleRetry}
                  className="px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm bg-blue-900 text-white hover:bg-blue-800"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  다시 연습하기
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <Timeline data={timelineData} onTimeClick={handleTimelineClick} />
            </div>
          </div>
        </div>

        {/* 오른쪽 컬럼: 피드백 패널 */}
        <div className="w-1/2 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-h-0">
          {/* 고정 탭 네비게이션 */}
          <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
            <button
              onClick={() => scrollToSection('overall')}
              className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors ${
                activeTab === 'overall'
                  ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              종합
            </button>
            <button
              onClick={() => scrollToSection('voice')}
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
              onClick={() => scrollToSection('posture')}
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

          {/* 단일 스크롤 콘텐츠 영역 */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">

            {/* 종합 섹션 */}
            <div ref={overallRef} data-section="overall" className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">평균 발화 속도</h3>
                  <p className="text-2xl font-bold text-blue-900">{analysisResults.speechRate} <span className="text-sm font-normal">글자/분</span></p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <h3 className="text-sm font-semibold text-green-900 mb-2">정면 응시 비율</h3>
                  <p className="text-2xl font-bold text-green-900">{analysisResults.eyeContact}%</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2">종합 평가</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  전반적으로 안정적인 발표였습니다. 명확한 논리 구조와 효과적인 제스처 활용이 돋보였으며,
                  청중과의 아이컨택도 양호한 편입니다. 다만 말하는 속도가 다소 빠르고, 중반부에 시선 처리가
                  산만해지는 경향이 있었습니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">발표 스크립트</h3>
                <div className="space-y-4">
                  {scriptData.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-16">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono font-semibold">
                          {item.time}
                        </span>
                      </div>
                      <p className="flex-1 text-slate-700 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 mx-6" />

            {/* 음성 섹션 */}
            <div ref={voiceRef} data-section="voice" className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-purple-700" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">음성 분석</h3>
              </div>

              <div className="space-y-3">
                {[
                  { label: '발음 명확도', desc: '발음이 명확하고 정확합니다' },
                  { label: '음량 적절성', desc: '적절한 음량을 유지했습니다' },
                  { label: '말하기 속도', desc: '분당 360자로 다소 빠른 편입니다' },
                  { label: '톤 변화', desc: '적절한 톤 변화로 생동감 있는 발표' },
                  { label: '강약 조절', desc: '중요한 부분에서 강조를 잘 활용했습니다' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">{item.label}</h4>
                    <p className="text-xs text-slate-600">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900">개선 제안</h4>
                {[
                  '중요한 내용은 천천히 강조하며 말하세요',
                  '문장 사이에 자연스러운 쉼을 두세요',
                  '발화 속도를 분당 300자 수준으로 조절하세요',
                ].map((suggestion, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    <p className="text-sm text-purple-900">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 mx-6" />

            {/* 자세 섹션 */}
            <div ref={postureRef} data-section="posture" className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-green-700" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">자세 및 응시</h3>
              </div>

              <div className="space-y-3">
                {[
                  { label: '자세 안정성', desc: '안정적인 자세를 유지했습니다' },
                  { label: '제스처 활용', desc: '효과적인 제스처와 손동작 활용' },
                  { label: '정면 응시 비율', desc: '78% 정면 응시' },
                  { label: '시선 분산', desc: '청중의 여러 방향을 적절히 응시' },
                  { label: '자신감 표현', desc: '자신감 있는 몸동작이 관찰됨' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">{item.label}</h4>
                    <p className="text-xs text-slate-600">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900">개선 제안</h4>
                {[
                  '현재 수준을 유지하세요',
                  '가끔 무대를 이동하며 역동성을 더할 수 있습니다',
                  '제스처의 크기를 청중 규모에 맞게 조절하세요',
                ].map((suggestion, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                    <p className="text-sm text-green-900">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
