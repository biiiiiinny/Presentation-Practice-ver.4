import { Presentation, Mic, ChevronRight, User, Brain, Activity } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: Mic,
      title: '음성 지표 분석',
      description: '말하는 속도, 말버릇 빈도, 침묵 구간 비율, 말의 높낮이(피치)를 정량 지표로 측정합니다.',
      color: 'bg-blue-900'
    },
    {
      icon: User,
      title: '비언어 행동 탐지',
      description: '뒷짐·삐딱한 자세·몸 흔들기 등 부정적 자세와 머리 만지기 등 습관적 행동 빈도를 추적합니다.',
      color: 'bg-blue-800'
    },
    {
      icon: Brain,
      title: '메타인지 피드백',
      description: '실제 측정 지표와 개선점 추적으로, 스스로를 얼마나 정확히 인식하는지 확인합니다.',
      color: 'bg-blue-700'
    }
  ];

  const metrics = [
    { label: '말하는 속도', icon: Mic },
    { label: '말버릇 빈도', icon: Mic },
    { label: '자세 안정성', icon: User },
    { label: '침묵 구간 비율', icon: Mic },
    { label: '말의 높낮이', icon: Mic },
    { label: '습관적 행동', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            {/* 아이콘 */}
            <div className="inline-flex items-center justify-center mb-8">
              <div className="relative w-24 h-24 bg-blue-900 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                <Presentation className="w-14 h-14 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* 환영 문구 */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-blue-200 mb-6">
                <Brain className="w-4 h-4 text-blue-900" />
                <span className="text-sm font-semibold text-blue-900">메타인지 발표 연습 어시스턴트</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                내일은
                <br />
                <span className="text-blue-900">발표왕</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
                발표 영상을 업로드를 진행하고 발표 정보를 입력하면,
                <br />
                6가지 정량 지표로 발표를 객관적으로 평가합니다.
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
                <div className="text-3xl font-bold text-slate-900 mb-1">6가지</div>
                <div className="text-sm text-slate-600">정량 평가 항목</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">메타인지</div>
                <div className="text-sm text-slate-600">재발표로 개선점 확인</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">회차별</div>
                <div className="text-sm text-slate-600">피드백 반영 및 개선 추적</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6가지 측정 지표 */}
      <div className="bg-white border-y border-slate-200 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-slate-500 mb-6 uppercase tracking-wider">
            측정하는 6가지 평가지표
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {metrics.map((m, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <m.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-slate-700">{m.label}</span>
              </div>
            ))}
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
            지표 기반 측정과 메타인지 피드백으로 발표를 다각도로 진단합니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
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
            이렇게 사용해 보세요
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full font-bold text-2xl mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">영상 업로드</h3>
              <p className="text-slate-600 text-sm">
                발표 영상을 업로드하고 목적·시간 등 발표 조건을 설정하세요
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 text-pink-600 rounded-full font-bold text-2xl mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">지표 분석</h3>
              <p className="text-slate-600 text-sm">
                모델이 영상에서 6가지 지표를 정량적으로 측정하고 점수화합니다
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full font-bold text-2xl mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">개선 확인</h3>
              <p className="text-slate-600 text-sm">
                측정 결과를 확인하고, 재발표로 개선 여부를 추적하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-blue-900 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            오늘의 발표가 내일을 바꿉니다
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            객관적인 지표로 나를 알고, 반복 연습으로 발표왕이 되세요
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
