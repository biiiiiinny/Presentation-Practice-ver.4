import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { useState, useEffect, useRef } from 'react';
import { Timeline } from '../components/Timeline';
import { VideoPlayer } from '../components/VideoPlayer';
import { Mic, User } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';

// ── 원형 진행 바 ──────────────────────────────────────────────────────────────
function CircleProgress({ value, max = 100, unit = '%', label, color = '#1e3a8a' }: {
  value: number; max?: number; unit?: string; label: string; color?: string;
}) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value / max, 1));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="96" height="96" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)"
        />
        <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f172a">
          {value}
        </text>
        <text x="50" y="62" textAnchor="middle" fontSize="11" fill="#64748b">
          {unit}
        </text>
      </svg>
      <span className="text-xs font-semibold text-slate-500 text-center">{label}</span>
    </div>
  );
}

// ── 범위 게이지 (말하기 속도) ─────────────────────────────────────────────────
function RangeGauge({ value, optimalMin, optimalMax, unit, maxDisplay }: {
  value: number; optimalMin: number; optimalMax: number; unit: string; maxDisplay: number;
}) {
  const pct = (v: number) => (Math.min(Math.max(v, 0), maxDisplay) / maxDisplay) * 100;
  const inRange = value >= optimalMin && value <= optimalMax;
  return (
    <div className="w-full space-y-2">
      <div className="relative h-5 bg-slate-200 rounded-full">
        <div
          className="absolute top-0 h-full bg-green-200 rounded-full"
          style={{ left: `${pct(optimalMin)}%`, width: `${pct(optimalMax) - pct(optimalMin)}%` }}
        />
        <div
          className={`absolute -top-0.5 w-2 h-6 rounded-full shadow ${inRange ? 'bg-green-600' : 'bg-red-500'}`}
          style={{ left: `calc(${pct(value)}% - 4px)` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>느림</span>
        <span className="text-green-700 font-semibold">적정 {optimalMin}–{optimalMax} {unit}</span>
        <span>빠름</span>
      </div>
      <p className="text-center text-sm">
        <span className={`font-bold ${inRange ? 'text-green-700' : 'text-red-600'}`}>
          {value} {unit}
        </span>
        <span className="text-slate-500 ml-1.5 text-xs">
          {inRange ? '✓ 적정 범위' : value < optimalMin ? '— 느린 편' : '— 빠른 편'}
        </span>
      </p>
    </div>
  );
}

// ── 횟수 배지 (말버릇, 습관적 행동) ──────────────────────────────────────────
function CountBadge({ count, label, thresholds }: {
  count: number; label: string; thresholds: [number, number];
}) {
  const cls = count <= thresholds[0]
    ? 'bg-green-100 text-green-800 border-green-300'
    : count <= thresholds[1]
    ? 'bg-orange-100 text-orange-800 border-orange-300'
    : 'bg-red-100 text-red-800 border-red-300';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-bold text-2xl ${cls}`}>
        {count}
      </div>
      <span className="text-xs font-semibold text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

// ── 레이더 차트 커스텀 툴팁 ───────────────────────────────────────────────────
const RadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800">{payload[0].payload.metric}</p>
      <p className="text-blue-700 font-bold mt-0.5">{payload[0].value}점</p>
    </div>
  );
};

// ── 점수 정규화 함수 ──────────────────────────────────────────────────────────
const calcSpeechRateScore = (r: number) =>
  r >= 280 && r <= 400 ? 100
  : r < 280 ? Math.max(0, Math.round(r / 280 * 100))
  : Math.max(0, Math.round(100 - (r - 400) / 2));

const calcFillerScore = (n: number) => Math.max(0, 100 - n * 5);
const calcSilenceScore = (r: number) => Math.max(0, Math.round(100 - Math.abs(r - 11) * 5));
const calcHabitualScore = (n: number) => Math.max(0, 100 - n * 7);

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
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
    if (!currentSession) navigate('/dashboard');
  }, [currentSession, navigate]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.getAttribute('data-section');
            if (id === 'overall' || id === 'voice' || id === 'posture') setActiveTab(id);
          }
        });
      },
      { root: container, threshold: 0.4 },
    );
    if (overallRef.current) observer.observe(overallRef.current);
    if (voiceRef.current) observer.observe(voiceRef.current);
    if (postureRef.current) observer.observe(postureRef.current);
    return () => observer.disconnect();
  }, [currentAttempt]);

  if (!currentSession) return null;
  if (!currentAttempt) { navigate('/dashboard'); return null; }

  // 기본값과 실제 데이터 병합
  const ar = {
    speechRate: 360, eyeContact: 78, duration: '8:30', confidence: 75,
    fillerWordCount: 6, silenceRatio: 10, pitchScore: 68, habitualBehaviorCount: 3,
    ...currentAttempt.analysisResults,
  };

  const radarData = [
    { metric: '말하기속도', score: calcSpeechRateScore(ar.speechRate) },
    { metric: '말버릇', score: calcFillerScore(ar.fillerWordCount ?? 6) },
    { metric: '침묵구간', score: calcSilenceScore(ar.silenceRatio ?? 10) },
    { metric: '높낮이', score: ar.pitchScore ?? 68 },
    { metric: '자세', score: ar.confidence },
    { metric: '습관행동', score: calcHabitualScore(ar.habitualBehaviorCount ?? 3) },
  ];

  const timelineData = [
    { time: '0:00', event: '발표 시작', type: 'start' as const },
    { time: '0:30', event: '도입부 - 주제 소개', type: 'content' as const },
    { time: '1:45', event: '본론 1 - 문제 정의', type: 'content' as const },
    { time: '4:10', event: '본론 2 - 해결방안', type: 'content' as const },
    { time: '6:45', event: '본론 3 - 기대효과', type: 'content' as const },
    { time: '8:00', event: '결론 및 마무리', type: 'content' as const },
    { time: '8:30', event: '발표 종료', type: 'end' as const },
  ];

  const scriptData = [
    { time: '0:00', text: '안녕하세요. 오늘 발표 연습 서비스에 대해 소개하겠습니다.' },
    { time: '0:30', text: '현재 많은 학생들과 직장인들이 발표에 대한 두려움을 가지고 있습니다. 우리 서비스는 이러한 문제를 해결하고자 합니다.' },
    { time: '1:45', text: '효과적인 발표를 위해서는 시선 처리, 음성 톤, 자세 등 다양한 요소가 필요합니다.' },
    { time: '4:10', text: '발표 영상을 업로드하면 6가지 지표로 자동으로 분석이 진행됩니다.' },
    { time: '6:45', text: '객관적인 피드백을 통해 발표 능력을 향상시킬 수 있습니다.' },
    { time: '8:00', text: '반복 연습을 통해 자신감을 키울 수 있습니다. 이상으로 발표를 마치겠습니다. 감사합니다.' },
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

        {/* ── 왼쪽: 영상 + 타임라인 ── */}
        <div className="flex flex-col gap-4 w-1/2 min-w-0">
          <div className="bg-black rounded-xl shadow-lg" style={{ height: '52vh' }}>
            {currentAttempt.videoUrl ? (
              <VideoPlayer
                videoUrl={currentAttempt.videoUrl}
                currentTime={currentVideoTime}
                onTimeUpdate={setCurrentVideoTime}
                className="rounded-xl overflow-hidden"
              />
            ) : (
              <div className="text-white text-center h-full flex flex-col items-center justify-center gap-2">
                <p className="text-lg">업로드된 영상이 없습니다</p>
                <p className="text-sm text-slate-400">새 발표를 시작하여 영상을 업로드해주세요</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-bold text-slate-900">타임라인</h2>
              {currentSession.attempts.length >= 2 ? (
                <button
                  onClick={() => navigate(`/presentation/compare/${sessionId}`)}
                  className="px-3 py-1.5 rounded-lg text-sm bg-green-700 text-white hover:bg-green-600 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  1회차 vs 2회차 비교
                </button>
              ) : (
                <button
                  onClick={handleRetry}
                  className="px-3 py-1.5 rounded-lg text-sm bg-blue-900 text-white hover:bg-blue-800 transition-colors flex items-center gap-1.5"
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

        {/* ── 오른쪽: 피드백 패널 ── */}
        <div className="w-1/2 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-h-0">
          {/* 고정 탭 */}
          <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
            {(['overall', 'voice', 'posture'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => scrollToSection(tab)}
                className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === tab
                    ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab === 'voice' && <Mic className="w-4 h-4" />}
                {tab === 'posture' && <User className="w-4 h-4" />}
                {tab === 'overall' ? '종합' : tab === 'voice' ? '음성' : '자세'}
              </button>
            ))}
          </div>

          {/* 스크롤 콘텐츠 */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">

            {/* ─── 종합 섹션 ─── */}
            <div ref={overallRef} data-section="overall" className="p-5 space-y-5">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">6가지 지표 요약</h3>

              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    dataKey="score"
                    stroke="#1e3a8a"
                    fill="#1e3a8a"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <RechartsTooltip content={<RadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-1">평균 발화 속도</p>
                  <p className="text-xl font-bold text-blue-900">
                    {ar.speechRate} <span className="text-xs font-normal">글자/분</span>
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <p className="text-xs font-semibold text-green-700 mb-1">정면 응시 비율</p>
                  <p className="text-xl font-bold text-green-900">
                    {ar.eyeContact}<span className="text-xs font-normal">%</span>
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">종합 평가</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  전반적으로 안정적인 발표였습니다. 명확한 논리 구조와 효과적인 제스처 활용이 돋보였으며,
                  청중과의 아이컨택도 양호한 편입니다. 다만 말하는 속도가 다소 빠르고, 중반부에 시선 처리가
                  산만해지는 경향이 있었습니다.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">발표 스크립트</h3>
                <div className="space-y-3">
                  {scriptData.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="flex-shrink-0 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-mono font-semibold h-fit">
                        {item.time}
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* ─── 음성 섹션 ─── */}
            <div ref={voiceRef} data-section="voice" className="p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-5 h-5 text-purple-700" />
                </div>
                <h3 className="text-base font-bold text-slate-900">음성 분석</h3>
              </div>

              {/* 말하기 속도 범위 게이지 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">말하기 속도</p>
                <RangeGauge
                  value={ar.speechRate}
                  optimalMin={280}
                  optimalMax={400}
                  unit="글자/분"
                  maxDisplay={600}
                />
              </div>

              {/* 침묵 구간 + 말버릇 + 높낮이 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-center">
                  <CircleProgress
                    value={ar.silenceRatio ?? 10}
                    unit="%"
                    label="침묵 구간 비율"
                    color={(ar.silenceRatio ?? 10) >= 5 && (ar.silenceRatio ?? 10) <= 20 ? '#16a34a' : '#dc2626'}
                  />
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-center">
                  <CountBadge
                    count={ar.fillerWordCount ?? 6}
                    label="말버릇 횟수"
                    thresholds={[5, 10]}
                  />
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-center">
                  <CircleProgress
                    value={ar.pitchScore ?? 68}
                    unit="점"
                    label="말의 높낮이"
                    color="#7c3aed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">개선 제안</h4>
                {[
                  '중요한 내용은 천천히 강조하며 말하세요',
                  '문장 사이에 자연스러운 쉼을 두세요',
                  '발화 속도를 분당 300자 수준으로 조절하세요',
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2 bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-purple-900">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* ─── 자세 섹션 ─── */}
            <div ref={postureRef} data-section="posture" className="p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-green-700" />
                </div>
                <h3 className="text-base font-bold text-slate-900">자세 및 응시</h3>
              </div>

              {/* 3가지 지표 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-center">
                  <CircleProgress
                    value={ar.eyeContact}
                    unit="%"
                    label="정면 응시 비율"
                    color={ar.eyeContact >= 70 ? '#16a34a' : '#dc2626'}
                  />
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-center">
                  <CircleProgress
                    value={ar.confidence}
                    unit="점"
                    label="자세 안정성"
                    color={ar.confidence >= 70 ? '#2563eb' : '#f59e0b'}
                  />
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-center">
                  <CountBadge
                    count={ar.habitualBehaviorCount ?? 3}
                    label="습관적 행동 횟수"
                    thresholds={[0, 7]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">개선 제안</h4>
                {[
                  '현재 수준을 유지하세요',
                  '가끔 무대를 이동하며 역동성을 더할 수 있습니다',
                  '제스처의 크기를 청중 규모에 맞게 조절하세요',
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2 bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-green-900">{s}</p>
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
