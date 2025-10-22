import { initializeApp, getApps } from 'firebase/app'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getStorage } from 'firebase/storage'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

// Firebase configuration loaded from Vite environment variables.
// See .env.example for the required variables.
const _databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL || import.meta.env.VITE_FIREBASE_DATABASEURL || ''

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: _databaseURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Enhanced validation with detailed logging
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'databaseURL']
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])

console.log('Firebase Configuration Check:')
console.log('API Key:', firebaseConfig.apiKey ? 'Present' : 'MISSING')
console.log('Auth Domain:', firebaseConfig.authDomain || 'MISSING')
console.log('Project ID:', firebaseConfig.projectId || 'MISSING')
console.log('Database URL:', firebaseConfig.databaseURL || 'MISSING')

if (missingFields.length > 0) {
  console.error('Missing Firebase configuration:', missingFields)
  console.error('Current config:', {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? '***' : 'MISSING'
  })
  throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`)
}

let app: any
let database: any
let storage: any

try {
  // Check if Firebase is already initialized
  if (getApps().length > 0) {
    console.log('Firebase already initialized, reusing existing app')
    app = getApps()[0]
  } else {
    console.log('Initializing Firebase with enhanced error handling...')
    app = initializeApp(firebaseConfig)
    console.log('Firebase app initialized successfully')
  }
  
  // Initialize services with individual error handling
  try {
    database = getDatabase(app)
    console.log('Firebase Database service initialized')
  } catch (dbError) {
    console.error('Failed to initialize Firebase Database:', dbError)
    throw dbError
  }
  
  try {
    storage = getStorage(app)
    console.log('Firebase Storage service initialized')
  } catch (storageError) {
    console.error('Failed to initialize Firebase Storage:', storageError)
    throw storageError
  }
  
  // Test auth initialization
  try {
    const auth = getAuth(app)
    console.log('Firebase Auth service initialized')
  } catch (authError) {
    console.error('Failed to initialize Firebase Auth:', authError)
    throw authError
  }
  
  // Log successful initialization
  console.log('All Firebase services initialized successfully', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey,
    hasDatabase: !!firebaseConfig.databaseURL
  })
} catch (error: any) {
  console.error('Firebase initialization failed:', error)
  
  // Provide helpful error messages
  if (error.code === 'auth/network-request-failed') {
    console.error('Network connection failed. Please check your internet connection and Firebase configuration.')
    console.error('This often happens due to network connectivity issues or incorrect Firebase configuration.')
  } else if (error.message?.includes('Missing Firebase configuration')) {
    console.error('Please check your .env file and ensure all Firebase variables are set correctly')
  } else if (error.code === 'auth/invalid-api-key') {
    console.error('Invalid Firebase API key. Please check your VITE_FIREBASE_API_KEY environment variable.')
  }
  
  throw error
}

export { database, storage }

export async function getAppAnalytics() {
  try {
    if (await isSupported()) {
      return getAnalytics(app)
    }
    return null
  } catch (error) {
    console.warn('Analytics not supported:', error)
    return null
  }
}

export default app
