import { useLocalSearchParams } from 'expo-router';

import { MealEditor } from '@/components/MealEditor';

export default function NewMealScreen() {
  const { date, photoHeight, photoName, photoType, photoUri, photoWidth } = useLocalSearchParams<{
    date?: string;
    photoHeight?: string;
    photoName?: string;
    photoType?: string;
    photoUri?: string;
    photoWidth?: string;
  }>();
  const initialPhoto = photoUri ? {
    uri: photoUri,
    width: Number(photoWidth) || 1,
    height: Number(photoHeight) || 1,
    fileName: photoName || undefined,
    mimeType: photoType || 'image/jpeg',
  } : undefined;
  return <MealEditor initialDate={date} initialPhoto={initialPhoto} />;
}
