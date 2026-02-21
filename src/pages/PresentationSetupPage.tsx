import { useNavigate } from 'react-router-dom';
import { PresentationSetup } from '../components/PresentationSetup';
import { useApp } from '../contexts/AppContext';

export default function PresentationSetupPage() {
  const navigate = useNavigate();
  const { currentSessionId, currentFormData, setCurrentFormData } = useApp();

  const handleSubmit = (formData: any) => {
    console.log('발표 설정 제출:', formData);
    setCurrentFormData(formData);
    navigate('/presentation/analyzing');
  };

  return (
    <PresentationSetup 
      onSubmit={handleSubmit}
      existingFormData={currentFormData}
      isRetry={currentSessionId !== null}
    />
  );
}
