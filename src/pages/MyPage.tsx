import { useNavigate } from 'react-router';
import { MyPage as MyPageComponent } from '../components/MyPage';
import { useApp } from '../contexts/AppContext';

export default function MyPage() {
  const navigate = useNavigate();
  const { currentSessionId, sessions } = useApp();

  const handleBack = () => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      const attemptNumber = session?.attempts.length || 1;
      navigate(`/presentation/results/${currentSessionId}/${attemptNumber}`);
    } else {
      navigate('/dashboard');
    }
  };

  return <MyPageComponent onBack={handleBack} />;
}
