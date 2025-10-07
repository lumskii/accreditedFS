import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getAuth, sendEmailVerification, onAuthStateChanged } from 'firebase/auth'
import { ref, set, get } from 'firebase/database'
import app, { database } from '../firebase'

const PaymentMode: React.FC = () => {
  const auth = getAuth(app)
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const plan = params.get('plan') || ''

  const [user, setUser] = useState<any>(null)
  const [mode, setMode] = useState<string>('full')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/signup')
        return
      }
      
      setUser(currentUser)
      
      // If user is already verified, skip to agreement
      if (currentUser.emailVerified) {
        navigate('/agreement')
        return
      }
      
      // Check if user already has a flow saved
      try {
        const flowSnap = await get(ref(database, `users/${currentUser.uid}/flow`))
        if (flowSnap.exists()) {
          const flowData = flowSnap.val()
          if (flowData.mode) {
            setMode(flowData.mode)
          }
        }
      } catch (error) {
        console.error('Error loading user flow:', error)
      }
    })

    return unsubscribe
  }, [])

  const handleContinue = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Save the payment mode selection
      await set(ref(database, `users/${user.uid}/flow`), {
        plan,
        mode,
        signupAt: Date.now()
      })

      // Send verification email if not already sent
      if (!user.emailVerified) {
        const continueUrl = `${window.location.origin}/verify`
        const actionCodeSettings = {
          url: continueUrl,
          handleCodeInApp: true
        }
        await sendEmailVerification(user, actionCodeSettings)
      }

      // Navigate to verification page
      navigate('/verify-email')
    } catch (err: any) {
      setError(err.message || 'Failed to save payment preference')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Account Created Successfully!
          </h1>
          
          {plan && (
            <p className="text-gray-600 mb-6">
              You've selected the <span className="font-semibold text-blue-600">{plan}</span> plan.
              <br />
              Now choose your payment preference:
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Options:</h3>
            
            <div className="space-y-3">
              <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="full"
                  checked={mode === 'full'}
                  onChange={(e) => setMode(e.target.value)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Pay in Full</div>
                  <div className="text-sm text-gray-600">One-time payment with potential discount</div>
                </div>
              </label>

              <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="monthly"
                  checked={mode === 'monthly'}
                  onChange={(e) => setMode(e.target.value)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Monthly Payments</div>
                  <div className="text-sm text-gray-600">Spread the cost over monthly installments</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Processing...' : 'Continue to Email Verification'}
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Back to Signup
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Next: We'll send you an email verification link to complete your account setup.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentMode