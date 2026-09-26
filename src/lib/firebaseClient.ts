import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import configData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: configData.apiKey,
  authDomain: configData.authDomain,
  projectId: configData.projectId,
  storageBucket: configData.storageBucket,
  messagingSenderId: configData.messagingSenderId,
  appId: configData.appId,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = configData.firestoreDatabaseId 
  ? getFirestore(app, configData.firestoreDatabaseId) 
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
