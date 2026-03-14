import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MainPage from './pages/MainPage';
import PresentationSetupPage from './pages/PresentationSetupPage';
import SelfEvaluationPage from './pages/SelfEvaluationPage';
import ResultsPage from './pages/ResultsPage';
import MyPagePage from './pages/MyPagePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', element: <MainPage /> },
          { path: '/presentation/new', element: <PresentationSetupPage /> },
          { path: '/presentation/:sessionId/self-evaluation', element: <SelfEvaluationPage /> },
          { path: '/presentation/results/:sessionId', element: <ResultsPage /> },
          { path: '/presentation/results/:sessionId/:attemptId', element: <ResultsPage /> },
          { path: '/profile', element: <MyPagePage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);