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
  const mode = params.get('mode') || 'full'

  const [isExisting, setIsExisting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If user is already logged in go to agreement
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        navigate('/agreement')
      }
    })
    return unsubscribe
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // try register
      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      // update displayName
      if (userCred.user) {
        await updateProfile(userCred.user, { displayName: name })
        // send verification
        await sendEmailVerification(userCred.user)
        // store basic profile in RTDB
        await set(ref(database, `users/${userCred.user.uid}/profile`), {
          name,
          phone,
          email,
          createdAt: Date.now()
        })
        // persist chosen plan/mode
        await set(ref(database, `users/${userCred.user.uid}/flow`), {
          plan,
          mode,
          signupAt: Date.now()
        })
        navigate('/agreement')
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already exists. Please log in instead.')
        setIsExisting(true)
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
        {plan && <p className="text-sm text-gray-700 mb-4">Plan: <strong>{plan}</strong> — {mode === 'full' ? 'Pay in Full' : 'Monthly'}</p>}
        {error && <div className="text-red-600 mb-2">{error}</div>}

        <form onSubmit={isExisting ? handleLogin : handleSignup} className="space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
          <input className="w-full border rounded px-3 py-2" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} required />
          <input className="w-full border rounded px-3 py-2" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />

          <div className="flex items-center space-x-2">
            <label className="text-sm">Payment option:</label>
            <label className="inline-flex items-center"><input className="mr-2" type="radio" name="mode" value="full" checked={mode === 'full'} readOnly /> Pay in Full</label>
            <label className="inline-flex items-center"><input className="mr-2" type="radio" name="mode" value="monthly" checked={mode === 'monthly'} readOnly /> Monthly</label>
          </div>

          <button className="w-full bg-blue-700 text-white py-2 rounded" disabled={loading}>{isExisting ? 'Log in' : 'Create account'}</button>
        </form>

        <p className="text-sm text-gray-500 mt-3">By continuing you agree to our terms.</p>
      </div>
    </div>
  )
}

export default Signup
