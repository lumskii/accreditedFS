import React, { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireEmailVerification?: boolean
  requireAgreement?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireEmailVerification = true,
  requireAgreement = true 
}) => {
  const [authState, setAuthState] = useState<{
    isLoading: boolean
    isAuthenticated: boolean
    isEmailVerified: boolean
    hasAgreement: boolean
    user: any
  }>({
    isLoading: true,
    isAuthenticated: false,
    isEmailVerified: false,
    hasAgreement: false,
    user: null
  })
  
  const location = useLocation()

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth')
        const { ref, get } = await import('firebase/database')
        const { database } = await import('../firebase')
        const app = (await import('../firebase')).default
        const auth = getAuth(app)
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            // Check if email is verified
            const isEmailVerified = user.emailVerified
            
            // Check if user has signed agreement
            let hasAgreement = false
            try {
              const agreementSnap = await get(ref(database, `users/${user.uid}/agreement`))
              hasAgreement = agreementSnap.exists() && agreementSnap.val().agreed
            } catch (error) {
              console.warn('Failed to check agreement status:', error)
            }

            setAuthState({
              isLoading: false,
              isAuthenticated: true,
              isEmailVerified,
              hasAgreement,
              user
            })
          } else {
            setAuthState({
              isLoading: false,
              isAuthenticated: false,
              isEmailVerified: false,
              hasAgreement: false,
              user: null
            })
          }
        })

        return () => unsubscribe()
      } catch (error) {
        console.error('Auth state check failed:', error)
        setAuthState(prev => ({ ...prev, isLoading: false }))
      }
    }

    checkAuthState()
  }, [])

  // Show loading spinner while checking auth state
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-800"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Redirect to verify page if email not verified (when required)
  if (requireEmailVerification && !authState.isEmailVerified) {
    return <Navigate to="/verify" replace />
  }

  // Redirect to agreement page if agreement not signed (when required)
  if (requireAgreement && !authState.hasAgreement) {
    return <Navigate to="/agreement" replace />
  }

  // All checks passed, render the protected content
  return <>{children}</>
}

export default ProtectedRoute