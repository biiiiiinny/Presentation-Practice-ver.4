import { User, Mail, Calendar, TrendingUp, Award, Target } from 'lucide-react';

interface MyPageProps {
  onBack: () => void;
}

export function MyPage({ onBack }: MyPageProps) {
  const userStats = {
    name: '김발표',
    email: 'presentation@example.com',
    joinDate: '2024년 1월',
    totalPresentations: 15,
    averageScore: 86,
    bestScore: 92,
    improvementRate: '+12%'
  };

  const recentAchievements = [
    { title: '첫 발표 완료', icon: '🎉', date: '2024-01-15' },
    { title: '평균 80점 돌파', icon: '🔥', date: '2024-01-20' },
    { title: '10회 연습 달성', icon: '💪', date: '2024-01-25' },
    { title: '완벽한 시선 처리', icon: '👀', date: '2024-01-28' }
  ];

  const categoryStats = [
    { category: '시선 처리', average: 85, best: 92, color: 'bg-blue-500' },
    { category: '음성 분석', average: 78, best: 85, color: 'bg-purple-500' },
    { category: '자세 및 제스처', average: 92, best: 95, color: 'bg-green-500' },
    { category: '발표 내용', average: 88, best: 93, color: 'bg-orange-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>돌아가기</span>
        </button>

        {/* 헤더 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            마이페이지
          </h1>
          <p className="text-slate-600">
            나의 발표 연습 현황을 확인하세요
          </p>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{userStats.name}</h2>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{userStats.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">가입일: {userStats.joinDate}</span>
                </div>
              </div>
            </div>
            <button className="px-6 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-semibold">
              프로필 수정
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-blue-600" />
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">TOTAL</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{userStats.totalPresentations}</div>
            <div className="text-sm text-slate-600">총 발표 횟수</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">AVG</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{userStats.averageScore}</div>
            <div className="text-sm text-slate-600">평균 점수</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-yellow-600" />
              <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded">BEST</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{userStats.bestScore}</div>
            <div className="text-sm text-slate-600">최고 점수</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">UP</span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{userStats.improvementRate}</div>
            <div className="text-sm text-slate-600">향상률</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 카테고리별 통계 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">카테고리별 평균</h3>
            <div className="space-y-4">
              {categoryStats.map((stat, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">{stat.category}</span>
                    <span className="text-sm text-slate-600">평균 {stat.average}점 / 최고 {stat.best}점</span>
                  </div>
                  <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full ${stat.color} rounded-full transition-all`}
                      style={{ width: `${stat.average}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 달성한 업적 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">최근 업적</h3>
            <div className="space-y-3">
              {recentAchievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{achievement.title}</p>
                    <p className="text-xs text-slate-600">{achievement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
