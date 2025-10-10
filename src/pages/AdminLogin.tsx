import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, Shield } from 'lucide-react'

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info', text: string } | null>(null)
  
  const navigate = useNavigate()

  // Check if admin is already logged in
  useEffect(() => {
    const checkAdminAuthState = async () => {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth')
        const { ref, get } = await import('firebase/database')
        const { database } = await import('../firebase')
        const app = (await import('../firebase')).default
        const auth = getAuth(app)
        
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            // Check if user has admin role
            const adminRef = ref(database, `users/${user.uid}/roles/admin`)
            const adminSnap = await get(adminRef)
            
            if (adminSnap.exists() && adminSnap.val()) {
              // User is already logged in as admin, redirect to admin dashboard
              navigate('/admin/dashboard', { replace: true })
            }
          }
        })
      } catch (error) {
        console.warn('Admin auth state check failed', error)
      }
    }

    checkAdminAuthState()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth')
      const { ref, get } = await import('firebase/database')
      const { database } = await import('../firebase')
      const app = (await import('../firebase')).default
      const auth = getAuth(app)

      // Login user
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      if (!user.emailVerified) {
        setMessage({
          type: 'error',
          text: 'Please verify your email address before accessing admin panel.'
        })
        return
      }

      // Check if user has admin role
      const adminRef = ref(database, `users/${user.uid}/roles/admin`)
      const adminSnap = await get(adminRef)
      
      if (!adminSnap.exists() || !adminSnap.val()) {
        setMessage({
          type: 'error',
          text: 'Access denied. You do not have administrator privileges.'
        })
        // Sign out the user since they're not an admin
        const { signOut } = await import('firebase/auth')
        await signOut(auth)
        return
      }

      // Success - redirect to admin dashboard
      setMessage({ type: 'success', text: 'Login successful! Redirecting...' })
      setTimeout(() => {
        navigate('/admin/dashboard')
      }, 1000)

    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.'
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password.'
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-12 w-12 text-blue-800" />
            <div>
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
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Access
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your administrator credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border-2 border-blue-100">
          {message && (
            <div className={`mb-4 p-3 rounded-md flex items-center space-x-2 ${
              message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {message.type === 'error' ? <AlertCircle className="h-5 w-5" /> :
               message.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
               <AlertCircle className="h-5 w-5" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  placeholder="Enter admin email"
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-800 focus:border-blue-800 sm:text-sm"
                  placeholder="Enter admin password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Sign in to Admin Panel</span>
                  </div>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Security Notice</span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                This area is restricted to authorized administrators only.
                All access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin