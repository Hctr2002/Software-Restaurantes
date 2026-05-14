import { Redirect } from 'expo-router';
import { View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <Redirect href="/(tabs)" />
    </View>
  );
}
