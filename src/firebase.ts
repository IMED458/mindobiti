// Firebase ინიციალიზაცია — ყველა მონაცემი ინახება მხოლოდ Google Firebase (Firestore) -ზე.
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDZ2SWhCJyUgjxfjdX61sPlWIAGBWy-xxM',
  authDomain: 'mindobiti.firebaseapp.com',
  projectId: 'mindobiti',
  storageBucket: 'mindobiti.firebasestorage.app',
  messagingSenderId: '11015589221',
  appId: '1:11015589221:web:c7af198f290eee6057258c',
  measurementId: 'G-K43F1MB5Q0',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
