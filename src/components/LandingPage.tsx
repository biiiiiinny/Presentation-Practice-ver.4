import { Presentation, TrendingUp, Eye, Mic, BarChart3, Sparkles, ChevronRight, User } from 'lucide-react';
import logoImage from '../assets/Logo_wang.png';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: Eye,
      title: '시선 처리 분석',
      description: 'AI가 청중과의 아이컨택을 분석하고 개선점을 제안합니다',
      color: 'bg-blue-900'
    },
    {
      icon: Mic,
      title: '음성 분석',
      description: '말하는 속도, 발음, 잉여표현 등을 체크하여 피드백합니다',
      color: 'bg-blue-800'
    },
    {
      icon: User,
      title: '자세 분석',
      description: '발표 자세와 손동작의 자연스러움을 평가합니다',
      color: 'bg-blue-700'
    },
    {
      icon: TrendingUp,
      title: '종합 분석',
      description: '시간대별 분석과 자기평가 비교로 객관적인 인사이트 제공',
      color: 'bg-indigo-900'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            {/* 아이콘 */}
            <div className="inline-flex items-center justify-center mb-8">
              <div className="relative">
                <img 
                  src={logoImage} 
                  alt="발표 연습 왕!" 
                  className="w-48 h-auto drop-shadow-2xl rounded-3xl border-4 border-blue-900"
                />
              </div>
            </div>

            {/* 환영 문구 */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-blue-200 mb-6">
                <Sparkles className="w-4 h-4 text-blue-900" />
                <span className="text-sm font-semibold text-blue-900">AI 기반 발표 연습 플랫폼</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                발표 연습,
                <br />
                <span className="text-blue-900">
                  이제 AI와 함께
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
                당신의 발표를 분석하고, 실시간으로 피드백을 제공합니다.
                <br />
                완벽한 발표를 위한 첫 걸음을 시작하세요.
              </p>

              {/* CTA 버튼 */}
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <span>무료로 시작하기</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* 간단한 통계 */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">AI</div>
                <div className="text-sm text-slate-600">분석 기술</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">4가지</div>
                <div className="text-sm text-slate-600">평가 항목</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">실시간</div>
                <div className="text-sm text-slate-600">피드백</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 기능 소개 섹션 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            핵심 기능
          </h2>
          <p className="text-lg text-slate-600">
            AI가 당신의 발표를 다각도로 분석합니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-slate-200"
            >
              <div className={`inline-flex p-3 rounded-xl ${feature.color} mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* 사용 방법 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            이렇게 사용해
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full font-bold text-2xl mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">영상 업로드</h3>
              <p className="text-slate-600">
                발표 영상을 업로드하고 평가 기준을 설정하세요
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full font-bold text-2xl mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">AI 분석</h3>
              <p className="text-slate-600">
                AI가 영상을 분석하는 동안 자기평가를 진행하세요
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 text-pink-600 rounded-full font-bold text-2xl mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">피드백 확인</h3>
              <p className="text-slate-600">
                상세한 분석 결과와 개선점을 확인하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-blue-900 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            완벽한 발표를 위한 여정, 오늘부터 시작해보세요
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-900 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <span>무료로 시작하기</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}