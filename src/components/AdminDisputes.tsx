import React, { useEffect, useState, useMemo } from 'react'
import { database } from '../firebase'
import { ref, onValue, update } from 'firebase/database'
import { Filter, Clock, CheckCircle, AlertCircle, Play, Search, MessageSquare, User, Save, X } from 'lucide-react'

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
          <div className="flex items-center text-sm text-gray-500">
            <Filter className="w-4 h-4 mr-1" />
            Filter by status
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
