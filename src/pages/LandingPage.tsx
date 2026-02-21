import { useNavigate } from 'react-router-dom';
import { LandingPage as LandingPageComponent } from '../components/LandingPage';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return <LandingPageComponent onGetStarted={handleGetStarted} />;
}
