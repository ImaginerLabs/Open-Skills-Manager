import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout/MainLayout';
import { Library } from '../pages/Library';
import { ToastContainer, ConfirmDialog } from '../components/ui';

// Placeholder pages - will be implemented in later epics
function SkillDetailPage(): React.ReactElement {
  return <div>Skill Detail Page</div>;
}

function GlobalPage(): React.ReactElement {
  return <div>Global Skills Page</div>;
}

function ProjectsPage(): React.ReactElement {
  return <div>Projects Page</div>;
}

function SettingsPage(): React.ReactElement {
  return <div>Settings Page</div>;
}

function RootLayout(): React.ReactElement {
  return (
    <>
      <MainLayout />
      <ToastContainer />
      <ConfirmDialog />
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/library" replace />,
      },
      {
        path: 'library',
        element: <Library />,
      },
      {
        path: 'library/:skillId',
        element: <SkillDetailPage />,
      },
      {
        path: 'global',
        element: <GlobalPage />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
]);