import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StoryCard({ story, progress = 0, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      style={styles.card}
      disabled={!onPress}
    >
      <Image source={story.coverImageSource} style={styles.cover} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.categoryPill}>
            <Ionicons name="book-outline" size={12} color="#4F46E5" />
            <Text style={styles.categoryText}>{story.category}</Text>
          </View>

          <View style={styles.levelPill}>
            <Text style={styles.levelText}>{story.level}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={1}>{story.title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{story.subtitle}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{story.readingTime} min</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{story.wordCount} words</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.xpBadge}>+{story.xp} XP</Text>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cover: {
    width: 92,
    height: 124,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
  },
  content: {
    flex: 1,
    paddingLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  categoryText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  levelPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F5F3FF',
  },
  levelText: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10,
  },
  metaText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  metaDot: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  xpBadge: {
    color: '#C026D3',
    fontSize: 12,
    fontWeight: '800',
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 999,
  },
  progressText: {
    width: 36,
    textAlign: 'right',
    fontSize: 11,
    color: '#6366F1',
    fontWeight: '700',
  },
});
