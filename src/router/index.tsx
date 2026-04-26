import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout/MainLayout';

// Placeholder pages - will be implemented in later epics
function LibraryPage(): React.ReactElement {
  return <div>Library Page</div>;
}

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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/library" replace />,
      },
      {
        path: 'library',
        element: <LibraryPage />,
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
