import AsyncStorage from '@react-native-async-storage/async-storage';

const LEVEL_KEY = 'stories.placement.level';
const RESULT_KEY = 'stories.placement.result';

const placementQuestions = require('../data/placement_questions.json');

export async function loadQuestions() {
  return placementQuestions;
}

export function calculateScore(questions, answers) {
  return questions.reduce((score, question, index) => {
    return answers[index] === question.correctAnswer ? score + 1 : score;
  }, 0);
}

export function determineLevel(score) {
  if (score <= 5) return 'A1';
  if (score <= 10) return 'A2';
  if (score <= 15) return 'B1';
  return 'B2';
}

export async function savePlacementLevel(level, score, total) {
  const result = {
    level,
    score,
    total,
    completedAt: Date.now(),
  };

  await Promise.all([
    AsyncStorage.setItem(LEVEL_KEY, level),
    AsyncStorage.setItem(RESULT_KEY, JSON.stringify(result)),
  ]);

  return result;
}

export async function getSavedLevel() {
  return AsyncStorage.getItem(LEVEL_KEY);
}

export async function getSavedPlacementResult() {
  const raw = await AsyncStorage.getItem(RESULT_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function resetPlacementResult() {
  await Promise.all([
    AsyncStorage.removeItem(LEVEL_KEY),
    AsyncStorage.removeItem(RESULT_KEY),
  ]);
}
