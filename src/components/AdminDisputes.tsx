import React, { useEffect, useState, useMemo } from 'react'
import { database } from '../firebase'
import { ref, onValue, off } from 'firebase/database'
import { Filter, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react'

type DisputeStatus = 'all' | 'pending' | 'in-progress' | 'resolved' | 'error'

type DisputeRequest = {
  email: string
  createdAt?: string
  status?: { 
    error?: boolean
    message?: string
    updatedAt?: string
    state?: 'pending' | 'in-progress' | 'resolved' // New field for tracking dispute state
  }
}

const AdminDisputes: React.FC = () => {
  const [requests, setRequests] = useState<Record<string, DisputeRequest>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<DisputeStatus>('all')

  useEffect(() => {
    const requestsRef = ref(database, 'disputeRequests')
    const listener = onValue(requestsRef, (snapshot) => {
      const val = snapshot.val() || {}
      setRequests(val)
      setLoading(false)
    })

    return () => {
      off(requestsRef)
    }
  }, [])

  // Get dispute status based on data
  const getDisputeStatus = (dispute: DisputeRequest): DisputeStatus => {
    if (dispute.status?.error) return 'error'
    if (dispute.status?.state) return dispute.status.state
    // Default to pending if no specific state
    return 'pending'
  }

  // Filter disputes based on selected status
  const filteredRequests = useMemo(() => {
    const entries = Object.entries(requests)
    
    if (statusFilter === 'all') {
      return entries
    }
    
    return entries.filter(([_, dispute]) => {
      const status = getDisputeStatus(dispute)
      return status === statusFilter
    })
  }, [requests, statusFilter])

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
              {statusFilter === 'all' 
                ? 'No dispute requests yet.' 
                : `No ${statusFilter} disputes found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map(([id, req]) => {
              const status = getDisputeStatus(req)
              return (
                <div
                  key={id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-base font-medium text-gray-900">
                          {req.email}
                        </h4>
                        {getStatusBadge(status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span>Submitted: </span>
                        <span className="font-medium">
                          {req.createdAt 
                            ? new Date(req.createdAt).toLocaleString()
                            : 'Unknown date'}
                        </span>
                      </div>
                      {req.status?.message && (
                        <div className={`mt-2 text-sm ${
                          req.status.error ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {req.status.message}
                        </div>
                      )}
                      {req.status?.updatedAt && (
                        <div className="mt-1 text-xs text-gray-400">
                          Last updated: {new Date(req.status.updatedAt).toLocaleString()}
                        </div>
                      )}
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
