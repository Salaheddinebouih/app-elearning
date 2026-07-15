import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../../utils/LanguageContext';
import { getSavedLevel } from '../services/PlacementService';

export default function StoriesGateScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();

  useEffect(() => {
    let active = true;

    (async () => {
      const level = await getSavedLevel();
      if (!active) return;

      if (level) {
        navigation.replace('StoryLibrary', { level });
      } else {
        navigation.replace('PlacementTest');
      }
    })();

    return () => {
      active = false;
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.title}>{t('stories.loading')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
});
