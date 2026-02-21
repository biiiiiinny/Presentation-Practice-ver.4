import { useState } from 'react';
import { Presentation, Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import logoImage from 'figma:asset/5b3406e1c944ae03d11bbafa7f6386f049eba43f.png';

interface LoginPageProps {
  onLogin: (email: string, password: string, rememberMe: boolean) => void;
  onBack: () => void;
  initialEmail?: string;
  initialPassword?: string;
}

export function LoginPage({ onLogin, onBack, initialEmail = '', initialPassword = '' }: LoginPageProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  // 이전에 저장된 값이 있으면 "로그인 유지" 체크박스도 체크 상태로
  const [rememberMe, setRememberMe] = useState(!!initialEmail);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    onLogin(email, password, rememberMe); // rememberMe 전달
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>메인으로</span>
        </button>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
          {/* 로고 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src={logoImage} 
                alt="발표 연습 왕!" 
                className="w-32 h-auto rounded-2xl border-4 border-blue-900"
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {isSignUp ? '회원가입' : '로그인'}
            </h1>
            <p className="text-slate-600">
              {isSignUp ? '새로운 계정을 만들어보세요' : '발표 연습을 시작하세요'}
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이메일 */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 비밀번호 찾기 / 기억하기 */}
            {!isSignUp && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-600">로그인 유지</span>
                </label>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  비밀번호 찾기
                </button>
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="w-full py-3 bg-blue-900 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:bg-blue-800 transition-all duration-300"
            >
              {isSignUp ? '회원가입' : '로그인'}
            </button>
          </form>

          {/* 소셜 로그인 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">또는</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium text-slate-700">Google</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm font-medium text-slate-700">Facebook</span>
              </button>
            </div>
          </div>

          {/* 회원가입 / 로그인 전환 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                {isSignUp ? '로그인' : '회원가입'}
              </button>
            </p>
          </div>
        </div>

        {/* 모 안내 */}
        <div className="mt-6 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">데모 계정:</span> demo@example.com / demo1234
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}