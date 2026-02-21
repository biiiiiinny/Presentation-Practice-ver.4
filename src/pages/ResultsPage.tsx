import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { OverallSummary } from '../components/OverallSummary';
import { FeedbackCard } from '../components/FeedbackCard';
import { ComparisonChart } from '../components/ComparisonChart';
import { Timeline } from '../components/Timeline';
import { Eye, Mic, User, FileText } from 'lucide-react';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { sessions, selfEvaluation, setCurrentSessionId } = useApp();

  const currentSession = sessions.find(s => s.id === id);

  // 세션을 찾지 못하면 대시보드로 리다이렉트
  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            세션을 찾을 수 없습니다
          </h2>
          <p className="text-slate-600 mb-4">
            요청하신 발표 세션이 존재하지 않습니다.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Mock 데이터 (실제로는 백엔드에서 가져올 데이터)
  const feedbackData = [
    {
      category: '시선 처리',
      icon: Eye,
      score: 85,
      feedback: '전반적으로 청중과 좋은 아이컨택을 유지했습니다. 다만, 발표 중반부(3-5분)에 슬라이드를 자주 보는 경향이 있었습니다.',
      suggestions: [
        '슬라이드 내용을 더 숙지하여 자신감 있게 청중을 바라보세요',
        '청중의 여러 방향을 골고루 응시하는 것이 좋습니다'
      ],
      color: 'bg-blue-900'
    },
    {
      category: '음성 분석',
      icon: Mic,
      score: 78,
      feedback: '음량과 발음은 명확했으나, 말하는 속도가 다소 빠른 편입니다. 평균 속도는 분당 180단어로, 권장 속도(150단어)보다 빠릅니다.',
      suggestions: [
        '중요한 내용은 천천히 강조하며 말하세요',
        '문장 사이에 자연스러운 쉼을 두세요'
      ],
      color: 'bg-blue-800'
    },
    {
      category: '자세 및 제스처',
      icon: User,
      score: 92,
      feedback: '안정적인 자세를 유지했고, 제스처를 효과적으로 사용했습니다. 자연스러운 손동작이 발표에 생동감을 더했습니다.',
      suggestions: [
        '현재 수준을 유지하세요',
        '가끔 무대를 이동하며 역동성을 더할 수 있습니다'
      ],
      color: 'bg-blue-700'
    },
    {
      category: '발표 내용',
      icon: FileText,
      score: 88,
      feedback: '논리적인 구조와 명확한 메시지 전달이 돋보였습니다. 도입부와 결론이 특히 인상적이었습니다.',
      suggestions: [
        '중간 부분에 구체적인 예시를 더 추가하면 좋겠습니다',
        '데이터를 인용할 때 출처를 명확히 언급하세요'
      ],
      color: 'bg-indigo-900'
    }
  ];

  const timelineData = [
    { time: '0:00', event: '발표 시작', type: 'start', confidence: 95 },
    { time: '0:30', event: '도입부 - 주제 소개', type: 'good', confidence: 90 },
    { time: '1:45', event: '본론 1 - 문제 정의', type: 'good', confidence: 88 },
    { time: '3:20', event: '시선 분산 감지', type: 'warning', confidence: 65 },
    { time: '4:10', event: '본론 2 - 해결방안', type: 'good', confidence: 85 },
    { time: '5:30', event: '말속도 빠름 감지', type: 'warning', confidence: 70 },
    { time: '6:45', event: '본론 3 - 기대효과', type: 'good', confidence: 92 },
    { time: '8:00', event: '결론 및 마무리', type: 'excellent', confidence: 95 },
    { time: '8:30', event: '발표 종료', type: 'end', confidence: 93 }
  ];

  // 자기평가 vs AI 평가 비교 데이터
  const evaluation = currentSession.selfEvaluation || selfEvaluation;
  const comparisonData = [
    { category: '시선', self: (evaluation.eyeContact || 3) * 20, ai: 85 },
    { category: '음성', self: (evaluation.voice || 4) * 20, ai: 78 },
    { category: '자세', self: (evaluation.posture || 4) * 20, ai: 92 },
    { category: '내용', self: (evaluation.content || 5) * 20, ai: 88 }
  ];

  const handleRetry = () => {
    // 현재 세션을 유지하면서 재발표
    setCurrentSessionId(id || null);
    navigate('/presentation/new');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        {/* 헤더 */}
        <div className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">
            발표 연습 피드백 결과
          </h1>
          <p className="text-lg text-slate-600">
            AI가 분석한 당신의 발표를 확인해보세요
          </p>
          <p className="text-base text-slate-500 mt-2">
            {currentSession.title} · {new Date(currentSession.date).toLocaleDateString('ko-KR')}
          </p>
        </div>

        {/* 전체 요약 */}
        <OverallSummary 
          overallScore={currentSession.score}
          duration="8분 30초"
          strengths={['명확한 논리 구조', '효과적인 제스처 활용', '좋은 발음']}
          improvements={['말하는 속도 조절', '중반부 시선 처리']}
        />

        {/* 카테고리별 피드백 카드 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            세부 피드백
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {feedbackData.map((data, index) => (
              <FeedbackCard key={index} {...data} />
            ))}
          </div>
        </div>

        {/* 자기평가 vs AI 평가 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            자기평가 vs AI 평가
          </h2>
          <ComparisonChart data={comparisonData} />
        </div>

        {/* 타임라인 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            발표 시간 분석
          </h2>
          <Timeline data={timelineData} />
        </div>

        {/* 다시 연습하기 버튼 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200"
          >
            대시보드로
          </button>
          <button
            onClick={handleRetry}
            className="group relative px-8 py-4 bg-blue-900 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-blue-800 transition-all duration-300 flex items-center gap-3"
          >
            <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            다시 연습하기
          </button>
        </div>
      </div>
    </div>
  );
}