import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout/MainLayout';
import { Library } from '../pages/Library/Library';
import { Global } from '../pages/Global/Global';
import { Settings } from '../pages/Settings/Settings';
import { ProjectSkillsView } from '../components/features/ProjectSkillsView';
import { ToastContainer, ConfirmDialog } from '../components/ui';

// Placeholder pages - will be implemented in later epics
function SkillDetailPage(): React.ReactElement {
  return <div>Skill Detail Page</div>;
}

function ProjectsPage(): React.ReactElement {
  return <div>Projects Page</div>;
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
        element: <Global />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectSkillsView />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);