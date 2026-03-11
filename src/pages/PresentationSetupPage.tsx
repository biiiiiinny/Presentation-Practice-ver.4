import { useNavigate } from 'react-router';
import { PresentationSetup } from '../components/PresentationSetup';
import { useApp } from '../contexts/AppContext';

export default function PresentationSetupPage() {
  const navigate = useNavigate();
  const { currentSessionId, currentFormData, setCurrentFormData, createSession } = useApp();

  const handleSubmit = (formData: any) => {
    console.log('발표 설정 제출:', formData);
    setCurrentFormData(formData);
    
    // 세션 먼저 생성
    const sessionId = createSession(formData);
    
    // sessionId와 함께 자기평가 페이지로 이동
    navigate(`/presentation/${sessionId}/self-evaluation`);
  };

  return (
    <PresentationSetup 
      onSubmit={handleSubmit}
      existingFormData={currentFormData}
      isRetry={currentSessionId !== null}
    />
  );
}