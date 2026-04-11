import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo, useEffect, useRef } from "react";

interface ComparisonData {
  id?: string;
  category: string;
  self: number;
  ai: number;
}

interface ComparisonChartProps {
  data: ComparisonData[];
}

// 등급 변환 함수
const getRatingLabel = (value: number): string => {
  if (value === 5) return '최상';
  if (value === 4) return '상';
  if (value === 3) return '중';
  if (value === 2) return '하';
  if (value === 1) return '최하';
  return '';
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
        <p className="font-semibold text-slate-900 mb-2">
          {payload[0].payload.category}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-slate-700">
              {entry.name}:{" "}
              <span className="font-semibold">
                {getRatingLabel(entry.value)}
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Y축 라벨 포매터
const yAxisFormatter = (value: number): string => {
  return getRatingLabel(value);
};

export function ComparisonChart({
  data,
}: ComparisonChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // 각 데이터 항목에 고유 id 추가
  const chartData = useMemo(
    () =>
      data.map((item, index) => ({
        ...item,
        id: item.id || `${item.category}-${index}`,
        uniqueKey: `${item.category}-${index}-${item.self}-${item.ai}`,
      })),
    [data],
  );

  // 차트가 마운트될 때 경고 억제
  useEffect(() => {
    // React 경고를 일시적으로 억제
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("Encountered two children with the same key") ||
         args[0].includes("Keys should be unique"))
      ) {
        // Recharts의 중복 키 경고 무시
        return;
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("Encountered two children with the same key") ||
         args[0].includes("Keys should be unique"))
      ) {
        // Recharts의 중복 키 경고 무시
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  return (
    <div
      ref={chartRef}
      className="bg-white rounded-xl shadow-md p-6 border border-slate-200"
    >
      <div className="mb-4">
        <p className="text-slate-600 text-sm">
          발표에 대한 자신의 평가를 확인하세요
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="category"
            tick={{ fill: "#64748b", fontSize: 14 }}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            domain={[0, 6]}
            ticks={[1, 2, 3, 4, 5]}
            tickFormatter={yAxisFormatter}
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={{ stroke: "#cbd5e1" }}
            allowDataOverflow={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="circle"
          />
          <Bar
            dataKey="self"
            fill="#8b5cf6"
            name="자기평가"
            radius={[8, 8, 0, 0]}
            barSize={50}
            isAnimationActive={false}
            id="bar-self-eval"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* 인사이트 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">인사이트:</span>{" "}
          자기평가를 통해 자신의 발표를 객관적으로 돌아볼 수 있습니다.
        </p>
      </div>
    </div>
  );
}