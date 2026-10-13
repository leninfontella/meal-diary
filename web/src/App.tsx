import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './pages/AuthPage';
import { DiaryPage } from './pages/DiaryPage';
import { MealPage } from './pages/MealPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { ProfilePage } from './pages/ProfilePage';
import { StatisticsPage } from './pages/StatisticsPage';

export function App() {
  return <Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route element={<ProtectedRoute />}><Route element={<AppLayout />}>
      <Route index element={<Navigate to="/diary" replace />} />
      <Route path="/diary" element={<DiaryPage />} />
      <Route path="/memories" element={<MemoriesPage />} />
      <Route path="/statistics" element={<StatisticsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/meal/new" element={<MealPage />} />
      <Route path="/meal/:id" element={<MealPage />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
