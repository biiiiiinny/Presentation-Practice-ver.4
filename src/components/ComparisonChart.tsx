import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComparisonData {
  category: string;
  self: number;
  ai: number;
}

interface ComparisonChartProps {
  data: ComparisonData[];
}

export function ComparisonChart({ data }: ComparisonChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <div className="mb-4">
        <p className="text-slate-600 text-sm">
          자신의 평가와 AI 평가를 비교하여 객관적인 인식을 확인하세요
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="category" 
            tick={{ fill: '#64748b', fontSize: 14 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 14 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar 
            dataKey="self" 
            fill="#8b5cf6" 
            name="자기평가" 
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
          <Bar 
            dataKey="ai" 
            fill="#3b82f6" 
            name="AI 평가" 
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* 인사이트 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 인사이트:</span> 자기평가와 AI 평가의 차이가 큰 항목은 객관적인 시각을 기르는데 집중이 필요합니다.
        </p>
      </div>
    </div>
  );
}
