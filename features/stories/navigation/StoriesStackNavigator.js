import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StoriesGateScreen from '../screens/StoriesGateScreen';
import PlacementTestScreen from '../screens/PlacementTestScreen';
import StoryLibraryScreen from '../screens/StoryLibraryScreen';
import StoryDetailScreen from '../screens/StoryDetailScreen';
import StoryReaderScreen from '../screens/StoryReaderScreen';
import StoryQuizScreen from '../screens/StoryQuizScreen';

const Stack = createNativeStackNavigator();

export default function StoriesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }} initialRouteName="StoriesGate">
      <Stack.Screen name="StoriesGate" component={StoriesGateScreen} />
      <Stack.Screen name="PlacementTest" component={PlacementTestScreen} />
      <Stack.Screen name="StoryLibrary" component={StoryLibraryScreen} />
      <Stack.Screen name="StoryDetail" component={StoryDetailScreen} />
      <Stack.Screen name="StoryReader" component={StoryReaderScreen} />
      <Stack.Screen name="StoryQuiz" component={StoryQuizScreen} />
    </Stack.Navigator>
  );
}
