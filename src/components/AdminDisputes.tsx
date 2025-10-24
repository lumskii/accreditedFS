import React, { useEffect, useState, useMemo } from 'react'
import { database } from '../firebase'
import { ref, onValue, update, push, set, get } from 'firebase/database'
import { Filter, Clock, CheckCircle, AlertCircle, Play, Search, MessageSquare, User, Save, X, Plus } from 'lucide-react'

type DisputeStatus = 'all' | 'pending' | 'in-progress' | 'resolved' | 'error'

type DisputeRequest = {
  userId: string
  userEmail: string
  creditorName: string
  accountNumber: string
  disputeReason: string
  bureau: string[]
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected'
  createdAt: string
  resolvedAt?: string
  adminNotes?: string
  userNotes?: string
}

type UserPlan = {
  name: string
  mode: string
  status: string
} | null

const AdminDisputes: React.FC = () => {
  const [requests, setRequests] = useState<Record<string, DisputeRequest>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<DisputeStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [userPlans, setUserPlans] = useState<Record<string, UserPlan>>({})
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [users, setUsers] = useState<Array<{uid: string, email: string, displayName?: string}>>([])
  const [createFormData, setCreateFormData] = useState({
    userId: '',
    userEmail: '',
    creditorName: '',
    accountNumber: '',
    disputeReason: '',
    bureau: [] as string[],
    adminNotes: ''
  })

  useEffect(() => {
    console.log('=== AdminDisputes component mounted ===')
    console.log('Database object:', database)
    
    const requestsRef = ref(database, 'userDisputes')
    console.log('Created ref for userDisputes:', requestsRef)
    
    const listener = onValue(
      requestsRef, 
      (snapshot) => {
        console.log('=== Firebase snapshot received ===')
        console.log('Snapshot exists:', snapshot.exists())
        
        const val = snapshot.val() || {}
        console.log('Dispute requests data:', val)
        console.log('Number of disputes:', Object.keys(val).length)
        
        // Log structure of first dispute for debugging
        const firstDispute = Object.values(val)[0] as any
        if (firstDispute) {
          console.log('Sample dispute structure:', firstDispute)
          console.log('Sample dispute keys:', Object.keys(firstDispute))
        }
        
        setRequests(val)
        
        // Fetch user plans for disputes that have userId
        fetchUserPlans(val)
        
        setLoading(false)
        console.log('Loading set to false')
      },
      (error) => {
        console.error('=== Error loading disputes ===')
        console.error('Error details:', error)
        setLoading(false)
      }
    )

    return () => {
      console.log('=== AdminDisputes component unmounting ===')
      listener()
    }
  }, [])

  // Fetch users list for create dispute form
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { getAuth } = await import('firebase/auth')
        const { default: app } = await import('../firebase')
        const auth = getAuth(app)
        const user = auth.currentUser

        if (!user) {
          console.error('No authenticated user')
          return
        }

        // Get auth token
        const token = await user.getIdToken()
        
        // API endpoint configuration
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
        
        // Fetch users data from admin API
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }

        const data = await response.json()
        const usersList = data.users.map((u: any) => ({
          uid: u.uid,
          email: u.email || 'No email',
          displayName: u.displayName || ''
        }))
        setUsers(usersList)
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }
    fetchUsers()
  }, [])

  const fetchUserPlans = async (disputes: Record<string, DisputeRequest>) => {
    const plans: Record<string, UserPlan> = {}
    
    for (const [id, dispute] of Object.entries(disputes)) {
      if (dispute.userId) {
        try {
          const { ref: dbRef, get } = await import('firebase/database')
          const userRef = dbRef(database, `users/${dispute.userId}`)
          const snapshot = await get(userRef)
          
          if (snapshot.exists()) {
            const userData = snapshot.val()
            const flow = userData.flow || {}
            
            if (flow.plan) {
              plans[id] = {
                name: flow.plan,
                mode: flow.mode || 'unknown',
                status: 'active'
              }
            } else if (userData.currentPlan) {
              plans[id] = userData.currentPlan
            }
          }
        } catch (error) {
          console.error(`Error fetching plan for user ${dispute.userId}:`, error)
        }
      }
    }
    
    setUserPlans(plans)
  }

  const handleSaveNote = async (disputeId: string) => {
    setSavingNote(true)
    try {
      const disputeRef = ref(database, `userDisputes/${disputeId}`)
      await update(disputeRef, {
        adminNotes: noteText
      })
      
      setEditingNoteId(null)
      setNoteText('')
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleStatusChange = async (disputeId: string, newStatus: 'pending' | 'in-progress' | 'resolved' | 'rejected') => {
    try {
      const disputeRef = ref(database, `userDisputes/${disputeId}`)
      const updates: any = { status: newStatus }
      
      if (newStatus === 'resolved') {
        updates.resolvedAt = new Date().toISOString()
      }
      
      await update(disputeRef, updates)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!createFormData.userId || !createFormData.creditorName || !createFormData.accountNumber || 
        !createFormData.disputeReason || createFormData.bureau.length === 0) {
      alert('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      const disputesRef = ref(database, 'userDisputes')
      const newDisputeRef = push(disputesRef)
      
      await set(newDisputeRef, {
        userId: createFormData.userId,
        userEmail: createFormData.userEmail,
        creditorName: createFormData.creditorName.trim(),
        accountNumber: createFormData.accountNumber.trim(),
        disputeReason: createFormData.disputeReason.trim(),
        bureau: createFormData.bureau,
        status: 'pending',
        createdAt: new Date().toISOString(),
        adminNotes: createFormData.adminNotes.trim() || ''
      })

      // Reset form
      setCreateFormData({
        userId: '',
        userEmail: '',
        creditorName: '',
        accountNumber: '',
        disputeReason: '',
        bureau: [],
        adminNotes: ''
      })
      setShowCreateForm(false)
      alert('Dispute created successfully!')
    } catch (error) {
      console.error('Error creating dispute:', error)
      alert('Failed to create dispute')
    } finally {
      setCreating(false)
    }
  }

  const handleBureauToggle = (bureau: string) => {
    setCreateFormData(prev => ({
      ...prev,
      bureau: prev.bureau.includes(bureau)
        ? prev.bureau.filter(b => b !== bureau)
        : [...prev.bureau, bureau]
    }))
  }

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.uid === userId)
    setCreateFormData(prev => ({
      ...prev,
      userId,
      userEmail: user?.email || ''
    }))
  }

  const startEditingNote = (disputeId: string, currentNote?: string) => {
    setEditingNoteId(disputeId)
    setNoteText(currentNote || '')
  }

  const cancelEditingNote = () => {
    setEditingNoteId(null)
    setNoteText('')
  }

  // Get dispute status - now directly from the status field
  const getDisputeStatus = (dispute: DisputeRequest): DisputeStatus => {
    if (dispute.status === 'rejected') return 'error'
    return dispute.status || 'pending'
  }

  // Filter disputes based on selected status and search query
  const filteredRequests = useMemo(() => {
    let entries = Object.entries(requests)
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      entries = entries.filter(([_, dispute]) => 
        dispute.userEmail.toLowerCase().includes(query) ||
        dispute.creditorName.toLowerCase().includes(query) ||
        dispute.accountNumber.toLowerCase().includes(query)
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      entries = entries.filter(([_, dispute]) => {
        const status = getDisputeStatus(dispute)
        return status === statusFilter
      })
    }
    
    return entries
  }, [requests, statusFilter, searchQuery])

  // Count disputes by status
  const statusCounts = useMemo(() => {
    const counts = {
      all: Object.keys(requests).length,
      pending: 0,
      'in-progress': 0,
      resolved: 0,
      error: 0
    }
    
    Object.values(requests).forEach(dispute => {
      const status = getDisputeStatus(dispute)
      counts[status]++
    })
    
    return counts
  }, [requests])

  // Get badge color based on status
  const getStatusBadge = (status: DisputeStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Play className="w-3 h-3 mr-1" />
            In Progress
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolved
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Dispute Requests
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Dispute
            </button>
            <div className="flex items-center text-sm text-gray-500">
              <Filter className="w-4 h-4 mr-1" />
              Filter by status
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Create Dispute Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Create New Dispute</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateDispute} className="space-y-4">
                  {/* User Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select User <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={createFormData.userId}
                      onChange={(e) => handleUserSelect(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a user...</option>
                      {users.map((user) => (
                        <option key={user.uid} value={user.uid}>
                          {user.displayName ? `${user.displayName} (${user.email})` : user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Creditor Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Creditor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createFormData.creditorName}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, creditorName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Capital One, Experian, etc."
                      required
                    />
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createFormData.accountNumber}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Last 4 digits or full account number"
                      required
                    />
                  </div>

                  {/* Dispute Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Dispute <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={createFormData.disputeReason}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, disputeReason: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Describe the reason for disputing this item"
                      required
                    />
                  </div>

                  {/* Credit Bureaus */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credit Bureau(s) <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {['Equifax', 'Experian', 'TransUnion'].map((bureau) => (
                        <label key={bureau} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={createFormData.bureau.includes(bureau)}
                            onChange={() => handleBureauToggle(bureau)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-gray-700">{bureau}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      value={createFormData.adminNotes}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, adminNotes: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add any internal notes about this dispute"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={creating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={creating}
                    >
                      {creating ? 'Creating...' : 'Create Dispute'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({statusCounts.pending})
          </button>
          <button
            onClick={() => setStatusFilter('in-progress')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'in-progress'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            In Progress ({statusCounts['in-progress']})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'resolved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Resolved ({statusCounts.resolved})
          </button>
          <button
            onClick={() => setStatusFilter('error')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Error ({statusCounts.error})
          </button>
        </div>

        {/* Disputes List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading disputes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">
              {searchQuery.trim() 
                ? `No disputes found matching "${searchQuery}"`
                : statusFilter === 'all' 
                  ? 'No dispute requests yet.' 
                  : `No ${statusFilter} disputes found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map(([id, req]) => {
              const status = getDisputeStatus(req)
              const userPlan = userPlans[id]
              const isEditingThis = editingNoteId === id
              
              return (
                <div
                  key={id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base font-medium text-gray-900">
                            {req.creditorName}
                          </h4>
                          {getStatusBadge(status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="text-gray-500">User: </span>
                            <span className="font-medium">{req.userEmail}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Account: </span>
                            <span className="font-medium">{req.accountNumber}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Bureau(s): </span>
                            <span className="font-medium">{req.bureau.join(', ')}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Submitted: </span>
                            <span className="font-medium">
                              {new Date(req.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dispute Reason */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Dispute Reason:</p>
                      <p className="text-sm text-gray-900">{req.disputeReason}</p>
                    </div>

                    {/* User Notes */}
                    {req.userNotes && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-900 mb-1">User Notes:</p>
                        <p className="text-sm text-blue-800">{req.userNotes}</p>
                      </div>
                    )}

                    {/* User Plan Info */}
                    {userPlan && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                        <User className="w-4 h-4 text-gray-500" />
                        <div className="text-sm">
                          <span className="text-gray-600">Current Plan: </span>
                          <span className="font-medium text-gray-900 capitalize">
                            {userPlan.name}
                          </span>
                          <span className="text-gray-500 ml-2">
                            ({userPlan.mode})
                          </span>
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                            userPlan.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {userPlan.status}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Resolved Date */}
                    {req.resolvedAt && (
                      <div className="text-xs text-gray-500">
                        Resolved: {new Date(req.resolvedAt).toLocaleString()}
                      </div>
                    )}

                    {/* Admin Notes Section */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Admin Notes</span>
                      </div>
                      
                      {isEditingThis ? (
                        <div className="space-y-2">
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            rows={3}
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add notes about this dispute..."
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveNote(id)}
                              disabled={savingNote}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              {savingNote ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEditingNote}
                              disabled={savingNote}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {req.adminNotes ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-gray-700">
                              {req.adminNotes}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No notes yet</p>
                          )}
                          <button
                            onClick={() => startEditingNote(id, req.adminNotes)}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {req.adminNotes ? 'Edit Notes' : 'Add Notes'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Status Change Section */}
                    <div className="pt-3 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Update Status
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(id, 'pending')}
                          disabled={req.status === 'pending'}
                          className={`px-3 py-1.5 text-xs font-medium rounded ${
                            req.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-yellow-100 hover:text-yellow-800'
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => handleStatusChange(id, 'in-progress')}
                          disabled={req.status === 'in-progress'}
                          className={`px-3 py-1.5 text-xs font-medium rounded ${
                            req.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-800'
                          }`}
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => handleStatusChange(id, 'resolved')}
                          disabled={req.status === 'resolved'}
                          className={`px-3 py-1.5 text-xs font-medium rounded ${
                            req.status === 'resolved'
                              ? 'bg-green-100 text-green-800 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800'
                          }`}
                        >
                          Resolved
                        </button>
                        <button
                          onClick={() => handleStatusChange(id, 'rejected')}
                          disabled={req.status === 'rejected'}
                          className={`px-3 py-1.5 text-xs font-medium rounded ${
                            req.status === 'rejected'
                              ? 'bg-red-100 text-red-800 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-800'
                          }`}
                        >
                          Rejected
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDisputes
