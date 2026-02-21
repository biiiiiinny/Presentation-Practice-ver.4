import { useNavigate } from 'react-router-dom';
import { LoginPage as LoginPageComponent } from '../components/LoginPage';
import { useApp } from '../contexts/AppContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setIsLoggedIn, savedLoginEmail, savedLoginPassword, saveLoginInfo } = useApp();

  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    // 실제로는 백엔드 API 호출
    console.log('로그인:', email, password, '로그인 유지:', rememberMe);
    
    // "로그인 유지" 체크 시에만 정보 저장
    if (rememberMe) {
      saveLoginInfo(email, password);
    } else {
      saveLoginInfo('', ''); // 체크 안 하면 초기화
    }
    
    // TODO: 실제 API 연결 시 아래와 같이 구현
    // try {
    //   const response = await fetch('/api/auth/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email, password })
    //   });
    //   
    //   if (response.ok) {
    //     const data = await response.json();
    //     localStorage.setItem('token', data.token);
    //     setIsLoggedIn(true);
    //     navigate('/dashboard');
    //   } else {
    //     alert('로그인에 실패했습니다.');
    //   }
    // } catch (error) {
    //   console.error('로그인 오류:', error);
    //   alert('로그인 중 오류가 발생했습니다.');
    // }

    // 임시 로그인 처리
    setIsLoggedIn(true);
    navigate('/dashboard', { replace: true }); // 로그인 페이지를 히스토리에서 제거
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