import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info', text: string } | null>(null)
  
  const navigate = useNavigate()
  const location = useLocation()

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth')
        const app = (await import('../firebase')).default
        const auth = getAuth(app)
        
        onAuthStateChanged(auth, (user) => {
          if (user) {
            // User is already logged in, redirect to dashboard or intended destination
            const from = location.state?.from?.pathname || '/dashboard'
            navigate(from, { replace: true })
          }
        })
      } catch (error) {
        console.warn('Auth state check failed', error)
      }
    }

    checkAuthState()
  }, [navigate, location])

  // Determine if we should show login or signup based on URL
  useEffect(() => {
    setIsLogin(location.pathname === '/login')
  }, [location.pathname])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import('firebase/auth')
      const app = (await import('../firebase')).default
      const auth = getAuth(app)

      if (isLogin) {
        // Login existing user
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        if (!user.emailVerified) {
          setMessage({
            type: 'info',
            text: 'Please verify your email address. Check your inbox for a verification link.'
          })
          return
        }

        // Check if user has signed agreement
        const { ref, get } = await import('firebase/database')
        const { database } = await import('../firebase')
        
        const agreementSnap = await get(ref(database, `users/${user.uid}/agreement`))
        
        if (!agreementSnap.exists() || !agreementSnap.val().agreed) {
          // Redirect to agreement page
          navigate('/agreement')
        } else {
          // Redirect to dashboard or intended destination
          const from = location.state?.from?.pathname || '/dashboard'
          navigate(from, { replace: true })
        }

      } else {
        // Sign up new user
        if (!displayName.trim()) {
          setMessage({ type: 'error', text: 'Full name is required' })
          return
        }

        if (password !== confirmPassword) {
          setMessage({ type: 'error', text: 'Passwords do not match' })
          return
        }

        if (password.length < 6) {
          setMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
          return
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // Update display name (now required)
        await updateProfile(user, { displayName: displayName.trim() })

        // Send email verification
        await sendEmailVerification(user)

        // Store user creation timestamp in database
        const { ref, set } = await import('firebase/database')
        const { database } = await import('../firebase')
        
        await set(ref(database, `users/${user.uid}/profile`), {
          email: user.email,
          displayName: displayName.trim(),
          createdAt: Date.now(),
          emailVerified: false
        })

        setMessage({
          type: 'success',
          text: 'Account created successfully! Please check your email and verify your account before proceeding.'
        })

        // Redirect to verify page
        navigate('/verify')
      }

    } catch (error: any) {
      console.error('Authentication error:', error)
      
      let errorMessage = 'An error occurred. Please try again.'
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.'
          break
        case 'auth/wrong-password':
          errorMessage = 'Invalid password. Please try again.'
          break
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.'
          break
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.'
          break
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists. Try logging in instead.'
          break
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.'
          break
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.'
          break
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.'
          break
        default:
          errorMessage = error.message || errorMessage
      }
      
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setMessage(null)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setDisplayName('')
    
    // Update URL without navigation
    window.history.pushState({}, '', isLogin ? '/signup' : '/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src="/assets/afs-min.png" 
            alt="Accredited Financial Services" 
            className="h-16 w-auto" 
            loading="eager"
            decoding="async"
            width="64"
            height="64"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={toggleMode}
                className="font-medium text-blue-800 hover:text-blue-900"
              >
                Sign up here
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={toggleMode}
                className="font-medium text-blue-800 hover:text-blue-900"
              >
                Sign in instead
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {message && (
            <div className={`mb-4 p-4 rounded-md flex items-center ${
              message.type === 'error' ? 'bg-red-50 text-red-800' :
              message.type === 'success' ? 'bg-green-50 text-green-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              {message.type === 'error' && <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
              {message.type === 'success' && <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
              {message.type === 'info' && <Mail className="h-5 w-5 mr-2 flex-shrink-0" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                    placeholder="Your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                  placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 characters)'}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                    placeholder="Confirm your password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </div>
                ) : (
                  isLogin ? 'Sign in' : 'Create account'
                )}
              </button>
            </div>
          </form>

          {isLogin && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  // TODO: Implement password reset
                  setMessage({ 
                    type: 'info', 
                    text: 'Password reset functionality will be available soon. Please contact support if needed.' 
                  })
                }}
                className="text-sm text-blue-800 hover:text-blue-900"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login