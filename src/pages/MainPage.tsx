import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, TrendingUp, Clock, Star } from 'lucide-react';

export default function MainPage() {
  const navigate = useNavigate();
  const { sessions, handleNewPresentation } = useApp();

  const handleStartNewPresentation = () => {
    handleNewPresentation();
    navigate('/presentation/new');
  };

  // 통계 계산
  const totalPresentations = sessions.length;
  const averageScore = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length)
    : 0;
  const favoriteCount = sessions.filter(s => s.isFavorite).length;

  // 최근 세션 3개
  const recentSessions = sessions.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* 헤더 */}
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3">
            대시보드
          </h1>
          <p className="text-lg text-slate-600">
            발표 연습 통계와 최근 활동을 확인하세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                총 발표 횟수
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPresentations}회</div>
              <p className="text-xs text-muted-foreground">
                지금까지 연습한 발표
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                평균 점수
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore}점</div>
              <p className="text-xs text-muted-foreground">
                AI 평가 평균
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                즐겨찾기
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favoriteCount}개</div>
              <p className="text-xs text-muted-foreground">
                중요한 발표
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 새 발표 시작 버튼 */}
        <div className="mb-8">
          <Card className="border-2 border-dashed border-slate-300 bg-white/50 hover:bg-white hover:border-blue-400 transition-all cursor-pointer group">
            <CardContent 
              className="flex flex-col items-center justify-center py-12"
              onClick={handleStartNewPresentation}
            >
              <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                새로운 발표 연습 시작하기
              </h3>
              <p className="text-slate-600">
                영상을 업로드하고 AI 피드백을 받아보세요
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 최근 발표 */}
        {recentSessions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              최근 발표
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentSessions.map((session) => (
                <Card 
                  key={session.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/presentation/results/${session.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">
                        {session.title}
                      </CardTitle>
                      {session.isFavorite && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <CardDescription>
                      {new Date(session.date).toLocaleDateString('ko-KR')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">AI 평가</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {session.score}점
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 세션이 없을 때 */}
        {sessions.length === 0 && (
          <Card className="bg-white/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Clock className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                아직 발표 기록이 없습니다
              </h3>
              <p className="text-slate-600 mb-6">
                첫 번째 발표를 시작해보세요!
              </p>
              <Button 
                onClick={handleStartNewPresentation}
                className="bg-blue-900 text-white hover:bg-blue-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                발표 시작하기
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}