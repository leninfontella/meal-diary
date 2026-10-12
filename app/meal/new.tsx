import { useLocalSearchParams } from 'expo-router';

import { MealEditor } from '@/components/MealEditor';

export default function NewMealScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  return <MealEditor initialDate={date} />;
}
