import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import type { ChecklistItem } from '../contexts/AppContext';
import { useState, useEffect, useRef } from 'react';
import { Timeline } from '../components/Timeline';
import { VideoPlayer } from '../components/VideoPlayer';
import { Mic, User } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip,
  AreaChart, ComposedChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceArea,
} from 'recharts';
import pitchExample from '../../pitch_example.json';

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

// ── 횟수 배지 ────────────────────────────────────────────────────────────────
function CountBadge({ count, label, thresholds, decimals = 0 }: {
  count: number; label: string; thresholds: [number, number]; decimals?: number;
}) {
  const cls = count <= thresholds[0]
    ? 'bg-green-100 text-green-800 border-green-300'
    : count <= thresholds[1]
    ? 'bg-orange-100 text-orange-800 border-orange-300'
    : 'bg-red-100 text-red-800 border-red-300';
  const display = decimals > 0 ? count.toFixed(decimals) : String(count);
  const textSize = display.length > 3 ? 'text-lg' : 'text-2xl';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-bold ${textSize} ${cls}`}>
        {display}
      </div>
      <span className="text-xs font-semibold text-slate-500 text-center leading-tight">{label}</span>
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

function generateSparkline(baseValue: number, count = 24, variance = 0.13): { v: number }[] {
  return Array.from({ length: count }, (_, i) => ({
    v: Math.max(0, baseValue * (1 + Math.sin(i * 0.9 + baseValue * 0.03) * variance)),
  }));
}

function KPICard({ label, value, unit, status, sparkData, gradientId }: {
  label: string; value: number; unit: string; status: KPIStatus;
  sparkData: { v: number }[]; gradientId: string;
}) {
  const s = KPI_STATUS_STYLE[status];
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-3 gap-1.5 min-w-0">
      <p className="text-xs font-semibold text-slate-500 truncate">{label}</p>
      <div className="flex items-center justify-between gap-1">
        <span className="text-2xl font-bold text-slate-900 leading-none">
          {value}
          <span className="text-xs font-normal text-slate-400 ml-1">{unit}</span>
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.badge}`}>
          {status}
        </span>
      </div>
      <div className="mt-1">
        <ResponsiveContainer width="100%" height={48}>
          <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={s.fill} stopOpacity={0.25} />
                <stop offset="95%" stopColor={s.fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone" dataKey="v"
              stroke={s.line} strokeWidth={1.5}
              fill={`url(#${gradientId})`} dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
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

// 피치 타임라인 + baseRate 로 mock 발화속도 생성
// 백엔드 연동 시 이 함수를 사용하지 않고 실제 timeline 배열을 사용
function buildCombinedTimeline(
  pitchTimeline: { start: number; mean_hz: number }[],
  baseRate: number,
): PresentationPoint[] {
  const n = pitchTimeline.length;
  return pitchTimeline.map(({ start, mean_hz }, i) => {
    const phase = i / n;
    const wave = Math.sin(phase * Math.PI * 5 + 1.0) * 22;
    const edgeDip = (phase < 0.12 || phase > 0.88) ? -18 : 10;
    const rate = Math.round(Math.max(180, Math.min(430, baseRate + wave + edgeDip)));
    return { start, pitch_hz: mean_hz, speech_rate: rate };
  });
}

// 총 발표 시간을 20/60/20 비율로 서론·본론·결론 분할
// 백엔드가 실제 구간 정보를 반환하면 그 값을 그대로 prop으로 전달
function buildDefaultSections(totalSec: number): PresentationSection[] {
  return [
    { label: '서론', start: 0,              end: totalSec * 0.2 },
    { label: '본론', start: totalSec * 0.2, end: totalSec * 0.8 },
    { label: '결론', start: totalSec * 0.8, end: totalSec },
  ];
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
  pitchMean,
}: {
  data: PresentationPoint[];
  sections: PresentationSection[];
  pitchMean: number;
}) {
  const [activeGraph, setActiveGraph] = useState<'pitch' | 'speech'>('pitch');
  const showPitch  = activeGraph === 'pitch';
  const showSpeech = activeGraph === 'speech';

  const speechMean = Math.round(data.reduce((s, d) => s + d.speech_rate, 0) / data.length);

  // XAxis domain을 sections 마지막 end까지 명시적으로 지정해야 결론 구간이 잘림 없이 표시됨
  const domainMax = sections.length > 0 ? sections[sections.length - 1].end : 'dataMax';

  return (
    <div className="space-y-2">
      {/* 체크박스 토글 + 평균값 (차트 내부에서 겹치지 않도록 범례 영역에 표시) */}
      <div className="flex items-center gap-5 flex-wrap">
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-semibold"
          style={{ color: CHART_COLOR.pitch }}>
          <input type="radio" name="graph-select" checked={showPitch}
            onChange={() => setActiveGraph('pitch')}
            className="accent-purple-600" />
          피치 (Hz)
          <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-mono">
            평균 {pitchMean.toFixed(0)}Hz
          </span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-semibold"
          style={{ color: CHART_COLOR.speech }}>
          <input type="radio" name="graph-select" checked={showSpeech}
            onChange={() => setActiveGraph('speech')}
            className="accent-orange-600" />
          발화속도 (음절/분)
          <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded font-mono">
            평균 {speechMean}음절/분
          </span>
        </label>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={data} margin={{ top: 14, right: 8, bottom: 0, left: 0 }}>
          {/* 서론·본론·결론 구간 레이블 */}
          {sections.map(sec => (
            <ReferenceArea
              key={sec.label}
              yAxisId="pitch"
              x1={sec.start} x2={sec.end}
              fill="none"
              label={{ value: sec.label, position: 'insideTop', fontSize: 10,
                fill: '#94a3b8', dy: 2, fontWeight: 600 }}
            />
          ))}
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

          <XAxis
            dataKey="start"
            type="number"
            scale="linear"
            domain={[0, domainMax]}
            tickFormatter={(v: number) => {
              const m = Math.floor(v / 60);
              const s = String(Math.floor(v % 60)).padStart(2, '0');
              return `${m}:${s}`;
            }}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            interval={19}
            axisLine={false}
            tickLine={false}
          />

          {/* Y축: 하나로 통합 — 항상 같은 width로 레이아웃 고정 */}
          <YAxis
            yAxisId="pitch"
            domain={showPitch ? [40, 170] : [150, 450]}
            tick={{ fontSize: 10, fill: showPitch ? CHART_COLOR.pitch : CHART_COLOR.speech }}
            axisLine={false} tickLine={false} width={44}
          />

          <RechartsTooltip content={<PresentationChartTooltip />} />

          {/* 평균 기준선 (레이블 없이 점선만 — 평균값은 위 범례에 표시) */}
          {showPitch && (
            <ReferenceLine yAxisId="pitch" y={pitchMean}
              stroke={CHART_COLOR.pitch} strokeDasharray="5 3" strokeOpacity={0.5} />
          )}
          {showSpeech && (
            <ReferenceLine yAxisId="pitch" y={speechMean}
              stroke={CHART_COLOR.speech} strokeDasharray="5 3" strokeOpacity={0.5} />
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

// 분석 결과로 개선 필요 항목을 생성 (백엔드 연동 시 LLM 응답을 이 타입으로 매핑)
// 표시 항목: 발화속도 · 피치 변화폭 · 정면 응시 비율
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
  if (items.length === 0)
    return (
      <div className="text-center py-6 text-sm text-slate-400">
        모든 지표가 적정 범위입니다 🎉
      </div>
    );

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        스스로 연습하여 개선했다고 생각하는 항목을 체크해주세요
      </p>
      <div className="space-y-2">
        {items.map(item => {
          const cat = CATEGORY_STYLE[item.category];
          return (
            <label key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                item.is_completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}>
              <input type="checkbox" checked={item.is_completed}
                onChange={() => onToggle(item.id)}
                className="mt-0.5 accent-green-600 shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <p className={`text-sm leading-snug ${
                  item.is_completed ? 'text-green-800 line-through decoration-green-400' : 'text-slate-800'
                }`}>
                  {item.label}
                </p>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${cat.cls}`}>
                  {cat.label}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}





// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const navigate = useNavigate();
  const { sessionId, attemptNumber } = useParams<{ sessionId: string; attemptNumber?: string }>();
  const { sessions, setCurrentSessionId, saveChecklist } = useApp();

  const [activeTab, setActiveTab] = useState<'overall' | 'voice' | 'posture'>('overall');
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

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

  // 체크리스트 초기화: 저장된 데이터 있으면 불러오고, 없으면 분석 결과로 생성
  useEffect(() => {
    if (!currentAttempt) return;
    if (currentAttempt.checklist) {
      setChecklistItems(currentAttempt.checklist);
    } else {
      const defaults = { speechRate: 300, eyeContact: 78, pitchVariation: 75 };
      setChecklistItems(generateMockChecklist({ ...defaults, ...currentAttempt.analysisResults }));
    }
  }, [currentAttempt?.id]);

  if (!currentSession) return null;
  if (!currentAttempt) { navigate('/dashboard'); return null; }

  // 기본값과 실제 데이터 병합
  const ar = {
    speechRate: 300, eyeContact: 78, duration: '8:30', postureScore: 75,
    pitchVariation: 75, avgIPsPerSentence: 3.5, avgWordsPerSentence: 10,
    lateSpeedRatio: 1.05, longPauseCount: 2, wordPauseCount: 12,
    fillerRate: 0.35, habitualBehaviorCount: 3,
    ...currentAttempt.analysisResults,
  };

  // 발표 전체 그래프 데이터
  // 백엔드 연동 시: ar.pitchTimeline / ar.speechRateTimeline 이 있으면 그걸 사용
  const pitchTimeline = pitchExample.pitch_metrics.pitch_timeline;
  const presentationData = buildCombinedTimeline(pitchTimeline, ar.speechRate);
  const presentationSections = buildDefaultSections(
    pitchTimeline[pitchTimeline.length - 1]?.end ?? 60,
  );

  // KPI 피치 카드: pitch_example 실데이터 사용
  // 백엔드 연동 시 analysisResults.pitchStdHz, analysisResults.pitchSparkline 으로 교체
  const pitchStdHz = pitchExample.pitch_metrics.summary.std_hz;
  const pitchSparkData = pitchTimeline
    .filter((_, i) => i % Math.max(1, Math.floor(pitchTimeline.length / 24)) === 0)
    .slice(0, 24)
    .map(p => ({ v: p.mean_hz }));

  const toSpeechLevel = (rate: number): number =>
    rate >= 270 && rate <= 330 ? 3 : rate >= 240 && rate <= 360 ? 2 : 1;
  const toPitchLevel = (hz: number): number =>
    hz >= 15 && hz <= 35 ? 3 : hz >= 8 && hz <= 50 ? 2 : 1;
  const toPostureLevel = (score: number): number => score >= 70 ? 3 : score >= 50 ? 2 : 1;
  const toEyeLevel = (pct: number): number => pct >= 70 ? 3 : pct >= 50 ? 2 : 1;

  const radarData = [
    { metric: '발화 속도',  level: toSpeechLevel(ar.speechRate) },
    { metric: '피치 변화폭', level: toPitchLevel(pitchStdHz) },
    { metric: '자세',       level: toPostureLevel(ar.postureScore) },
    { metric: '정면 응시',  level: toEyeLevel(ar.eyeContact) },
  ];

  const timelineData = [
    { time: '0:00', event: '발표 시작',       type: 'start' as const },
    { time: '0:30', event: '도입부 - 주제 소개', type: 'content' as const,
      script: '안녕하세요. 오늘 발표 연습 서비스에 대해 소개하겠습니다.' },
    { time: '1:45', event: '본론 1 - 문제 정의', type: 'content' as const,
      script: '현재 많은 학생들과 직장인들이 발표에 대한 두려움을 가지고 있습니다. 우리 서비스는 이러한 문제를 해결하고자 합니다.' },
    { time: '4:10', event: '본론 2 - 해결방안', type: 'content' as const,
      script: '효과적인 발표를 위해서는 시선 처리, 음성 톤, 자세 등 다양한 요소가 필요합니다. 발표 영상을 업로드하면 자동으로 분석이 진행됩니다.' },
    { time: '6:45', event: '본론 3 - 기대효과', type: 'content' as const,
      script: '객관적인 피드백을 통해 발표 능력을 향상시킬 수 있습니다.' },
    { time: '8:00', event: '결론 및 마무리',   type: 'content' as const,
      script: '반복 연습을 통해 자신감을 키울 수 있습니다. 이상으로 발표를 마치겠습니다. 감사합니다.' },
    { time: '8:30', event: '발표 종료',        type: 'end' as const },
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
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">4가지 지표 요약</h3>

              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
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

              <div className="grid grid-cols-3 gap-3">
                <KPICard
                  label="발화 속도 평균"
                  value={ar.speechRate}
                  unit="음절/분"
                  status={ar.speechRate >= 270 && ar.speechRate <= 330 ? '적정' : ar.speechRate >= 240 && ar.speechRate <= 360 ? '주의' : '경고'}
                  sparkData={generateSparkline(ar.speechRate, 24, 0.12)}
                  gradientId="kpi-speech"
                />
                <KPICard
                  label="피치 변화폭"
                  value={Math.round(pitchStdHz * 10) / 10}
                  unit="Hz"
                  status={pitchStdHz >= 15 && pitchStdHz <= 35 ? '적정' : pitchStdHz >= 8 && pitchStdHz <= 50 ? '주의' : '경고'}
                  sparkData={pitchSparkData}
                  gradientId="kpi-pitch"
                />
                <KPICard
                  label="정면 응시 비율"
                  value={ar.eyeContact}
                  unit="%"
                  status={ar.eyeContact >= 70 ? '적정' : ar.eyeContact >= 50 ? '주의' : '경고'}
                  sparkData={generateSparkline(ar.eyeContact, 24, 0.1)}
                  gradientId="kpi-eye"
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">종합 평가</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  전반적으로 안정적인 발표였습니다. 명확한 논리 구조와 효과적인 제스처 활용이 돋보였으며,
                  청중과의 아이컨택도 양호한 편입니다. 다만 말하는 속도가 다소 빠르고, 중반부에 시선 처리가
                  산만해지는 경향이 있었습니다.
                </p>
              </div>

            </div>

            <div className="border-t border-slate-100 mx-5" />

            {/* ─── 음성 섹션 ─── */}
            <div ref={voiceRef} data-section="voice" className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-5 h-5 text-purple-700" />
                </div>
                <h3 className="text-base font-bold text-slate-900">음성 분석</h3>
              </div>

              {/* 발표 전체 그래프 (피치 + 발화속도) */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">발표 전체 그래프</p>
                <PresentationChart
                  data={presentationData}
                  sections={presentationSections}
                  pitchMean={pitchExample.pitch_metrics.summary.mean_hz}
                />
              </div>

              {/* 발화 속도 + 피치 변화폭 (나란히) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">발화 속도</p>
                  <RangeGauge
                    value={ar.speechRate}
                    optimalMin={270} optimalMax={330}
                    unit="음절/분" maxDisplay={480}
                    minLabel="느린 편" maxLabel="빠른 편"
                  />
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">피치 변화폭</p>
                  <RangeGauge
                    value={ar.pitchVariation ?? 75}
                    optimalMin={70} optimalMax={90}
                    unit="Hz" maxDisplay={150}
                    minLabel="단조로움" maxLabel="변화 과다"
                  />
                </div>
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
                    value={ar.postureScore ?? 75}
                    unit="점"
                    label="자세 안정성"
                    color={(ar.postureScore ?? 75) >= 70 ? '#2563eb' : '#f59e0b'}
                  />
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-center">
                  <CountBadge
                    count={ar.habitualBehaviorCount ?? 3}
                    label="부정적 행동 횟수"
                    thresholds={[0, 7]}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">자가 체크리스트</h4>
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
    </div>
  );
}
