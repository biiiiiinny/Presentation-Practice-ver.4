import { useNavigate, useParams } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Eye, Mic } from 'lucide-react';

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

  // 실제 attempt의 분석 결과를 사용 (없으면 기본값)
  const attempt1Data = attempt1.analysisResults || {
    speechRate: 360,
    eyeContact: 78,
    duration: '8:30',
    confidence: 75
  };

  const attempt2Data = attempt2.analysisResults || {
    speechRate: 330,
    eyeContact: 85,
    duration: '9:00',
    confidence: 85
  };

  // duration을 초로 변환하는 함수
  const durationToSeconds = (duration: string): number => {
    const [minutes, seconds] = duration.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const attempt1Seconds = durationToSeconds(attempt1Data.duration);
  const attempt2Seconds = durationToSeconds(attempt2Data.duration);
  const durationDiff = attempt2Seconds - attempt1Seconds;

  // 비교 데이터 계산
  const comparison = {
    speechRate: {
      attempt1: attempt1Data.speechRate,
      attempt2: attempt2Data.speechRate,
      change: attempt2Data.speechRate - attempt1Data.speechRate,
      improved: attempt2Data.speechRate < attempt1Data.speechRate // 발화 속도는 낮을수록 좋음
    },
    eyeContact: {
      attempt1: attempt1Data.eyeContact,
      attempt2: attempt2Data.eyeContact,
      change: attempt2Data.eyeContact - attempt1Data.eyeContact,
      improved: attempt2Data.eyeContact > attempt1Data.eyeContact
    },
    totalDuration: {
      attempt1: attempt1Data.duration,
      attempt2: attempt2Data.duration,
      change: durationDiff >= 0 ? `+${durationDiff}초` : `${durationDiff}초`,
      changeInSeconds: durationDiff,
      improved: false // 시간이 늘어난 것은 개선이 아님
    },
    confidence: {
      attempt1: attempt1Data.confidence,
      attempt2: attempt2Data.confidence,
      change: attempt2Data.confidence - attempt1Data.confidence,
      improved: attempt2Data.confidence > attempt1Data.confidence
    }
  };

  // 개선 및 퇴보 목록 동적 생성
  const improvements = [];
  const weaknesses = [];

  if (comparison.speechRate.improved) {
    improvements.push(
      `발화 속도가 ${comparison.speechRate.attempt1}자/분에서 ${comparison.speechRate.attempt2}자/분으로 개선되어 청중이 따라오기 더 쉬워졌습니다`
    );
  } else {
    weaknesses.push(
      `발화 속도가 ${Math.abs(comparison.speechRate.change)}자/분 증가하여 다소 빨라졌습니다`
    );
  }

  if (comparison.eyeContact.improved) {
    improvements.push(
      `정면 응시 비율이 ${comparison.eyeContact.attempt1}%에서 ${comparison.eyeContact.attempt2}%로 증가하여 청중과의 아이컨택이 향상되었습니다`
    );
  } else {
    weaknesses.push(
      `정면 응시 비율이 ${Math.abs(comparison.eyeContact.change)}%p 감소했습니다`
    );
  }

  if (comparison.confidence.improved) {
    improvements.push(
      `전반적인 자기평가가 ${comparison.confidence.change}점 향상되었습니다`
    );
  } else {
    weaknesses.push(
      `자기평가가 ${Math.abs(comparison.confidence.change)}점 감소했습니다`
    );
  }

  if (!comparison.totalDuration.improved) {
    const changeAbs = Math.abs(comparison.totalDuration.changeInSeconds);
    const changeText = comparison.totalDuration.changeInSeconds > 0
      ? `${changeAbs}초 증가하여`
      : `${changeAbs}초 감소했지만`;
    weaknesses.push(
      `발표 시간이 ${changeText} 시간 관리에 주의가 필요합니다`
    );
  }

  // 항상 최소 1개의 개선점과 주의점이 있도록
  if (improvements.length === 0) {
    improvements.push('목소리 톤 변화가 더 자연스러워졌습니다');
  }
  if (improvements.length === 1) {
    improvements.push('전체적인 발표 흐름이 개선되었습니다');
  }
  if (weaknesses.length === 0) {
    weaknesses.push('중반부 제스처 빈도를 조금 더 높이면 좋겠습니다');
  }

  const getChangeIcon = (improved: boolean, change: number) => {
    if (change === 0) return <Minus className="w-4 h-4 text-slate-500" />;
    if (improved) return <TrendingUp className="w-4 h-4 text-green-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getChangeColor = (improved: boolean, change: number) => {
    if (change === 0) return 'text-slate-600';
    if (improved) return 'text-green-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* 주요 지표 비교 */}
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
                  <span className="text-lg font-semibold text-blue-900">{comparison.speechRate.attempt1} 글자/분</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800">2회차</span>
                  <span className="text-lg font-semibold text-blue-900">{comparison.speechRate.attempt2} 글자/분</span>
                </div>
                <div className={`flex items-center gap-2 pt-2 border-t border-blue-300 ${getChangeColor(comparison.speechRate.improved, comparison.speechRate.change)}`}>
                  {getChangeIcon(comparison.speechRate.improved, comparison.speechRate.change)}
                  <span className="font-bold">{comparison.speechRate.change > 0 ? '+' : ''}{comparison.speechRate.change} 글자/분</span>
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
                  <span className="text-lg font-semibold text-green-900">{comparison.eyeContact.attempt1}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-800">2회차</span>
                  <span className="text-lg font-semibold text-green-900">{comparison.eyeContact.attempt2}%</span>
                </div>
                <div className={`flex items-center gap-2 pt-2 border-t border-green-300 ${getChangeColor(comparison.eyeContact.improved, comparison.eyeContact.change)}`}>
                  {getChangeIcon(comparison.eyeContact.improved, comparison.eyeContact.change)}
                  <span className="font-bold">+{comparison.eyeContact.change}%p</span>
                </div>
              </div>
            </div>

            {/* 발표 시간 */}
            <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-bold text-purple-900">발표 시간</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-800">1회차</span>
                  <span className="text-lg font-semibold text-purple-900">{comparison.totalDuration.attempt1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-800">2회차</span>
                  <span className="text-lg font-semibold text-purple-900">{comparison.totalDuration.attempt2}</span>
                </div>
                <div className={`flex items-center gap-2 pt-2 border-t border-purple-300 ${getChangeColor(comparison.totalDuration.improved, 45)}`}>
                  {getChangeIcon(comparison.totalDuration.improved, 45)}
                  <span className="font-bold">{comparison.totalDuration.change}</span>
                </div>
              </div>
            </div>

            {/* 자기평가 */}
            <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <h3 className="font-bold text-orange-900">자기평가</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-800">1회차</span>
                  <span className="text-lg font-semibold text-orange-900">{comparison.confidence.attempt1}점</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-800">2회차</span>
                  <span className="text-lg font-semibold text-orange-900">{comparison.confidence.attempt2}점</span>
                </div>
                <div className={`flex items-center gap-2 pt-2 border-t border-orange-300 ${getChangeColor(comparison.confidence.improved, comparison.confidence.change)}`}>
                  {getChangeIcon(comparison.confidence.improved, comparison.confidence.change)}
                  <span className="font-bold">+{comparison.confidence.change}점</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 개선된 점 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-slate-900">개선된 점</h2>
          </div>
          <div className="space-y-3">
            {improvements.map((item, index) => (
              <div key={index} className="flex items-start gap-3 bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-green-900 flex-1">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 개선할 점 */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-slate-900">개선할 점</h2>
          </div>
          <div className="space-y-3">
            {weaknesses.map((item, index) => (
              <div key={index} className="flex items-start gap-3 bg-orange-50 rounded-lg p-4 border border-orange-100">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm text-orange-900 flex-1">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 종합 의견 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
          <h2 className="text-xl font-bold text-blue-900 mb-3">종합 의견</h2>
          <p className="text-slate-700 leading-relaxed">
            여긴 어떻게 하지?
          </p>
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