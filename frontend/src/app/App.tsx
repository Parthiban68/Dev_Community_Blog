import { Route, Routes } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { AuthenticatedHomePage } from '../features/auth/AuthenticatedHomePage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { LoginPage } from '../features/auth/LoginPage';
import { OnboardingPage } from '../features/auth/OnboardingPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { CommunityWorkspacePage } from '../features/community/CommunityWorkspacePage';
import { DiscussionPage } from '../features/community/DiscussionPage';
import { WorkspaceSectionPlaceholder } from '../features/community/WorkspaceSectionPlaceholder';
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
        <Route path="/app" element={<CommunityWorkspacePage />} />
        <Route path="/app/home" element={<AuthenticatedHomePage />} />
        <Route path="/app/discussions" element={<WorkspaceSectionPlaceholder title="Discussions" description="The cross-community discussion feed is not available in this phase. Open a question thread from a channel to view its replies." />} />
        <Route path="/app/discussions/:messageId" element={<DiscussionPage />} />
        <Route path="/app/discover" element={<WorkspaceSectionPlaceholder title="Discover developers" description="Developer discovery is not available in this phase. Community members are listed in the details panel." />} />
        <Route path="/app/messages" element={<WorkspaceSectionPlaceholder title="Messages" description="Direct messages are not available in this phase. Channel conversations are available in the workspace." />} />
        <Route path="/app/notifications" element={<WorkspaceSectionPlaceholder title="Notifications" description="Notifications are not available in this phase and no notification records are being generated." />} />
        <Route path="/app/profile" element={<WorkspaceSectionPlaceholder title="Profile" description="Profile editing is not available in this phase. Your existing account details remain unchanged." />} />
        <Route path="/app/settings" element={<WorkspaceSectionPlaceholder title="Settings" description="Workspace settings are not available in this phase. Theme controls remain available in the navigation rail." />} />
        <Route path="/app/projects" element={<WorkspaceSectionPlaceholder title="Projects" description="Project collaboration is not available in this phase." />} />
        <Route path="/app/events" element={<WorkspaceSectionPlaceholder title="Events" description="The event calendar is not available in this phase." />} />
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
