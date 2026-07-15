import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useLanguage } from '../../../utils/LanguageContext';
import { getSavedLevel } from '../services/PlacementService';
import {
  loadStories,
  getStoryCategories,
  getStoryLevels,
} from '../services/StoryService';
import StoryCard from '../components/StoryCard';

export default function StoryLibraryScreen() {
  const route = useRoute();
  const { t, isRTL } = useLanguage();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState(route.params?.level || 'A1');
  const [savedLevel, setSavedLevel] = useState(route.params?.level || null);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    const [loadedStories, storedLevel] = await Promise.all([loadStories(), getSavedLevel()]);
    const routeLevel = route.params?.level || null;
    const nextLevel = routeLevel || storedLevel || 'A1';

    setStories(loadedStories);
    setSavedLevel(storedLevel || routeLevel || null);
    setLevelFilter(nextLevel);
    setLoading(false);
  }, [route.params?.level]);

  useFocusEffect(
    useCallback(() => {
      loadLibrary();
    }, [loadLibrary])
  );

  const categories = useMemo(() => {
    return ['All', ...getStoryCategories(stories)];
  }, [stories]);

  const levelOptions = useMemo(() => {
    return ['All', ...getStoryLevels(stories)];
  }, [stories]);

  const visibleStories = useMemo(() => {
    const baseStories = levelFilter === 'All'
      ? stories
      : stories.filter((story) => story.level === levelFilter);

    const categoryFiltered = categoryFilter === 'All'
      ? baseStories
      : baseStories.filter((story) => story.category === categoryFilter);

    const searchFiltered = search.trim()
      ? categoryFiltered.filter((story) => {
          const term = search.trim().toLowerCase();
          return [story.title, story.subtitle, story.summary, story.category]
            .some((value) => String(value || '').toLowerCase().includes(term));
        })
      : categoryFiltered;

    return searchFiltered;
  }, [stories, levelFilter, categoryFilter, search]);

  const headerLevel = savedLevel || levelFilter;

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={[styles.heroRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={styles.heroTextWrap}>
            <Text style={[styles.heroEyebrow, isRTL && { textAlign: 'right' }]}>{t('stories.libraryEyebrow')}</Text>
            <Text style={[styles.heroTitle, isRTL && { textAlign: 'right' }]}>{t('stories.libraryTitle')}</Text>
            <Text style={[styles.heroSubtitle, isRTL && { textAlign: 'right' }]}>
              {t('stories.librarySubtitle')}
            </Text>
          </View>
          <Ionicons name="library-outline" size={38} color="rgba(255,255,255,0.92)" />
        </View>
      </LinearGradient>

      <View style={styles.levelSummaryCard}>
        <View>
          <Text style={styles.levelSummaryLabel}>{t('stories.currentLevel')}</Text>
          <Text style={styles.levelSummaryValue}>{headerLevel}</Text>
        </View>
        <View style={styles.levelSummaryBadge}>
          <Text style={styles.levelSummaryBadgeText}>{visibleStories.length} {t('stories.stories')}</Text>
        </View>
      </View>

      <View style={[styles.searchWrap, isRTL && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
          value={search}
          onChangeText={setSearch}
          placeholder={t('stories.searchHint')}
          placeholderTextColor="#9CA3AF"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={[styles.filterLabel, isRTL && { textAlign: 'right' }]}>{t('stories.categoryFilter')}</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item }) => {
          const active = item === categoryFilter;
          const isAll = item === 'All';
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setCategoryFilter(item)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {isAll ? t('stories.allCategories') : item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Text style={[styles.filterLabel, isRTL && { textAlign: 'right' }]}>{t('stories.levelFilter')}</Text>
      <FlatList
        data={levelOptions}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item }) => {
          const active = item === levelFilter;
          const isAll = item === 'All';
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setLevelFilter(item)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {isAll ? t('stories.allLevels') : item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" translucent={false} backgroundColor="#F4F6FB" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" translucent={false} backgroundColor="#F4F6FB" />
      <FlatList
        data={visibleStories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StoryCard
            story={item}
            progress={0}
            onPress={() => navigation.navigate('StoryDetail', { storyId: item.id })}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={34} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{t('stories.noStoriesTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('stories.noStoriesBody')}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 20,
  },
  levelSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  levelSummaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  levelSummaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  levelSummaryBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  levelSummaryBadgeText: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    padding: 0,
  },
  filterLabel: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  chipRow: {
    gap: 8,
    paddingBottom: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  chipActive: {
    backgroundColor: '#EEF2FF',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#4F46E5',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 28,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
