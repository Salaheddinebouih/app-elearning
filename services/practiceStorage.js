import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'practice_texts';

// Simple UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getPracticeTexts = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('[practiceStorage] Error getting practice texts:', error);
    return [];
  }
};

export const savePracticeText = async (title, text) => {
  try {
    const texts = await getPracticeTexts();
    const now = Date.now();
    const newText = {
      id: generateUUID(),
      title: title.trim(),
      text: text.trim(),
      favorite: false,
      createdAt: now,
      updatedAt: now,
    };
    texts.push(newText);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(texts));
    return newText;
  } catch (error) {
    console.error('[practiceStorage] Error saving practice text:', error);
    throw error;
  }
};

export const updatePracticeText = async (id, updates) => {
  try {
    const texts = await getPracticeTexts();
    const index = texts.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error('Practice text not found');
    }
    
    const now = Date.now();
    texts[index] = {
      ...texts[index],
      ...updates,
      updatedAt: now,
    };
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(texts));
    return texts[index];
  } catch (error) {
    console.error('[practiceStorage] Error updating practice text:', error);
    throw error;
  }
};

export const deletePracticeText = async (id) => {
  try {
    const texts = await getPracticeTexts();
    const filtered = texts.filter((t) => t.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[practiceStorage] Error deleting practice text:', error);
    throw error;
  }
};
