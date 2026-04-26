import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './styles/global.scss';

export default function App() {
  return <RouterProvider router={router} />;
}
