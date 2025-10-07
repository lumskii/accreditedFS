import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth'
import { ref, set } from 'firebase/database'
import app, { database } from '../firebase'

const Signup: React.FC = () => {
  const auth = getAuth(app)
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const plan = params.get('plan') || ''
  const initialMode = params.get('mode') || 'full'

  const [isExisting, setIsExisting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // make mode a controlled UI state so users can toggle options
  const [modeState, setModeState] = useState<string>(initialMode)

  useEffect(() => {
    // If user is already logged in and verified, go to agreement
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user && user.emailVerified) {
        navigate('/agreement')
      }
    })
    return unsubscribe
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate required fields
    if (!name.trim()) {
      setError('Full name is required')
      setLoading(false)
      return
    }

    if (!phone.trim()) {
      setError('Phone number is required')
      setLoading(false)
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setError('Password is required')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      // try register
      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      // update displayName
      if (userCred.user) {
        await updateProfile(userCred.user, { displayName: name })
        // send verification with actionCodeSettings so the link returns to our app route /verify
        const continueUrl = `${window.location.origin}/verify`
        const actionCodeSettings = {
          url: continueUrl,
          handleCodeInApp: true
        }
        await sendEmailVerification(userCred.user, actionCodeSettings)
        // store basic profile in RTDB
        await set(ref(database, `users/${userCred.user.uid}/profile`), {
          name,
          phone,
          email,
          createdAt: Date.now(),
          emailVerified: false
        })
        // persist chosen plan/mode
        await set(ref(database, `users/${userCred.user.uid}/flow`), {
          plan,
          mode: modeState,
          signupAt: Date.now()
        })
        // Navigate to verification page instead of agreement
        navigate('/verify-email')
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already exists. Please log in instead.')
        setIsExisting(true)
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError(err.message || 'Signup failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // persist chosen mode for existing users too
      const user = auth.currentUser
      if (user) {
        await set(ref(database, `users/${user.uid}/flow`), { plan, mode: modeState, signupAt: Date.now() })
      }
      navigate('/agreement')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-blue-800 mb-4">Create an account to continue</h2>
  {plan && <p className="text-sm text-gray-700 mb-4">Plan: <strong>{plan}</strong> — {modeState === 'full' ? 'Pay in Full' : 'Monthly'}</p>}
        {error && <div className="text-red-600 mb-2">{error}</div>}

        <form onSubmit={isExisting ? handleLogin : handleSignup} className="space-y-3">
                                  <input
                          type="text"
                          placeholder="Full Name *"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
          <input className="w-full border rounded px-3 py-2" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} required />
          <input className="w-full border rounded px-3 py-2" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />

          <div className="flex items-center space-x-4">
            <label className="text-sm">Payment option:</label>
            <label className="inline-flex items-center">
              <input className="mr-2" type="radio" name="mode" value="full" checked={modeState === 'full'} onChange={() => setModeState('full')} />
              Pay in Full
            </label>
            <label className="inline-flex items-center">
              <input className="mr-2" type="radio" name="mode" value="monthly" checked={modeState === 'monthly'} onChange={() => setModeState('monthly')} />
              Monthly
            </label>
          </div>

            <button className="w-full bg-blue-700 text-white py-2 rounded" disabled={loading}>{isExisting ? 'Log in' : 'Create account'}</button>
        </form>

        <p className="text-sm text-gray-500 mt-3">By continuing you agree to our terms.</p>
      </div>
    </div>
  )
}

export default Signup
