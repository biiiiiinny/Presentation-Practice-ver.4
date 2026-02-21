import { useNavigate } from 'react-router-dom';
import { LoadingAnalysis } from '../components/LoadingAnalysis';
import { useApp } from '../contexts/AppContext';

export default function AnalysisLoadingPage() {
  const navigate = useNavigate();
  const { addOrUpdateSession } = useApp();

  const handleComplete = (evaluation: Record<string, number>) => {
    console.log('자기평가 완료:', evaluation);
    
    // 세션 추가 또는 업데이트하고 세션 ID 받기
    const sessionId = addOrUpdateSession(evaluation);
    
    // 결과 페이지로 이동 (replace: true로 로딩 페이지를 히스토리에서 제거)
    navigate(`/presentation/results/${sessionId}`, { replace: true });
  };

  return <LoadingAnalysis onComplete={handleComplete} />;
}
