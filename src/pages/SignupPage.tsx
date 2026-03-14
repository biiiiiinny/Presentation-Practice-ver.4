import { useNavigate } from 'react-router';
import { SignupPage as SignupPageComponent } from '../components/SignupPage';
import authService from '../lib/api/authService';

export default function SignupPage() {
  const navigate = useNavigate();

  const handleSignUp = async (email: string, password: string, nickname: string): Promise<boolean> => {
    try {
      console.log('회원가입 시도:', email, nickname);
      
      // 백엔드 API 호출 (Mock 모드 또는 실제 API)
      const response = await authService.register({ email, password, nickname });
      
      if (response.success) {
        console.log('✅ 회원가입 성공:', response.user);
        alert(`회원가입이 완료되었습니다!\n별명: ${nickname}\n\n로그인 페이지로 이동합니다.`);
        
        // 회원가입 성공 시 로그인 페이지로 리다이렉트
        navigate('/login', { replace: true });
        return true;
      } else {
        // 회원가입 실패
        alert(response.message || '회원가입에 실패했습니다.');
        return false;
      }
    } catch (error: any) {
      console.error('❌ 회원가입 오류:', error);
      alert('회원가입 중 오류가 발생했습니다.');
      return false;
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return <SignupPageComponent 
    onSignUp={handleSignUp}
    onBack={handleBack}
  />;
}
