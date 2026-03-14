import { useNavigate } from 'react-router';
import { LoginPage as LoginPageComponent } from '../components/LoginPage';
import { useApp } from '../contexts/AppContext';
import authService from '../lib/api/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setIsLoggedIn, savedLoginEmail, savedLoginPassword, saveLoginInfo } = useApp();

  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    try {
      console.log('로그인 시도:', email);
      
      // 백엔드 API 호출 (Mock 모드 또는 실제 API)
      const response = await authService.login({ email, password });
      
      if (response.success) {
        console.log('✅ 로그인 성공:', response.user);
        
        // "로그인 유지" 체크 시에만 정보 저장
        if (rememberMe) {
          saveLoginInfo(email, password);
        } else {
          saveLoginInfo('', '');
        }
        
        setIsLoggedIn(true);
        navigate('/dashboard', { replace: true });
      } else {
        // 로그인 실패
        alert(response.message || '로그인에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('❌ 로그인 오류:', error);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return <LoginPageComponent 
    onLogin={handleLogin}
    onBack={handleBack}
    initialEmail={savedLoginEmail}
    initialPassword={savedLoginPassword}
  />;
}