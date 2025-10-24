import React, { useState, useEffect } from 'react'
import { FileText, Clock, CheckCircle, AlertCircle, X } from 'lucide-react'
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database'
import { database } from '../firebase'
import { getAuth } from 'firebase/auth'

type DisputeStatus = 'pending' | 'in-progress' | 'resolved' | 'rejected'

type UserDispute = {
  id: string
  userId: string
  userEmail: string
  creditorName: string
  accountNumber: string
  disputeReason: string
  bureau: string[]
  status: DisputeStatus
  createdAt: string
  resolvedAt?: string
  adminNotes?: string
  userNotes?: string
}

const UserDisputes: React.FC = () => {
  const [disputes, setDisputes] = useState<UserDispute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) {
      setLoading(false)
      return
    }

    const disputesRef = ref(database, 'userDisputes')
    const userDisputesQuery = query(disputesRef, orderByChild('userId'), equalTo(user.uid))
    
    const listener = onValue(userDisputesQuery, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const disputesList = Object.entries(data).map(([id, dispute]: [string, any]) => ({
          id,
          ...dispute
        }))
        setDisputes(disputesList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ))
      } else {
        setDisputes([])
      }
      setLoading(false)
    }, (error) => {
      console.error('Error fetching disputes:', error)
      setError('Failed to load disputes')
      setLoading(false)
    })

    return () => listener()
  }, [])

  const getStatusIcon = (status: DisputeStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'in-progress':
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusBadge = (status: DisputeStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Disputes</h2>
        <p className="text-gray-600 mt-1">View disputes that our team is handling on your behalf</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Disputes Yet</h3>
          <p className="text-gray-600">
            Our team will create and manage disputes on your behalf. They will appear here once initiated.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(dispute.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{dispute.creditorName}</h3>
                    <p className="text-sm text-gray-600">Account: {dispute.accountNumber}</p>
                  </div>
                </div>
                {getStatusBadge(dispute.status)}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Reason:</p>
                  <p className="text-gray-600">{dispute.disputeReason}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Bureau(s):</p>
                  <div className="flex gap-2 mt-1">
                    {dispute.bureau.map((b) => (
                      <span key={b} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                {dispute.userNotes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Your Notes:</p>
                    <p className="text-gray-600 text-sm">{dispute.userNotes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                  <span>Submitted: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                  {dispute.resolvedAt && (
                    <span>Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserDisputes
