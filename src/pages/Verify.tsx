import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import app from '../firebase'
import { getAuth, applyActionCode, sendEmailVerification, onAuthStateChanged } from 'firebase/auth'
import Toast from '../components/Toast'
import Spinner from '../components/Spinner'

const Verify: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const auth = getAuth(app)
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email || '')
        // If user is already verified, redirect to agreement
        if (user.emailVerified) {
          setToast('Email already verified! Redirecting...')
          setTimeout(() => navigate('/agreement'), 1200)
          return
        }
      }
    })

    return () => unsubscribe()
  }, [navigate])

  useEffect(() => {
    const run = async () => {
      const auth = getAuth(app)
      const oobCode = searchParams.get('oobCode')
      
      if (!oobCode) {
        // No verification code in URL - this means user navigated directly to /verify
        // Set up auto-refresh to check verification status
        setLoading(false)
        startAutoRefresh()
        return
      }
      
      try {
        await applyActionCode(auth, oobCode)
        // reload current user state
        if (auth.currentUser) await auth.currentUser.reload()
        setToast('Email verified successfully! Redirecting...')
        setTimeout(() => navigate('/agreement'), 1200)
      } catch (err: any) {
        setError(err.message || 'Verification failed')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [searchParams, navigate])

  // Auto-refresh to check verification status every 3 seconds
  const startAutoRefresh = () => {
    const interval = setInterval(async () => {
      const auth = getAuth(app)
      const user = auth.currentUser
      
      if (!user) return
      
      setIsChecking(true)
      try {
        await user.reload()
        const currentUser = auth.currentUser
        if (currentUser?.emailVerified) {
          clearInterval(interval)
          setToast('Email verified! Redirecting...')
          setTimeout(() => navigate('/agreement'), 1200)
        }
      } catch (error) {
        console.error('Error checking verification status:', error)
      } finally {
        setIsChecking(false)
      }
    }, 3000)

    // Clean up interval after 10 minutes
    setTimeout(() => clearInterval(interval), 600000)
  }

  const handleResendVerification = async () => {
    const auth = getAuth(app)
    const user = auth.currentUser

    if (!user) {
      setError('No user found. Please sign up again.')
      return
    }

    setResendLoading(true)
    try {
      const continueUrl = `${window.location.origin}/verify`
      const actionCodeSettings = {
        url: continueUrl,
        handleCodeInApp: true
      }
      
      await sendEmailVerification(user, actionCodeSettings)
      setToast('Verification email sent! Please check your inbox.')
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email')
    } finally {
      setResendLoading(false)
    }
  }

  const handleManualCheck = async () => {
    const auth = getAuth(app)
    const user = auth.currentUser

    if (!user) return

    setIsChecking(true)
    try {
      await user.reload()
      const currentUser = auth.currentUser
      if (currentUser?.emailVerified) {
        setToast('Email verified! Redirecting...')
        setTimeout(() => navigate('/agreement'), 1200)
      } else {
        setToast('Email not verified yet. Please check your inbox and click the verification link.')
      }
    } catch (error) {
      console.error('Error checking verification status:', error)
      setToast('Error checking verification status. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  // If we have a verification code in URL, show the verification process
  if (searchParams.get('oobCode')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          {loading ? (
            <div className="flex items-center space-x-3">
              <Spinner size={20} />
              <div>Verifying your email…</div>
            </div>
          ) : error ? (
            <div>
              <div className="text-red-600 mb-3">{error}</div>
              <button 
                className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors" 
                onClick={() => navigate('/signup')}
              >
                Back to Signup
              </button>
            </div>
          ) : (
            <div>
              <div className="text-green-700 mb-3">Verification successful.</div>
              <button 
                className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors" 
                onClick={() => navigate('/agreement')}
              >
                Continue
              </button>
            </div>
          )}
          <Toast message={toast} onClose={() => setToast(null)} />
        </div>
      </div>
    )
  }

  // No verification code - show waiting page with instructions
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Check Your Email
          </h1>
          
          <p className="text-gray-600 mb-6">
            We've sent a verification link to
            {userEmail && (
              <span className="block font-medium text-gray-900 mt-1">
                {userEmail}
              </span>
            )}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What to do next:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Return to this page - we'll automatically detect when you're verified</li>
                </ol>
              </div>
            </div>
          </div>

          {isChecking && (
            <div className="flex items-center justify-center text-blue-600 mb-4">
              <Spinner size={16} />
              <span className="ml-2 text-sm">Checking verification status...</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isChecking ? 'Checking...' : 'I\'ve clicked the link - Check again'}
            </button>

            <div className="flex space-x-3">
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {resendLoading ? (
                  <div className="flex items-center justify-center">
                    <Spinner size={16} />
                    <span className="ml-2">Sending...</span>
                  </div>
                ) : (
                  'Resend verification email'
                )}
              </button>

              <button
                onClick={() => navigate('/signup')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Back to Signup
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              After verification, you'll proceed to review our agreement and complete your setup.
            </p>
          </div>
        </div>
        
        <Toast message={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  )
}

export default Verify
