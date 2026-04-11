import {
  User,
  Mail,
  Calendar,
  Target,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";

interface MyPageProps {
  onBack: () => void;
}

export function MyPage({ onBack }: MyPageProps) {
  const { sessions, userEmail } = useApp();

  // 통계 계산
  const totalPresentations = sessions.length;
  const totalRetries = sessions.reduce(
    (sum, session) => sum + (session.attempts.length - 1),
    0,
  );

  const userStats = {
    name: "김발표",
    email: userEmail || "presentation@example.com",
    joinDate: "2024년 1월",
    totalPresentations: totalPresentations,
    totalRetries: totalRetries,
  };

  // 업적 정의
  interface Achievement {
    title: string;
    icon: string;
    date?: string;
    achieved: boolean;
  }

  const allAchievements: Achievement[] = [
    {
      title: "첫 발표 완료",
      icon: "🎉",
      date:
        totalPresentations >= 1
          ? new Date(
              sessions[sessions.length - 1].date,
            ).toLocaleDateString("ko-KR")
          : undefined,
      achieved: totalPresentations >= 1,
    },
    {
      title: "첫 재발표 완료",
      icon: "🔄",
      date:
        totalRetries >= 1
          ? new Date(
              sessions.find((s) => s.attempts.length > 1)
                ?.attempts[1]?.timestamp || sessions[0]?.date,
            ).toLocaleDateString("ko-KR")
          : undefined,
      achieved: totalRetries >= 1,
    },
    {
      title: "10번째 발표 달성",
      icon: "💪",
      date:
        totalPresentations >= 10
          ? new Date(
              sessions[sessions.length - 10].date,
            ).toLocaleDateString("ko-KR")
          : undefined,
      achieved: totalPresentations >= 10,
    },
  ];

  const achievedList = allAchievements.filter(
    (a) => a.achieved,
  );
  const notAchievedList = allAchievements.filter(
    (a) => !a.achieved,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {userStats.name}
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">
                    {userStats.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    가입일: {userStats.joinDate}
                  </span>
                </div>
              </div>
            </div>
            <button className="px-6 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
              onClick={() => alert('프로필 수정 기능은 준비 중입니다.')}
            >
              프로필 수정
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-blue-600" />
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                TOTAL
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {userStats.totalPresentations}
            </div>
            <div className="text-sm text-slate-600">
              총 발표 횟수
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="w-8 h-8 text-purple-600" />
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                RETRY
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {userStats.totalRetries}
            </div>
            <div className="text-sm text-slate-600">
              재발표 횟수
            </div>
          </div>
        </div>

        {/* 업적 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 달성한 업적 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">
              달성한 업적
            </h3>
            {achievedList.length > 0 ? (
              <div className="space-y-3">
                {achievedList.map((achievement, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="text-3xl">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                        {achievement.title}
                      </p>
                      {achievement.date && (
                        <p className="text-xs text-slate-600">
                          {achievement.date}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">
                  아직 달성한 업적이 없습니다
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  첫 발표를 시작해보세요!
                </p>
              </div>
            )}
          </div>

          {/* 미달성 업적 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">
              미달성 업적
            </h3>
            {notAchievedList.length > 0 ? (
              <div className="space-y-3">
                {notAchievedList.map((achievement, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg opacity-60"
                  >
                    <div className="text-3xl grayscale">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700">
                        {achievement.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        아직 달성하지 못했습니다
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">
                  모든 업적을 달성했습니다! 🎉
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}