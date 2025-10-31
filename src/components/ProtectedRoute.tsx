import React, { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireEmailVerification?: boolean
  requireAgreement?: boolean
  requirePayment?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireEmailVerification = true,
  requireAgreement = true,
  requirePayment = false
}) => {
  const [authState, setAuthState] = useState<{
    isLoading: boolean
    isAuthenticated: boolean
    isEmailVerified: boolean
    hasAgreement: boolean
    hasActivePlan: boolean
    isAdmin: boolean
    user: any
  }>({
    isLoading: true,
    isAuthenticated: false,
    isEmailVerified: false,
    hasAgreement: false,
    hasActivePlan: false,
    isAdmin: false,
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
            // Check admin role
            let isAdmin = false
            // Check if user has an active plan
            let hasActivePlan = false
            try {
              const agreementSnap = await get(ref(database, `users/${user.uid}/agreement`))
              hasAgreement = agreementSnap.exists() && agreementSnap.val().agreed
              const adminSnap = await get(ref(database, `users/${user.uid}/roles/admin`))
              isAdmin = adminSnap.exists() && !!adminSnap.val()
              
              // Check for active plan with status 'active' or 'paid'
              const planSnap = await get(ref(database, `users/${user.uid}/currentPlan`))
              if (planSnap.exists()) {
                const planData = planSnap.val()
                console.log('ProtectedRoute - Current plan data:', planData)
                // User has active plan if the plan exists in database
                // This means they completed payment (webhook sets this field)
                hasActivePlan = !!planData
                console.log('ProtectedRoute - hasActivePlan:', hasActivePlan)
              } else {
                console.log('ProtectedRoute - No currentPlan found for user')
              }
            } catch (error) {
              console.warn('Failed to check user status:', error)
            }

            setAuthState({
              isLoading: false,
              isAuthenticated: true,
              isEmailVerified,
              hasAgreement,
              hasActivePlan,
              isAdmin,
              user
            })
          } else {
            setAuthState({
              isLoading: false,
              isAuthenticated: false,
              isEmailVerified: false,
              hasAgreement: false,
              hasActivePlan: false,
              isAdmin: false,
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

  // Admin bypass: admins do not need agreements and should not see user agreement/dashboard pages
  if (authState.isAdmin) {
    if (location.pathname === '/agreement' || location.pathname === '/dashboard') {
      return <Navigate to="/admin/dashboard" replace />
    }
    // Otherwise allow access without enforcing agreement or payment
    return <>{children}</>
  }

  // Redirect to agreement page if agreement not signed (when required)
  if (requireAgreement && !authState.hasAgreement) {
    return <Navigate to="/agreement" replace />
  }

  // Redirect to homepage if user doesn't have an active plan (only for routes that require payment)
  // This prevents users who cancel payment from accessing the dashboard
  if (requirePayment && !authState.hasActivePlan) {
    console.log('ProtectedRoute - Payment required but user has no active plan, redirecting to homepage')
    return <Navigate to="/" replace />
  }

  // All checks passed, render the protected content
  return <>{children}</>
}

export default ProtectedRoute