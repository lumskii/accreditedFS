import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { ref, set } from 'firebase/database'
import app, { database } from '../firebase'

const Signup: React.FC = () => {
  const auth = getAuth(app)
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const plan = params.get('plan') || ''

  const [isExisting, setIsExisting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/[^\d]/g, '')
    
    // Don't format if less than 3 digits
    if (phoneNumber.length < 4) return phoneNumber
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    }
    
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  // Phone number validation function
  const validatePhoneNumber = (phoneNumber: string) => {
    // Remove all non-digit characters for validation
    const digits = phoneNumber.replace(/[^\d]/g, '')
    
    // US phone numbers should have exactly 10 digits
    if (digits.length !== 10) {
      return 'Phone number must be 10 digits long'
    }
    
    // Check for valid area code (first digit can't be 0 or 1)
    if (digits[0] === '0' || digits[0] === '1') {
      return 'Invalid area code'
    }
    
    // Check for valid exchange code (fourth digit can't be 0 or 1)
    if (digits[3] === '0' || digits[3] === '1') {
      return 'Invalid phone number format'
    }
    
    return null
  }

  // Handle phone number input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formattedPhone = formatPhoneNumber(value)
    
    // Only update if the formatted length is 14 or less (to prevent over-typing)
    if (formattedPhone.length <= 14) {
      setPhone(formattedPhone)
    }
  }

  useEffect(() => {
    // If user is already logged in and verified, route to payment selection when plan is known
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user && user.emailVerified) {
        try {
          const { ref, get } = await import('firebase/database')
          const { database } = await import('../firebase')
          const adminSnap = await get(ref(database, `users/${user.uid}/roles/admin`))
          const isAdmin = adminSnap.exists() && !!adminSnap.val()
          if (isAdmin) {
            navigate('/admin/dashboard')
            return
          }
        } catch {}

        if (plan) {
          navigate(`/payment-mode?plan=${encodeURIComponent(plan)}`)
        } else {
          navigate('/agreement')
        }
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

    // Validate phone number format
    const phoneError = validatePhoneNumber(phone)
    if (phoneError) {
      setError(phoneError)
      setLoading(false)
      return
    }

    if (!address.trim()) {
      setError('Address is required')
      setLoading(false)
      return
    }

    if (!city.trim()) {
      setError('City is required')
      setLoading(false)
      return
    }

    if (!state.trim()) {
      setError('State is required')
      setLoading(false)
      return
    }

    if (!zipCode.trim()) {
      setError('ZIP code is required')
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
      // Create user account
      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      
      if (userCred.user) {
        // Update displayName
        await updateProfile(userCred.user, { displayName: name })
        
        // Store extended profile in database
        await set(ref(database, `users/${userCred.user.uid}/profile`), {
          name,
          phone,
          phoneDigits: phone.replace(/[^\d]/g, ''), // Store digits-only version for processing
          address,
          city,
          state,
          zipCode,
          email,
          createdAt: Date.now(),
          emailVerified: false
        })
        
        // Navigate to payment mode selection
        navigate(`/payment-mode?plan=${encodeURIComponent(plan)}`)
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
      // Navigate to payment mode selection for existing users too
      navigate(`/payment-mode?plan=${encodeURIComponent(plan)}`)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-blue-800 mb-4">
          {isExisting ? 'Welcome back!' : 'Create an account to continue'}
        </h2>
        
        {plan && (
          <p className="text-sm text-gray-700 mb-4">
            Plan: <strong>{plan}</strong>
          </p>
        )}
        
        {error && <div className="text-red-600 mb-2">{error}</div>}

        <form onSubmit={isExisting ? handleLogin : handleSignup} className="space-y-3">
          {!isExisting && (
            <>
              <input
                type="text"
                placeholder="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="tel"
                placeholder="Phone * (e.g., (555) 123-4567)"
                value={phone}
                onChange={handlePhoneChange}
                required
                maxLength={14}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Address *"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City *"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="State *"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <input
                type="text"
                placeholder="ZIP Code *"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                required
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </>
          )}
          
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          
          <input
            type="password"
            placeholder="Password *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />

          <button
            type="submit"
            className="w-full bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isExisting ? 'Log in' : 'Create account')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsExisting(!isExisting)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isExisting ? 'Need to create an account?' : 'Already have an account?'}
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-3 text-center">
          By continuing you agree to our terms.
        </p>
      </div>
    </div>
  )
}

export default Signup