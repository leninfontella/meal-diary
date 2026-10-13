import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './pages/AuthPage';
import { DiaryPage } from './pages/DiaryPage';
import { MealPage } from './pages/MealPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { ProfilePage } from './pages/ProfilePage';
import { StatisticsPage } from './pages/StatisticsPage';
import { WelcomePage } from './pages/WelcomePage';

const router = createBrowserRouter([
  { path: '/', element: <WelcomePage /> },
  { path: '/auth', element: <AuthPage /> },
  {
    element: <ProtectedRoute />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '/diary', element: <DiaryPage /> },
        { path: '/memories', element: <MemoriesPage /> },
        { path: '/statistics', element: <StatisticsPage /> },
        { path: '/profile', element: <ProfilePage /> },
        { path: '/meal/new', element: <MealPage /> },
        { path: '/meal/:id', element: <MealPage /> },
      ],
    }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
