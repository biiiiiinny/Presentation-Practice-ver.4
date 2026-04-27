import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { VideoPlayer } from '../components/VideoPlayer';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, Eye, Mic,
  CheckCircle, XCircle, AlertTriangle, Clock, Award,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip as RechartsTooltip,
} from 'recharts';

// ── 기준값 ────────────────────────────────────────────────────────────────────
// 발화속도: 아나운서 표준 발화속도(300~350자/분) 참고, 일반 발표 여유 마진 포함
const SPEECH_MIN = 280;
const SPEECH_MAX = 400;
const EYE_THRESHOLD = 70;       // 정면 응시 권장 기준 (70% 이상)
const CONFIDENCE_THRESHOLD = 70; // 자신감 권장 기준 (70점 이상)
const DURATION_TOLERANCE = 0.1;  // 목표 시간 ±10% 허용

type ImprovementStatus = 'improved' | 'partial' | 'maintained' | 'worsened' | 'overcorrected';

interface ImprovementResult {
  status: ImprovementStatus;
  rate: number | null; // 개선율 % (해당 시)
  label: string;
}

// ── 헬퍼 함수 ─────────────────────────────────────────────────────────────────

const getSpeechRateCategory = (rate: number): '느림' | '적정' | '빠름' => {
  if (rate < SPEECH_MIN) return '느림';
  if (rate <= SPEECH_MAX) return '적정';
  return '빠름';
};

// 레이더 차트용 발화속도 점수 (0~100): 적정 범위일수록 높음
const getSpeechRateScore = (rate: number): number => {
  if (rate >= SPEECH_MIN && rate <= SPEECH_MAX) return 100;
  if (rate > SPEECH_MAX) return Math.max(0, Math.round(100 - (rate - SPEECH_MAX) * 0.5));
  return Math.max(0, Math.round(100 - (SPEECH_MIN - rate) * 0.5));
};

// 시간준수 점수 (0~100): 목표 시간 대비 오차가 클수록 낮음
const getDurationScore = (actualSec: number, limitSec: number): number => {
  if (limitSec <= 0) return 75;
  const deviation = Math.abs(actualSec - limitSec) / limitSec;
  return Math.max(0, Math.round(100 - deviation * 300));
};

const durationToSeconds = (d: string): number => {
  const [m, s] = d.split(':').map(Number);
  return m * 60 + s;
};

const analyzeSpeechRate = (r1: number, r2: number): ImprovementResult => {
  const cat1 = getSpeechRateCategory(r1);
  const cat2 = getSpeechRateCategory(r2);

  if (cat1 === '적정') {
    return cat2 === '적정'
      ? { status: 'maintained', rate: null, label: '적정 범위 유지' }
      : { status: 'worsened', rate: null, label: `${cat2}으로 저하` };
  }
  if (cat1 === '빠름') {
    if (cat2 === '느림') return { status: 'overcorrected', rate: null, label: '느림으로 과보정됨' };
    if (cat2 === '적정') return { status: 'improved', rate: 100, label: '적정 범위 진입 (완전 개선)' };
    const rate = Math.round(Math.max(0, (r1 - r2) / (r1 - SPEECH_MAX) * 100));
    return rate > 0
      ? { status: 'partial', rate, label: `${rate}% 개선 (아직 빠름)` }
      : { status: 'worsened', rate: null, label: '더 빨라짐' };
  }
  // 느림
  if (cat2 === '빠름') return { status: 'overcorrected', rate: null, label: '빠름으로 과보정됨' };
  if (cat2 === '적정') return { status: 'improved', rate: 100, label: '적정 범위 진입 (완전 개선)' };
  const rate = Math.round(Math.max(0, (r2 - r1) / (SPEECH_MIN - r1) * 100));
  return rate > 0
    ? { status: 'partial', rate, label: `${rate}% 개선 (아직 느림)` }
    : { status: 'worsened', rate: null, label: '더 느려짐' };
};

const analyzeEyeContact = (e1: number, e2: number): ImprovementResult => {
  if (e1 >= EYE_THRESHOLD) {
    return e2 >= EYE_THRESHOLD
      ? { status: 'maintained', rate: null, label: '양호 유지' }
      : { status: 'worsened', rate: null, label: `${EYE_THRESHOLD}% 이하로 저하` };
  }
  if (e2 >= EYE_THRESHOLD) return { status: 'improved', rate: 100, label: '기준 이상 달성 (완전 개선)' };
  if (e2 > e1) {
    const rate = Math.round((e2 - e1) / (EYE_THRESHOLD - e1) * 100);
    return { status: 'partial', rate, label: `${rate}% 개선 (아직 부족)` };
  }
  return { status: 'worsened', rate: null, label: '더 낮아짐' };
};

const analyzeConfidence = (c1: number, c2: number): ImprovementResult => {
  if (c1 >= CONFIDENCE_THRESHOLD) {
    return c2 >= CONFIDENCE_THRESHOLD
      ? { status: 'maintained', rate: null, label: '양호 유지' }
      : { status: 'worsened', rate: null, label: '저하됨' };
  }
  if (c2 >= CONFIDENCE_THRESHOLD) return { status: 'improved', rate: 100, label: '기준 이상 달성' };
  if (c2 > c1) {
    const rate = Math.round((c2 - c1) / (CONFIDENCE_THRESHOLD - c1) * 100);
    return { status: 'partial', rate, label: `${rate}% 개선` };
  }
  return { status: 'worsened', rate: null, label: '더 낮아짐' };
};

const analyzeDuration = (sec1: number, sec2: number, limitSec: number): ImprovementResult => {
  if (limitSec <= 0) return { status: 'maintained', rate: null, label: '목표 시간 미설정' };
  const dev1 = Math.abs(sec1 - limitSec) / limitSec;
  const dev2 = Math.abs(sec2 - limitSec) / limitSec;
  if (dev1 <= DURATION_TOLERANCE) {
    return dev2 <= DURATION_TOLERANCE
      ? { status: 'maintained', rate: null, label: '목표 시간 준수 유지' }
      : { status: 'worsened', rate: null, label: '시간 준수 저하' };
  }
  if (dev2 <= DURATION_TOLERANCE) return { status: 'improved', rate: 100, label: '목표 시간 내 완료 (완전 개선)' };
  if (dev2 < dev1) {
    const rate = Math.round((dev1 - dev2) / dev1 * 100);
    return { status: 'partial', rate, label: `${rate}% 개선 (목표 시간과 차이 있음)` };
  }
  return { status: 'worsened', rate: null, label: '시간 오차 증가' };
};

// ── 상태 배지 컴포넌트 ─────────────────────────────────────────────────────────
function StatusBadge({ status, rate }: { status: ImprovementStatus; rate: number | null }) {
  const base = 'flex items-center gap-1.5 font-semibold text-sm';
  if (status === 'improved') return (
    <div className={`${base} text-green-700`}>
      <CheckCircle className="w-4 h-4" />
      <span>개선됨</span>
      {rate !== null && <span className="text-xs bg-green-100 px-1.5 py-0.5 rounded-full">{rate}%</span>}
    </div>
  );
  if (status === 'partial') return (
    <div className={`${base} text-blue-600`}>
      <TrendingUp className="w-4 h-4" />
      <span>부분 개선</span>
      {rate !== null && <span className="text-xs bg-blue-100 px-1.5 py-0.5 rounded-full">{rate}%</span>}
    </div>
  );
  if (status === 'maintained') return (
    <div className={`${base} text-slate-500`}>
      <Minus className="w-4 h-4" />
      <span>유지</span>
    </div>
  );
  if (status === 'overcorrected') return (
    <div className={`${base} text-yellow-600`}>
      <AlertTriangle className="w-4 h-4" />
      <span>과보정</span>
    </div>
  );
  return (
    <div className={`${base} text-red-600`}>
      <XCircle className="w-4 h-4" />
      <span>저하됨</span>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function ComparisonPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { sessions } = useApp();

  const currentSession = sessions.find(s => s.id === sessionId);

  if (!currentSession || currentSession.attempts.length < 2) {
    navigate('/dashboard');
    return null;
  }

  const attempt1 = currentSession.attempts[0];
  const attempt2 = currentSession.attempts[1];

  const attempt1Data = attempt1.analysisResults ?? {
    speechRate: 360, eyeContact: 78, duration: '8:30', confidence: 75,
  };
  const attempt2Data = attempt2.analysisResults ?? {
    speechRate: 330, eyeContact: 85, duration: '9:00', confidence: 85,
  };

  const attempt1Seconds = durationToSeconds(attempt1Data.duration);
  const attempt2Seconds = durationToSeconds(attempt2Data.duration);
  const timeLimitSeconds = currentSession.formData?.timeLimit
    ? parseInt(currentSession.formData.timeLimit) * 60 : 0;

  // ── 개선 분석 ──────────────────────────────────────────────────────────────
  const speechImprovement   = analyzeSpeechRate(attempt1Data.speechRate, attempt2Data.speechRate);
  const eyeImprovement      = analyzeEyeContact(attempt1Data.eyeContact, attempt2Data.eyeContact);
  const confidenceImprovement = analyzeConfidence(attempt1Data.confidence, attempt2Data.confidence);
  const durationImprovement = analyzeDuration(attempt1Seconds, attempt2Seconds, timeLimitSeconds);

  // ── 레이더 차트 데이터 ─────────────────────────────────────────────────────
  const radarData = [
    {
      metric: '발화속도',
      '1회차': getSpeechRateScore(attempt1Data.speechRate),
      '2회차': getSpeechRateScore(attempt2Data.speechRate),
    },
    {
      metric: '눈맞춤',
      '1회차': attempt1Data.eyeContact,
      '2회차': attempt2Data.eyeContact,
    },
    {
      metric: '자신감',
      '1회차': attempt1Data.confidence,
      '2회차': attempt2Data.confidence,
    },
    {
      metric: '시간준수',
      '1회차': getDurationScore(attempt1Seconds, timeLimitSeconds),
      '2회차': getDurationScore(attempt2Seconds, timeLimitSeconds),
    },
  ];

  // ── 피드백 수용 현황 아이템 ────────────────────────────────────────────────
  const feedbackItems = [
    {
      title: '발화 속도',
      icon: <Mic className="w-4 h-4" />,
      attempt1Value: `${attempt1Data.speechRate}자/분 (${getSpeechRateCategory(attempt1Data.speechRate)})`,
      attempt2Value: `${attempt2Data.speechRate}자/분 (${getSpeechRateCategory(attempt2Data.speechRate)})`,
      result: speechImprovement,
      note: '기준: 280~400자/분 (아나운서 표준 발화속도 참고)',
    },
    {
      title: '정면 응시',
      icon: <Eye className="w-4 h-4" />,
      attempt1Value: `${attempt1Data.eyeContact}%`,
      attempt2Value: `${attempt2Data.eyeContact}%`,
      result: eyeImprovement,
      note: '기준: 70% 이상 권장',
    },
    {
      title: '자신감 지수',
      icon: <Award className="w-4 h-4" />,
      attempt1Value: `${attempt1Data.confidence}점`,
      attempt2Value: `${attempt2Data.confidence}점`,
      result: confidenceImprovement,
      note: '기준: 70점 이상 권장',
    },
    ...(timeLimitSeconds > 0 ? [{
      title: '발표 시간 준수',
      icon: <Clock className="w-4 h-4" />,
      attempt1Value: attempt1Data.duration,
      attempt2Value: attempt2Data.duration,
      result: durationImprovement,
      note: `목표: ${currentSession.formData?.timeLimit}분 (±10%)`,
    }] : []),
  ];

  // ── 종합 의견 ──────────────────────────────────────────────────────────────
  const improvedItems  = feedbackItems.filter(i => i.result.status === 'improved' || i.result.status === 'partial');
  const worsenedItems  = feedbackItems.filter(i => i.result.status === 'worsened' || i.result.status === 'overcorrected');

  const overallOpinion = (() => {
    if (improvedItems.length >= 3) {
      const worsenedText = worsenedItems.length > 0
        ? ` 다만 ${worsenedItems.map(i => i.title).join(', ')} 항목에 조금 더 집중해보세요.`
        : ' 모든 항목에서 긍정적인 변화가 확인됩니다.';
      return `이번 재발표에서 ${improvedItems.length}개 항목이 개선되었습니다. 꾸준한 연습의 효과가 나타나고 있습니다.${worsenedText}`;
    }
    if (improvedItems.length >= 1) {
      const worsenedText = worsenedItems.length > 0
        ? ` ${worsenedItems.map(i => i.title).join(', ')} 부분은 다음 발표 시 집중적으로 보완해보세요.`
        : '';
      return `${improvedItems.map(i => i.title).join(', ')} 항목에서 개선이 확인됩니다.${worsenedText}`;
    }
    return '이번 재발표에서 전반적인 개선이 확인되지 않았습니다. 1회차 피드백을 다시 확인하고 항목별 개선 목표를 설정해 재도전해보세요.';
  })();

  // ── 지표 카드 공통 헬퍼 ───────────────────────────────────────────────────
  const getChangeIcon = (improved: boolean, change: number) => {
    if (change === 0) return <Minus className="w-4 h-4 text-slate-500" />;
    return improved
      ? <TrendingUp className="w-4 h-4 text-green-600" />
      : <TrendingDown className="w-4 h-4 text-red-600" />;
  };
  const getChangeColor = (improved: boolean, change: number) => {
    if (change === 0) return 'text-slate-600';
    return improved ? 'text-green-600' : 'text-red-600';
  };

  const speechRateImproved = getSpeechRateScore(attempt2Data.speechRate) > getSpeechRateScore(attempt1Data.speechRate);
  const speechRateChange   = attempt2Data.speechRate - attempt1Data.speechRate;
  const eyeChange          = attempt2Data.eyeContact - attempt1Data.eyeContact;
  const confidenceChange   = attempt2Data.confidence - attempt1Data.confidence;
  const durationDiff       = attempt2Seconds - attempt1Seconds;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(`/presentation/results/${sessionId}/2`)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">1회차 vs 2회차 비교</h1>
            <p className="text-sm text-slate-600 mt-0.5">{currentSession.title}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ⓪ 영상 비교 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">영상 비교</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">1회차</p>
              {attempt1.videoUrl ? (
                <VideoPlayer videoUrl={attempt1.videoUrl} />
              ) : (
                <div className="bg-slate-100 rounded-xl aspect-video flex items-center justify-center">
                  <span className="text-slate-400 text-sm">업로드된 영상 없음</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">2회차</p>
              {attempt2.videoUrl ? (
                <VideoPlayer videoUrl={attempt2.videoUrl} />
              ) : (
                <div className="bg-slate-100 rounded-xl aspect-video flex items-center justify-center">
                  <span className="text-slate-400 text-sm">업로드된 영상 없음</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ① 종합 비교 차트 (레이더) */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-1">종합 비교 차트</h2>
          <p className="text-sm text-slate-500 mb-6">
            각 항목을 0~100점으로 정규화한 점수입니다.
            발화속도는 적정 범위(280~400자/분)에 가까울수록 높은 점수입니다.
          </p>
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tickCount={5}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Radar
                name="1회차"
                dataKey="1회차"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Radar
                name="2회차"
                dataKey="2회차"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Legend iconType="circle" />
              <RechartsTooltip
                formatter={(value: number | string | undefined) => [`${value ?? 0}점`, '']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* ② 피드백 수용 현황 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-1">피드백 수용 현황</h2>
          <p className="text-sm text-slate-500 mb-5">
            1회차 결과 기반으로 2회차에서 각 항목이 얼마나 개선됐는지 추적합니다.
          </p>
          <div className="space-y-3">
            {feedbackItems.map((item, idx) => {
              const statusColors: Record<ImprovementStatus, string> = {
                improved:     'bg-green-50 border-green-200',
                partial:      'bg-blue-50 border-blue-200',
                maintained:   'bg-slate-50 border-slate-200',
                overcorrected:'bg-yellow-50 border-yellow-200',
                worsened:     'bg-red-50 border-red-200',
              };
              const iconColors: Record<ImprovementStatus, string> = {
                improved:     'text-green-700',
                partial:      'text-blue-700',
                maintained:   'text-slate-500',
                overcorrected:'text-yellow-700',
                worsened:     'text-red-700',
              };
              return (
                <div key={idx} className={`p-4 rounded-xl border ${statusColors[item.result.status]}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={iconColors[item.result.status]}>{item.icon}</span>
                        <span className="font-bold text-slate-800">{item.title}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                          1회차: {item.attempt1Value}
                        </span>
                        <span>→</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                          2회차: {item.attempt2Value}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{item.note}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={item.result.status} rate={item.result.rate} />
                      <span className="text-xs text-slate-500 text-right">{item.result.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ③ 주요 지표 비교 카드 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">주요 지표 비교</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* 발화 속도 */}
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Mic className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-blue-900">발화 속도</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800">1회차</span>
                  <span className="text-lg font-semibold text-blue-900">{attempt1Data.speechRate} 자/분</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800">2회차</span>
                  <span className="text-lg font-semibold text-blue-900">{attempt2Data.speechRate} 자/분</span>
                </div>
                <div className={`flex items-center gap-2 pt-2 border-t border-blue-300 ${getChangeColor(speechRateImproved, speechRateChange)}`}>
                  {getChangeIcon(speechRateImproved, speechRateChange)}
                  <span className="font-bold">{speechRateChange > 0 ? '+' : ''}{speechRateChange} 자/분</span>
                </div>
              </div>
            </div>

            {/* 정면 응시 비율 */}
            <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-green-700" />
                <h3 className="font-bold text-green-900">정면 응시 비율</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-800">1회차</span>
                  <span className="text-lg font-semibold text-green-900">{attempt1Data.eyeContact}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-800">2회차</span>
                  <span className="text-lg font-semibold text-green-900">{attempt2Data.eyeContact}%</span>
                </div>
                <div className={`flex items-center gap-2 pt-2 border-t border-green-300 ${getChangeColor(eyeChange > 0, eyeChange)}`}>
                  {getChangeIcon(eyeChange > 0, eyeChange)}
                  <span className="font-bold">{eyeChange > 0 ? '+' : ''}{eyeChange}%p</span>
                </div>
              </div>
            </div>

            {/* 발표 시간 */}
            <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-purple-900">발표 시간</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-800">1회차</span>
                  <span className="text-lg font-semibold text-purple-900">{attempt1Data.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-800">2회차</span>
                  <span className="text-lg font-semibold text-purple-900">{attempt2Data.duration}</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-purple-300 text-slate-600">
                  <Minus className="w-4 h-4" />
                  <span className="font-bold">{durationDiff >= 0 ? '+' : ''}{durationDiff}초</span>
                </div>
              </div>
            </div>

            {/* 자신감 */}
            <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-orange-700" />
                <h3 className="font-bold text-orange-900">자신감 지수</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-800">1회차</span>
                  <span className="text-lg font-semibold text-orange-900">{attempt1Data.confidence}점</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-800">2회차</span>
                  <span className="text-lg font-semibold text-orange-900">{attempt2Data.confidence}점</span>
                </div>
                <div className={`flex items-center gap-2 pt-2 border-t border-orange-300 ${getChangeColor(confidenceChange > 0, confidenceChange)}`}>
                  {getChangeIcon(confidenceChange > 0, confidenceChange)}
                  <span className="font-bold">{confidenceChange > 0 ? '+' : ''}{confidenceChange}점</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ④ 종합 의견 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
          <h2 className="text-xl font-bold text-blue-900 mb-3">종합 의견</h2>
          <p className="text-slate-700 leading-relaxed">{overallOpinion}</p>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-4 justify-center pb-8">
          <button
            onClick={() => navigate(`/presentation/results/${sessionId}/1`)}
            className="px-6 py-3 bg-white border-2 border-blue-900 text-blue-900 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            1회차 결과 보기
          </button>
          <button
            onClick={() => navigate(`/presentation/results/${sessionId}/2`)}
            className="px-6 py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors"
          >
            2회차 결과 보기
          </button>
        </div>
      </div>
    </div>
  );
}
