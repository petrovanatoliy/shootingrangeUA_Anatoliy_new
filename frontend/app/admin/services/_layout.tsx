import { Stack } from 'expo-router';

export default function ServicesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#202447' },
        animation: 'slide_from_right',
      }}
    />
  );
}
