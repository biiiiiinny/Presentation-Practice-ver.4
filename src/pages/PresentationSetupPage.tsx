import { useNavigate } from 'react-router';
import { PresentationSetup } from '../components/PresentationSetup';
import { useApp } from '../contexts/AppContext';

export default function PresentationSetupPage() {
  const navigate = useNavigate();
  const { currentSessionId, currentFormData, setCurrentFormData, createSession, startAnalysis } = useApp();

  const handleSubmit = (formData: any) => {
    setCurrentFormData(formData);
    const sessionId = createSession(formData);
    startAnalysis(formData.topic || '새로운 발표');
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
