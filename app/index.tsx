import { Redirect } from 'expo-router';

import { ScreenLoader } from '@/components/ScreenLoader';
import { useAuth } from '@/providers/AuthProvider';

export default function Index() {
  const { loading, session } = useAuth();
  if (loading) return <ScreenLoader />;
  return <Redirect href={session ? '/diary' : '/auth'} />;
}
