import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../../utils/LanguageContext';
import {
  loadQuestions,
  calculateScore,
  determineLevel,
  savePlacementLevel,
} from '../services/PlacementService';

function typeLabel(type) {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function PlacementTestScreen() {
  const navigation = useNavigation();
  const { t, isRTL } = useLanguage();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;

    (async () => {
      const loadedQuestions = await loadQuestions();
      if (!active) return;

      setQuestions(loadedQuestions);
      setSelectedAnswers(Array(loadedQuestions.length).fill(null));
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 70,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(14);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });

    const progress = questions.length > 1 ? currentIndex / (questions.length - 1) : 0;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, questions.length, fadeAnim, slideAnim, progressAnim]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const selectedAnswer = selectedAnswers[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const completionCount = useMemo(() => {
    return selectedAnswers.filter(Boolean).length;
  }, [selectedAnswers]);

  const handleSelect = (answer) => {
    setSelectedAnswers((current) => {
      const next = [...current];
      next[currentIndex] = answer;
      return next;
    });
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((value) => value - 1);
  };

  const handleNext = async () => {
    if (!selectedAnswer || saving) return;

    if (!isLastQuestion) {
      setCurrentIndex((value) => value + 1);
      return;
    }

    setSaving(true);
    const score = calculateScore(questions, selectedAnswers);
    const level = determineLevel(score);
    await savePlacementLevel(level, score, totalQuestions);
    navigation.replace('StoryLibrary', { level, score, totalQuestions });
  };

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

  if (!currentQuestion) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" translucent={false} backgroundColor="#F4F6FB" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>{t('stories.placementEyebrow')}</Text>
              <Text style={styles.heroTitle}>{t('stories.placementTitle')}</Text>
            </View>
            <Ionicons name="sparkles" size={34} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.heroSubtitle}>{t('stories.placementSubtitle')}</Text>
        </LinearGradient>

        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, isRTL && { textAlign: 'right' }]}>Question {currentIndex + 1} of {totalQuestions}</Text>
          <Text style={styles.progressCount}>{completionCount}/{totalQuestions}</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <Animated.View style={[styles.questionCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.questionMetaRow}>
            <View style={styles.questionTypePill}>
              <Text style={styles.questionTypeText}>{typeLabel(currentQuestion.type)}</Text>
            </View>
            <View style={styles.questionIndexPill}>
              <Text style={styles.questionIndexText}>{String(currentIndex + 1).padStart(2, '0')}</Text>
            </View>
          </View>

          <Text style={[styles.questionPrompt, isRTL && { textAlign: 'right' }]}>{currentQuestion.prompt}</Text>

          {currentQuestion.passage ? (
            <View style={styles.passageBox}>
              <Text style={[styles.passageText, isRTL && { textAlign: 'right' }]}>{currentQuestion.passage}</Text>
            </View>
          ) : null}

          <View style={styles.optionsWrap}>
            {currentQuestion.options.map((option) => {
              const selected = selectedAnswer === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionCard, selected && styles.optionCardActive]}
                  activeOpacity={0.85}
                  onPress={() => handleSelect(option)}
                >
                  <View style={[styles.optionCircle, selected && styles.optionCircleActive]}>
                    {selected ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextActive]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        <View style={[styles.navRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity
            style={[styles.navButton, styles.secondaryButton, currentIndex === 0 && styles.disabledButton]}
            disabled={currentIndex === 0 || saving}
            onPress={handlePrevious}
            activeOpacity={0.85}
          >
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={16} color="#4F46E5" />
            <Text style={styles.secondaryButtonText}>{t('stories.previous')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.primaryButton, (!selectedAnswer || saving) && styles.primaryButtonDisabled]}
            disabled={!selectedAnswer || saving}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>{isLastQuestion ? t('stories.finish') : t('stories.next')}</Text>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
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
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  progressCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6366F1',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 999,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 18,
  },
  questionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionTypePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },
  questionTypeText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '800',
  },
  questionIndexPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  questionIndexText: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '800',
  },
  questionPrompt: {
    fontSize: 21,
    lineHeight: 30,
    color: '#1A1A2E',
    fontWeight: '800',
    marginBottom: 14,
  },
  passageBox: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF2FF',
    marginBottom: 16,
  },
  passageText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  optionsWrap: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  optionCardActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  optionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionCircleActive: {
    borderColor: '#6366F1',
    backgroundColor: '#6366F1',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#4338CA',
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4F46E5',
  },
  primaryButton: {
    backgroundColor: '#6366F1',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.45,
  },
});
