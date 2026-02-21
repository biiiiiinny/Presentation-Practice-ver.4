import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import PresentationSetupPage from './pages/PresentationSetupPage';
import AnalysisLoadingPage from './pages/AnalysisLoadingPage';
import ResultsPage from './pages/ResultsPage';
import MyPagePage from './pages/MyPagePage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-w-[1024px]">
          <Routes>
            {/* 공개 페이지 */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* 로그인 필요한 페이지들 */}
            <Route element={<ProtectedRoute />}>
              {/* 사이드바 레이아웃 포함 페이지 */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<MainPage />} />
                <Route path="/presentation/new" element={<PresentationSetupPage />} />
                <Route path="/presentation/results/:id" element={<ResultsPage />} />
                <Route path="/profile" element={<MyPagePage />} />
              </Route>

              {/* 사이드바 없는 페이지 (로딩 화면) */}
              <Route path="/presentation/analyzing" element={<AnalysisLoadingPage />} />
            </Route>

            {/* 404 또는 기본 리다이렉트 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}