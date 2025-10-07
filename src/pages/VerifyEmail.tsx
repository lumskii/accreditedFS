import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuth, sendEmailVerification, User } from 'firebase/auth'
import { Mail, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react'
import app from '../firebase'

const VerifyEmail: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const auth = getAuth(app)
    
    // Check initial auth state
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // No user logged in, redirect to signup
        navigate('/signup')
        return
      }

      setUser(user)
      setLoading(false)

      // If already verified, redirect to agreement
      if (user.emailVerified) {
        navigate('/agreement')
        return
      }
    })

    return unsubscribe
  }, [navigate])

  // Auto-refresh verification status every 3 seconds
  useEffect(() => {
    if (!user || user.emailVerified) return

    const interval = setInterval(async () => {
      try {
        setCheckingStatus(true)
        await user.reload()
        
        // Get fresh user data
        const auth = getAuth(app)
        const currentUser = auth.currentUser
        
        if (currentUser?.emailVerified) {
          setCheckingStatus(false)
          navigate('/agreement')
        }
      } catch (error) {
        console.error('Error checking verification status:', error)
      } finally {
        setCheckingStatus(false)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [user, navigate])

  const handleResendVerification = async () => {
    if (!user) return

    setResending(true)
    setResendMessage(null)

    try {
      const continueUrl = `${window.location.origin}/verify`
      const actionCodeSettings = {
        url: continueUrl,
        handleCodeInApp: true
      }
      
      await sendEmailVerification(user, actionCodeSettings)
      setResendMessage('Verification email sent! Please check your inbox.')
    } catch (error: any) {
      setResendMessage(`Failed to resend email: ${error.message}`)
    } finally {
      setResending(false)
    }
  }

  const handleManualCheck = async () => {
    if (!user) return

    setCheckingStatus(true)
    try {
      await user.reload()
      const auth = getAuth(app)
      const currentUser = auth.currentUser
      
      if (currentUser?.emailVerified) {
        navigate('/agreement')
      } else {
        setResendMessage('Email not verified yet. Please check your inbox and click the verification link.')
      }
    } catch (error) {
      console.error('Error checking verification status:', error)
      setResendMessage('Error checking verification status. Please try again.')
    } finally {
      setCheckingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-800"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to signup
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-blue-100 p-3">
            <Mail className="h-12 w-12 text-blue-800" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify your email address
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We've sent a verification link to
        </p>
        <p className="text-center text-sm font-medium text-blue-800">
          {user.email}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Please check your email
              </h3>
              <p className="text-gray-600 mb-6">
                Click the verification link in your email to continue. This page will automatically 
                update when your email is verified.
              </p>
              
              {checkingStatus && (
                <div className="flex items-center justify-center space-x-2 text-blue-600 mb-4">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Checking verification status...</span>
                </div>
              )}

              {resendMessage && (
                <div className={`mb-4 p-3 rounded-md ${
                  resendMessage.includes('sent') || resendMessage.includes('success')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {resendMessage}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={handleManualCheck}
                disabled={checkingStatus}
                className="w-full flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 font-medium rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                I've verified my email
              </button>

              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5 mr-2" />
                    Resend verification email
                  </>
                )}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Next steps</span>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  After verification, you'll proceed to review our agreement and complete your setup.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail