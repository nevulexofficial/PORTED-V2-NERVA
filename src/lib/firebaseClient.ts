import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import configData from '../../firebase-applet-config.json';

const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string) || configData.apiKey;
const authDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || configData.authDomain;
const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || configData.projectId;
const databaseId = (import.meta.env.VITE_FIREBASE_DATABASE_ID as string) || configData.firestoreDatabaseId;
const storageBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || configData.storageBucket;
const messagingSenderId = (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || configData.messagingSenderId;
const appId = (import.meta.env.VITE_FIREBASE_APP_ID as string) || configData.appId;

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = databaseId 
  ? getFirestore(app, databaseId) 
  : getFirestore(app);
export const auth = getAuth(app);

// Validation test connection per instructions
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Connection offline or waiting network sync.');
    }
  }
}
testFirestoreConnection().catch(() => {});
