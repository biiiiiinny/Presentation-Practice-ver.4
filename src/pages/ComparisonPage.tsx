import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import type { ChecklistItem } from '../contexts/AppContext';
import { VideoPlayer } from '../components/VideoPlayer';
import {
  ArrowLeft, TrendingUp, Minus, Eye, Mic,
  CheckCircle, XCircle, AlertTriangle, Clock, Award, Activity,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip as RechartsTooltip,
  AreaChart, Area,
} from 'recharts';

// ── 기준값 ────────────────────────────────────────────────────────────────────
// 발화속도: 아나운서 표준 발화속도(300~350자/분) 참고, 일반 발표 여유 마진 포함
const SPEECH_MIN = 270;
const SPEECH_MAX = 330;
const EYE_THRESHOLD = 70;        // 정면 응시 권장 기준 (70% 이상)
const CONFIDENCE_THRESHOLD = 70; // 자세 안정성 권장 기준 (70점 이상)
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


// ── 3단계 레벨 변환 함수 (0=개선필요, 1=주의, 2=적정) ─────────────────────────
const toSpeechLevel = (rate: number): number =>
  rate >= 270 && rate <= 330 ? 3 : rate >= 240 && rate <= 360 ? 2 : 1;
const toPitchLevel = (hz: number): number =>
  hz >= 15 && hz <= 35 ? 3 : hz >= 8 && hz <= 50 ? 2 : 1;
const toPostureLevel = (score: number): number => score >= 70 ? 3 : score >= 50 ? 2 : 1;
const toEyeLevel = (pct: number): number => pct >= 70 ? 3 : pct >= 50 ? 2 : 1;

// ── 체크리스트 헬퍼 ───────────────────────────────────────────────────────────

function generateMockChecklist(ar: {
  speechRate: number; eyeContact: number; pitchVariation: number;
}): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  if (ar.speechRate < 270 || ar.speechRate > 330)
    items.push({ id: 'speechRate', category: 'voice', metric_key: 'speechRate',
      condition: 'in_range', target_min: 270, target_max: 330, is_completed: false,
      label: ar.speechRate < 270
        ? `발화 속도 높이기 · 현재 ${ar.speechRate}음절/분 → 목표 270–330`
        : `발화 속도 줄이기 · 현재 ${ar.speechRate}음절/분 → 목표 270–330` });
  if (ar.pitchVariation < 15 || ar.pitchVariation > 35)
    items.push({ id: 'pitchVariation', category: 'voice', metric_key: 'pitchVariation',
      condition: 'in_range', target_min: 15, target_max: 35, is_completed: false,
      label: ar.pitchVariation < 15
        ? `피치 변화폭 늘리기 · 현재 ${ar.pitchVariation}Hz → 목표 15–35Hz`
        : `피치 변화폭 줄이기 · 현재 ${ar.pitchVariation}Hz → 목표 15–35Hz` });
  if (ar.eyeContact < 70)
    items.push({ id: 'eyeContact', category: 'posture', metric_key: 'eyeContact',
      condition: 'gte', target_min: 70, is_completed: false,
      label: `정면 응시 비율 높이기 · 현재 ${ar.eyeContact}% → 목표 70% 이상` });
  return items;
}

function checkActuallyAchieved(item: ChecklistItem, data: Record<string, number | undefined>): boolean {
  if (!item.metric_key) return false;
  const val = data[item.metric_key];
  if (val == null) return false;
  if (item.condition === 'in_range')
    return val >= (item.target_min ?? -Infinity) && val <= (item.target_max ?? Infinity);
  if (item.condition === 'gte') return val >= (item.target_min ?? -Infinity);
  if (item.condition === 'lte') return val <= (item.target_max ?? Infinity);
  return false;
}

function getMetricDisplay(item: ChecklistItem, data: Record<string, number | undefined>): string {
  if (!item.metric_key) return '—';
  const val = data[item.metric_key];
  if (val == null) return '—';
  if (item.metric_key === 'speechRate') return `${val}음절/분`;
  if (item.metric_key === 'pitchVariation') return `${val}Hz`;
  if (item.metric_key === 'eyeContact') return `${val}%`;
  return String(val);
}

// ── KPI 비교 스파크라인 헬퍼 ──────────────────────────────────────────────────
function generateCompSparkline(base: number, seed: number, count = 12): number[] {
  return Array.from({ length: count }, (_, i) =>
    Math.round(base * (1 + Math.sin(i * 0.9 + seed) * 0.1))
  );
}

const analyzePitchVariation = (p1: number, p2: number): ImprovementResult => {
  const inRange1 = p1 >= 70 && p1 <= 90;
  const inRange2 = p2 >= 70 && p2 <= 90;
  if (inRange1) {
    return inRange2
      ? { status: 'maintained', rate: null, label: '적정 범위 유지' }
      : { status: 'worsened', rate: null, label: '적정 범위 이탈' };
  }
  if (inRange2) return { status: 'improved', rate: 100, label: '적정 범위 진입 (완전 개선)' };
  const dist1 = p1 < 70 ? 70 - p1 : p1 - 90;
  const dist2 = p2 < 70 ? 70 - p2 : p2 - 90;
  if (dist2 < dist1) {
    const rate = Math.min(99, Math.round((dist1 - dist2) / dist1 * 100));
    return { status: 'partial', rate, label: `${rate}% 개선` };
  }
  return { status: 'worsened', rate: null, label: '범위 이탈 증가' };
};

const analyzeLateSpeed = (r1: number, r2: number): ImprovementResult => {
  const good1 = Math.abs(r1 - 1.0) <= 0.05;
  const good2 = Math.abs(r2 - 1.0) <= 0.05;
  if (good1) {
    return good2
      ? { status: 'maintained', rate: null, label: '균등 속도 유지' }
      : { status: 'worsened', rate: null, label: '후반부 속도 불균등 증가' };
  }
  if (good2) return { status: 'improved', rate: 100, label: '균등 속도 달성 (완전 개선)' };
  const dev1 = Math.abs(r1 - 1.0);
  const dev2 = Math.abs(r2 - 1.0);
  if (dev2 < dev1) {
    const rate = Math.min(99, Math.round((dev1 - dev2) / (dev1 - 0.05) * 100));
    return { status: 'partial', rate, label: `${rate}% 개선` };
  }
  return { status: 'worsened', rate: null, label: '후반부 속도 불균등 악화' };
};

// ── 상태 배지 컴포넌트 ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ImprovementStatus }) {
  const base = 'flex items-center gap-1.5 font-semibold text-sm';
  if (status === 'improved') return (
    <div className={`${base} text-green-700`}>
      <CheckCircle className="w-4 h-4" />
      <span>개선됨</span>
    </div>
  );
  if (status === 'partial') return (
    <div className={`${base} text-blue-600`}>
      <TrendingUp className="w-4 h-4" />
      <span>부분 개선</span>
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

// ── KPI 비교 카드 ─────────────────────────────────────────────────────────────
const C1 = '#6366f1'; // 1회차 indigo
const C2 = '#10b981'; // 2회차 emerald

const LEVEL_BADGE: Record<number, { label: string; cls: string }> = {
  1: { label: '개선필요', cls: 'bg-red-100 text-red-700' },
  2: { label: '주의',    cls: 'bg-orange-100 text-orange-700' },
  3: { label: '적정',   cls: 'bg-green-100 text-green-700' },
};

function KPICompareCard({
  label, unit, val1, val2, spark1, spark2, trend, gradKey, level1, level2,
}: {
  label: string; unit: string; val1: string; val2: string;
  spark1: number[]; spark2: number[]; trend: 'up' | 'down' | 'flat';
  gradKey: string; level1: number; level2: number;
}) {
  const chartData = spark1.map((v, i) => ({ i, v1: v, v2: spark2[i] }));
  const gradId1 = `cg1-${gradKey}`;
  const gradId2 = `cg2-${gradKey}`;
  const b1 = LEVEL_BADGE[level1];
  const b2 = LEVEL_BADGE[level2];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-3 gap-1.5 min-w-0">
      {/* 헤더 행: 라벨 + 트렌드 배지 */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 truncate">{label}</p>
        {trend === 'up' ? (
          <span className="text-xs font-bold text-green-600 flex-shrink-0">▲</span>
        ) : trend === 'down' ? (
          <span className="text-xs font-bold text-red-600 flex-shrink-0">▼</span>
        ) : (
          <span className="text-xs font-bold text-slate-400 flex-shrink-0">—</span>
        )}
      </div>
      {/* 수치 행 */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: C1 }} />
          <span className="text-xs text-slate-400">1회차</span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-auto ${b1.cls}`}>{b1.label}</span>
          <span className="text-lg font-bold text-slate-800 leading-none">{val1}</span>
          <span className="text-xs text-slate-400">{unit}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: C2 }} />
          <span className="text-xs text-slate-400">2회차</span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-auto ${b2.cls}`}>{b2.label}</span>
          <span className="text-lg font-bold text-slate-800 leading-none">{val2}</span>
          <span className="text-xs text-slate-400">{unit}</span>
        </div>
      </div>
      {/* 스파크라인 */}
      <div className="mt-0.5">
        <ResponsiveContainer width="100%" height={44}>
          <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradId1} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C1} stopOpacity={0.2} />
                <stop offset="95%" stopColor={C1} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={gradId2} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C2} stopOpacity={0.2} />
                <stop offset="95%" stopColor={C2} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v1" stroke={C1} fill={`url(#${gradId1})`} strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="v2" stroke={C2} fill={`url(#${gradId2})`} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── 레이더 차트 커스텀 툴팁 ───────────────────────────────────────────────────
const RADAR_LEVEL_LABEL: Record<number, string> = { 1: '개선필요', 2: '주의', 3: '적정' };

const ComparisonRadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800 mb-1">{payload[0]?.payload?.metric}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="mt-0.5">
          {p.name}: {RADAR_LEVEL_LABEL[p.value as number]}
        </p>
      ))}
    </div>
  );
};

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
    speechRate: 360, eyeContact: 78, duration: '8:30', postureScore: 75,
    pitchVariation: 75, avgIPsPerSentence: 3.5, avgWordsPerSentence: 10,
    lateSpeedRatio: 1.05, longPauseCount: 2, wordPauseCount: 12, fillerRate: 0.35,
  };
  const attempt2Data = attempt2.analysisResults ?? {
    speechRate: 330, eyeContact: 85, duration: '9:00', postureScore: 85,
    pitchVariation: 80, avgIPsPerSentence: 2.9, avgWordsPerSentence: 10,
    lateSpeedRatio: 1.02, longPauseCount: 1, wordPauseCount: 9, fillerRate: 0.28,
  };

  const attempt1Seconds = durationToSeconds(attempt1Data.duration);
  const attempt2Seconds = durationToSeconds(attempt2Data.duration);
  const timeLimitSeconds = currentSession.formData?.timeLimit
    ? parseInt(currentSession.formData.timeLimit) * 60 : 0;

  // ── 개선 분석 ──────────────────────────────────────────────────────────────
  const speechImprovement     = analyzeSpeechRate(attempt1Data.speechRate, attempt2Data.speechRate);
  const eyeImprovement        = analyzeEyeContact(attempt1Data.eyeContact, attempt2Data.eyeContact);
  const postureScoreImprovement = analyzeConfidence(attempt1Data.postureScore, attempt2Data.postureScore);
  const durationImprovement   = analyzeDuration(attempt1Seconds, attempt2Seconds, timeLimitSeconds);
  const pitchImprovement      = analyzePitchVariation(attempt1Data.pitchVariation ?? 75, attempt2Data.pitchVariation ?? 75);
  const lateSpeedImprovement  = analyzeLateSpeed(attempt1Data.lateSpeedRatio ?? 1.05, attempt2Data.lateSpeedRatio ?? 1.05);

  // ── 레이더 차트 데이터 ─────────────────────────────────────────────────────
  const radarData = [
    { metric: '발화 속도',  '1회차': toSpeechLevel(attempt1Data.speechRate),           '2회차': toSpeechLevel(attempt2Data.speechRate) },
    { metric: '피치 변화폭', '1회차': toPitchLevel(attempt1Data.pitchVariation ?? 75), '2회차': toPitchLevel(attempt2Data.pitchVariation ?? 75) },
    { metric: '자세',       '1회차': toPostureLevel(attempt1Data.postureScore),         '2회차': toPostureLevel(attempt2Data.postureScore) },
    { metric: '정면 응시',  '1회차': toEyeLevel(attempt1Data.eyeContact),              '2회차': toEyeLevel(attempt2Data.eyeContact) },
  ];

  // ── 피드백 수용 현황 아이템 ────────────────────────────────────────────────
  const feedbackItems = [
    {
      title: '발화 속도',
      icon: <Mic className="w-4 h-4" />,
      attempt1Value: `${attempt1Data.speechRate}음절/분 (${getSpeechRateCategory(attempt1Data.speechRate)})`,
      attempt2Value: `${attempt2Data.speechRate}음절/분 (${getSpeechRateCategory(attempt2Data.speechRate)})`,
      result: speechImprovement,
      note: '기준: 270~330음절/분',
    },
    {
      title: '피치 변화폭',
      icon: <Activity className="w-4 h-4" />,
      attempt1Value: `${attempt1Data.pitchVariation ?? 75}Hz`,
      attempt2Value: `${attempt2Data.pitchVariation ?? 75}Hz`,
      result: pitchImprovement,
      note: '기준: 70~90Hz',
    },
    {
      title: '후반부 말속도',
      icon: <Activity className="w-4 h-4" />,
      attempt1Value: `${attempt1Data.lateSpeedRatio ?? 1.05}배`,
      attempt2Value: `${attempt2Data.lateSpeedRatio ?? 1.05}배`,
      result: lateSpeedImprovement,
      note: '기준: 1.0 ± 0.05',
    },
    {
      title: '자세 안정성',
      icon: <Award className="w-4 h-4" />,
      attempt1Value: `${attempt1Data.postureScore}점`,
      attempt2Value: `${attempt2Data.postureScore}점`,
      result: postureScoreImprovement,
      note: '기준: 70점 이상',
    },
    {
      title: '정면 응시',
      icon: <Eye className="w-4 h-4" />,
      attempt1Value: `${attempt1Data.eyeContact}%`,
      attempt2Value: `${attempt2Data.eyeContact}%`,
      result: eyeImprovement,
      note: '기준: 70% 이상',
    },
    ...(timeLimitSeconds > 0 ? [{
      title: '발표 시간',
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

  const p1 = attempt1Data.pitchVariation ?? 75;
  const p2 = attempt2Data.pitchVariation ?? 75;

  const speechTrend: 'up' | 'down' | 'flat' =
    attempt2Data.speechRate > attempt1Data.speechRate ? 'up' :
    attempt2Data.speechRate < attempt1Data.speechRate ? 'down' : 'flat';
  const pitchTrend: 'up' | 'down' | 'flat' =
    p2 > p1 ? 'up' : p2 < p1 ? 'down' : 'flat';
  const eyeTrend: 'up' | 'down' | 'flat' =
    attempt2Data.eyeContact > attempt1Data.eyeContact ? 'up' :
    attempt2Data.eyeContact < attempt1Data.eyeContact ? 'down' : 'flat';

  // ── 자가 체크리스트 비교 ───────────────────────────────────────────────────
  const checklistItems: ChecklistItem[] = attempt1.checklist?.length
    ? attempt1.checklist
    : generateMockChecklist({
        speechRate: attempt1Data.speechRate,
        eyeContact: attempt1Data.eyeContact,
        pitchVariation: attempt1Data.pitchVariation ?? 75,
      });

  const attempt2DataMap: Record<string, number | undefined> = {
    speechRate: attempt2Data.speechRate,
    eyeContact: attempt2Data.eyeContact,
    pitchVariation: attempt2Data.pitchVariation,
  };
  const attempt1DataMap: Record<string, number | undefined> = {
    speechRate: attempt1Data.speechRate,
    eyeContact: attempt1Data.eyeContact,
    pitchVariation: attempt1Data.pitchVariation,
  };

  const speechSpark1 = generateCompSparkline(attempt1Data.speechRate, 1);
  const speechSpark2 = generateCompSparkline(attempt2Data.speechRate, 2);
  const pitchSpark1  = generateCompSparkline(p1, 3);
  const pitchSpark2  = generateCompSparkline(p2, 4);
  const eyeSpark1    = generateCompSparkline(attempt1Data.eyeContact, 5);
  const eyeSpark2    = generateCompSparkline(attempt2Data.eyeContact, 6);

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="px-6 py-4 flex items-center gap-4">
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

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">

        {/* 왼쪽: 영상 비교 */}
        <div className="w-1/2 flex flex-col min-w-0">
          <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-200 flex flex-col flex-1 gap-3 overflow-hidden">
            <h2 className="text-base font-bold text-slate-900 pl-3 border-l-4 border-blue-900 flex-shrink-0">영상 비교</h2>
            <div className="flex flex-col flex-1 gap-3 min-h-0">
              <div className="flex-1 flex flex-col min-h-0">
                <p className="text-sm font-bold text-slate-700 mb-2 flex-shrink-0">1회차</p>
                {attempt1.videoUrl ? (
                  <div className="flex-1 min-h-0 overflow-hidden rounded-xl">
                    <VideoPlayer videoUrl={attempt1.videoUrl} />
                  </div>
                ) : (
                  <div className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center">
                    <span className="text-slate-400 text-sm">업로드된 영상 없음</span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <p className="text-sm font-bold text-slate-700 mb-2 flex-shrink-0">2회차</p>
                {attempt2.videoUrl ? (
                  <div className="flex-1 min-h-0 overflow-hidden rounded-xl">
                    <VideoPlayer videoUrl={attempt2.videoUrl} />
                  </div>
                ) : (
                  <div className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center">
                    <span className="text-slate-400 text-sm">업로드된 영상 없음</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 모든 지표 (스크롤) */}
        <div className="w-1/2 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto scrollbar-hide">

            {/* 종합 의견 */}
            <div className="p-5">
              <h3 className="text-base font-bold text-slate-900 pl-3 border-l-4 border-blue-900 mb-3">종합 의견</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{overallOpinion}</p>
            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* 종합 비교 차트 */}
            <div className="p-5">
              <h3 className="text-base font-bold text-slate-900 pl-3 border-l-4 border-blue-900 mb-1">종합 비교 차트</h3>
              <p className="text-sm text-slate-500 mb-3">
                각 항목을 개선필요 · 주의 · 적정 3단계로 평가합니다.
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 3]} tickCount={4} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="1회차" dataKey="1회차" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="2회차" dataKey="2회차" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  <Legend iconType="circle" />
                  <RechartsTooltip content={<ComparisonRadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* 피드백 수용 현황 */}
            <div className="p-5">
              <h3 className="text-base font-bold text-slate-900 pl-3 border-l-4 border-blue-900 mb-1">피드백 수용 현황</h3>
              <p className="text-sm text-slate-500 mb-4">1회차 결과 기반으로 2회차에서 각 항목이 얼마나 개선됐는지 추적합니다.</p>
              <div className="grid grid-cols-2 gap-2.5">
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
                    <div key={idx} className={`p-3 rounded-xl border ${statusColors[item.result.status]}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={iconColors[item.result.status]}>{item.icon}</span>
                        <span className="font-bold text-slate-800 text-sm">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-600 mb-1.5 flex-wrap">
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">{item.attempt1Value}</span>
                        <span className="text-slate-400">→</span>
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">{item.attempt2Value}</span>
                      </div>
                      <StatusBadge status={item.result.status} />
                      <p className="text-xs text-slate-400 mt-1">{item.result.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* KPI 비교 */}
            <div className="p-5">
              <h3 className="text-base font-bold text-slate-900 pl-3 border-l-4 border-blue-900 mb-4">KPI 비교</h3>
              <div className="grid grid-cols-3 gap-3">
                <KPICompareCard
                  label="발화 속도" unit="음절/분" gradKey="speech"
                  val1={String(attempt1Data.speechRate)} val2={String(attempt2Data.speechRate)}
                  spark1={speechSpark1} spark2={speechSpark2} trend={speechTrend}
                  level1={toSpeechLevel(attempt1Data.speechRate)} level2={toSpeechLevel(attempt2Data.speechRate)}
                />
                <KPICompareCard
                  label="피치 변화폭" unit="Hz" gradKey="pitch"
                  val1={String(p1)} val2={String(p2)}
                  spark1={pitchSpark1} spark2={pitchSpark2} trend={pitchTrend}
                  level1={toPitchLevel(p1)} level2={toPitchLevel(p2)}
                />
                <KPICompareCard
                  label="정면 응시" unit="%" gradKey="eye"
                  val1={String(attempt1Data.eyeContact)} val2={String(attempt2Data.eyeContact)}
                  spark1={eyeSpark1} spark2={eyeSpark2} trend={eyeTrend}
                  level1={toEyeLevel(attempt1Data.eyeContact)} level2={toEyeLevel(attempt2Data.eyeContact)}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* 자가 체크리스트 비교 */}
            <div className="p-5">
              <h3 className="text-base font-bold text-slate-900 pl-3 border-l-4 border-green-500 mb-1">자가 체크리스트 비교</h3>
              <p className="text-sm text-slate-500 mb-4">1회차에서 설정한 개선 목표가 2회차에서 실제로 달성됐는지 확인합니다.</p>
              {checklistItems.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400">1회차에서 모든 지표가 적정 범위였습니다 🎉</div>
              ) : (
                <div className="space-y-2">
                  {checklistItems.map(item => {
                    const achieved = checkActuallyAchieved(item, attempt2DataMap);
                    const selfChecked = item.is_completed;
                    return (
                      <div key={item.id} className={`rounded-xl border p-3 ${achieved ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-slate-800 leading-snug flex-1">{item.label}</p>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs text-slate-400">자기 체크</span>
                              <span className={`text-sm font-bold ${selfChecked ? 'text-green-600' : 'text-slate-300'}`}>
                                {selfChecked ? '✓' : '—'}
                              </span>
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs text-slate-400">실제 달성</span>
                              <span className={`text-sm font-bold ${achieved ? 'text-green-600' : 'text-red-500'}`}>
                                {achieved ? '✓' : '✗'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-xs text-slate-400">1회차</span>
                          <span className="text-xs font-semibold text-slate-700">{getMetricDisplay(item, attempt1DataMap)}</span>
                          <span className="text-slate-300 text-xs">→</span>
                          <span className="text-xs text-slate-400">2회차</span>
                          <span className={`text-xs font-semibold ${achieved ? 'text-green-700' : 'text-red-600'}`}>
                            {getMetricDisplay(item, attempt2DataMap)}
                          </span>
                        </div>
                        {selfChecked !== achieved && (
                          <p className="text-xs mt-1.5 font-semibold text-orange-600">
                            {selfChecked && !achieved
                              ? '⚠ 스스로 개선했다고 체크했지만 수치상 목표 미달입니다.'
                              : '✦ 체크하지 않았지만 실제로 목표를 달성했습니다!'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="flex gap-3 justify-center px-5 pb-6">
              <button
                onClick={() => navigate(`/presentation/results/${sessionId}/1`)}
                className="flex-1 py-2.5 bg-white border-2 border-blue-900 text-blue-900 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-sm"
              >
                1회차 결과 보기
              </button>
              <button
                onClick={() => navigate(`/presentation/results/${sessionId}/2`)}
                className="flex-1 py-2.5 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors text-sm"
              >
                2회차 결과 보기
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
