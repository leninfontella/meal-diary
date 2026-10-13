export const mealTypes = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Outro'] as const;
export type MealType = (typeof mealTypes)[number];

export type Meal = {
  id: string;
  user_id: string;
  meal_date: string;
  meal_time: string;
  meal_type: MealType | null;
  note: string | null;
  photo_path: string;
  created_at: string;
  updated_at: string;
  imageUrl?: string;
};

export type Profile = { user_id: string; name: string | null; avatar_path: string | null };
