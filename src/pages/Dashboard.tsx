import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  FileText, 
  User, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Download
} from 'lucide-react'

interface DashboardData {
  user: {
    uid: string
    email: string
    emailVerified: boolean
    displayName?: string
    joinDate: string
  }
  currentPlan: {
    id: string
    status: string
    currentPeriodEnd: string
    plan: string
  } | null
  paymentHistory: Array<{
    id: string
    amount: number
    currency: string
    status: string
    description: string
    created: string
    receiptUrl?: string
  }>
  subscriptions: Array<{
    id: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    plan: string
    amount: number
  }>
  upcomingInvoices: Array<{
    id: string
    amount: number
    currency: string
    dueDate: string
    status: string
  }>
  progress: {
    creditScore: {
      current: number | null
      initial: number | null
      goal: number | null
      lastUpdated: string | null
    }
    disputesSubmitted: number
    disputesResolved: number
    itemsRemoved: number
    milestones: Array<{
      title: string
      completed: boolean
      date?: string
    }>
  }
  sessions: any[]
  agreement: { agreed: boolean }
}

// Helper to derive milestones from dashboard data and optional uploads
function deriveMilestones(data: DashboardData, uploads: Array<{name: string, url: string, uploadedAt: string}> = []) {
  const ms: Array<{ title: string; completed: boolean; date?: string }> = []
  const prog = data.progress || ({} as any)
  const score = prog.creditScore || {}
  const current = typeof score.current === 'number' ? score.current : null
  const initial = typeof score.initial === 'number' ? score.initial : null
  // Account & agreement milestones
  ms.push({ title: 'Account Created', completed: !!data.user?.joinDate, date: data.user?.joinDate })
  ms.push({ title: 'Email Verified', completed: !!data.user?.emailVerified })
  ms.push({ title: 'Agreement Signed', completed: !!data.agreement?.agreed })
  // Dispute milestones
  ms.push({ title: 'First Dispute Submitted', completed: (prog.disputesSubmitted || 0) > 0 })
  ms.push({ title: 'First Item Removed', completed: (prog.itemsRemoved || 0) > 0 })
  // Score improvement milestones
  if (current != null && initial != null) {
    const delta = current - initial
    ms.push({ title: '+25 Points Achieved', completed: delta >= 25 })
    ms.push({ title: '+50 Points Achieved', completed: delta >= 50 })
  } else {
    ms.push({ title: '+25 Points Achieved', completed: false })
    ms.push({ title: '+50 Points Achieved', completed: false })
  }
  if (current != null && (score.goal || null)) {
    ms.push({ title: 'Target Score Reached', completed: current >= (score.goal as number) })
  } else {
    ms.push({ title: 'Target Score Reached', completed: false })
  }
  // Document uploads
  ms.push({ title: 'Documents Uploaded', completed: uploads.length > 0, date: uploads[0]?.uploadedAt })
  return ms
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'progress' | 'agreements'>('overview')
  const [uploads, setUploads] = useState<Array<{name: string, url: string, uploadedAt: string}>>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showAllUploads, setShowAllUploads] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)
  const MAX_MB = 20
  const ACCEPTED_TYPES = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { getAuth, onAuthStateChanged } = await import('firebase/auth')
        const app = (await import('../firebase')).default
        const auth = getAuth(app)
        
        // Wait for auth state to be determined with timeout
        const user = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => {
            unsubscribe()
            reject(new Error('Authentication timeout'))
          }, 10000) // 10 second timeout
          
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            clearTimeout(timeout)
            unsubscribe()
            resolve(user)
          })
        })
        
        if (!user) {
          console.log('No authenticated user, redirecting to login')
          navigate('/login')
          return
        }

        console.log('User authenticated:', user.email, 'Email verified:', user.emailVerified)

        // Force token refresh to ensure we have a valid token
        const idToken = await user.getIdToken(true)
        
        // Use the same API endpoint resolution logic as PricingSection
        const envApiBase = import.meta.env.VITE_API_BASE as string | undefined
        const isDev = import.meta.env.MODE === "development"
        const defaultProdApi = "https://api.accreditedfs.com"
        // Safety: never use a localhost API base when running on a public HTTPS origin
        const isBrowser = typeof window !== 'undefined'
        const currentOrigin = isBrowser ? window.location.origin : ''
        const onHttpsOrigin = isBrowser && currentOrigin.startsWith('https://')
        const looksLikeLocal = !!envApiBase && /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/.test(envApiBase)
        const resolvedApiBase = envApiBase && !(onHttpsOrigin && looksLikeLocal)
          ? envApiBase
          : (isDev ? '' : defaultProdApi)
        const endpoint = resolvedApiBase
          ? `${resolvedApiBase.replace(/\/$/, "")}/api/user-dashboard`
          : "/api/user-dashboard"

        console.log('Making dashboard API call to:', endpoint)
        console.log('Token length:', idToken.length)
        console.log('Token starts with:', idToken.substring(0, 20))

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        })

        console.log('Response status:', response.status)
        console.log('Response ok:', response.ok)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Dashboard API error response:', errorText)
          
          // Try to parse error as JSON
          let errorData;
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          
          throw new Error(`API Error (${response.status}): ${errorData.error || errorText}`)
        }

        const data = await response.json()
        console.log('Dashboard data received:', Object.keys(data))
        
        // If no current plan from API, try to get plan info from signed agreement
        if (!data.currentPlan || !data.currentPlan.plan || data.currentPlan.plan === 'Unknown Plan') {
          try {
            const { ref, get } = await import('firebase/database')
            const { database } = await import('../firebase')
            const agreementRef = ref(database, `users/${user.uid}/agreement`)
            const agreementSnap = await get(agreementRef)
            
            if (agreementSnap.exists()) {
              const agreementData = agreementSnap.val()
              if (agreementData.planDetails && agreementData.planDetails.name) {
                // Create or update currentPlan with agreement data
                data.currentPlan = {
                  id: 'agreement-plan',
                  status: 'active',
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                  plan: agreementData.planDetails.name
                }
                console.log('Updated plan from agreement:', data.currentPlan.plan)
              }
            }
          } catch (e) {
            console.warn('Failed to load plan from agreement:', e)
          }
        }
        
        setDashboardData(data)
        // Load uploads from RTDB
        try {
          const { ref, get } = await import('firebase/database')
          const { database } = await import('../firebase')
          const upSnap = await get(ref(database, `users/${user.uid}/uploads`))
          if (upSnap.exists()) {
            const val = upSnap.val()
            const arr = Array.isArray(val) ? val.filter(Boolean) : Object.values(val || {})
            setUploads(arr as any)
          } else {
            setUploads([])
          }
        } catch (e) {
          console.warn('Failed to load uploads:', e)
        }
      } catch (err: any) {
        console.error('Dashboard fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [navigate])

  // Handle document upload
  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      setUploadError(null)
      const [{ getAuth }, { ref: dbRef, push, set: dbSet }] = await Promise.all([
        import('firebase/auth'),
        import('firebase/database')
      ])
      const app = (await import('../firebase')).default
      const { database } = await import('../firebase')
      const auth = getAuth(app)
      const user = auth.currentUser
      if (!user) throw new Error('Not authenticated')

      // Resolve API base (reuse same logic as other endpoints)
      const envApiBase = import.meta.env.VITE_API_BASE as string | undefined
      const isDev = import.meta.env.MODE === 'development'
      const defaultProdApi = 'https://api.accreditedfs.com'
      const isBrowser = typeof window !== 'undefined'
      const currentOrigin = isBrowser ? window.location.origin : ''
      const onHttpsOrigin = isBrowser && currentOrigin.startsWith('https://')
      const looksLikeLocal = !!envApiBase && /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/.test(envApiBase)
      const resolvedApiBase = envApiBase && !(onHttpsOrigin && looksLikeLocal)
        ? envApiBase
        : (isDev ? '' : defaultProdApi)

      // Upload file to backend (server uploads to Vercel Blob)
      const token = await user.getIdToken()
      const uploadEndpoint = resolvedApiBase
        ? `${resolvedApiBase.replace(/\/$/, '')}/api/upload-blob?filename=${encodeURIComponent(file.name)}`
        : `/api/upload-blob?filename=${encodeURIComponent(file.name)}`
      const putResp = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': file.type || 'application/octet-stream'
        },
        body: file,
        credentials: 'include'
      })
      if (!putResp.ok) {
        let detail = ''
        try {
          const errJson = await putResp.json()
          detail = errJson?.error ? `${errJson.error}${errJson.details ? `: ${errJson.details}` : ''}` : ''
        } catch {}
        throw new Error(detail || 'Upload failed')
      }
      const { url: publicUrl } = await putResp.json()
      if (!publicUrl) throw new Error('Missing public URL after upload')

      const meta = { name: file.name, url: publicUrl, uploadedAt: new Date().toISOString() }
      const nodeRef = dbRef(database, `users/${user.uid}/uploads`)
      const newRef = push(nodeRef)
      await dbSet(newRef, meta)
      // Re-fetch to ensure consistency (covers any rule/latency issues)
      try {
        const { ref: rRef, get } = await import('firebase/database')
        const upSnap = await get(rRef(database, `users/${user.uid}/uploads`))
        if (upSnap.exists()) {
          const val = upSnap.val()
          const arr = Array.isArray(val) ? val.filter(Boolean) : Object.values(val || {})
          setUploads(arr as any)
        } else {
          setUploads([meta])
        }
      } catch {
        setUploads(prev => [meta, ...prev])
      }
    } catch (e: any) {
      setUploadError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }
  const handleUploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files)
    for (const f of arr) {
      // Validate type
      const isAccepted = ACCEPTED_TYPES.some(t => t.endsWith('/') ? (f.type || '').startsWith(t) : (f.type || '') === t)
      if (!isAccepted) {
        setUploadError(`Unsupported file type: ${f.type || 'unknown'}. Allowed: images, PDF, Word, Excel, text.`)
        continue
      }
      // Validate size
      if (f.size > MAX_MB * 1024 * 1024) {
        setUploadError(`File too large: ${(f.size / (1024*1024)).toFixed(1)}MB. Max allowed is ${MAX_MB}MB.`)
        continue
      }
      // sequential uploads to keep UI simple; can be parallelized later
      // swallow individual errors but surface last one
      await handleUpload(f)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-800"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-900"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {dashboardData.user.displayName || dashboardData.user.email.split('@')[0]}!
          </h1>
          <p className="text-gray-600 mt-2">Track your credit repair progress and manage your account</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'agreements', label: 'Agreements', icon: FileText }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === id
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-800" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Credit Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.progress.creditScore.current || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Items Removed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.progress.itemsRemoved}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Disputes Active</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.progress.disputesSubmitted - dashboardData.progress.disputesResolved}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Current Plan</p>
                    <p className="text-lg font-bold text-gray-900">
                      {dashboardData.currentPlan?.plan === 'Unknown Plan' 
                        ? 'Plan Information Loading...' 
                        : dashboardData.currentPlan?.plan || 'No Active Plan'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Plan Status */}
            {dashboardData.currentPlan && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-blue-800">{dashboardData.currentPlan.plan}</p>
                    <p className="text-gray-600">
                      Status: <span className="capitalize">{dashboardData.currentPlan.status}</span>
                    </p>
                    <p className="text-gray-600">
                      Next billing: {formatDate(dashboardData.currentPlan.currentPeriodEnd)}
                    </p>
                  </div>
                  <div className="text-right">
                    <button
                      className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-900 disabled:opacity-50"
                      disabled={portalLoading}
                      onClick={async () => {
                        try {
                          setPortalError(null)
                          setPortalLoading(true)
                          const { getAuth } = await import('firebase/auth')
                          const app = (await import('../firebase')).default
                          const auth = getAuth(app)
                          const user = auth.currentUser
                          if (!user) throw new Error('Not authenticated')
                          const idToken = await user.getIdToken()

                          const envApiBase = import.meta.env.VITE_API_BASE as string | undefined
                          const isDev = import.meta.env.MODE === 'development'
                          const defaultProdApi = 'https://api.accreditedfs.com'
                          const isBrowser = typeof window !== 'undefined'
                          const currentOrigin = isBrowser ? window.location.origin : ''
                          const onHttpsOrigin = isBrowser && currentOrigin.startsWith('https://')
                          const looksLikeLocal = !!envApiBase && /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/.test(envApiBase)
                          const resolvedApiBase = envApiBase && !(onHttpsOrigin && looksLikeLocal)
                            ? envApiBase
                            : (isDev ? '' : defaultProdApi)

                          const endpoint = resolvedApiBase
                            ? `${resolvedApiBase.replace(/\/$/, '')}/api/create-portal-session`
                            : `/api/create-portal-session`
                          const resp = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${idToken}` },
                            credentials: 'include'
                          })
                          if (!resp.ok) {
                            const j = await resp.json().catch(() => ({} as any))
                            const msg = j?.details ? `${j.error || 'Failed to open portal'}: ${j.details}` : (j?.error || 'Failed to open portal')
                            throw new Error(msg)
                          }
                          const { url } = await resp.json()
                          if (url) window.location.href = url
                        } catch (e: any) {
                          setPortalError(e.message || 'Failed to open portal')
                        } finally {
                          setPortalLoading(false)
                        }
                      }}
                    >
                      {portalLoading ? 'Opening…' : 'Manage Plan'}
                    </button>
                  </div>
                </div>
                {portalError && (
                  <p className="text-sm text-red-600 mt-3">{portalError}</p>
                )}
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {dashboardData.paymentHistory.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.paymentHistory.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{payment.description}</p>
                        <p className="text-sm text-gray-600">{formatDate(payment.created)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</p>
                        <p className={`text-sm capitalize ${
                          payment.status === 'succeeded' ? 'text-green-600' : 
                          payment.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {payment.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No recent activity</p>
              )}
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Upcoming Invoices */}
            {dashboardData.upcomingInvoices.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Payments</h3>
                <div className="space-y-3">
                  {dashboardData.upcomingInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Subscription Payment</p>
                        <p className="text-sm text-gray-600">Due: {formatDate(invoice.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(invoice.amount, invoice.currency)}</p>
                        <p className="text-sm text-blue-600 capitalize">{invoice.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment History */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
              {dashboardData.paymentHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.paymentHistory.map((payment) => (
                        <tr key={payment.id} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-gray-900">{formatDate(payment.created)}</td>
                          <td className="py-3 px-4 text-gray-900">{payment.description}</td>
                          <td className="py-3 px-4 text-gray-900">{formatCurrency(payment.amount, payment.currency)}</td>
                          <td className="py-3 px-4">
                            <span className={`capitalize px-2 py-1 rounded-full text-xs ${
                              payment.status === 'succeeded' ? 'bg-green-100 text-green-800' : 
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {payment.receiptUrl && (
                              <a 
                                href={payment.receiptUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No payment history available</p>
              )}
            </div>

            {/* Active Subscriptions */}
            {dashboardData.subscriptions.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Subscriptions</h3>
                <div className="space-y-4">
                  {dashboardData.subscriptions.map((subscription) => (
                    <div key={subscription.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{subscription.plan}</p>
                          <p className="text-sm text-gray-600">
                            Status: <span className="capitalize">{subscription.status}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Period: {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(subscription.amount)}/month</p>
                          <button
                            className="text-sm text-blue-600 hover:text-blue-800 mt-1 disabled:opacity-50"
                            disabled={portalLoading}
                            onClick={async () => {
                              // Reuse the same portal flow
                              const btn = document.querySelector('button') // no-op placeholder to avoid duplication
                              try {
                                setPortalError(null)
                                setPortalLoading(true)
                                const { getAuth } = await import('firebase/auth')
                                const app = (await import('../firebase')).default
                                const auth = getAuth(app)
                                const user = auth.currentUser
                                if (!user) throw new Error('Not authenticated')
                                const idToken = await user.getIdToken()
                                const envApiBase = import.meta.env.VITE_API_BASE as string | undefined
                                const isDev = import.meta.env.MODE === 'development'
                                const defaultProdApi = 'https://api.accreditedfs.com'
                                const isBrowser = typeof window !== 'undefined'
                                const currentOrigin = isBrowser ? window.location.origin : ''
                                const onHttpsOrigin = isBrowser && currentOrigin.startsWith('https://')
                                const looksLikeLocal = !!envApiBase && /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/.test(envApiBase)
                                const resolvedApiBase = envApiBase && !(onHttpsOrigin && looksLikeLocal)
                                  ? envApiBase
                                  : (isDev ? '' : defaultProdApi)
                                const endpoint = resolvedApiBase
                                  ? `${resolvedApiBase.replace(/\/$/, '')}/api/create-portal-session`
                                  : `/api/create-portal-session`
                                const resp = await fetch(endpoint, {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${idToken}` },
                                  credentials: 'include'
                                })
                                if (!resp.ok) {
                                  const j = await resp.json().catch(() => ({} as any))
                                  const msg = j?.details ? `${j.error || 'Failed to open portal'}: ${j.details}` : (j?.error || 'Failed to open portal')
                                  throw new Error(msg)
                                }
                                const { url } = await resp.json()
                                if (url) window.location.href = url
                              } catch (e: any) {
                                setPortalError(e.message || 'Failed to open portal')
                              } finally {
                                setPortalLoading(false)
                              }
                            }}
                          >
                            {portalLoading ? 'Opening…' : 'Manage'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Credit Score Progress */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Score Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Initial Score</p>
                  <p className="text-3xl font-bold text-gray-400">
                    {dashboardData.progress.creditScore.initial || 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Current Score</p>
                  <p className="text-3xl font-bold text-blue-800">
                    {dashboardData.progress.creditScore.current || 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Goal Score</p>
                  <p className="text-3xl font-bold text-green-600">
                    {dashboardData.progress.creditScore.goal || 'N/A'}
                  </p>
                </div>
              </div>
              {dashboardData.progress.creditScore.lastUpdated && (
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Last updated: {formatDate(dashboardData.progress.creditScore.lastUpdated)}
                </p>
              )}
            </div>

            {/* Dispute Progress */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dispute Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-800">{dashboardData.progress.disputesSubmitted}</p>
                  <p className="text-sm text-gray-600">Disputes Submitted</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{dashboardData.progress.disputesResolved}</p>
                  <p className="text-sm text-gray-600">Disputes Resolved</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {dashboardData.progress.disputesSubmitted - dashboardData.progress.disputesResolved}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </div>

            {/* Documents Upload */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
              {uploadError && (
                <div className="mb-3 text-sm text-red-600">{uploadError}</div>
              )}
              <div className="flex items-center space-x-3">
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                  <input
                    type="file"
                    multiple
                    // Allow images and common document types; leaving off accept would allow any file
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      const list = e.target.files
                      if (list && list.length) {
                        handleUploadFiles(list)
                      }
                      e.currentTarget.value = ''
                    }}
                  />
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </label>
                <span className="text-xs text-gray-500">Max {MAX_MB}MB • Images, PDF, Word, Excel, Text</span>
              </div>
              {uploads.length > 0 && (
                <>
                  <div className="mt-2 text-xs text-gray-500">{uploads.length} document{uploads.length === 1 ? '' : 's'}</div>
                  <ul className="mt-2 space-y-2">
                    {(showAllUploads ? uploads : uploads.slice(0, 5)).map((u, idx) => (
                      <li key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate mr-2">{u.name}</span>
                        <a className="text-blue-600 hover:text-blue-800" href={u.url} target="_blank" rel="noreferrer">View</a>
                      </li>
                    ))}
                  </ul>
                  {uploads.length > 5 && (
                    <button
                      onClick={() => setShowAllUploads(!showAllUploads)}
                      className="mt-2 text-sm text-blue-700 hover:text-blue-900"
                    >
                      {showAllUploads ? 'Show less' : `Show all (${uploads.length})`}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Milestones */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestones</h3>
              {(() => {
                const derived = deriveMilestones(dashboardData, uploads)
                // Merge with backend milestones if present
                const raw = (dashboardData.progress as any).milestones
                let merged: Array<any> = []
                if (Array.isArray(raw)) merged = [...raw.filter(Boolean), ...derived]
                else if (raw && typeof raw === 'object') merged = [...Object.values(raw), ...derived]
                else merged = derived
                const unique = new Map<string, any>()
                merged.forEach(m => {
                  const key = m.title
                  if (!unique.has(key) || (m.completed && !unique.get(key)?.completed)) unique.set(key, m)
                })
                const milestonesArr = Array.from(unique.values())
                return milestonesArr.length > 0 ? (
                <div className="space-y-3">
                  {milestonesArr.map((milestone, index) => (
                    <div key={index} className="flex items-center p-3 border border-gray-200 rounded-lg">
                      <div className={`p-2 rounded-full mr-3 ${
                        milestone.completed ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <CheckCircle className={`h-5 w-5 ${
                          milestone.completed ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          milestone.completed ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {milestone.title}
                        </p>
                        {milestone.date && (
                          <p className="text-sm text-gray-500">
                            Completed: {formatDate(milestone.date)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No milestones tracked yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Milestones will appear here as we work on your credit repair
                  </p>
                </div>
              )
              })()}
            </div>
          </div>
        )}

        {/* Agreements Tab */}
        {activeTab === 'agreements' && (
          <div className="space-y-6">
            {/* Signed Agreement */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Service Agreement
              </h3>
              
              {dashboardData.agreement && dashboardData.agreement.agreed ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <p className="text-sm font-medium text-green-800">
                        Agreement Signed and Active
                      </p>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Your service agreement is in effect and covers your selected credit repair plan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Agreement Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Signed Name:</span>
                          <span className="font-medium">{dashboardData.user.displayName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{dashboardData.user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium text-green-600">Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Selected Plan</h4>
                      {dashboardData.currentPlan ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Plan:</span>
                            <span className="font-medium">{dashboardData.currentPlan.plan}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-medium capitalize">{dashboardData.currentPlan.status}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Plan details not available</p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        // Navigate to view full agreement
                        navigate('/agreement-view')
                      }}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Full Agreement
                    </button>
                    
                    <button
                      onClick={() => {
                        // Download agreement functionality
                        window.print()
                      }}
                      className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">No Agreement Found</p>
                  <p className="text-sm text-gray-500 mb-4">
                    You haven't signed a service agreement yet.
                  </p>
                  <button
                    onClick={() => navigate('/agreement')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Sign Agreement
                  </button>
                </div>
              )}
            </div>

            {/* Agreement History */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agreement History</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                  <div className="p-2 rounded-full bg-green-100 mr-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Service Agreement Signed
                    </p>
                    <p className="text-sm text-gray-500">
                      {dashboardData.user.joinDate ? formatDate(dashboardData.user.joinDate) : 'Date not available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard