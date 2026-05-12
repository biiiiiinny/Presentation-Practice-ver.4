import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';

import { VideoPlayer } from '../components/VideoPlayer';
import {
  ArrowLeft,
  CheckCircle, XCircle, AlertTriangle, Eye,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip as RechartsTooltip,
} from 'recharts';
import mockGazeResult1 from '../../json_examples/1회차 결과 json/gaze_1.json';
import mockGazeResult2 from '../../json_examples/2회차 결과 json/gaze_2.json';
import mockRefinerResult1 from '../../json_examples/1회차 결과 json/refiner_1.json';
import mockRefinerResult2 from '../../json_examples/2회차 결과 json/refiner_2.json';
import type { GazeResult, RefinerResult } from '../contexts/AppContext';


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

// ── 자세 라벨 한글 매핑 ───────────────────────────────────────────────────────
const POSE_LABEL_KO: Record<string, string> = {
  'Touching head': '머리 만지기',
  'Touching face': '얼굴 만지기',
  'Touching body': '몸 만지기',
  'Touching hand': '손 만지기',
  'Swaying head':  '머리 흔들기',
  'Swaying body':  '몸 흔들기',
};

// ── 시선 방향 헬퍼 (모듈 레벨) ───────────────────────────────────────────────
const GAZE_DIR_LABELS: { r: number; c: number; label: string }[] = [
  { r: 0, c: 1, label: '위쪽' }, { r: 2, c: 1, label: '아래쪽' },
  { r: 1, c: 0, label: '왼쪽' }, { r: 1, c: 2, label: '오른쪽' },
];
const dominantOffCenter = (grid: number[][]): string | null => {
  const best = GAZE_DIR_LABELS.reduce((a, b) => grid[a.r][a.c] >= grid[b.r][b.c] ? a : b);
  return grid[best.r][best.c] > grid[1][1] ? best.label : null;
};

// ── 자가 체크리스트 서브 컴포넌트 ────────────────────────────────────────────
function CheckIcon({ level }: { level: number }) {
  if (level === 1) return <XCircle className="w-4 h-4 text-red-500" />;
  if (level === 2) return <AlertTriangle className="w-4 h-4 text-orange-400" />;
  return <div className="w-4 h-4 rounded-full border-2 border-slate-200" />;
}

function checkLabel(level: number) {
  if (level === 1) return { text: '개선 필요', cls: 'text-red-600' };
  if (level === 2) return { text: '주의',      cls: 'text-orange-500' };
  return { text: '적정', cls: 'text-slate-400' };
}

function HeaderBadge({ level1, level2 }: { level1: number; level2: number }) {
  if (level2 === 3 && level1 === 3) return null;
  if (level2 === 3) return (
    <div className="flex items-center gap-1 text-green-700 font-semibold text-sm flex-shrink-0">
      <CheckCircle className="w-4 h-4" /><span>개선됨</span>
    </div>
  );
  if (level2 === 2) return (
    <div className="flex items-center gap-1 text-orange-500 font-semibold text-sm flex-shrink-0">
      <AlertTriangle className="w-4 h-4" /><span>주의</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1 text-red-600 font-semibold text-sm flex-shrink-0">
      <XCircle className="w-4 h-4" /><span>개선필요</span>
    </div>
  );
}

// ── 시선 비교 그리드 ─────────────────────────────────────────────────────────
function GazeComparisonGrid({ grid1, grid2 }: { grid1: number[][]; grid2: number[][] }) {
  const eye1 = Math.round(grid1[1][1] * 10) / 10;
  const eye2 = Math.round(grid2[1][1] * 10) / 10;
  const eyeDiff = Math.round((eye2 - eye1) * 10) / 10;
  const centerImproved = eyeDiff >= 3;
  const centerDecreased = eyeDiff <= -3;

  const maxNonCenter = Math.max(
    ...grid2.flatMap((row, ri) => row.map((v, ci) => (ri === 1 && ci === 1 ? 0 : v))),
    0.01
  );

  const diffSign = eyeDiff >= 0 ? '+' : '';
  const diffCls = centerImproved ? 'text-green-600' : centerDecreased ? 'text-red-500' : 'text-slate-400';

  return (
    <div className="w-full flex flex-col gap-3">
      {/* 요약 카드 */}
      <div className="flex items-center justify-center gap-4 bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm">
        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Eye className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-slate-500 font-medium">2회차 정면 응시 비율</span>
          <span className="text-xl font-bold text-blue-600">{eye2}%</span>
        </div>
        <div className="w-px h-6 bg-slate-200 flex-shrink-0" />
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-slate-400 font-medium">1회차 대비</span>
          <span className={`text-xl font-bold ${diffCls}`}>{diffSign}{eyeDiff}%p</span>
        </div>
      </div>

      {/* 방향 레이블 + 그리드 */}
      <div className="flex items-center gap-2 justify-center">
        <span className="text-xs font-semibold text-slate-400 w-4 text-center">좌</span>
        <div className="flex flex-col gap-1 items-center">
          <span className="text-xs font-semibold text-slate-400">상</span>
          <div className="grid grid-cols-3 gap-1">
            {grid2.map((row, ri) =>
              row.map((val2, ci) => {
                const isCenter = ri === 1 && ci === 1;
                const delta = Math.round((grid2[ri][ci] - grid1[ri][ci]) * 10) / 10;
                const absVal = Math.round(val2 * 10) / 10;
                const absD = Math.abs(delta);
                const badgeUp = delta >= 0.5;
                const badgeDown = delta <= -0.5;
                const symbol = badgeUp ? '▲' : badgeDown ? '▼' : '—';
                const badgeStr = absD < 0.05 ? '' : `${absD.toFixed(1)}%p`;

                if (isCenter) {
                  const bg = centerImproved
                    ? 'rgba(15, 118, 110, 0.88)'
                    : centerDecreased
                    ? 'rgba(55, 65, 81, 0.9)'
                    : 'rgba(30, 64, 175, 0.75)';
                  const badgeBg = badgeUp ? 'bg-green-400/30' : badgeDown ? 'bg-red-400/30' : 'bg-white/20';
                  const badgeTextCls = badgeUp ? 'text-green-200' : badgeDown ? 'text-red-200' : 'text-white/60';
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-0.5 relative z-10 scale-[1.13] shadow-xl"
                      style={{ background: bg }}
                    >
                      <span className="text-[10px] font-bold text-white/70 tracking-wide">정면</span>
                      <span className="text-2xl font-bold text-white leading-none">{absVal}%</span>
                      <div className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 ${badgeBg}`}>
                        <span className={`text-[10px] font-bold leading-none ${badgeTextCls}`}>{symbol}</span>
                        {badgeStr && <span className={`text-[10px] font-semibold leading-none ${badgeTextCls}`}>{badgeStr}</span>}
                      </div>
                    </div>
                  );
                }

                const intensity = Math.min(val2 / (maxNonCenter * 1.2), 1);
                const bgOpacity = 0.04 + intensity * 0.22;
                const bg = `rgba(59, 130, 246, ${bgOpacity})`;
                const badgeCls = badgeUp ? 'text-green-600' : badgeDown ? 'text-red-500' : 'text-slate-400';

                return (
                  <div
                    key={`${ri}-${ci}`}
                    className="w-20 h-20 rounded-lg flex flex-col items-center justify-center gap-0.5 border border-slate-200"
                    style={{ background: bg }}
                  >
                    <span className="text-base font-bold text-slate-700 leading-none">{absVal}%</span>
                    <div className="flex items-center gap-0.5">
                      <span className={`text-[10px] font-bold leading-none ${badgeCls}`}>{symbol}</span>
                      {badgeStr && <span className={`text-[10px] font-semibold leading-none ${badgeCls}`}>{badgeStr}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <span className="text-xs font-semibold text-slate-400">하</span>
        </div>
        <span className="text-xs font-semibold text-slate-400 w-4 text-center">우</span>
      </div>
    </div>
  );
}

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
  // TODO: 백엔드 연동 시 아래 useEffect의 주석을 해제하고 엔드포인트를 맞춰주세요.
  // useEffect(() => {
  //   if (!sessionId) return;
  //   fetch(`/api/sessions/${sessionId}/comparison-opinion`)
  //     .then(r => r.json())
  //     .then((data: ComparisonOpinion) => setOpinion(data))
  //     .catch(console.error);
  // }, [sessionId]);
  void setOpinion; // placeholder until backend is wired

  if (!currentSession || currentSession.attempts.length < 2) {
    navigate('/dashboard');
    return null;
  }

  const attempt1 = currentSession.attempts[0];
  const attempt2 = currentSession.attempts[1];

  const refiner1: RefinerResult = (attempt1.analysisResults as any)?.refinerResult ?? (mockRefinerResult1 as unknown as RefinerResult);
  const refiner2: RefinerResult = (attempt2.analysisResults as any)?.refinerResult ?? (mockRefinerResult2 as unknown as RefinerResult);

  const attempt1Data = {
    ...(attempt1.analysisResults ?? {
      speechRate: 360, eyeContact: 78, duration: '8:30',
      pitchVariation: 75, lateSpeedRatio: 1.05,
    }),
    negativePoseDurationRatio: refiner1.refined_result.details.negative_posture_analysis.negative_posture_duration_ratio,
  };
  const attempt2Data = {
    ...(attempt2.analysisResults ?? {
      speechRate: 330, eyeContact: 85, duration: '9:00',
      pitchVariation: 80, lateSpeedRatio: 1.02,
    }),
    negativePoseDurationRatio: refiner2.refined_result.details.negative_posture_analysis.negative_posture_duration_ratio,
  };

  const attempt1Seconds = durationToSeconds(attempt1Data.duration);
  const attempt2Seconds = durationToSeconds(attempt2Data.duration);
  const timeLimitSeconds = currentSession.formData?.timeLimit
    ? parseInt(currentSession.formData.timeLimit) * 60 : 0;

  const dur1 = video1Duration != null ? Math.round(video1Duration) : attempt1Seconds;
  const dur2 = video2Duration != null ? Math.round(video2Duration) : attempt2Seconds;

  const gaze1: GazeResult = (attempt1.analysisResults as any)?.gazeResult ?? (mockGazeResult1 as unknown as GazeResult);
  const gaze2: GazeResult = (attempt2.analysisResults as any)?.gazeResult ?? (mockGazeResult2 as unknown as GazeResult);
  const gazeGrid1 = gaze1.gaze_metrics.grid_percent;
  const gazeGrid2 = gaze2.gaze_metrics.grid_percent;

  const gazeEye1 = Math.round(gazeGrid1[1][1] * 10) / 10;
  const gazeEye2 = Math.round(gazeGrid2[1][1] * 10) / 10;
  const gazeEyeDiff = Math.round((gazeEye2 - gazeEye1) * 10) / 10;

  const gazeOffDir1 = dominantOffCenter(gazeGrid1);
  const gazeOffDir2 = dominantOffCenter(gazeGrid2);

  const poseByLabel1 = refiner1.refined_result.details.negative_posture_analysis.negative_posture_by_label;
  const poseByLabel2 = refiner2.refined_result.details.negative_posture_analysis.negative_posture_by_label;

  const allPoseLabels = Array.from(new Set([...poseByLabel1.map(i => i.label), ...poseByLabel2.map(i => i.label)]));
  const poseBarData = allPoseLabels.map(label => ({
    name: POSE_LABEL_KO[label] ?? label,
    '1회차': Math.round((poseByLabel1.find(i => i.label === label)?.duration_sec ?? 0) * 10) / 10,
    '2회차': Math.round((poseByLabel2.find(i => i.label === label)?.duration_sec ?? 0) * 10) / 10,
  }));

  // ── 레이더 차트 + 자가 체크리스트 공용 ────────────────────────────────────
  const a1d = attempt1Data as any;
  const a2d = attempt2Data as any;
  const radarData = [
    { metric: '발화 속도',    '1회차': toSpeechLevel(attempt1Data.speechRate),              '2회차': toSpeechLevel(attempt2Data.speechRate) },
    { metric: '피치 변화폭',  '1회차': toPitchLevel(a1d.pitchVariation ?? 75),             '2회차': toPitchLevel(a2d.pitchVariation ?? 75) },
    { metric: '후반부 말속도', '1회차': toLateSpeedLevel(a1d.lateSpeedRatio ?? 1.05),      '2회차': toLateSpeedLevel(a2d.lateSpeedRatio ?? 1.02) },
    { metric: '자세 안정성',  '1회차': toPostureLevel(a1d.negativePoseDurationRatio ?? 0.20), '2회차': toPostureLevel(a2d.negativePoseDurationRatio ?? 0.08) },
    { metric: '정면 응시',    '1회차': toEyeLevel(attempt1Data.eyeContact),                '2회차': toEyeLevel(attempt2Data.eyeContact) },
    { metric: '발표 시간',    '1회차': toDurationLevel(dur1, timeLimitSeconds),            '2회차': toDurationLevel(dur2, timeLimitSeconds) },
  ];

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
    return { metric, r1, r2, compSentence };
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

            {/* 주요 지표 비교 */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 pl-3 border-l-4 border-blue-900 mb-4">주요 지표 비교</h3>
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

            {/* 시선 분포 비교 */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 pl-3 border-l-4 border-blue-900 mb-1">정면 응시 분포</h3>
              <p className="text-base text-slate-500 mb-4">
                발표 중 시선이 화면의 어느 방향에 머물렀는지 보여줍니다. 가운데(정면)가 높을수록 좋아요.
              </p>
              <GazeComparisonGrid grid1={gazeGrid1} grid2={gazeGrid2} />

              {/* 인사이트 */}
              {(() => {
                const improved = gazeEyeDiff >= 3;
                const worsened = gazeEyeDiff <= -3;

                const theme = improved
                  ? { wrap: 'bg-green-50 border-green-200', title: 'text-green-700', iconBg: 'bg-green-100', iconCls: 'text-green-600' }
                  : worsened
                  ? { wrap: 'bg-red-50 border-red-200',     title: 'text-red-600',   iconBg: 'bg-red-100',   iconCls: 'text-red-500'   }
                  : { wrap: 'bg-slate-50 border-slate-200', title: 'text-slate-600', iconBg: 'bg-slate-100', iconCls: 'text-slate-400' };

                const title = improved
                  ? `정면 응시가 ${gazeEye1}% → ${gazeEye2}%로 ${gazeEyeDiff}%p 개선됐어요.`
                  : worsened
                  ? `정면 응시가 ${gazeEye1}% → ${gazeEye2}%로 ${Math.abs(gazeEyeDiff)}%p 줄었어요.`
                  : `정면 응시 비율이 두 회차 모두 비슷했어요. (${gazeEye1}% → ${gazeEye2}%)`;

                const detail = improved
                  ? gazeOffDir1
                    ? `1회차에서 ${gazeOffDir1}으로 향하던 시선이 2회차에서 정면으로 잡혔어요.`
                    : `시선이 화면 중앙에 안정적으로 집중되고 있어요.`
                  : worsened
                  ? gazeOffDir2
                    ? `2회차에서 시선이 ${gazeOffDir2}으로 분산되는 경향이 있었어요. 발표 중 의도적으로 카메라를 바라보는 연습이 필요해요.`
                    : `발표 중 의도적으로 카메라를 바라보는 연습이 필요해요.`
                  : gazeEye2 >= 80
                  ? `두 회차 모두 시선이 안정적으로 유지되고 있어요.`
                  : gazeEye2 >= 60
                  ? `양호한 수준이에요. 정면 응시를 조금 더 늘리면 청중과의 연결감이 높아져요.`
                  : `두 회차 모두 정면 응시가 부족했어요. 카메라를 의식적으로 바라보는 연습을 해보세요.`;

                return (
                  <div className={`mt-4 rounded-xl px-4 py-3 border text-sm flex gap-3 items-start ${theme.wrap}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${theme.iconBg}`}>
                      {improved
                        ? <CheckCircle className={`w-4 h-4 ${theme.iconCls}`} />
                        : worsened
                        ? <XCircle className={`w-4 h-4 ${theme.iconCls}`} />
                        : <span className={`text-sm font-bold leading-none ${theme.iconCls}`}>~</span>
                      }
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className={`font-semibold ${theme.title}`}>{title}</p>
                      <p className="text-slate-500">{detail}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* 부정 자세 비교 */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 pl-3 border-l-4 border-blue-900 mb-1">부정 자세 비교</h3>
              <p className="text-base text-slate-500 mb-4">자세 유형별 지속 시간을 비교합니다.</p>
              {poseBarData.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">감지된 부정 자세가 없어요.</p>
              ) : (() => {
                const maxDur = Math.max(...poseBarData.flatMap(d => [d['1회차'], d['2회차']]), 0.1);
                const rows = [
                  { key: '1회차' as const, color: 'bg-indigo-500' },
                  { key: '2회차' as const, color: 'bg-emerald-500' },
                ];
                return (
                  <div className="flex flex-col gap-5">
                    {poseBarData.map(item => (
                      <div key={item.name}>
                        <p className="text-sm font-bold text-slate-700 mb-2">{item.name}</p>
                        <div className="flex flex-col gap-1.5">
                          {rows.map(({ key, color }) => {
                            const val = item[key];
                            const pct = Math.round((val / maxDur) * 100);
                            const isEmpty = val === 0;
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-400 w-9 flex-shrink-0">{key}</span>
                                {isEmpty ? (
                                  <span className="text-xs text-slate-300 font-medium">없음</span>
                                ) : (
                                  <>
                                    <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${color}`}
                                        style={{ width: `${pct}%`, minWidth: '6px' }}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500 w-10 text-right flex-shrink-0">{val}s</span>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* 자가 체크리스트 */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 pl-3 border-l-4 border-blue-900 mb-1">자가 체크리스트 비교</h3>
              <p className="text-base text-slate-500 mb-4">6개 항목 전체를 비교합니다. 개선이 필요한 항목에는 체크박스가 활성화됩니다.</p>
              <div className="space-y-3">
                {fullChecklist.map(({ metric, r1, r2, compSentence }, idx) => {
                  // 카드 테두리: 2회차 레벨 기준
                  const borderCls =
                    r2.level === 3 && r1.level < 3 ? 'border-green-200' :
                    r2.level === 2                  ? 'border-orange-200' :
                    r2.level === 1                  ? 'border-red-200'    : 'border-slate-200';

                  const l1 = checkLabel(r1.level);
                  const l2 = checkLabel(r2.level);

                  return (
                    <div key={idx} className={`rounded-xl border bg-white overflow-hidden ${borderCls}`}>
                      {/* 헤더: 카테고리 + 비교 문장 + 배지 */}
                      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${CATEGORY_STYLE[metric.category].cls}`}>
                          {CATEGORY_STYLE[metric.category].label}
                        </span>
                        <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">{compSentence}</p>
                        <HeaderBadge level1={r1.level} level2={r2.level} />
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
