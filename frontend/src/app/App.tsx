import { Route, Routes } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { AuthenticatedHomePage } from '../features/auth/AuthenticatedHomePage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { LoginPage } from '../features/auth/LoginPage';
import { OnboardingPage } from '../features/auth/OnboardingPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { LandingPage } from '../features/landing/LandingPage';
import { PlaceholderPage } from './PlaceholderPage';

export function App() {
  useTheme();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/app" element={<AuthenticatedHomePage />} />
      </Route>
      <Route
        path="/communities"
        element={
          <PlaceholderPage
            title="Technical communities"
            description="Community directories and discussions are planned for a later phase."
          />
        }
      />
      <Route
        path="/projects"
        element={
          <PlaceholderPage
            title="Project discovery"
            description="Project discovery is planned for a later phase."
          />
        }
      />
      <Route
        path="/events"
        element={
          <PlaceholderPage
            title="Events and challenges"
            description="The event calendar is planned for a later phase."
          />
        }
      />
      <Route path="*" element={<PlaceholderPage title="Page not found" description="This page does not exist." />} />
    </Routes>
  );
}
