// Attendify - Core Configuration & Seed Data
// Demo data removed: No dummy students, dummy teachers, or dummy attendance are injected.

import {
  fetchSettings,
  saveSettings,
} from '../services/firestoreService.js';

export const CLASSES = ['8', '9', '10'];
export const SECTIONS = ['A', 'B'];

export async function initializeSeedData() {
  // Only ensure base configuration exists in Firestore if empty
  try {
    const existingSettings = await fetchSettings();
    if (!existingSettings) {
      await saveSettings({
        schoolName: '',
        collegeName: '',
        schoolLogo: null,
        teacherName: '',
        principleName: '',
        darkMode: false,
        notifications: true,
      });
      console.log('[Init] Default school configuration initialized in Firestore.');
    }
  } catch (err) {
    console.warn('[Init] Settings check skipped:', err);
  }
}
