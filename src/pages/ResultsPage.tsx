import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import type { ChecklistItem } from '../contexts/AppContext';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Timeline } from '../components/Timeline';
import { VideoPlayer } from '../components/VideoPlayer';
import { Mic, User, ChevronDown, ChevronUp, CheckCircle, XCircle, Eye } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip,
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceArea,
} from 'recharts';
import mockSttResult1 from '../../json_examples/1회차 결과 json/stt_1.json';
import mockPitchResult1 from '../../json_examples/1회차 결과 json/pitch_1.json';
import mockLlmResult1 from '../../json_examples/1회차 결과 json/llm_1.json';
import mockPoseResult1 from '../../json_examples/1회차 결과 json/pose_1.json';
import mockRefinerResult1 from '../../json_examples/1회차 결과 json/refiner_1.json';
import mockGazeResult1 from '../../json_examples/1회차 결과 json/gaze_1.json';
import mockSttResult2 from '../../json_examples/2회차 결과 json/stt_2.json';
import mockPitchResult2 from '../../json_examples/2회차 결과 json/pitch_2.json';
import mockLlmResult2 from '../../json_examples/2회차 결과 json/llm_2.json';
import mockPoseResult2 from '../../json_examples/2회차 결과 json/pose_2.json';
import mockRefinerResult2 from '../../json_examples/2회차 결과 json/refiner_2.json';
import mockGazeResult2 from '../../json_examples/2회차 결과 json/gaze_2.json';
import type { SttResult, PitchResult, LlmResult, PoseResult, RefinerResult, GazeResult } from '../contexts/AppContext';


// ── 범위 게이지 ───────────────────────────────────────────────────────────────
function RangeGauge({ value, optimalMin, optimalMax, unit, maxDisplay, minLabel = '낮음', maxLabel = '높음' }: {
  value: number; optimalMin: number; optimalMax: number; unit: string; maxDisplay: number;
  minLabel?: string; maxLabel?: string;
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
        <span>{minLabel}</span>
        <span className="text-green-700 font-semibold">적정 {optimalMin}–{optimalMax} {unit}</span>
        <span>{maxLabel}</span>
      </div>
      <p className="text-center text-sm">
        <span className={`font-bold ${inRange ? 'text-green-700' : 'text-red-600'}`}>
          {value} {unit}
        </span>
        <span className="text-slate-500 ml-1.5 text-xs">
          {inRange ? '✓ 적정 범위' : value < optimalMin ? `— ${minLabel}` : `— ${maxLabel}`}
        </span>
      </p>
    </div>
  );
}

// ── KPI 카드 ──────────────────────────────────────────────────────────────────
type KPIStatus = '적정' | '주의' | '경고';

const KPI_STATUS_STYLE: Record<KPIStatus, { badge: string; line: string; fill: string }> = {
  '적정': { badge: 'bg-green-100 text-green-700',  line: '#16a34a', fill: '#16a34a' },
  '주의': { badge: 'bg-orange-100 text-orange-700', line: '#ea580c', fill: '#ea580c' },
  '경고': { badge: 'bg-red-100 text-red-700',      line: '#dc2626', fill: '#dc2626' },
};

function KPICard({ label, value, unit, status, displayValue }: {
  label: string; value: number; unit: string; status: KPIStatus; displayValue?: ReactNode;
}) {
  const s = KPI_STATUS_STYLE[status];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-3 gap-2 min-w-0">
      <p className="text-sm font-semibold text-slate-500 truncate">{label}</p>
      <div className="flex items-end justify-between gap-1">
        <p className="text-2xl font-bold text-slate-900 leading-none">
          {displayValue ?? value}
          {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
        </p>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${s.badge}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

// ── 레이더 차트 커스텀 툴팁 ───────────────────────────────────────────────────
const RADAR_LEVEL_LABEL: Record<number, string> = { 1: '개선필요', 2: '주의', 3: '적정' };
const RADAR_LEVEL_COLOR: Record<number, string> = { 1: '#dc2626', 2: '#ea580c', 3: '#16a34a' };

const RadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800">{payload[0].payload.metric}</p>
      <p className="font-bold mt-0.5" style={{ color: RADAR_LEVEL_COLOR[val] }}>{RADAR_LEVEL_LABEL[val]}</p>
    </div>
  );
};

// ── 발표 전체 그래프 ──────────────────────────────────────────────────────────

// 백엔드 연동 시 analysisResults 에 아래 두 타입을 추가하고
// mock 빌더 대신 실제 데이터를 그대로 넘기면 됩니다.
export interface PresentationPoint {
  start: number;       // 초 단위 (구간 시작)
  pitch_hz: number;    // 피치 (Hz)
  speech_rate: number; // 발화속도 (음절/분)
}

export interface PresentationSection {
  label: string;  // '서론' | '본론' | '결론'
  start: number;
  end: number;
}

// 피치 segment + stt segment 로 실제 cpm 매핑
// 두 배열의 start가 동일함
function buildCombinedTimeline(
  pitchSegments: { start: number; mean_hz: number }[],
  sttSegments: { start: number; cpm: number }[],
): PresentationPoint[] {
  return pitchSegments.map(({ start, mean_hz }) => {
    const stt = sttSegments.find(s => s.start === start);
    return { start, pitch_hz: mean_hz, speech_rate: stt?.cpm ?? 0 };
  });
}

// 타임라인 이벤트 기반으로 서론·본론·결론 구간 추출 (레거시 — LLM 구조 없을 때 폴백용)
export function buildSectionsFromTimeline(
  timeline: { time: string; event: string; type: string }[],
): PresentationSection[] {
  const toSec = (t: string) => {
    const [m, s] = t.split(':').map(Number);
    return m * 60 + s;
  };
  const endEvent = timeline.find(e => e.type === 'end');
  const totalSec = endEvent ? toSec(endEvent.time) : 0;

  const contents = timeline.filter(e => e.type === 'content');
  let bodyStart: number | null = null;
  let conclusionStart: number | null = null;

  for (const e of contents) {
    const sec = toSec(e.time);
    if (bodyStart === null && e.event.includes('본론')) bodyStart = sec;
    if (conclusionStart === null && (e.event.includes('결론') || e.event.includes('마무리'))) conclusionStart = sec;
  }

  if (bodyStart === null && conclusionStart === null) {
    return [
      { label: '서론', start: 0,              end: totalSec * 0.2 },
      { label: '본론', start: totalSec * 0.2, end: totalSec * 0.8 },
      { label: '결론', start: totalSec * 0.8, end: totalSec },
    ];
  }

  const sections: PresentationSection[] = [];
  if (bodyStart !== null) {
    sections.push({ label: '서론', start: 0, end: bodyStart });
    if (conclusionStart !== null) {
      sections.push({ label: '본론', start: bodyStart, end: conclusionStart });
      sections.push({ label: '결론', start: conclusionStart, end: totalSec });
    } else {
      sections.push({ label: '본론', start: bodyStart, end: totalSec });
    }
  } else if (conclusionStart !== null) {
    sections.push({ label: '서론/본론', start: 0, end: conclusionStart });
    sections.push({ label: '결론', start: conclusionStart, end: totalSec });
  }
  return sections;
}

// LLM structure 배열로부터 서론·본론·결론 구간 추출
function buildSectionsFromLlm(structure: Record<string, string>[]): PresentationSection[] {
  const toSec = (t: string) => { const [m, s] = t.split(':').map(Number); return m * 60 + s; };
  const entries = structure.map(item => {
    const [time, label] = Object.entries(item)[0];
    return { sec: toSec(time), label };
  });
  const totalSec = entries[entries.length - 1]?.sec ?? 0;
  let bodyStart: number | null = null;
  let conclusionStart: number | null = null;
  for (const { sec, label } of entries) {
    if (bodyStart === null && label.includes('본론')) bodyStart = sec;
    if (conclusionStart === null && (label.includes('결론') || label.includes('마무리'))) conclusionStart = sec;
  }
  if (bodyStart === null && conclusionStart === null) return [
    { label: '서론', start: 0, end: totalSec * 0.2 },
    { label: '본론', start: totalSec * 0.2, end: totalSec * 0.8 },
    { label: '결론', start: totalSec * 0.8, end: totalSec },
  ];
  const sections: PresentationSection[] = [];
  const body = bodyStart ?? 0;
  if (bodyStart !== null) sections.push({ label: '서론', start: 0, end: body });
  if (bodyStart !== null && conclusionStart !== null) {
    sections.push({ label: '본론', start: body, end: conclusionStart });
    sections.push({ label: '결론', start: conclusionStart, end: totalSec });
  } else if (bodyStart !== null) {
    sections.push({ label: '본론', start: body, end: totalSec });
  } else if (conclusionStart !== null) {
    sections.push({ label: '서론/본론', start: 0, end: conclusionStart });
    sections.push({ label: '결론', start: conclusionStart, end: totalSec });
  }
  return sections;
}

// 피치: 보라, 발화속도: 주황 — 명확히 구분되는 색
const CHART_COLOR = { pitch: '#7c3aed', speech: '#ea580c' } as const;

function PresentationChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const sec = Number(label);
  const mm = Math.floor(sec / 60);
  const ss = String(Math.floor(sec % 60)).padStart(2, '0');
  return (
    <div className="bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-xl text-xs pointer-events-none space-y-1">
      <p className="text-slate-400 font-mono mb-0.5">{mm}:{ss}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {p.dataKey === 'pitch_hz'
            ? `피치: ${Number(p.value).toFixed(1)} Hz`
            : `발화속도: ${Math.round(p.value)} 음절/분`}
        </p>
      ))}
    </div>
  );
}

function PresentationChart({
  data,
  sections,
  pitchRange,
  pitchMin,
  pitchMax,
  speechOptimalMin = 270,
  speechOptimalMax = 330,
}: {
  data: PresentationPoint[];
  sections: PresentationSection[];
  pitchRange: number;
  pitchMin: number;
  pitchMax: number;
  speechOptimalMin?: number;
  speechOptimalMax?: number;
}) {
  const [activeGraph, setActiveGraph] = useState<'pitch' | 'speech'>('speech');
  const showPitch  = activeGraph === 'pitch';
  const showSpeech = activeGraph === 'speech';

  const speechMean = Math.round(data.reduce((s, d) => s + d.speech_rate, 0) / data.length);

  // XAxis domain을 sections 마지막 end까지 명시적으로 지정해야 결론 구간이 잘림 없이 표시됨
  const domainMax = sections.length > 0 ? sections[sections.length - 1].end : 'dataMax';

  return (
    <div className="space-y-2">
      {/* 체크박스 토글 + 평균값 (차트 내부에서 겹치지 않도록 범례 영역에 표시) */}
      <div className="flex items-center gap-5 flex-wrap">
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm font-semibold"
          style={{ color: CHART_COLOR.speech }}>
          <input type="radio" name="graph-select" checked={showSpeech}
            onChange={() => setActiveGraph('speech')}
            className="accent-orange-600" />
          발화속도 (음절/분)
          <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-mono text-xs">
            평균 {speechMean}음절/분
          </span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm font-semibold"
          style={{ color: CHART_COLOR.pitch }}>
          <input type="radio" name="graph-select" checked={showPitch}
            onChange={() => setActiveGraph('pitch')}
            className="accent-purple-600" />
          피치 변화 (Hz)
          <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-mono text-xs">
            변화폭 {pitchRange.toFixed(0)}Hz
          </span>
        </label>
      </div>

      {/* 섹션 레이블 바 — 차트 위에 분리하여 선과 겹치지 않게 */}
      {typeof domainMax === 'number' && domainMax > 0 && (
        <div className="relative flex h-5" style={{ marginLeft: 48, marginRight: 8 }}>
          {sections.map(sec => (
            <div
              key={sec.label}
              className="absolute flex items-center justify-center text-xs font-semibold text-slate-400"
              style={{
                left: `${(sec.start / domainMax) * 100}%`,
                width: `${((sec.end - sec.start) / domainMax) * 100}%`,
              }}
            >
              {sec.label}
            </div>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          {/* 구간 경계 세로선 */}
          {sections.slice(0, -1).map(sec => (
            <ReferenceLine
              key={`div-${sec.label}`}
              yAxisId="pitch"
              x={sec.end}
              stroke="#cbd5e1"
              strokeDasharray="4 3"
              strokeWidth={1}
            />
          ))}

          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

          {/* 적정 범위 음영 (발화속도만) */}
          {showSpeech && (
            <ReferenceArea
              yAxisId="pitch"
              y1={speechOptimalMin} y2={speechOptimalMax}
              fill="#16a34a" fillOpacity={0.1}
              stroke="#16a34a" strokeOpacity={0.35} strokeWidth={1} strokeDasharray="4 3"
            />
          )}

          <XAxis
            dataKey="start"
            type="number"
            scale="linear"
            domain={[0, domainMax]}
            ticks={typeof domainMax === 'number'
              ? Array.from({ length: Math.floor(domainMax / 30) + 1 }, (_, i) => i * 30)
              : undefined}
            tickFormatter={(v: number) => {
              const m = Math.floor(v / 60);
              const s = String(Math.floor(v % 60)).padStart(2, '0');
              return `${m}:${s}`;
            }}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />

          {/* Y축: 하나로 통합 — 항상 같은 width로 레이아웃 고정 */}
          <YAxis
            yAxisId="pitch"
            domain={showPitch ? [40, 170] : [150, 450]}
            tick={{ fontSize: 12, fill: showPitch ? CHART_COLOR.pitch : CHART_COLOR.speech }}
            axisLine={false} tickLine={false} width={48}
          />

          <RechartsTooltip content={<PresentationChartTooltip />} />

          {/* 발화속도 평균 기준선 */}
          {/* 피치 최고·최저 기준선 */}
          {showPitch && (
            <ReferenceLine yAxisId="pitch" y={pitchMax}
              stroke={CHART_COLOR.pitch} strokeWidth={1} strokeDasharray="3 2" strokeOpacity={0.5}
              label={{ value: `최고 ${pitchMax}Hz`, position: 'insideRight', fontSize: 11, fill: CHART_COLOR.pitch, opacity: 0.8 }}
            />
          )}
          {showPitch && (
            <ReferenceLine yAxisId="pitch" y={pitchMin}
              stroke={CHART_COLOR.pitch} strokeWidth={1} strokeDasharray="3 2" strokeOpacity={0.5}
              label={{ value: `최저 ${pitchMin}Hz`, position: 'insideRight', fontSize: 11, fill: CHART_COLOR.pitch, opacity: 0.8 }}
            />
          )}
          {showSpeech && (
            <ReferenceLine yAxisId="pitch" y={speechMean}
              stroke={CHART_COLOR.speech} strokeWidth={2} strokeDasharray="6 3" />
          )}

          {showPitch && (
            <Area yAxisId="pitch" type="monotone" dataKey="pitch_hz"
              stroke={CHART_COLOR.pitch} strokeWidth={1.5}
              fill="none"
              dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
          )}
          {showSpeech && (
            <Area yAxisId="pitch" type="monotone" dataKey="speech_rate"
              stroke={CHART_COLOR.speech} strokeWidth={1.5}
              fill="none"
              dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 연습 체크리스트 ───────────────────────────────────────────────────────────

export function generateMockChecklist(ar: {
  speechRate: number;
  eyeContact: number;
  pitchVariation: number;
  lateSpeedRatio?: number;
  negativePoseDurationRatio?: number;
  durationSec?: number;
  timeLimitSec?: number;
}): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  const fmtDiff = (s: number) => {
    const m = Math.floor(s / 60), sec = Math.round(s % 60);
    return m > 0 ? `${m}분 ${sec}초` : `${sec}초`;
  };

  // 발화 속도
  if (ar.speechRate < 270 || ar.speechRate > 330)
    items.push({ id: 'speechRate', category: 'voice', metric_key: 'speechRate',
      condition: 'in_range', target_min: 270, target_max: 330, is_completed: false,
      label: ar.speechRate > 330 ? `발화 속도가 ${ar.speechRate}자/분으로 빠른 편이에요.` : `발화 속도가 ${ar.speechRate} 자/분으로 느린 편이에요.`,
      fact: ar.speechRate > 330
        ? `발화 속도가 ${ar.speechRate} 자/분으로 적정 범위(270–330자/분)보다 빠르게 측정됐어요.`
        : `발화 속도가 ${ar.speechRate} 자/분으로 적정 범위(270–330자/분)보다 느리게 측정됐어요.`,
      tip: ar.speechRate > 330
        ? `문장 사이에 짧게 멈추는 연습을 하면 청중이 내용을 더 잘 이해할 수 있어요.`
        : `핵심 내용을 읽어보는 연습을 통해 자연스럽게 속도를 높이면 발표에 집중력이 생겨요.` });
  else
    items.push({ id: 'speechRate', category: 'voice', metric_key: 'speechRate', is_completed: false,
      label: `발화 속도가 ${ar.speechRate}자/분으로 적정해요.`,
      fact: `발화 속도가 ${ar.speechRate}자/분으로 청중이 따라오기 좋은 속도였어요.` });

  // 피치 변화폭
  const pitchVal = ar.pitchVariation ?? 75;
  if (pitchVal < 70 || pitchVal > 90)
    items.push({ id: 'pitchVariation', category: 'voice', metric_key: 'pitchVariation',
      condition: 'in_range', target_min: 70, target_max: 90, is_completed: false,
      label: pitchVal < 70 ? `피치 변화폭이 ${pitchVal}Hz로 단조로운 편이에요.` : `피치 변화폭이 ${pitchVal} Hz로 변화가 과한 편이에요.`,
      fact: pitchVal < 70
        ? `피치 변화폭이 ${pitchVal}Hz로 목소리가 전반적으로 단조롭게 유지됐어요.`
        : `피치 변화폭이 ${pitchVal}Hz로 목소리 변화가 다소 불규칙했어요.`,
      tip: pitchVal < 70
        ? `중요한 단어에서 의식적으로 목소리를 높이면 청중의 집중도를 끌어올릴 수 있어요.`
        : `주요 포인트 외에는 일정한 톤을 유지하면 더 안정적이고 신뢰감 있게 들려요.` });
  else
    items.push({ id: 'pitchVariation', category: 'voice', metric_key: 'pitchVariation', is_completed: false,
      label: `피치 변화폭이 ${pitchVal}Hz로 적절해요.`,
      fact: `피치 변화폭이 ${pitchVal}Hz로 목소리 높낮이가 자연스럽게 유지됐어요.` });

  // 후반부 말속도
  const lateRatio = ar.lateSpeedRatio ?? 1.0;
  if (Math.abs(lateRatio - 1.0) > 0.05) {
    const diffPct = Math.round(Math.abs(lateRatio - 1.0) * 100);
    items.push({ id: 'lateSpeed', category: 'voice', metric_key: 'lateSpeedRatio',
      condition: 'in_range', target_min: 0.95, target_max: 1.05, is_completed: false,
      label: lateRatio > 1.0 ? `후반부 발화 속도가 전체 평균보다 ${diffPct}% 빨랐어요.` : `후반부 발화 속도가 전체 평균보다 ${diffPct}% 느려졌어요.`,
      fact: lateRatio > 1.0
        ? `발표 후반부 발화 속도가 전체 평균 대비 ${diffPct}% 빠르게 측정됐어요.`
        : `발표 후반부 발화 속도가 전체 평균 대비 ${diffPct}% 느리게 측정됐어요.`,
      tip: lateRatio > 1.0
        ? `발표 마지막 부분에서 의식적으로 천천히 말하면 마무리가 더 깔끔하게 전달돼요.`
        : `후반부에 핵심 내용을 짧게 요약하는 연습을 하면 긴장감 없이 속도를 유지할 수 있어요.` });
  } else {
    const diffPct = Math.round(Math.abs(lateRatio - 1.0) * 100);
    items.push({ id: 'lateSpeed', category: 'voice', metric_key: 'lateSpeedRatio', is_completed: false,
      label: `후반부 발화 속도가 일정하게 유지됐어요.`,
      fact: `후반부 말속도 변화율이 ±${diffPct}%로 일정하게 유지됐어요.` });
  }

  // 자세 안정성
  const poseRatio = ar.negativePoseDurationRatio ?? 0;
  if (poseRatio >= 0.10)
    items.push({ id: 'posture', category: 'posture', metric_key: 'negativePoseDurationRatio',
      condition: 'lte', target_max: 0.10, is_completed: false,
      label: poseRatio > 0.25 ? `발표 시간의 ${Math.round(poseRatio * 100)}% 동안 자세가 자주 흐트러졌어요.` : `발표 시간의 ${Math.round(poseRatio * 100)}% 동안 자세가 흐트러졌어요.`,
      fact: poseRatio > 0.25
        ? `발표 시간의 ${Math.round(poseRatio * 100)}% 동안 몸 기울이기·만지기 등 부정적인 자세가 감지됐어요.`
        : `발표 시간의 ${Math.round(poseRatio * 100)}% 동안 자세 불안정이 측정됐어요.`,
      tip: poseRatio > 0.25
        ? `발표 전 어깨를 펴고 발 너비를 어깨 폭으로 벌려 서는 자세를 습관화하면 자연스럽게 안정돼요.`
        : `녹화 영상을 보며 어느 순간 자세가 무너지는지 확인하고 그 구간을 집중적으로 연습해보세요.` });
  else
    items.push({ id: 'posture', category: 'posture', metric_key: 'negativePoseDurationRatio', is_completed: false,
      label: `발표 내내 자세가 안정적이었어요.`,
      fact: `자세 불안정 비율이 ${Math.round(poseRatio * 100)}%로 발표 내내 안정적인 자세를 유지했어요.` });

  // 정면 응시
  if (ar.eyeContact < 70)
    items.push({ id: 'eyeContact', category: 'posture', metric_key: 'eyeContact',
      condition: 'gte', target_min: 70, is_completed: false,
      label: ar.eyeContact < 50 ? `정면 응시 비율이 ${ar.eyeContact}%로 낮아요.` : `정면 응시 비율이 ${ar.eyeContact}%로 조금 부족해요.`,
      fact: ar.eyeContact < 50
        ? `정면 응시 비율이 ${ar.eyeContact}%로 청중보다 화면이나 메모를 바라보는 시간이 훨씬 많았어요.`
        : `정면 응시 비율이 ${ar.eyeContact}%로 시선이 화면 쪽으로 자주 향했어요.`,
      tip: ar.eyeContact < 50
        ? `카메라 위에 작은 메모지를 붙여두고 연습하면 자연스럽게 정면을 바라보는 습관이 생겨요.`
        : `슬라이드를 읽는 대신 키워드만 적어두면 청중을 바라보며 말하는 시간이 늘어나요.` });
  else
    items.push({ id: 'eyeContact', category: 'posture', metric_key: 'eyeContact', is_completed: false,
      label: `정면 응시 비율이 ${ar.eyeContact}%로 충분했어요.`,
      fact: `정면 응시 비율이 ${ar.eyeContact}%로 청중과 충분히 눈을 맞추며 발표했어요.` });

  // 발표 시간
  if (ar.durationSec !== undefined && ar.timeLimitSec && ar.timeLimitSec > 0) {
    const diff = ar.durationSec - ar.timeLimitSec;
    if (Math.abs(diff) > ar.timeLimitSec * 0.10)
      items.push({ id: 'duration', category: 'voice', metric_key: 'durationSec',
        condition: 'in_range', target_min: ar.timeLimitSec * 0.9, target_max: ar.timeLimitSec * 1.1, is_completed: false,
        label: diff > 0 ? `제한시간보다 ${fmtDiff(diff)} 초과했어요.` : `제한시간보다 ${fmtDiff(-diff)} 일찍 끝났어요.`,
        fact: diff > 0
          ? `발표 시간이 제한시간보다 ${fmtDiff(diff)} 초과됐어요.`
          : `발표 시간이 제한시간보다 ${fmtDiff(-diff)} 일찍 끝났어요.`,
        tip: diff > 0
          ? `각 섹션에 시간을 배분하고 미리 타이머를 켜두고 연습하면 자연스럽게 시간 안에 마칠 수 있어요.`
          : `핵심 포인트마다 예시나 부연 설명을 한 문장씩 추가하면 내용이 더 풍부해지고 시간도 채워져요.` });
    else {
      const fmtAbs = (s: number) => {
        const m = Math.floor(s / 60), sec = Math.round(s % 60);
        return sec > 0 ? `${m}분 ${sec}초` : `${m}분`;
      };
      items.push({ id: 'duration', category: 'voice', metric_key: 'durationSec', is_completed: false,
        label: `발표 시간을 적절히 활용했어요.`,
        fact: `${fmtAbs(ar.durationSec)} 발표로 제한시간 ${fmtAbs(ar.timeLimitSec!)}을 여유롭게 마쳤어요.` });
    }
  }

  return items;
}

const CATEGORY_STYLE = {
  voice:   { label: '음성', cls: 'bg-purple-100 text-purple-700' },
  posture: { label: '자세', cls: 'bg-green-100  text-green-700'  },
} as const;

function ChecklistPanel({
  items,
  onToggle,
}: {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
}) {
  const goodItems = items.filter(item => !item.tip);
  const improveItems = items.filter(item => !!item.tip);

  const renderGoodItem = (item: ChecklistItem) => {
    const cat = CATEGORY_STYLE[item.category];
    return (
      <div key={item.id} className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-green-50 border-green-200">
        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${cat.cls}`}>
          {cat.label}
        </span>
        <p className="text-sm leading-snug flex-1 min-w-0 text-green-800">
          {item.fact ?? item.label}
        </p>
      </div>
    );
  };

  const renderImproveItem = (item: ChecklistItem) => {
    const cat = CATEGORY_STYLE[item.category];
    if (item.is_completed) {
      return (
        <div key={item.id} className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${cat.cls}`}>
            {cat.label}
          </span>
          <p className="text-sm leading-snug flex-1 min-w-0 text-green-800 line-through decoration-green-400">
            {item.fact ?? item.label}
          </p>
        </div>
      );
    }
    return (
      <label key={item.id}
        className="flex flex-col gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-colors bg-red-50 border-red-200 hover:bg-red-100">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={false}
            onChange={() => onToggle(item.id)}
            className="accent-green-600 shrink-0" />
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${cat.cls}`}>
            {cat.label}
          </span>
          <p className="text-sm leading-snug flex-1 min-w-0 text-slate-800">
            {item.fact ?? item.label}
          </p>
        </div>
        <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-2">
          <span className="text-sm flex-shrink-0">💡</span>
          <p className="text-xs text-amber-800 leading-relaxed">{item.tip}</p>
        </div>
      </label>
    );
  };

  return (
    <div className="space-y-4">
      {goodItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm font-bold text-green-700">잘한 점</p>
          </div>
          {goodItems.map(renderGoodItem)}
        </div>
      )}
      {improveItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm font-bold text-red-600">개선할 점</p>
          </div>
          <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 leading-relaxed">
            2회차 발표 후 비교 페이지에서 자기 체크 여부와 실제 수치 달성 여부를 함께 확인할 수 있습니다.
          </p>
          {improveItems.map(renderImproveItem)}
        </div>
      )}
      {goodItems.length === 0 && improveItems.length === 0 && (
        <div className="text-center py-6 text-sm text-slate-400">
          모든 지표가 적정 범위입니다 🎉
        </div>
      )}
    </div>
  );
}

// ── 시선 비율 3x3 그리드 ──────────────────────────────────────────────────────
function GazeGrid({ grid }: { grid: number[][] }) {
  const maxNonCenter = Math.max(
    ...grid.flatMap((row, ri) => row.map((v, ci) => (ri === 1 && ci === 1 ? 0 : v))),
    0.01
  );

  return (
    <div className="w-full h-full bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col">
      <p className="text-sm font-semibold text-slate-600 mb-3 tracking-wide">시선 분포</p>
      <div className="flex-1 flex items-center justify-center">
        <div className="inline-grid gap-x-2 gap-y-1" style={{ gridTemplateColumns: '1.5rem auto 1.5rem' }}>
          <div />
          <div className="flex justify-center"><span className="text-sm font-semibold text-slate-400">상</span></div>
          <div />
          <div className="flex items-center justify-center">
            <span className="text-sm font-semibold text-slate-400">좌</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
              {grid.map((row, ri) =>
                row.map((val, ci) => {
                  const isCenter = ri === 1 && ci === 1;
                  const absVal = Math.round(val * 10) / 10;

                  if (isCenter) {
                    return (
                      <div
                        key={`${ri}-${ci}`}
                        className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-0.5 relative z-10 scale-[1.13] shadow-xl"
                        style={{ background: 'rgba(30, 64, 175, 0.75)' }}
                      >
                        <span className="text-[10px] font-bold text-white/70 tracking-wide">정면</span>
                        <span className="text-2xl font-bold text-white leading-none">{absVal === 0 ? '—' : `${absVal}%`}</span>
                      </div>
                    );
                  }

                  const intensity = Math.min(val / (maxNonCenter * 1.2), 1);
                  const bgOpacity = 0.04 + intensity * 0.22;
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className="w-20 h-20 rounded-lg flex flex-col items-center justify-center gap-0.5 border border-slate-200"
                      style={{ background: `rgba(59, 130, 246, ${bgOpacity})` }}
                    >
                      <span className="text-base font-bold text-slate-700 leading-none">{absVal === 0 ? '—' : `${absVal}%`}</span>
                    </div>
                  );
                })
              )}
          </div>
          <div className="flex items-center justify-center">
            <span className="text-sm font-semibold text-slate-400">우</span>
          </div>
          <div />
          <div className="flex justify-center"><span className="text-sm font-semibold text-slate-400">하</span></div>
          <div />
        </div>
      </div>
    </div>
  );
}

// ── 자세 라벨 한글 매핑 ───────────────────────────────────────────────────────
const POSE_LABEL_KO: Record<string, string> = {
  'Touching head': '머리 만지기',
  'Touching face': '얼굴 만지기',
  'Touching body': '몸 만지기',
  'Touching hand': '손 만지기',
  'Swaying head':  '머리 흔들기',
  'Swaying body':  '몸 흔들기',
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const navigate = useNavigate();
  const { sessionId, attemptNumber } = useParams<{ sessionId: string; attemptNumber?: string }>();
  const { sessions, setCurrentSessionId, saveChecklist } = useApp();

  const [activeTab, setActiveTab] = useState<'overall' | 'voice' | 'posture' | 'checklist'>('overall');
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [expandedPoses, setExpandedPoses] = useState<Set<string>>(new Set());
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const overallRef = useRef<HTMLDivElement>(null);
  const voiceRef = useRef<HTMLDivElement>(null);
  const postureRef = useRef<HTMLDivElement>(null);
  const checklistRef = useRef<HTMLDivElement>(null);

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
            if (id === 'overall' || id === 'voice' || id === 'posture' || id === 'checklist') setActiveTab(id);
          }
        });
      },
      { root: container, threshold: 0.4 },
    );
    if (overallRef.current) observer.observe(overallRef.current);
    if (voiceRef.current) observer.observe(voiceRef.current);
    if (postureRef.current) observer.observe(postureRef.current);
    if (checklistRef.current) observer.observe(checklistRef.current);
    return () => observer.disconnect();
  }, [currentAttempt]);

  // 체크리스트 초기화: 저장된 데이터 있으면 불러오고, 없으면 분석 결과로 생성
  useEffect(() => {
    if (!currentAttempt) return;
    const gazeM = (currentAttempt.analysisResults as any)?.gazeResult?.gaze_metrics
      ?? (mockGazeResult as unknown as GazeResult).gaze_metrics;
    const eyeContactVal = Math.round((gazeM.grid_percent as number[][])[1][1] * 10) / 10;
    const ar = currentAttempt.analysisResults as any ?? {};
    const mockRefiner = mockRefinerResult as unknown as RefinerResult;
    const negPoseRatio = ar.negativePoseDurationRatio
      ?? mockRefiner.refined_result.details.negative_posture_analysis.negative_posture_duration_ratio;
    const lateRatio = ar.lateSpeedRatio
      ?? (mockRefiner.refined_result.details.late_speech_rate_analysis.late_average_cpm
          / mockRefiner.refined_result.details.late_speech_rate_analysis.overall_average_cpm);
    // videoDuration(실제 영상 길이)을 우선 사용, 없으면 분석 데이터의 duration으로 폴백
    const durFallback = (() => {
      const durStr: string = ar.duration ?? '0:00';
      const [dm, ds] = durStr.split(':').map(Number);
      return dm * 60 + (ds || 0);
    })();
    const durationSec = videoDuration ?? durFallback;
    const timeLimitSec = currentSession?.formData?.timeLimit
      ? parseInt(currentSession.formData.timeLimit) * 60 : 0;
    // 항상 현재 분석 데이터 기준으로 재생성 → 개선이 필요한 항목만 남음
    const generated = generateMockChecklist({
      speechRate: ar.speechRate ?? 300,
      eyeContact: eyeContactVal,
      pitchVariation: ar.pitchVariation ?? 75,
      lateSpeedRatio: lateRatio,
      negativePoseDurationRatio: negPoseRatio,
      durationSec: durationSec > 0 ? durationSec : undefined,
      timeLimitSec: timeLimitSec > 0 ? timeLimitSec : undefined,
    });
    // 저장된 체크 상태(is_completed)만 복원
    const saved = currentAttempt.checklist ?? [];
    setChecklistItems(generated.map(item => ({
      ...item,
      is_completed: saved.find(s => s.id === item.id)?.is_completed ?? false,
    })));
  }, [currentAttempt?.id, videoDuration]);

  useEffect(() => {
    const url = currentAttempt?.videoUrl;
    if (!url) { setVideoDuration(null); return; }
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => setVideoDuration(video.duration);
    video.onerror = () => setVideoDuration(null);
    video.src = url;
  }, [currentAttempt?.videoUrl]);

  if (!currentSession) return null;
  if (!currentAttempt) { navigate('/dashboard'); return null; }

  // ── 회차 번호에 따라 mock fallback 선택 ──
  const attemptIdx = attemptNumber ? parseInt(attemptNumber) : (currentSession?.attempts.length ?? 1);
  const mockSttResult    = attemptIdx === 2 ? mockSttResult2    : mockSttResult1;
  const mockPitchResult  = attemptIdx === 2 ? mockPitchResult2  : mockPitchResult1;
  const mockLlmResult    = attemptIdx === 2 ? mockLlmResult2    : mockLlmResult1;
  const mockPoseResult   = attemptIdx === 2 ? mockPoseResult2   : mockPoseResult1;
  const mockRefinerResult = attemptIdx === 2 ? mockRefinerResult2 : mockRefinerResult1;
  const mockGazeResult   = attemptIdx === 2 ? mockGazeResult2   : mockGazeResult1;

  // ── 백엔드 연동 시 analysisResults에 아래 필드가 채워짐 (없으면 mock fallback) ──
  const stt: SttResult = (currentAttempt.analysisResults as any)?.sttResult ?? (mockSttResult as unknown as SttResult);
  const pitch: PitchResult = (currentAttempt.analysisResults as any)?.pitchResult ?? (mockPitchResult as unknown as PitchResult);
  const llm: LlmResult = (currentAttempt.analysisResults as any)?.llmResult ?? (mockLlmResult as unknown as LlmResult);
  const pose: PoseResult = (currentAttempt.analysisResults as any)?.poseResult ?? (mockPoseResult as unknown as PoseResult);
  const refiner: RefinerResult = (currentAttempt.analysisResults as any)?.refinerResult ?? (mockRefinerResult as unknown as RefinerResult);
  const gaze: GazeResult = (currentAttempt.analysisResults as any)?.gazeResult ?? (mockGazeResult as unknown as GazeResult);

  // stt
  const overallCpm = stt.audio_metrics.overall_cpm;
  const durationSec = stt.audio_metrics.total_time_sec;

  // pitch
  const { min_hz, max_hz } = pitch.pitch_metrics;
  const pitchRange = Math.round((max_hz - min_hz) * 10) / 10;

  // gaze
  const gazeGrid = gaze.gaze_metrics.grid_percent;
  const eyeContactFromGaze = Math.round(gazeGrid[1][1] * 10) / 10;
  const GAZE_DIRS = [
    { r: 0, c: 1, label: '위쪽' }, { r: 2, c: 1, label: '아래쪽' },
    { r: 1, c: 0, label: '왼쪽' }, { r: 1, c: 2, label: '오른쪽' },
  ];
  const dominantOffDir = (() => {
    const best = GAZE_DIRS.reduce((a, b) => gazeGrid[a.r][a.c] >= gazeGrid[b.r][b.c] ? a : b);
    return gazeGrid[best.r][best.c] > gazeGrid[1][1] ? best.label : null;
  })();

  // refiner
  const negPoseAnalysis = refiner.refined_result.details.negative_posture_analysis;
  const negPoseDurationRatio = negPoseAnalysis.negative_posture_duration_ratio;
  const lateSpeedAnalysis = refiner.refined_result.details.late_speech_rate_analysis;
  const lateSpeedRatio = lateSpeedAnalysis.late_average_cpm / lateSpeedAnalysis.overall_average_cpm;

  // pose: 부정 자세만 필터 (Standing 제외)
  const NEGATIVE_POSE_LABELS = ['Touching head', 'Touching face', 'Touching body', 'Touching hand', 'Swaying head', 'Swaying body'];
  const negativePoseTimeline = pose.timeline.filter(e => NEGATIVE_POSE_LABELS.includes(e.label));

  // postureTop3: negative_posture_by_label 사용
  const postureTop3 = refiner.refined_result.details.negative_posture_analysis.negative_posture_by_label
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((item, idx) => ({ rank: idx + 1, label: item.label, count: item.count, percent: Math.round(item.duration_sec / durationSec * 100) }));

  // 그래프 데이터
  const presentationData = buildCombinedTimeline(pitch.pitch_metrics.segment, stt.audio_metrics.segment);
  const presentationSections = buildSectionsFromLlm(llm.feedback.summary.structure);

  // Timeline 컴포넌트용 데이터: LLM structure → section 단위, script는 해당 구간 STT 텍스트 합산
  const toSec = (t: string) => { const [m, s] = t.split(':').map(Number); return m * 60 + (s ?? 0); };
  const structureEntries = llm.feedback.summary.structure.map(item => {
    const [time, label] = Object.entries(item)[0];
    return { time, label, startSec: toSec(time) };
  });
  const timelineData = structureEntries.map((entry, i) => {
    const nextSec = i < structureEntries.length - 1 ? structureEntries[i + 1].startSec : Infinity;
    const script = stt.audio_metrics.segment
      .filter(seg => seg.start >= entry.startSec && seg.start < nextSec)
      .map(seg => seg.text)
      .join(' ');
    return {
      time: entry.time,
      event: entry.label,
      type: (i === 0 ? 'start' : i === structureEntries.length - 1 ? 'end' : 'content') as 'start' | 'content' | 'end',
      script: script || undefined,
    };
  });

  // label별 탐지 구간 목록 (토글 시 표시)
  const segmentsByLabel = negativePoseTimeline.reduce<Record<string, { start: number; end: number; duration: number }[]>>(
    (acc, item) => {
      (acc[item.label] ??= []).push({ start: item.start, end: item.end, duration: item.duration });
      return acc;
    }, {}
  );

  // 기본값과 실제 데이터 병합 (eyeContact, speechRate 등은 위에서 추출한 값 우선)
  const ar = {
    duration: '8:30', postureScore: 75,
    pitchVariation: pitchRange, avgIPsPerSentence: 3.5, avgWordsPerSentence: 10,
    longPauseCount: 2, wordPauseCount: 12,
    fillerRate: 0.35, habitualBehaviorCount: 3,
    ...currentAttempt.analysisResults,
    speechRate: overallCpm,
    eyeContact: eyeContactFromGaze,
    lateSpeedRatio: lateSpeedRatio,
    negativePoseDurationRatio: negPoseDurationRatio,
  };

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

  const postureNegDurationRatio = negPoseDurationRatio;
  const lateSpeedRatioForRadar = lateSpeedRatio;
  const timeLimitSecForRadar = currentSession.formData?.timeLimit
    ? parseInt(currentSession.formData.timeLimit) * 60 : 0;
  const durationSecForRadar = videoDuration ?? 0;

  const radarData = [
    { metric: '발화 속도',    level: toSpeechLevel(ar.speechRate) },
    { metric: '피치 변화폭',  level: toPitchLevel(pitchRange) },
    { metric: '후반부 말속도', level: toLateSpeedLevel(lateSpeedRatioForRadar) },
    { metric: '자세 안정성',  level: toPostureLevel(postureNegDurationRatio) },
    { metric: '정면 응시',    level: toEyeLevel(ar.eyeContact) },
    { metric: '발표 시간',    level: toDurationLevel(durationSecForRadar, timeLimitSecForRadar) },
  ];

  const handleTimelineClick = (timeString: string) => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    setCurrentVideoTime(minutes * 60 + seconds);
  };

  const handleRetry = () => {
    setCurrentSessionId(sessionId || null);
    navigate('/presentation/new');
  };

  const handleToggleChecklist = (id: string) => {
    const updated = checklistItems.map(it =>
      it.id === id ? { ...it, is_completed: !it.is_completed } : it
    );
    setChecklistItems(updated);
    saveChecklist(sessionId!, currentAttempt.id, updated); // AppContext에 자동 반영 (네비게이션 후에도 유지)
  };

  const scrollToSection = (section: 'overall' | 'voice' | 'posture' | 'checklist') => {
    const refMap = { overall: overallRef, voice: voiceRef, posture: postureRef, checklist: checklistRef };
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
                issueSegments={currentAttempt.analysisResults?.issueSegments}
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
            {(['overall', 'voice', 'posture', 'checklist'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => scrollToSection(tab)}
                className={`flex-1 px-2 py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-1 ${
                  activeTab === tab
                    ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab === 'voice' && <Mic className="w-4 h-4 flex-shrink-0" />}
                {tab === 'posture' && <User className="w-4 h-4 flex-shrink-0" />}
                {tab === 'checklist' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                {tab === 'overall' ? '종합' : tab === 'voice' ? '음성' : tab === 'posture' ? '자세' : '개선 과제'}
              </button>
            ))}
          </div>

          {/* 스크롤 콘텐츠 */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-hide">

            {/* ─── 종합 섹션 ─── */}
            <div ref={overallRef} data-section="overall" className="p-5 space-y-5">

              {/* 종합 평가 — 가장 먼저 보여주는 핵심 피드백 */}
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-2">종합 평가</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {llm.feedback.summary.overall_comment}
                </p>
              </div>

              <h3 className="text-sm font-bold text-slate-900 pl-3 border-l-4 border-blue-900">6가지 지표 요약</h3>

              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} outerRadius="68%" margin={{ top: 15, right: 40, bottom: 15, left: 40 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 13, fill: '#475569', fontWeight: 600 }}
                  />
                  <PolarRadiusAxis domain={[0, 3]} tick={false} axisLine={false} tickCount={4} />
                  <Radar
                    dataKey="level"
                    stroke="#1e3a8a"
                    fill="#1e3a8a"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <RechartsTooltip content={<RadarTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 text-xs">
                {([['#dc2626', '개선필요'], ['#ea580c', '주의'], ['#16a34a', '적정']] as const).map(([color, label]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-slate-500 font-medium">{label}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <KPICard
                  label="발화 속도 평균"
                  value={ar.speechRate}
                  unit="음절/분"
                  status={ar.speechRate >= 270 && ar.speechRate <= 330 ? '적정' : ar.speechRate >= 240 && ar.speechRate <= 360 ? '주의' : '경고'}
                />
                <KPICard
                  label="피치 변화폭"
                  value={pitchRange}
                  unit="Hz"
                  status={pitchRange >= 70 && pitchRange <= 90 ? '적정' : pitchRange >= 41 ? '주의' : '경고'}
                />
                <KPICard
                  label="정면 응시 비율"
                  value={ar.eyeContact}
                  unit="%"
                  status={ar.eyeContact >= 70 ? '적정' : ar.eyeContact >= 50 ? '주의' : '경고'}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(() => {
                  const totalSec = videoDuration ?? 0;
                  const m = Math.floor(totalSec / 60);
                  const s = Math.floor(totalSec % 60);
                  const node: ReactNode = videoDuration != null ? (
                    <>
                      {m}<span className="text-sm font-normal text-slate-400 ml-1">분</span>
                      {s > 0 && <> {String(s).padStart(2, '0')}<span className="text-sm font-normal text-slate-400 ml-1">초</span></>}
                    </>
                  ) : '—';
                  const lvl = toDurationLevel(durationSecForRadar, timeLimitSecForRadar);
                  const status: KPIStatus = lvl === 3 ? '적정' : lvl === 2 ? '주의' : '경고';
                  return <KPICard label="발표 시간" value={0} displayValue={node} unit="" status={status} />;
                })()}
                <KPICard
                  label="문제 자세 비율"
                  value={Math.round(negPoseDurationRatio * 100)}
                  unit="%"
                  status={negPoseDurationRatio < 0.10 ? '적정' : negPoseDurationRatio <= 0.25 ? '주의' : '경고'}
                />
                {(() => {
                  const dev = lateSpeedRatio - 1.0;
                  const pct = Math.round(dev * 100);
                  const display = `${pct >= 0 ? '+' : ''}${pct}`;
                  const absDev = Math.abs(dev);
                  const status: KPIStatus = absDev <= 0.05 ? '적정' : absDev <= 0.15 ? '주의' : '경고';
                  return <KPICard label="후반부 말속도" value={0} displayValue={display} unit="%" status={status} />;
                })()}
              </div>

              {/* 발표 시간 준수 여부 */}
              {(() => {
                if (videoDuration === null) return null;
                const totalSec = videoDuration;
                const timeLimitMin = parseFloat(currentSession.formData?.timeLimit ?? '0');
                const timeLimitSec = timeLimitMin * 60;
                const hasLimit = timeLimitMin > 0;
                const exceeded = hasLimit && totalSec > timeLimitSec;
                const fmt = (s: number) =>
                  `${Math.floor(s / 60)}분 ${String(Math.floor(s % 60)).padStart(2, '0')}초`;
                const statusCls = !hasLimit
                  ? 'bg-slate-100 border-slate-200'
                  : exceeded
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200';
                return (
                  <div className={`rounded-xl p-4 border ${statusCls}`}>
                    <p className="text-sm font-semibold text-slate-600 mb-3 tracking-wide">발표 시간 준수</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 w-20">제한 시간</span>
                        <span className="font-bold text-slate-800">
                          {hasLimit ? `${timeLimitMin}분 (${fmt(timeLimitSec)})` : '미설정'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500 w-20">실제 시간</span>
                        <span className="font-bold text-slate-800">{fmt(totalSec)}</span>
                      </div>
                      {hasLimit && (
                        <p className={`text-sm font-semibold mt-1 ${exceeded ? 'text-red-600' : 'text-green-700'}`}>
                          {exceeded ? '제한 시간을 초과했습니다.' : '제한 시간을 준수했습니다.'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

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

              {/* 발표 전체 그래프 (피치 + 발화속도) */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-sm font-semibold text-slate-600 mb-3 tracking-wide">발표 전체 그래프</p>
                <PresentationChart
                  data={presentationData}
                  sections={presentationSections}
                  pitchRange={pitchRange}
                  pitchMin={min_hz}
                  pitchMax={max_hz}
                />
              </div>

              {/* 발화 속도 + 피치 변화폭 (나란히) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm font-semibold text-slate-600 mb-3 tracking-wide">발화 속도</p>
                  <RangeGauge
                    value={ar.speechRate}
                    optimalMin={270} optimalMax={330}
                    unit="음절/분" maxDisplay={480}
                    minLabel="느린 편" maxLabel="빠른 편"
                  />
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-sm font-semibold text-slate-600 mb-3 tracking-wide">피치 변화폭</p>
                  <RangeGauge
                    value={ar.pitchVariation}
                    optimalMin={70} optimalMax={90}
                    unit="Hz" maxDisplay={150}
                    minLabel="단조로움" maxLabel="변화 과다"
                  />
                </div>
              </div>

              {/* 후반부 발화속도 분석 */}
              {(() => {
                const lateData = (refiner as any).refined_result.details.late_speech_rate_analysis;

                const { late_section_ratio, late_section_start_sec, late_average_cpm, overall_average_cpm, is_faster_than_overall } = lateData;
                const changeRatio = (overall_average_cpm - late_average_cpm) / overall_average_cpm * 100;
                const isSignificant = is_faster_than_overall && Math.abs(changeRatio) >= 10;
                const lateRatioPct = Math.round(late_section_ratio * 100);

                const fmtTime = (sec: number) => {
                  const m = Math.floor(sec / 60);
                  const s = String(Math.floor(sec % 60)).padStart(2, '0');
                  return `${m}:${s}`;
                };

                return (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-600 mb-3 tracking-wide">
                      후반 {lateRatioPct}% 구간 발화속도
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">전체 평균</span>
                        <span className="font-bold text-slate-800">{overall_average_cpm.toFixed(1)} 자/분</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">후반부 평균 <span className="text-slate-400 font-normal">({fmtTime(late_section_start_sec)} ~ )</span></span>
                        <span className="font-bold text-slate-800">{late_average_cpm.toFixed(1)} 자/분</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">전체 대비 변화율</span>
                        <span className={`font-bold ${is_faster_than_overall ? 'text-red-600' : 'text-green-700'}`}>
                          {is_faster_than_overall ? '+' : ''}{Math.abs(changeRatio).toFixed(1)}%{is_faster_than_overall ? ' 빠름' : ' 느림'}
                        </span>
                      </div>
                      <div className={`mt-1 text-sm font-semibold rounded-lg px-3 py-2 ${
                        isSignificant
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {isSignificant
                          ? `후반부에 발화속도가 평균 대비 ${Math.abs(changeRatio).toFixed(1)}% 빨라졌습니다. 속도를 일정하게 유지해보세요.`
                          : '후반부 발화속도가 전체 평균과 비슷하게 유지되었습니다.'}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 휴지 기간 (3초 이상) */}
              {(() => {
                const PAUSE_THRESHOLD = refiner.refined_result.details.pause_analysis.sentence_pause_threshold_sec;
                const allPauses = refiner.refined_result.details.pause_analysis.long_sentence_pause_top3;
                // 이전 문장 조회용 인덱스 맵
                const textByIndex = Object.fromEntries(allPauses.map(p => [p.index, p.text]));
                const qualifying = allPauses.filter(p => p.pause_duration_sec >= PAUSE_THRESHOLD);

                if (qualifying.length === 0) return (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-600 mb-2 tracking-wide">
                      휴지 기간 ({PAUSE_THRESHOLD}초 이상)
                    </p>
                    <p className="text-sm text-slate-400">{PAUSE_THRESHOLD}초 이상의 휴지 구간이 없었어요.</p>
                  </div>
                );

                const fmtTime = (sec: number) => {
                  const m = Math.floor(sec / 60);
                  const s = String(Math.floor(sec % 60)).padStart(2, '0');
                  return `${m}:${s}`;
                };

                return (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-600 mb-3 tracking-wide">
                      휴지 기간 ({PAUSE_THRESHOLD}초 이상)
                    </p>
                    <div className="space-y-3">
                      {qualifying.map((pause, i) => {
                        const pauseStart = pause.start - pause.pause_duration_sec;
                        const prevText = pause.index > 0 ? textByIndex[pause.index - 1] : null;
                        const durationColor = pause.pause_duration_sec >= 6
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-orange-100 text-orange-700 border-orange-200';

                        return (
                          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5">
                            {/* 헤더: 휴지 길이 + 이동 버튼 */}
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${durationColor}`}>
                                {pause.pause_duration_sec.toFixed(1)}초 휴지
                              </span>
                              <button
                                onClick={() => handleTimelineClick(fmtTime(pauseStart))}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 text-xs font-semibold transition-colors"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                {fmtTime(pauseStart)} 구간 보기
                              </button>
                            </div>

                            {/* 이전 문장 → 휴지 → 이후 문장 */}
                            <div className="space-y-1.5">
                              <div className="flex gap-2">
                                <span className="text-xs font-semibold text-slate-400 w-14 flex-shrink-0 pt-0.5">이전 발화</span>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {prevText ?? '(발표 시작 전)'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 pl-14">
                                <div className="h-px flex-1 border-t-2 border-dashed border-slate-300" />
                                <span className="text-[11px] font-semibold text-slate-400 flex-shrink-0">
                                  ↓ {pause.pause_duration_sec.toFixed(1)}초
                                </span>
                                <div className="h-px flex-1 border-t-2 border-dashed border-slate-300" />
                              </div>
                              <div className="flex gap-2">
                                <span className="text-xs font-semibold text-slate-400 w-14 flex-shrink-0 pt-0.5">이후 발화</span>
                                <p className="text-xs text-slate-600 leading-relaxed">{pause.text}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

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

              {/* 시선 + 자세 인사이트 요약 카드 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 시선 응시 */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-semibold text-blue-600">정면 응시 비율</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700 leading-none mb-1.5">{eyeContactFromGaze}%</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {eyeContactFromGaze >= 70
                      ? '청중과 충분히 눈을 맞췄어요.'
                      : eyeContactFromGaze >= 50
                      ? '시선이 화면에 머무는 경향이 있었어요.'
                      : '정면 응시 비율을 높여보세요.'}
                    {dominantOffDir && ` 주로 ${dominantOffDir}으로 시선이 분산됐어요.`}
                  </p>
                </div>

                {/* 자세 안정성 */}
                <div className={`border rounded-xl p-4 ${
                  negPoseDurationRatio < 0.10
                    ? 'bg-green-50 border-green-100'
                    : negPoseDurationRatio <= 0.25
                    ? 'bg-orange-50 border-orange-100'
                    : 'bg-red-50 border-red-100'
                }`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <User className={`w-4 h-4 ${negPoseDurationRatio < 0.10 ? 'text-green-600' : negPoseDurationRatio <= 0.25 ? 'text-orange-500' : 'text-red-500'}`} />
                    <p className={`text-xs font-semibold ${negPoseDurationRatio < 0.10 ? 'text-green-600' : negPoseDurationRatio <= 0.25 ? 'text-orange-500' : 'text-red-500'}`}>자세 안정성</p>
                  </div>
                  <p className={`text-2xl font-bold leading-none mb-1.5 ${negPoseDurationRatio < 0.10 ? 'text-green-700' : negPoseDurationRatio <= 0.25 ? 'text-orange-600' : 'text-red-600'}`}>
                    {negPoseAnalysis.negative_posture_event_count}회
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    부정 자세 감지 · 총 {negPoseAnalysis.negative_posture_duration_sec.toFixed(1)}초 지속
                    {` (발표 시간의 ${Math.round(negPoseDurationRatio * 100)}%)`}
                  </p>
                </div>
              </div>

              {/* 시선 분포 + 자세 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 왼쪽: 시선 분포 3×3 */}
                <div className="min-w-0">
                  <GazeGrid grid={gazeGrid} />
                </div>

                {/* 오른쪽: 자세 Top 3 */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-600 tracking-wide">문제 자세 Top 3</p>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full flex-shrink-0">
                      총 {negPoseAnalysis.negative_posture_event_count}회 감지
                    </span>
                  </div>
                  <div className="space-y-2">
                    {postureTop3.map(({ rank, label, count, percent }) => {
                      const rankCls = rank === 1
                        ? 'bg-red-500 text-white'
                        : rank === 2
                        ? 'bg-orange-400 text-white'
                        : 'bg-amber-400 text-white';
                      const barCls = rank === 1 ? 'bg-red-400' : rank === 2 ? 'bg-orange-400' : 'bg-amber-300';
                      const isExpanded = expandedPoses.has(label);
                      const segments = segmentsByLabel[label] ?? [];
                      const fmtSec = (s: number) =>
                        `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
                      const toggleExpand = () => setExpandedPoses(prev => {
                        const next = new Set(prev);
                        next.has(label) ? next.delete(label) : next.add(label);
                        return next;
                      });
                      return (
                        <div key={rank} className="flex gap-2.5">
                          <div className="flex-1 min-w-0">
                            <div
                              className="flex items-center justify-between mb-1 cursor-pointer"
                              onClick={toggleExpand}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${rankCls}`}>
                                  {rank}
                                </span>
                                <span className="text-sm font-semibold text-slate-800">
                                  {POSE_LABEL_KO[label] ?? label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500 font-mono">{count}회 ({percent}%)</span>
                                {isExpanded
                                  ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                  : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                              </div>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full">
                              <div className={`h-full rounded-full ${barCls}`} style={{ width: `${percent}%` }} />
                            </div>
                            {isExpanded && (
                              <div className="mt-2 max-h-36 overflow-y-auto space-y-1 pr-0.5">
                                {segments.map((seg, i) => (
                                  <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                                    <span className="text-xs text-slate-600 font-mono">
                                      {fmtSec(seg.start)} – {fmtSec(seg.end)}
                                      <span className="text-slate-400 ml-1.5">({seg.duration.toFixed(1)}초)</span>
                                    </span>
                                    <button
                                      onClick={() => handleTimelineClick(fmtSec(seg.start))}
                                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold ml-2 flex-shrink-0 transition-colors"
                                    >
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                      </svg>
                                      보기
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* ─── 개선 과제 섹션 ─── */}
            <div ref={checklistRef} data-section="checklist" className="p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="text-base font-bold text-slate-900">개선 과제</h3>
              </div>
              <ChecklistPanel
                items={checklistItems}
                onToggle={handleToggleChecklist}
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
