import { useNavigate } from 'react-router';
import { PresentationSetup } from '../components/PresentationSetup';
import { useApp } from '../contexts/AppContext';

export default function PresentationSetupPage() {
  const navigate = useNavigate();
  const { currentSessionId, currentFormData, setCurrentFormData, createSession, startAnalysis, completeSelfEvaluation } = useApp();

  const handleSubmit = (formData: any) => {
    console.log('발표 설정 제출:', formData);
    
    // formData에서 selfEvaluation 분리
    const { selfEvaluation, ...presentationData } = formData;
    
    setCurrentFormData(presentationData);
    
    // 세션 먼저 생성
    const sessionId = createSession(presentationData);
    
    // AI 분석 시작
    startAnalysis(presentationData.topic || '새로운 발표');
    
    // 자기평가 완료 처리 (세션에 저장)
    completeSelfEvaluation(selfEvaluation);
    
    // 결과 페이지로 직접 이동
    navigate(`/presentation/results/${sessionId}/1`);
  };

  return (
    <PresentationSetup 
      onSubmit={handleSubmit}
      existingFormData={currentFormData}
      isRetry={currentSessionId !== null}
    />
  );
}