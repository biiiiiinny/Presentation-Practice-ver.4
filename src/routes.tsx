import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { AppProvider } from './contexts/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MainPage from './pages/MainPage';
import PresentationSetupPage from './pages/PresentationSetupPage';
import ResultsPage from './pages/ResultsPage';
import ComparisonPage from './pages/ComparisonPage';
import MyPage from './pages/MyPage';

// Root wrapper with AppProvider
function RootLayout() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
              { path: '/presentation/results/:sessionId/:attemptNumber', element: <ResultsPage /> },
              { path: '/presentation/compare/:sessionId', element: <ComparisonPage /> },
              { path: '/profile', element: <MyPage /> },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
], { basename: import.meta.env.BASE_URL });