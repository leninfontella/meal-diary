import { useLocalSearchParams } from 'expo-router';

import { MealEditor } from '@/components/MealEditor';

export default function MealDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MealEditor mealId={id} />;
}
