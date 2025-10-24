import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  FileText, 
  Shield,
  LogOut,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Edit3,
  Save,
  X
} from 'lucide-react'
import AdminDisputes from '../components/AdminDisputes'
import AdminSettings from '../components/AdminSettings'

interface User {
  uid: string
  email: string
  displayName?: string
  emailVerified: boolean
  joinDate: string
  currentPlan?: any
  progress?: {
    creditScore?: {
      current: number | null
      initial: number | null
      goal: number | null
    }
    disputesSubmitted: number
    disputesResolved: number
    itemsRemoved: number
  }
}

interface PlanChangeRequest {
  userId: string
  userEmail: string
  currentPlan: string
  newPlan: string
  currentPrice: number
  newPrice: number
  paymentMode: string
  status: 'pending' | 'approved' | 'denied'
  requestedAt: string
  reviewedBy?: string
  reviewedAt?: string
  adminComment?: string
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    pendingDisputes: 0
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingProgress, setEditingProgress] = useState(false)
  const [progressForm, setProgressForm] = useState({
    creditScore: { current: '', initial: '', goal: '' },
    disputesSubmitted: '',
    disputesResolved: '',
    itemsRemoved: ''
  })
  const [userUploads, setUserUploads] = useState<Array<{name: string, url: string, uploadedAt?: string}>>([])
  const [deletingUploadKey, setDeletingUploadKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'plan-changes' | 'disputes' | 'settings'>('overview')
  const [planChangeRequests, setPlanChangeRequests] = useState<PlanChangeRequest[]>([])
  const [loadingPlanChanges, setLoadingPlanChanges] = useState(false)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
  
  const navigate = useNavigate()

  useEffect(() => {
    checkAdminAuth()
  }, [])

  useEffect(() => {
    if (activeTab === 'plan-changes') {
      fetchPlanChangeRequests()
    }
  }, [activeTab])

  const checkAdminAuth = async () => {
    try {
      const { getAuth, onAuthStateChanged } = await import('firebase/auth')
      const { ref, get } = await import('firebase/database')
      const { database } = await import('../firebase')
      const app = (await import('../firebase')).default
      const auth = getAuth(app)
      
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          navigate('/admin/login')
          return
        }

        // Check admin role
        const adminRef = ref(database, `users/${user.uid}/roles/admin`)
        const adminSnap = await get(adminRef)
        
        if (!adminSnap.exists() || !adminSnap.val()) {
          navigate('/admin/login')
          return
        }

        // User is authenticated and is admin, now fetch data
        fetchAdminData()
      })
    } catch (error) {
      console.error('Admin auth check failed:', error)
      navigate('/admin/login')
    }
  }

  const fetchAdminData = async () => {
    try {
      const { getAuth } = await import('firebase/auth')
      const { default: app } = await import('../firebase')
      const auth = getAuth(app)
      const user = auth.currentUser

      if (!user) {
        throw new Error('No authenticated user')
      }

      // Get auth token
      const token = await user.getIdToken()
      
      // API endpoint configuration - prefer env var; never use localhost in prod; default to custom API domain
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

      // Add cache busting timestamp
      const timestamp = Date.now();
      const endpoint = resolvedApiBase
        ? `${resolvedApiBase.replace(/\/$/, '')}/api/admin-users?t=${timestamp}`
        : `/api/admin-users?t=${timestamp}`
      
      console.log('Admin API endpoint:', endpoint);
      console.log('Request headers:', {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      // Fetch users data from admin API
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include credentials for CORS
      })

      console.log('Response status:', response.status);
      console.log('Response headers access-control-allow-origin:', response.headers.get('access-control-allow-origin'));

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch admin data')
      }

      const data = await response.json()
      console.log('Admin users data:', data)
      
      setUsers(data.users)
      
      // Calculate stats from the API response
      const totalUsers = data.totalUsers || data.users.length
      const verifiedUsers = data.verifiedUsers || data.users.filter((u: User) => u.emailVerified).length
      const activeSubscriptions = data.users.filter((user: User) => 
        user.currentPlan && user.currentPlan.status === 'active'
      ).length
      
      // Fetch user disputes to calculate pending disputes
      let pendingDisputesCount = 0
      try {
        const { ref, get } = await import('firebase/database')
        const { database } = await import('../firebase')
        const disputesRef = ref(database, 'userDisputes')
        const disputesSnapshot = await get(disputesRef)
        
        if (disputesSnapshot.exists()) {
          const disputes = disputesSnapshot.val()
          // Count disputes that are pending or in-progress
          pendingDisputesCount = Object.values(disputes).filter((dispute: any) => {
            return dispute.status === 'pending' || dispute.status === 'in-progress'
          }).length
        }
      } catch (error) {
        console.error('Error fetching disputes:', error)
      }
      
      // Fetch total revenue from Stripe via analytics endpoint
      let totalRevenue = 0
      try {
        const analyticsEndpoint = resolvedApiBase
          ? `${resolvedApiBase.replace(/\/$/, '')}/api/admin-users?action=getAnalytics`
          : `/api/admin-users?action=getAnalytics`
        
        const analyticsResponse = await fetch(analyticsEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
        
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          totalRevenue = analyticsData.analytics?.totalRevenue || 0
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error)
      }
      
      setStats({
        totalUsers,
        activeSubscriptions,
        totalRevenue,
        pendingDisputes: pendingDisputesCount
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
      setLoading(false)
    }
  }

  const fetchPlanChangeRequests = async () => {
    try {
      setLoadingPlanChanges(true)
      console.log('Fetching plan change requests...')
      
      const { ref, get } = await import('firebase/database')
      const { database } = await import('../firebase')
      
      console.log('Database imported:', database)
      
      const requestsRef = ref(database, 'planChangeRequests')
      console.log('Requests ref created:', requestsRef)
      
      const snapshot = await get(requestsRef)
      console.log('Snapshot exists:', snapshot.exists())
      console.log('Snapshot val:', snapshot.val())
      
      if (!snapshot.exists()) {
        console.log('No plan change requests found in database')
        setPlanChangeRequests([])
        setLoadingPlanChanges(false)
        return
      }

      const requestsData = snapshot.val()
      console.log('Requests data:', requestsData)
      const requests: PlanChangeRequest[] = []

      // Convert Firebase object to array
      for (const [userId, requestData] of Object.entries(requestsData)) {
        const data = requestData as any
        console.log('Processing request for user:', userId, data)
        requests.push({
          userId,
          userEmail: data.userEmail || 'Unknown',
          currentPlan: data.currentPlan || 'N/A',
          newPlan: data.newPlan || 'N/A',
          currentPrice: data.currentPrice || 0,
          newPrice: data.newPrice || 0,
          paymentMode: data.paymentMode || 'monthly',
          status: data.status || 'pending',
          requestedAt: data.requestedAt || new Date().toISOString(),
          reviewedBy: data.reviewedBy,
          reviewedAt: data.reviewedAt,
          adminComment: data.adminComment
        })
      }

      // Sort by requested date, newest first
      requests.sort((a, b) => 
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      )

      console.log('Processed requests:', requests)
      setPlanChangeRequests(requests)
      setLoadingPlanChanges(false)
    } catch (error) {
      console.error('Failed to fetch plan change requests:', error)
      alert(`Error loading plan change requests: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setLoadingPlanChanges(false)
    }
  }

  const handlePlanChangeAction = async (userId: string, action: 'approve' | 'deny', adminComment?: string) => {
    try {
      setProcessingRequestId(userId)

      const { getAuth } = await import('firebase/auth')
      const { default: app } = await import('../firebase')
      const auth = getAuth(app)
      const user = auth.currentUser

      if (!user) {
        throw new Error('No authenticated user')
      }

      const token = await user.getIdToken()
      
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
        ? `${resolvedApiBase.replace(/\/$/, '')}/api/admin-users`
        : `/api/admin-users`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          action,
          adminComment
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process plan change request')
      }

      // Refresh plan change requests after successful action
      await fetchPlanChangeRequests()
      
      setProcessingRequestId(null)
    } catch (error) {
      console.error('Failed to process plan change request:', error)
      alert(`Failed to ${action} plan change: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setProcessingRequestId(null)
    }
  }

  const handleLogout = async () => {
    try {
      const { getAuth, signOut } = await import('firebase/auth')
      const app = (await import('../firebase')).default
      const auth = getAuth(app)
      await signOut(auth)
      navigate('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const openUserEdit = (user: User) => {
    setSelectedUser(user)
    setProgressForm({
      creditScore: {
        current: user.progress?.creditScore?.current?.toString() || '',
        initial: user.progress?.creditScore?.initial?.toString() || '',
        goal: user.progress?.creditScore?.goal?.toString() || ''
      },
      disputesSubmitted: user.progress?.disputesSubmitted?.toString() || '0',
      disputesResolved: user.progress?.disputesResolved?.toString() || '0',
      itemsRemoved: user.progress?.itemsRemoved?.toString() || '0'
    })
    setEditingProgress(true)
    // Load uploads for this user
    ;(async () => {
      try {
        const { ref, get } = await import('firebase/database')
        const { database } = await import('../firebase')
        const snap = await get(ref(database, `users/${user.uid}/uploads`))
        if (snap.exists()) {
          const val = snap.val() as any
          // keep keys alongside values for deletion
          const arr = Array.isArray(val)
            ? (val.map((v: any, idx: number) => ({ key: String(idx), ...(v || {}) })).filter((v: any) => !!v.name && !!v.url))
            : Object.entries(val || {}).map(([k, v]: any) => ({ key: k, ...(v || {}) }))
          setUserUploads(arr as any)
        } else {
          setUserUploads([])
        }
      } catch (e) {
        console.warn('Failed to load user uploads:', e)
        setUserUploads([])
      }
    })()
  }

  const deleteUserUpload = async (item: any) => {
    if (!selectedUser) return
    try {
      setDeletingUploadKey(item.key)
      const { getAuth } = await import('firebase/auth')
      const app = (await import('../firebase')).default
      const auth = getAuth(app)
      const current = auth.currentUser
      if (!current) throw new Error('Not authenticated')
      const idToken = await current.getIdToken()

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
        ? `${resolvedApiBase.replace(/\/$/, '')}/api/delete-upload`
        : `/api/delete-upload`

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ userId: selectedUser.uid, uploadKey: item.key, url: item.url })
      })
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}))
        throw new Error(j?.error || 'Delete failed')
      }
      setUserUploads(prev => prev.filter((u: any) => u.key !== item.key))
    } catch (e) {
      console.error('Delete upload failed:', e)
      alert((e as any).message || 'Failed to delete')
    } finally {
      setDeletingUploadKey(null)
    }
  }

  const saveUserProgress = async () => {
    if (!selectedUser) return
    
    try {
      const { getAuth } = await import('firebase/auth')
      const app = (await import('../firebase')).default
      const auth = getAuth(app)
      const user = auth.currentUser
      
      if (!user) return
      
      const idToken = await user.getIdToken()
      
      const progressUpdate = {
        creditScore: {
          current: progressForm.creditScore.current ? parseInt(progressForm.creditScore.current) : null,
          initial: progressForm.creditScore.initial ? parseInt(progressForm.creditScore.initial) : null,
          goal: progressForm.creditScore.goal ? parseInt(progressForm.creditScore.goal) : null,
          lastUpdated: new Date().toISOString()
        },
        disputesSubmitted: parseInt(progressForm.disputesSubmitted) || 0,
        disputesResolved: parseInt(progressForm.disputesResolved) || 0,
        itemsRemoved: parseInt(progressForm.itemsRemoved) || 0
      }
      
      const envApiBase2 = import.meta.env.VITE_API_BASE as string | undefined
      const isDev2 = import.meta.env.MODE === 'development'
      const defaultProdApi2 = 'https://api.accreditedfs.com'
      const isBrowser2 = typeof window !== 'undefined'
      const currentOrigin2 = isBrowser2 ? window.location.origin : ''
      const onHttpsOrigin2 = isBrowser2 && currentOrigin2.startsWith('https://')
      const looksLikeLocal2 = !!envApiBase2 && /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/.test(envApiBase2)
      const resolvedApiBase2 = envApiBase2 && !(onHttpsOrigin2 && looksLikeLocal2)
        ? envApiBase2
        : (isDev2 ? '' : defaultProdApi2)
      const updEndpoint = resolvedApiBase2
        ? `${resolvedApiBase2.replace(/\/$/, '')}/api/update-progress`
        : `/api/update-progress`
      const response = await fetch(updEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          userId: selectedUser.uid,
          progressUpdate
        })
      })
      
      if (response.ok) {
        setEditingProgress(false)
        setSelectedUser(null)
        fetchAdminData() // Refresh data
      } else {
        const errorData = await response.json()
        console.error('Failed to update progress:', errorData)
      }
    } catch (error) {
      console.error('Failed to save user progress:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-800"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-800 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-800 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: TrendingUp },
              { key: 'users', label: 'Users', icon: Users },
              { key: 'plan-changes', label: 'Plan Changes', icon: CreditCard },
              { key: 'disputes', label: 'Disputes', icon: FileText },
              { key: 'settings', label: 'Settings', icon: Settings }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? 'border-blue-800 text-blue-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Subscriptions</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.activeSubscriptions}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(stats.totalRevenue / 100)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Clock className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Disputes</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.pendingDisputes}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Users</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.slice(0, 5).map((user) => (
                        <tr key={user.uid}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.displayName || user.email || `User ${user.uid.substring(0, 8)}...`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email || 'No email available'}
                              </div>
                              <div className="text-xs text-gray-400">
                                ID: {user.uid.substring(0, 8)}...
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.currentPlan 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.currentPlan?.name || 'No Plan'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.progress?.creditScore?.current || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openUserEdit(user)}
                              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            >
                              <Edit3 className="h-4 w-4" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">All Users</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.uid}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName || user.email || `User ${user.uid.substring(0, 8)}...`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email || 'No email available'}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {user.uid.substring(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.emailVerified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.emailVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.currentPlan 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.currentPlan?.name || 'No Plan'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-xs">
                            <div>Credit: {user.progress?.creditScore?.current || 'N/A'}</div>
                            <div>Disputes: {user.progress?.disputesResolved || 0}/{user.progress?.disputesSubmitted || 0}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openUserEdit(user)}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          >
                            <Edit3 className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Plan Changes Tab */}
        {activeTab === 'plan-changes' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Plan Change Requests</h3>
                <button
                  onClick={fetchPlanChangeRequests}
                  disabled={loadingPlanChanges}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {loadingPlanChanges ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {loadingPlanChanges ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
                </div>
              ) : planChangeRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p>No plan change requests</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requested Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price Change
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Requested
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {planChangeRequests.map((request) => (
                        <tr key={request.userId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{request.userEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{request.currentPlan}</div>
                            <div className="text-xs text-gray-500">${(request.currentPrice / 100).toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{request.newPlan}</div>
                            <div className="text-xs text-gray-500">
                              ${(request.newPrice / 100).toFixed(2)}
                              {' '}({request.paymentMode === 'full' ? 'Full Payment' : 'Monthly'})
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              request.newPrice > request.currentPrice 
                                ? 'text-green-600' 
                                : request.newPrice < request.currentPrice
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}>
                              {request.newPrice > request.currentPrice ? '+' : ''}
                              ${((request.newPrice - request.currentPrice) / 100).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {request.status === 'pending' ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    const comment = prompt('Optional admin comment:')
                                    if (comment !== null) {
                                      handlePlanChangeAction(request.userId, 'approve', comment || undefined)
                                    }
                                  }}
                                  disabled={processingRequestId === request.userId}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const comment = prompt('Reason for denial (optional):')
                                    if (comment !== null) {
                                      handlePlanChangeAction(request.userId, 'deny', comment || undefined)
                                    }
                                  }}
                                  disabled={processingRequestId === request.userId}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">
                                {request.reviewedBy && (
                                  <div>By: {request.reviewedBy}</div>
                                )}
                                {request.adminComment && (
                                  <div className="mt-1 italic">{request.adminComment}</div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <AdminDisputes />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <AdminSettings />
        )}
      </div>

      {/* Edit User Modal */}
      {editingProgress && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Progress for {selectedUser.displayName || selectedUser.email}
                </h3>
                <button
                  onClick={() => setEditingProgress(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* User uploads preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Documents</label>
                  {userUploads.length > 0 ? (
                    <ul className="space-y-2 max-h-40 overflow-auto border rounded-md p-2">
                      {userUploads.map((u: any) => (
                        <li key={u.key} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 truncate mr-2">{u.name}</span>
                          <div className="flex items-center space-x-3">
                            <a className="text-blue-600 hover:text-blue-800" href={u.url} target="_blank" rel="noreferrer">View</a>
                            <button
                              onClick={() => deleteUserUpload(u)}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              disabled={deletingUploadKey === u.key}
                            >
                              {deletingUploadKey === u.key ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No documents uploaded</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Scores</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Current"
                      value={progressForm.creditScore.current}
                      onChange={(e) => setProgressForm(prev => ({
                        ...prev,
                        creditScore: { ...prev.creditScore, current: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Initial"
                      value={progressForm.creditScore.initial}
                      onChange={(e) => setProgressForm(prev => ({
                        ...prev,
                        creditScore: { ...prev.creditScore, initial: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Goal"
                      value={progressForm.creditScore.goal}
                      onChange={(e) => setProgressForm(prev => ({
                        ...prev,
                        creditScore: { ...prev.creditScore, goal: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disputes Submitted</label>
                  <input
                    type="number"
                    value={progressForm.disputesSubmitted}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, disputesSubmitted: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disputes Resolved</label>
                  <input
                    type="number"
                    value={progressForm.disputesResolved}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, disputesResolved: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Items Removed</label>
                  <input
                    type="number"
                    value={progressForm.itemsRemoved}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, itemsRemoved: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={saveUserProgress}
                    className="flex-1 bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-900 flex items-center justify-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => setEditingProgress(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard