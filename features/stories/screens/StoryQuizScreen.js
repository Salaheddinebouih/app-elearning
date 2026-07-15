import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLanguage } from '../../../utils/LanguageContext';
import { getStoryById } from '../services/StoryService';
import { saveQuizResult } from '../services/StoryInteractionService';

function getQuestionText(question, t) {
  return question.question || question.prompt || t('stories.quizQuestion');
}

function getCorrectAnswer(question) {
  return question.correctAnswer || question.correct_answer || '';
}

function getQuestionType(question) {
  return question.type || 'multiple_choice';
}

export default function StoryQuizScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, isRTL } = useLanguage();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const loaded = await getStoryById(route.params?.storyId);
      if (!active) return;
      setStory(loaded);
      setAnswers(Array((loaded?.quiz || []).length).fill(null));
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [route.params?.storyId]);

  const quiz = story?.quiz || [];
  const currentQuestion = quiz[currentIndex];
  const currentAnswer = answers[currentIndex];

  const score = useMemo(() => {
    return quiz.reduce((count, question, index) => {
      return answers[index] === getCorrectAnswer(question) ? count + 1 : count;
    }, 0);
  }, [answers, quiz]);

  const total = quiz.length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  const handleSelect = (option) => {
    setAnswers((current) => {
      const next = [...current];
      next[currentIndex] = option;
      return next;
    });
  };

  const handleNext = () => {
    if (!currentAnswer) return;
    if (currentIndex + 1 < quiz.length) {
      setCurrentIndex((value) => value + 1);
      return;
    }
    setFinished(true);
    (async () => {
      setSaving(true);
      await saveQuizResult({
        storyId: story.id,
        score,
        total,
        percent,
      });
      setSaving(false);
    })();
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((value) => value - 1);
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

  if (!story) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" translucent={false} backgroundColor="#F4F6FB" />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>{t('stories.noQuiz')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" translucent={false} backgroundColor="#F4F6FB" />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.resultCard}>
            <Ionicons name="trophy-outline" size={42} color="#F59E0B" />
            <Text style={styles.resultTitle}>{t('stories.quizComplete')}</Text>
            <Text style={styles.resultScore}>{score}/{total}</Text>
            <Text style={styles.resultPercent}>{percent}%</Text>
            <Text style={styles.resultSub}>{saving ? t('stories.saving') : t('stories.quizSaved')}</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>{t('stories.backToStory')}</Text>
          </TouchableOpacity>
        </ScrollView>
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
          <Text style={styles.topTitle}>{t('stories.quizTitle')}</Text>
          <View style={styles.backBtnSpacer} />
        </View>

        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEyebrow}>{story.title}</Text>
          <Text style={styles.heroTitle}>{t('stories.quizSubtitle')}</Text>
          <Text style={styles.heroSubtitle}>{currentIndex + 1} / {total}</Text>
        </LinearGradient>

        <View style={styles.questionCard}>
          <Text style={[styles.questionText, isRTL && { textAlign: 'right' }]}>
            {getQuestionText(currentQuestion, t)}
          </Text>

          <View style={styles.optionsWrap}>
            {(currentQuestion.options || []).map((option) => {
              const selected = currentAnswer === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionCard, selected && styles.optionCardActive]}
                  activeOpacity={0.85}
                  onPress={() => handleSelect(option)}
                >
                  <View style={[styles.optionCircle, selected && styles.optionCircleActive]}>
                    {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextActive]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.navRow, isRTL && { flexDirection: 'row-reverse' }]}> 
          <TouchableOpacity
            style={[styles.navButton, styles.secondaryButton, currentIndex === 0 && styles.disabledButton]}
            disabled={currentIndex === 0}
            onPress={handlePrevious}
            activeOpacity={0.85}
          >
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={16} color="#4F46E5" />
            <Text style={styles.secondaryButtonText}>{t('stories.previous')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.primaryButton, !currentAnswer && styles.disabledPrimaryButton]}
            disabled={!currentAnswer}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>{currentIndex + 1 === total ? t('stories.finish') : t('stories.next')}</Text>
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
  hero: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  questionCard: {
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
  questionText: {
    fontSize: 22,
    lineHeight: 30,
    color: '#1A1A2E',
    fontWeight: '800',
    marginBottom: 14,
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
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.45,
  },
  disabledPrimaryButton: {
    opacity: 0.55,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 12,
    marginBottom: 6,
  },
  resultScore: {
    fontSize: 34,
    fontWeight: '800',
    color: '#6366F1',
  },
  resultPercent: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  resultSub: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
