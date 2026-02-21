import { useNavigate } from 'react-router-dom';
import { MyPage } from '../components/MyPage';
import { useApp } from '../contexts/AppContext';

export default function MyPagePage() {
  const navigate = useNavigate();
  const { currentSessionId } = useApp();

  const handleBack = () => {
    if (currentSessionId) {
      navigate(`/presentation/results/${currentSessionId}`);
    } else {
      navigate('/dashboard');
    }
  };

  return <MyPage onBack={handleBack} />;
}
