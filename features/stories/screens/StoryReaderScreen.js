import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLanguage } from '../../../utils/LanguageContext';
import { getStoryById } from '../services/StoryService';
import {
  isWordSaved,
  loadBookmarks,
  loadStoryProgress,
  saveStoryProgress,
  speakGermanSequence,
  toggleBookmark,
  toggleSavedWord,
} from '../services/StoryInteractionService';

function normalizeTerm(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[.,/#!$%\^&\*;:{}=\-_`~()?¡¿"'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitParagraphText(text, vocabulary) {
  const source = String(text || '');
  const entries = (vocabulary || [])
    .map((word) => ({
      ...word,
      term: normalizeTerm(word.german),
    }))
    .filter((word) => word.term)
    .sort((left, right) => right.term.length - left.term.length);

  if (!entries.length) {
    return [{ text: source, key: source, match: null }];
  }

  const segments = [];
  let cursor = 0;

  while (cursor < source.length) {
    const remainder = source.slice(cursor);
    let matched = null;
    let matchedIndex = -1;

    for (const candidate of entries) {
      const index = remainder.toLowerCase().indexOf(candidate.term);
      if (index < 0) continue;
      if (matchedIndex === -1 || index < matchedIndex) {
        matched = candidate;
        matchedIndex = index;
      }
    }

    if (!matched) {
      segments.push({ text: remainder, key: `${cursor}-${remainder}`, match: null });
      break;
    }

    if (matchedIndex > 0) {
      segments.push({
        text: remainder.slice(0, matchedIndex),
        key: `${cursor}-${matchedIndex}`,
        match: null,
      });
    }

    const matchedText = remainder.slice(matchedIndex, matchedIndex + matched.term.length);
    segments.push({
      text: matchedText,
      key: `${cursor}-${matched.term}`,
      match: matched,
    });
    cursor += matchedIndex + matched.term.length;
  }

  return segments;
}

export default function StoryReaderScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, isRTL, language } = useLanguage();
  const [story, setStory] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [savedWords, setSavedWords] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [audioState, setAudioState] = useState('idle');
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const loaded = await getStoryById(route.params?.storyId);
      if (active) setStory(loaded);

      if (loaded?.id) {
        const [storyBookmarks, storyProgress] = await Promise.all([
          loadBookmarks(loaded.id),
          loadStoryProgress(loaded.id),
        ]);
        if (active) {
          setBookmarks(storyBookmarks);
          setProgress(storyProgress);
        }

        const saved = [];
        for (const word of loaded?.vocabulary || []) {
          if (await isWordSaved(loaded.id, word.german)) {
            saved.push(normalizeTerm(word.german));
          }
        }
        if (active) setSavedWords(saved);
      }
    })();

    return () => {
      active = false;
      Speech.stop();
    };
  }, [route.params?.storyId]);

  const vocabularyIndex = useMemo(() => {
    return (story?.vocabulary || []).reduce((index, word) => {
      index[normalizeTerm(word.german)] = word;
      return index;
    }, {});
  }, [story]);

  const handleToggleBookmark = async (paragraph) => {
    if (!story) return;

    const result = await toggleBookmark({
      storyId: story.id,
      paragraphId: paragraph.paragraph_id,
      paragraphOrder: paragraph.order,
      excerpt: paragraph.german_text,
    });

    setBookmarks(result.bookmarks);
    await saveStoryProgress(story.id, {
      lastParagraphId: paragraph.paragraph_id,
      lastParagraphOrder: paragraph.order,
    });
  };

  const handleWordPress = async (word) => {
    if (!story) return;

    const result = await toggleSavedWord(word, story.id);
    setSavedWords(result.savedWords.map((entry) => entry.wordKey));
    setSelectedWord(word);
  };

  const handleSpeakStory = () => {
    if (!story) return;

    setAudioState('playing');
    speakGermanSequence((story.paragraphs || []).map((paragraph) => paragraph.german_text), {
      onDone: () => setAudioState('idle'),
      onError: () => setAudioState('idle'),
    });
  };

  const handleStopSpeech = () => {
    Speech.stop();
    setAudioState('idle');
  };

  const startQuiz = () => {
    navigation.navigate('StoryQuiz', { storyId: story.id });
  };

  if (!story) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" translucent={false} backgroundColor="#F4F6FB" />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>{t('stories.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" translucent={false} backgroundColor="#F4F6FB" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.topBar, isRTL && { flexDirection: 'row-reverse' }]}> 
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={18} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t('stories.readerTitle')}</Text>
          <View style={styles.backBtnSpacer} />
        </View>

        <View style={styles.storyHeader}>
          <Text style={styles.category}>{story.category}</Text>
          <Text style={styles.title}>{story.title}</Text>
          <Text style={styles.subtitle}>{story.summary}</Text>
          <View style={[styles.actionRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity style={[styles.actionButton, styles.actionPrimary]} onPress={handleSpeakStory} activeOpacity={0.85}>
              <Ionicons name="play" size={16} color="#FFFFFF" />
              <Text style={styles.actionPrimaryText}>{audioState === 'playing' ? t('common.playing') : t('stories.listenStory')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionSecondary]} onPress={handleStopSpeech} activeOpacity={0.85}>
              <Ionicons name="stop" size={16} color="#4F46E5" />
              <Text style={styles.actionSecondaryText}>{t('stories.stopListening')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t('stories.paragraphs')}</Text>
          {(story.paragraphs || []).map((paragraph) => (
            <View key={paragraph.paragraph_id} style={styles.paragraphCard}>
              <View style={[styles.paragraphHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                <Text style={styles.paragraphLabel}>{t('stories.paragraph')} {paragraph.order}</Text>
                <TouchableOpacity style={styles.bookmarkButton} onPress={() => handleToggleBookmark(paragraph)} activeOpacity={0.85}>
                  <Ionicons
                    name={bookmarks.some((item) => item.paragraphId === paragraph.paragraph_id) ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color="#4F46E5"
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.paragraphText, isRTL && { textAlign: 'right' }]}>
                {(splitParagraphText(paragraph.german_text, story.vocabulary) || []).map((segment) => {
                  if (!segment.match) {
                    return <Text key={segment.key}>{segment.text}</Text>;
                  }

                  const normalized = normalizeTerm(segment.match.german);
                  const active = savedWords.includes(normalized);

                  return (
                    <Pressable key={segment.key} onPress={() => handleWordPress(segment.match)}>
                      <Text style={[styles.vocabInline, active && styles.vocabInlineSaved]}>{segment.text}</Text>
                    </Pressable>
                  );
                })}
              </Text>
              <Text style={[styles.translationText, isRTL && { textAlign: 'right' }]}>
                {language === 'ar'
                  ? paragraph.arabic_translation
                  : paragraph.french_translation}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t('stories.vocabularyPreview')}</Text>
          {(story.vocabulary || []).slice(0, 8).map((word) => (
            <TouchableOpacity key={word.german} style={[styles.vocabRow, isRTL && { flexDirection: 'row-reverse' }]} onPress={() => handleWordPress(word)} activeOpacity={0.85}> 
              <View style={styles.vocabBadge}>
                <Text style={styles.vocabBadgeText}>{word.article || '•'}</Text>
              </View>
              <View style={styles.vocabContent}>
                <Text style={[styles.vocabWord, isRTL && { textAlign: 'right' }]}>{word.german}</Text>
                <Text style={[styles.vocabMeta, isRTL && { textAlign: 'right' }]}>
                  {language === 'ar' ? word.arabic : word.french} · {word.example_sentence}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t('stories.quizPreview')}</Text>
          <Text style={[styles.quizText, isRTL && { textAlign: 'right' }]}>
            {story.quiz?.length || 0} {t('stories.quizQuestions')}
          </Text>
          <Text style={[styles.quizSubText, isRTL && { textAlign: 'right' }]}>
            {t('stories.nextPhaseNote')}
          </Text>
          <TouchableOpacity style={styles.quizButton} onPress={startQuiz} activeOpacity={0.9}>
            <Text style={styles.quizButtonText}>{t('stories.openQuiz')}</Text>
            <Ionicons name="help-circle-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={Boolean(selectedWord)} transparent animationType="fade" onRequestClose={() => setSelectedWord(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedWord ? (
              <>
                <Text style={styles.modalTitle}>{selectedWord.german}</Text>
                <Text style={styles.modalMeta}>
                  {selectedWord.article ? `${selectedWord.article} · ` : ''}
                  {selectedWord.pronunciation}
                </Text>
                <Text style={styles.modalTranslation}>
                  {language === 'ar' ? selectedWord.arabic : selectedWord.french}
                </Text>
                <Text style={styles.modalExample}>{selectedWord.example_sentence}</Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalButton} onPress={() => Speech.speak(selectedWord.german, { language: 'de-DE', pitch: 1, rate: 0.9 })}>
                    <Ionicons name="volume-high-outline" size={16} color="#4F46E5" />
                    <Text style={styles.modalButtonText}>{t('stories.listenWord')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalPrimaryButton]} onPress={() => handleWordPress(selectedWord)}>
                    <Ionicons name="bookmark-outline" size={16} color="#FFFFFF" />
                    <Text style={[styles.modalButtonText, styles.modalPrimaryButtonText]}>{t('stories.saveWord')}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedWord(null)}>
                  <Text style={styles.closeButtonText}>{t('stories.close')}</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#1A1A2E',
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtnSpacer: {
    width: 36,
    height: 36,
  },
  storyHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  category: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: '#1A1A2E',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionPrimary: {
    backgroundColor: '#4F46E5',
  },
  actionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  actionSecondary: {
    backgroundColor: '#EEF2FF',
  },
  actionSecondaryText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  paragraphCard: {
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF2FF',
    padding: 14,
    marginBottom: 10,
  },
  paragraphHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paragraphLabel: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  paragraphText: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 8,
  },
  vocabInline: {
    color: '#4338CA',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  vocabInlineSaved: {
    color: '#059669',
  },
  translationText: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
  },
  vocabRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  bookmarkButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  vocabBadgeText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
  },
  vocabContent: {
    flex: 1,
  },
  vocabWord: {
    color: '#1A1A2E',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  vocabMeta: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
  },
  quizText: {
    color: '#1A1A2E',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  quizSubText: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 20,
  },
  quizButton: {
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 13,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quizButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 18,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  modalMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  modalTranslation: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 8,
  },
  modalExample: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalPrimaryButton: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  modalButtonText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '800',
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
  },
  closeButton: {
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#1F2937',
    fontWeight: '800',
  },
});