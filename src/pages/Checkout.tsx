import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import app, { database } from '../firebase'
import { getAuth, sendEmailVerification } from 'firebase/auth'
import { get, ref } from 'firebase/database'
import { loadStripe } from '@stripe/stripe-js'
import Toast from '../components/Toast'
import Spinner from '../components/Spinner'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)

const Checkout: React.FC = () => {
  const auth = getAuth(app)
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const plan = params.get('plan') || ''
  const mode = params.get('mode') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setError(null)
      const user = auth.currentUser
      if (!user) {
        navigate('/signup')
        return
      }

      // Ensure email verified and agreement exists
      if (!user.emailVerified) {
        setError('Please verify your email before continuing to payment.')
        setLoading(false)
        return
      }

      try {
        const agrSnap = await get(ref(database, `users/${user.uid}/agreement`))
        if (!agrSnap.exists() || !agrSnap.val().agreed) {
          setError('You must sign the agreement before proceeding to payment.')
          setLoading(false)
          return
        }

        const idToken = await user.getIdToken()
        // POST to backend to create checkout session
        const envApiBase = import.meta.env.VITE_API_BASE
        const isDev = import.meta.env.MODE === 'development'
        const defaultProdApi = 'https://accreditedfs.vercel.app'
        const apiBase = envApiBase || (isDev ? '' : defaultProdApi)
        const endpoint = apiBase ? `${apiBase.replace(/\/$/, '')}/api/create-checkout-session` : '/api/create-checkout-session'

        const body: Record<string, any> = {}
        if (plan) body.plan = plan
        if (mode) body.mode = mode

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify(body)
        })

        if (!res.ok) {
          const txt = await res.text()
          throw new Error(txt || 'Failed to create checkout session')
        }

        const { id } = await res.json()
        const stripe = await stripePromise
        if (!stripe) throw new Error('Stripe not configured')
        await stripe.redirectToCheckout({ sessionId: id })
      } catch (err: any) {
        setError(err.message || 'Checkout failed')
        setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [])

  const handleResend = async () => {
    const user = auth.currentUser
    if (!user) return
    setResendLoading(true)
    try {
      await sendEmailVerification(user)
      setToast('Verification email sent — check your inbox')
    } catch (err: any) {
      setError(err.message || 'Failed to send verification')
    } finally {
      setResendLoading(false)
    }
  }

  if (loading && !error) return <div className="min-h-screen flex items-center justify-center">Starting checkout…</div>
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 bg-white rounded shadow w-full max-w-md">
        {error ? (
          <div>
            <p className="text-red-600 mb-2">{error}</p>
            <div className="flex items-center space-x-2">
              <button className="bg-blue-700 text-white px-4 py-2 rounded" onClick={() => navigate('/agreement')}>Back to Agreement</button>
              <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={handleResend} disabled={resendLoading}>
                {resendLoading ? <Spinner size={16} /> : 'Resend verification email'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2"><Spinner size={20} /><div>Preparing your checkout…</div></div>
        )}
        <Toast message={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  )
}

export default Checkout
