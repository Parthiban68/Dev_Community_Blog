import { Route, Routes } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { LandingPage } from '../features/landing/LandingPage';
import { PlaceholderPage } from './PlaceholderPage';

export function App() {
  useTheme();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PlaceholderPage
            title="Sign in"
            description="Authentication is implemented in the next phase. The landing page remains fully available."
          />
        }
      />
      <Route
        path="/register"
        element={
          <PlaceholderPage
            title="Create your account"
            description="Registration is implemented in the next phase. The landing page remains fully available."
          />
        }
      />
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
