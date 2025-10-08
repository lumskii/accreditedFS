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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'disputes' | 'settings'>('overview')
  
  const navigate = useNavigate()

  useEffect(() => {
    checkAdminAuth()
  }, [])

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
      
      // API endpoint configuration - use environment variable or fallback
      const isDev = import.meta.env.DEV;
      const apiBase = import.meta.env.VITE_API_BASE || 
        (isDev 
          ? '' // Use relative URL for proxy in dev
          : 'https://accredited-8w89sev1g-mikes-projects-eb8d5010.vercel.app'); // Use latest working deployment
      
      // Add cache busting timestamp
      const timestamp = Date.now();
      const endpoint = `${apiBase}/api/admin-users?t=${timestamp}`;
      
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
      
      setStats({
        totalUsers,
        activeSubscriptions,
        totalRevenue: 0, // You can calculate this from payment data
        pendingDisputes: 0 // You can calculate this from dispute data
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
      setLoading(false)
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
      
      const apiBase = import.meta.env.VITE_API_BASE || "https://accredited-8w89sev1g-mikes-projects-eb8d5010.vercel.app"
      const response = await fetch(`${apiBase}/api/update-progress`, {
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
                        <dd className="text-lg font-medium text-gray-900">${stats.totalRevenue}</dd>
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

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <AdminDisputes />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Admin Settings</h3>
              <p className="text-gray-600">Settings panel coming soon...</p>
            </div>
          </div>
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