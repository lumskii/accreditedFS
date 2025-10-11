import React, { useState, useEffect, useRef } from 'react'
import { Menu, X, User, ChevronDown } from 'lucide-react'

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasPlan, setHasPlan] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Check authentication state and admin role
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
            setIsLoggedIn(true)
            
            // Check if user is admin
            try {
              const adminRef = ref(database, `users/${user.uid}/roles/admin`)
              const adminSnap = await get(adminRef)
              setIsAdmin(adminSnap.exists() && adminSnap.val())
            } catch (error) {
              console.warn('Admin check failed:', error)
              setIsAdmin(false)
            }

            // Check if user has a plan
            try {
              const planRef = ref(database, `users/${user.uid}/flow/plan`)
              const planSnap = await get(planRef)
              setHasPlan(planSnap.exists() && planSnap.val())
            } catch (error) {
              console.warn('Plan check failed:', error)
              setHasPlan(false)
            }
          } else {
            setIsLoggedIn(false)
            setIsAdmin(false)
            setHasPlan(false)
          }
          setIsLoading(false)
        })

        return unsubscribe
      } catch (error) {
        console.warn('Auth state check failed', error)
        setIsLoading(false)
      }
    }

    checkAuthState()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // lightweight auth-aware logout (we'll import auth lazily to avoid adding firebase to main bundle)
  const handleLogout = async () => {
    try {
      const { getAuth, signOut } = await import('firebase/auth')
      const app = (await import('../firebase')).default
      const auth = getAuth(app)
      await signOut(auth)
      // force a reload to update UI
      window.location.href = '/'
    } catch (e) {
      console.warn('Logout failed', e)
    }
  }
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <img 
                src="/assets/afs-min.png" 
                alt="Accredited Financial Services - Arizona Credit Repair Company Logo" 
                className="h-28 md:h-36 lg:h-44 xl:h-52 w-auto mr-4 object-contain" 
                loading="eager"
                decoding="async"
                width="200"
                height="208"
              />
            </a>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="/#services" className="text-gray-700 hover:text-blue-800 transition-colors">Services</a>
            <a href="/#pricing" className="text-gray-700 hover:text-blue-800 transition-colors">Pricing</a>
            <a href="/#benefits" className="text-gray-700 hover:text-blue-800 transition-colors">Why Choose Us</a>
            <a href="/#testimonials" className="text-gray-700 hover:text-blue-800 transition-colors">Success Stories</a>
            {/* Admin link removed for public navigation */}
            <a href="/#about" className="text-gray-700 hover:text-blue-800 transition-colors">About</a>
            <a href="/#booking" className="bg-[#f0d541] text-blue-800 px-4 py-2 rounded-md hover:bg-[#e6cb3d] transition-colors font-medium">Book Consultation</a>
            
            {/* User Dropdown - Show for all users */}
            {!isLoading && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-800 transition-colors p-2 rounded-md hover:bg-gray-50"
                >
                  <User size={20} />
                  <ChevronDown size={16} />
                </button>
                
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    {isLoggedIn ? (
                      <>
                        {!isAdmin && (
                          <a 
                            href="/dashboard" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserDropdownOpen(false)}
                          >
                            Dashboard
                          </a>
                        )}
                        <button 
                          onClick={() => {
                            setUserDropdownOpen(false)
                            handleLogout()
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <a 
                        href="/login" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Login
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="text-gray-700 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg rounded-b-md" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3" role="menu" aria-orientation="vertical">
            <a href="/#services" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600" onClick={() => setIsMenuOpen(false)} role="menuitem">Services</a>
            <a href="/#pricing" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600" onClick={() => setIsMenuOpen(false)} role="menuitem">Pricing</a>
            <a href="/#benefits" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600" onClick={() => setIsMenuOpen(false)} role="menuitem">Why Choose Us</a>
            <a href="/#testimonials" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600" onClick={() => setIsMenuOpen(false)} role="menuitem">Success Stories</a>
            {/* Admin link removed for public navigation */}
            <a href="/#about" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600" onClick={() => setIsMenuOpen(false)} role="menuitem">About</a>
            <a href="/#booking" className="block px-3 py-2 bg-[#f0d541] text-blue-800 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600" onClick={() => setIsMenuOpen(false)} role="menuitem">Book Consultation</a>
            
            {/* Mobile User Options - Show for all users */}
            {!isLoading && (
              <>
                {isLoggedIn ? (
                  <>
                    {!isAdmin && (
                      <a href="/dashboard" className="block px-3 py-2 text-blue-800 hover:bg-blue-50 hover:text-blue-900 font-medium rounded-md" onClick={() => setIsMenuOpen(false)}>Dashboard</a>
                    )}
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false)
                        handleLogout()
                      }} 
                      className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-md"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <a href="/login" className="block px-3 py-2 text-blue-800 hover:bg-blue-50 hover:text-blue-900 font-medium rounded-md" onClick={() => setIsMenuOpen(false)}>Login</a>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
export default Navbar
