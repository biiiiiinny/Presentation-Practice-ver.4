import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';

import { VideoPlayer } from '../components/VideoPlayer';
import {
  ArrowLeft,
  CheckCircle, XCircle, AlertTriangle,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip as RechartsTooltip,
} from 'recharts';

type ImprovementStatus = 'improved' | 'partial' | 'maintained' | 'worsened' | 'overcorrected';

// ── LLM 종합 의견 JSON 스펙 ────────────────────────────────────────────────────
// 백엔드에서 이 구조의 JSON을 내려주면 됩니다.
export interface ComparisonOpinion {
  script: string; // LLM이 생성한 종합 의견 텍스트
}

const durationToSeconds = (d: string): number => {
  const [m, s] = d.split(':').map(Number);
  return m * 60 + s;
};


// ── 3단계 레벨 변환 함수 ──────────────────────────────────────────────────────
const toSpeechLevel    = (rate: number): number => rate >= 270 && rate <= 330 ? 3 : rate >= 240 && rate <= 360 ? 2 : 1;
const toPitchLevel     = (hz: number):   number => hz >= 70 && hz <= 90 ? 3 : hz >= 41 ? 2 : 1;
const toPostureLevel   = (ratio: number): number => ratio < 0.10 ? 3 : ratio <= 0.25 ? 2 : 1;
const toEyeLevel       = (pct: number):  number => pct >= 70 ? 3 : pct >= 50 ? 2 : 1;
const toLateSpeedLevel = (ratio: number): number => { const d = Math.abs(ratio - 1.0); return d <= 0.05 ? 3 : d <= 0.15 ? 2 : 1; };
const toDurationLevel  = (sec: number, limitSec: number): number => {
  if (limitSec <= 0) return 2;
  const r = sec / limitSec;
  if (r > 1.0) return 1;
  if (r >= 0.9) return 3;
  if (r >= 0.7) return 2;
  return 1;
};

// ── 자가 체크리스트 헬퍼 ─────────────────────────────────────────────────────

interface CheckResult { sentence: string; level: number; }

function levelToStatus(l1: number, l2: number): ImprovementStatus {
  if (l2 > l1) return 'improved';
  if (l2 < l1) return 'worsened';
  return 'maintained';
}

function speechResult(rate: number): CheckResult {
  if (rate >= 270 && rate <= 330) return { sentence: `발화 속도 ${rate} 자/분으로 청중이 따라오기 좋은 속도였어요`, level: 3 };
  if ((rate > 330 && rate <= 360) || (rate >= 240 && rate < 270)) return {
    sentence: rate > 330 ? `발화 속도 ${rate} 자/분으로 약간 빠른 편이었어요` : `발화 속도 ${rate} 자/분으로 약간 느린 편이었어요`, level: 2,
  };
  return { sentence: rate > 360 ? `발화 속도 ${rate} 자/분으로 많이 빠른 편이었어요` : `발화 속도 ${rate} 자/분으로 많이 느린 편이었어요`, level: 1 };
}

function pitchResult(hz: number): CheckResult {
  if (hz >= 70 && hz <= 90) return { sentence: `피치 변화폭 ${hz} Hz로 생동감 있게 발표했어요`, level: 3 };
  if (hz > 90 || hz >= 41) return {
    sentence: hz > 90 ? `피치 변화폭 ${hz} Hz로 목소리 변화가 다소 과한 편이었어요` : `피치 변화폭 ${hz} Hz로 목소리가 다소 단조로운 편이었어요`, level: 2,
  };
  return { sentence: `피치 변화폭 ${hz} Hz로 목소리 변화가 거의 없었어요`, level: 1 };
}

function lateSpeedResult(ratio: number): CheckResult {
  const dev = ratio - 1.0;
  const absDev = Math.abs(dev);
  const pct = Math.round(absDev * 100);
  if (absDev <= 0.05) return { sentence: `후반부 말속도가 전반부 대비 ±${pct}%로 일정하게 유지됐어요`, level: 3 };
  if (absDev <= 0.15) return {
    sentence: dev > 0 ? `후반부 말속도가 전반부 대비 +${pct}% 빨라졌어요` : `후반부 말속도가 전반부 대비 -${pct}% 느려졌어요`, level: 2,
  };
  return {
    sentence: dev > 0 ? `후반부 말속도가 전반부 대비 +${pct}% 크게 빨라졌어요` : `후반부 말속도가 전반부 대비 -${pct}% 크게 느려졌어요`, level: 1,
  };
}

function postureResult(ratio: number): CheckResult {
  const pct = Math.round(ratio * 100);
  if (ratio < 0.10) return { sentence: `자세 불안정 비율 ${pct}%로 안정적인 자세를 유지했어요`, level: 3 };
  if (ratio <= 0.25) return { sentence: `자세 불안정 비율 ${pct}%로 가끔 자세가 흐트러졌어요`, level: 2 };
  return { sentence: `자세 불안정 비율 ${pct}%로 자세 흐트러짐이 자주 있었어요`, level: 1 };
}

function eyeResult(pct: number): CheckResult {
  if (pct >= 70) return { sentence: `정면 응시 비율 ${pct}%로 청중과 충분히 눈을 맞췄어요`, level: 3 };
  if (pct >= 50) return { sentence: `정면 응시 비율 ${pct}%로 시선이 화면에 더 머무는 경향이 있었어요`, level: 2 };
  return { sentence: `정면 응시 비율 ${pct}%로 청중을 거의 바라보지 못했어요`, level: 1 };
}

function durationResult(sec: number, limitSec: number): CheckResult {
  if (limitSec <= 0) return { sentence: '목표 시간이 설정되지 않았어요', level: 2 };
  const fmt = (s: number) => {
    const m = Math.floor(s / 60), rem = Math.round(s % 60);
    return rem > 0 ? `${m}분 ${rem}초` : `${m}분`;
  };
  const r = sec / limitSec;
  if (r > 1.0) return { sentence: `제한 시간 ${fmt(limitSec)}을 ${fmt(sec - limitSec)} 초과했어요 (실제: ${fmt(sec)})`, level: 1 };
  if (r >= 0.9) return { sentence: `제한 시간 ${fmt(limitSec)} 내에 ${fmt(sec)}로 발표를 마쳤어요`, level: 3 };
  if (r >= 0.7) return { sentence: `제한 시간 ${fmt(limitSec)}보다 ${fmt(limitSec - sec)} 일찍 끝났어요 (실제: ${fmt(sec)})`, level: 2 };
  return { sentence: `제한 시간 ${fmt(limitSec)}보다 ${fmt(limitSec - sec)} 부족했어요 (실제: ${fmt(sec)})`, level: 1 };
}

// ── metric_key 별 결과 생성 ───────────────────────────────────────────────────
function getAttemptResult(metricKey: string, data: any, timeLimitSec: number, videoDurationSec?: number): CheckResult {
  switch (metricKey) {
    case 'speechRate':                return speechResult(data.speechRate ?? 300);
    case 'pitchVariation':            return pitchResult(data.pitchVariation ?? 75);
    case 'lateSpeedRatio':            return lateSpeedResult(data.lateSpeedRatio ?? 1.0);
    case 'negativePoseDurationRatio': return postureResult(data.negativePoseDurationRatio ?? 0);
    case 'eyeContact':                return eyeResult(data.eyeContact ?? 0);
    case 'durationSec': {
      const sec = videoDurationSec ?? durationToSeconds(data.duration ?? '0:00');
      return durationResult(sec, timeLimitSec);
    }
    default: return { sentence: '—', level: 2 };
  }
}

const CATEGORY_STYLE = {
  voice:   { label: '음성', cls: 'bg-purple-100 text-purple-700' },
  posture: { label: '자세', cls: 'bg-green-100 text-green-700'  },
} as const;


function getComparisonSentence(metricKey: string | null, a1: any, a2: any, timeLimitSec: number, v1Sec?: number, v2Sec?: number): string {
  switch (metricKey) {
    case 'speechRate': {
      const v1 = a1.speechRate ?? 300, v2 = a2.speechRate ?? 300;
      if (v1 === v2) return `발화 속도가 ${v1} 자/분으로 동일했어요.`;
      return `발화 속도가 ${v1} → ${v2} 자/분으로 ${v2 < v1 ? '느려졌어요.' : '빨라졌어요.'}`;
    }
    case 'pitchVariation': {
      const v1 = a1.pitchVariation ?? 75, v2 = a2.pitchVariation ?? 75;
      if (v1 === v2) return `피치 변화폭이 ${v1} Hz로 동일했어요.`;
      return `피치 변화폭이 ${v1} → ${v2} Hz로 ${v2 > v1 ? '넓어졌어요.' : '좁아졌어요.'}`;
    }
    case 'lateSpeedRatio': {
      const v1 = Math.round(Math.abs((a1.lateSpeedRatio ?? 1.0) - 1.0) * 100);
      const v2 = Math.round(Math.abs((a2.lateSpeedRatio ?? 1.0) - 1.0) * 100);
      if (v1 === v2) return `후반부 말속도 변화율이 ±${v1}%로 동일했어요.`;
      return `후반부 말속도 변화율이 ±${v1}% → ±${v2}%로 ${v2 < v1 ? '안정됐어요.' : '벌어졌어요.'}`;
    }
    case 'negativePoseDurationRatio': {
      const v1 = Math.round((a1.negativePoseDurationRatio ?? 0) * 100);
      const v2 = Math.round((a2.negativePoseDurationRatio ?? 0) * 100);
      if (v1 === v2) return `자세 불안정 비율이 ${v1}%로 동일했어요.`;
      return `자세 불안정 비율이 ${v1}% → ${v2}%로 ${v2 < v1 ? '줄었어요.' : '늘었어요.'}`;
    }
    case 'eyeContact': {
      const v1 = a1.eyeContact ?? 0, v2 = a2.eyeContact ?? 0;
      if (v1 === v2) return `정면 응시 비율이 ${v1}%로 동일했어요.`;
      return `정면 응시 비율이 ${v1}% → ${v2}%로 ${v2 > v1 ? '높아졌어요.' : '낮아졌어요.'}`;
    }
    case 'durationSec': {
      const fmt = (s: number) => `${Math.floor(s / 60)}분 ${String(Math.round(s % 60)).padStart(2, '0')}초`;
      const v1 = v1Sec ?? durationToSeconds(a1.duration ?? '0:00');
      const v2 = v2Sec ?? durationToSeconds(a2.duration ?? '0:00');
      const lim = timeLimitSec > 0 ? ` (제한: ${fmt(timeLimitSec)})` : '';
      if (v1 === v2) return `발표 시간이 ${fmt(v1)}으로 동일했어요.${lim}`;
      const dir = v2 > v1 ? '길어졌어요.' : '짧아졌어요.';
      return `발표 시간이 ${fmt(v1)} → ${fmt(v2)}로 ${dir}${lim}`;
    }
    default: return '—';
  }
}




// ── KPI 비교 카드 ─────────────────────────────────────────────────────────────
const LEVEL_BADGE: Record<number, { label: string; cls: string }> = {
  1: { label: '개선필요', cls: 'bg-red-100 text-red-700' },
  2: { label: '주의',    cls: 'bg-orange-100 text-orange-700' },
  3: { label: '적정',   cls: 'bg-green-100 text-green-700' },
};

function KPICompareCard({
  label, unit, val1, val2, trend, level1, level2,
}: {
  label: string; unit: string; val1: string; val2: string;
  trend: 'up' | 'down' | 'flat'; level1: number; level2: number;
}) {
  const b1 = LEVEL_BADGE[level1];
  const b2 = LEVEL_BADGE[level2];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-3 gap-2 min-w-0">
      {/* 라벨 + 트렌드 */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500 truncate">{label}</p>
        {(() => {
          const colorCls = level2 === 3 ? 'text-green-600' : level2 === 1 ? 'text-red-600' : 'text-orange-500';
          const arrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';
          return <span className={`text-sm font-bold flex-shrink-0 ${colorCls}`}>{arrow}</span>;
        })()}
      </div>
      {/* 1회차 */}
      <div className="flex items-end justify-between gap-1">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">1회차</p>
          <p className="text-2xl font-bold text-slate-700 leading-none">
            {val1}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${b1.cls}`}>{b1.label}</span>
      </div>
      <div className="border-t border-slate-100" />
      {/* 2회차 */}
      <div className="flex items-end justify-between gap-1">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">2회차</p>
          <p className="text-2xl font-bold text-slate-900 leading-none">
            {val2}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${b2.cls}`}>{b2.label}</span>
      </div>
    </div>
  );
}

// ── 레이더 차트 커스텀 툴팁 ───────────────────────────────────────────────────
const RADAR_LEVEL_LABEL: Record<number, string> = { 1: '개선필요', 2: '주의', 3: '적정' };

const ComparisonRadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-sm">
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

  const [video1Duration, setVideo1Duration] = useState<number | null>(null);
  const [video2Duration, setVideo2Duration] = useState<number | null>(null);
  const videoUrl1 = currentSession?.attempts[0]?.videoUrl;
  const videoUrl2 = currentSession?.attempts[1]?.videoUrl;

  useEffect(() => {
    if (!videoUrl1) return;
    const vid = document.createElement('video');
    vid.src = videoUrl1;
    vid.onloadedmetadata = () => setVideo1Duration(vid.duration);
  }, [videoUrl1]);

  useEffect(() => {
    if (!videoUrl2) return;
    const vid = document.createElement('video');
    vid.src = videoUrl2;
    vid.onloadedmetadata = () => setVideo2Duration(vid.duration);
  }, [videoUrl2]);

  const [opinion, setOpinion] = useState<ComparisonOpinion | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    // TODO: 백엔드 연동 시 아래 주석을 해제하고 엔드포인트를 맞춰주세요.
    // fetch(`/api/sessions/${sessionId}/comparison-opinion`)
    //   .then(r => r.json())
    //   .then((data: ComparisonOpinion) => setOpinion(data))
    //   .catch(console.error);
  }, [sessionId]);

  if (!currentSession || currentSession.attempts.length < 2) {
    navigate('/dashboard');
    return null;
  }

  const attempt1 = currentSession.attempts[0];
  const attempt2 = currentSession.attempts[1];

  const attempt1Data = attempt1.analysisResults ?? {
    speechRate: 360, eyeContact: 78, duration: '8:30', negativePoseDurationRatio: 0.20,
    pitchVariation: 75, avgIPsPerSentence: 3.5, avgWordsPerSentence: 10,
    lateSpeedRatio: 1.05, longPauseCount: 2, wordPauseCount: 12, fillerRate: 0.35,
  };
  const attempt2Data = attempt2.analysisResults ?? {
    speechRate: 330, eyeContact: 85, duration: '9:00', negativePoseDurationRatio: 0.08,
    pitchVariation: 80, avgIPsPerSentence: 2.9, avgWordsPerSentence: 10,
    lateSpeedRatio: 1.02, longPauseCount: 1, wordPauseCount: 9, fillerRate: 0.28,
  };

  const attempt1Seconds = durationToSeconds(attempt1Data.duration);
  const attempt2Seconds = durationToSeconds(attempt2Data.duration);
  const timeLimitSeconds = currentSession.formData?.timeLimit
    ? parseInt(currentSession.formData.timeLimit) * 60 : 0;

  const dur1 = video1Duration != null ? Math.round(video1Duration) : attempt1Seconds;
  const dur2 = video2Duration != null ? Math.round(video2Duration) : attempt2Seconds;

  // ── 레이더 차트 데이터 ─────────────────────────────────────────────────────
  const a1 = attempt1Data as any;
  const a2 = attempt2Data as any;
  const radarData = [
    { metric: '발화 속도',    '1회차': toSpeechLevel(attempt1Data.speechRate),         '2회차': toSpeechLevel(attempt2Data.speechRate) },
    { metric: '피치 변화폭',  '1회차': toPitchLevel(a1.pitchVariation ?? 75),          '2회차': toPitchLevel(a2.pitchVariation ?? 75) },
    { metric: '후반부 말속도', '1회차': toLateSpeedLevel(a1.lateSpeedRatio ?? 1.05),   '2회차': toLateSpeedLevel(a2.lateSpeedRatio ?? 1.02) },
    { metric: '자세 안정성',  '1회차': toPostureLevel(a1.negativePoseDurationRatio ?? 0.20), '2회차': toPostureLevel(a2.negativePoseDurationRatio ?? 0.08) },
    { metric: '정면 응시',    '1회차': toEyeLevel(attempt1Data.eyeContact),            '2회차': toEyeLevel(attempt2Data.eyeContact) },
    { metric: '발표 시간',    '1회차': toDurationLevel(dur1, timeLimitSeconds), '2회차': toDurationLevel(dur2, timeLimitSeconds) },
  ];

  // ── 자가 체크리스트 ───────────────────────────────────────────────────────
  const a1d = attempt1Data as any;
  const a2d = attempt2Data as any;

  const ALL_METRICS = [
    { metric_key: 'speechRate',                label: '발화 속도',    category: 'voice'    as const },
    { metric_key: 'pitchVariation',            label: '피치 변화폭',  category: 'voice'    as const },
    { metric_key: 'lateSpeedRatio',            label: '후반부 말속도', category: 'voice'   as const },
    { metric_key: 'negativePoseDurationRatio', label: '자세 안정성',  category: 'posture'  as const },
    { metric_key: 'eyeContact',                label: '정면 응시',    category: 'posture'  as const },
    { metric_key: 'durationSec',               label: '발표 시간',    category: 'voice'    as const },
  ];

  const fullChecklist = ALL_METRICS.map(metric => {
    const isDur = metric.metric_key === 'durationSec';
    const r1 = getAttemptResult(metric.metric_key, a1d, timeLimitSeconds, isDur ? dur1 : undefined);
    const r2 = getAttemptResult(metric.metric_key, a2d, timeLimitSeconds, isDur ? dur2 : undefined);
    const compSentence = getComparisonSentence(metric.metric_key, a1d, a2d, timeLimitSeconds, isDur ? dur1 : undefined, isDur ? dur2 : undefined);
    return { metric, r1, r2, compSentence, status: levelToStatus(r1.level, r2.level) };
  });


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
            <p className="text-base text-slate-600 mt-0.5">{currentSession.title}</p>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">

        {/* 왼쪽: 영상 비교 */}
        <div className="w-1/2 flex flex-col min-w-0">
          <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-200 flex flex-col flex-1 gap-3 overflow-hidden">
            <h2 className="text-lg font-bold text-slate-900 pl-3 border-l-4 border-blue-900 flex-shrink-0">영상 비교</h2>
            <div className="flex flex-col flex-1 gap-3 min-h-0">
              <div className="flex-1 flex flex-col min-h-0">
                <p className="text-base font-bold text-slate-700 mb-2 flex-shrink-0">1회차</p>
                {attempt1.videoUrl ? (
                  <div className="flex-1 min-h-0 overflow-hidden rounded-xl">
                    <VideoPlayer videoUrl={attempt1.videoUrl} />
                  </div>
                ) : (
                  <div className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center">
                    <span className="text-slate-400 text-base">업로드된 영상 없음</span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <p className="text-base font-bold text-slate-700 mb-2 flex-shrink-0">2회차</p>
                {attempt2.videoUrl ? (
                  <div className="flex-1 min-h-0 overflow-hidden rounded-xl">
                    <VideoPlayer videoUrl={attempt2.videoUrl} />
                  </div>
                ) : (
                  <div className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center">
                    <span className="text-slate-400 text-base">업로드된 영상 없음</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 모든 지표 (스크롤) */}
        <div className="w-1/2 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto scrollbar-hide">

            {/* 종합 의견 — LLM JSON → opinion state로 주입 */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 pl-3 border-l-4 border-blue-900 mb-3">종합 의견</h3>
              {opinion ? (
                <p className="text-sm text-slate-700 leading-relaxed">{opinion.script}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">종합 의견을 불러오는 중입니다...</p>
              )}
            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* 종합 비교 차트 */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 pl-3 border-l-4 border-blue-900 mb-1">종합 비교 차트</h3>
              <p className="text-base text-slate-500 mb-3">
                각 항목을 개선필요 · 주의 · 적정 3단계로 평가합니다.
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} outerRadius="72%" margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 3]} tickCount={4} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Radar name="1회차" dataKey="1회차" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="2회차" dataKey="2회차" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  <Legend iconType="circle" />
                  <RechartsTooltip content={<ComparisonRadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* KPI 비교 */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 pl-3 border-l-4 border-blue-900 mb-4">KPI 비교</h3>
              <div className="grid grid-cols-3 gap-3">
                <KPICompareCard
                  label="발화 속도" unit="음절/분"
                  val1={String(attempt1Data.speechRate)} val2={String(attempt2Data.speechRate)}
                  trend={speechTrend}
                  level1={toSpeechLevel(attempt1Data.speechRate)} level2={toSpeechLevel(attempt2Data.speechRate)}
                />
                <KPICompareCard
                  label="피치 변화폭" unit="Hz"
                  val1={String(p1)} val2={String(p2)}
                  trend={pitchTrend}
                  level1={toPitchLevel(p1)} level2={toPitchLevel(p2)}
                />
                <KPICompareCard
                  label="정면 응시" unit="%"
                  val1={String(attempt1Data.eyeContact)} val2={String(attempt2Data.eyeContact)}
                  trend={eyeTrend}
                  level1={toEyeLevel(attempt1Data.eyeContact)} level2={toEyeLevel(attempt2Data.eyeContact)}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* 자가 체크리스트 */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 pl-3 border-l-4 border-blue-900 mb-1">자가 체크리스트 비교</h3>
              <p className="text-sm text-slate-500 mb-4">6개 항목 전체를 비교합니다. 개선이 필요한 항목에는 체크박스가 활성화됩니다.</p>
              <div className="space-y-3">
                {fullChecklist.map(({ metric, r1, r2, compSentence }, idx) => {
                  // 카드 테두리: 2회차 레벨 기준
                  const borderCls =
                    r2.level === 3 && r1.level < 3 ? 'border-green-200' :
                    r2.level === 2                  ? 'border-orange-200' :
                    r2.level === 1                  ? 'border-red-200'    : 'border-slate-200';

                  const CheckIcon = ({ level }: { level: number }) => {
                    if (level === 1) return <XCircle className="w-4 h-4 text-red-500" />;
                    if (level === 2) return <AlertTriangle className="w-4 h-4 text-orange-400" />;
                    return <div className="w-4 h-4 rounded-full border-2 border-slate-200" />;
                  };
                  const checkLabel = (level: number) =>
                    level === 1 ? { text: '개선 필요', cls: 'text-red-600' } :
                    level === 2 ? { text: '주의',      cls: 'text-orange-500' } :
                                  { text: '적정',      cls: 'text-slate-400' };
                  const l1 = checkLabel(r1.level);
                  const l2 = checkLabel(r2.level);

                  // 헤더 배지: 적정→적정이면 없음, 적정 도달이면 개선됨, 아니면 2회차 레벨 표시
                  const HeaderBadge = () => {
                    if (r2.level === 3 && r1.level === 3) return null;
                    if (r2.level === 3) return (
                      <div className="flex items-center gap-1 text-green-700 font-semibold text-sm flex-shrink-0">
                        <CheckCircle className="w-4 h-4" /><span>개선됨</span>
                      </div>
                    );
                    if (r2.level === 2) return (
                      <div className="flex items-center gap-1 text-orange-500 font-semibold text-sm flex-shrink-0">
                        <AlertTriangle className="w-4 h-4" /><span>주의</span>
                      </div>
                    );
                    return (
                      <div className="flex items-center gap-1 text-red-600 font-semibold text-sm flex-shrink-0">
                        <XCircle className="w-4 h-4" /><span>개선필요</span>
                      </div>
                    );
                  };

                  return (
                    <div key={idx} className={`rounded-xl border bg-white overflow-hidden ${borderCls}`}>
                      {/* 헤더: 카테고리 + 비교 문장 + 배지 */}
                      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${CATEGORY_STYLE[metric.category].cls}`}>
                          {CATEGORY_STYLE[metric.category].label}
                        </span>
                        <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">{compSentence}</p>
                        <HeaderBadge />
                      </div>

                      {/* 1회차 / 2회차 비교 행 */}
                      <div className="divide-y divide-slate-100">
                        {/* 1회차 */}
                        <div className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs font-semibold text-slate-400 w-10 flex-shrink-0">1회차</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <CheckIcon level={r1.level} />
                            <span className={`text-xs font-semibold ${l1.cls}`}>{l1.text}</span>
                          </div>
                          <p className="text-xs text-slate-500 ml-auto">{r1.sentence}</p>
                        </div>

                        {/* 2회차 */}
                        <div className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs font-semibold text-slate-400 w-10 flex-shrink-0">2회차</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <CheckIcon level={r2.level} />
                            <span className={`text-xs font-semibold ${l2.cls}`}>{l2.text}</span>
                          </div>
                          <p className={`text-xs font-medium ml-auto ${
                            r2.level === 3 && r1.level < 3 ? 'text-green-700' :
                            r2.level === 1                  ? 'text-red-600'   : 'text-slate-500'
                          }`}>{r2.sentence}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="flex gap-3 justify-center px-5 pb-6">
              <button
                onClick={() => navigate(`/presentation/results/${sessionId}/1`)}
                className="flex-1 py-2.5 bg-white border-2 border-blue-900 text-blue-900 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-base"
              >
                1회차 결과 보기
              </button>
              <button
                onClick={() => navigate(`/presentation/results/${sessionId}/2`)}
                className="flex-1 py-2.5 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors text-base"
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
