import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyBHgM9w98CbWzWrm6f1MwcBLYQSP5jQrU8",
  authDomain: "accreditedfs.firebaseapp.com",
  projectId: "accreditedfs",
  storageBucket: "accreditedfs.firebasestorage.app",
  messagingSenderId: "421709791580",
  appId: "1:421709791580:web:1bbd904382f4ce0a9ec199",
  measurementId: "G-M4CDFFHBGT"
};

const app = initializeApp(firebaseConfig)

export const database = getDatabase(app)

export async function getAppAnalytics() {
  if (await isSupported()) {
    return getAnalytics(app)
  }
  return null
}

export default app
