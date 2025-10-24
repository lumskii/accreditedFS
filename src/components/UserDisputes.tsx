import React, { useState, useEffect } from 'react'
import { FileText, Plus, Clock, CheckCircle, AlertCircle, X } from 'lucide-react'
import { ref, push, set, onValue, query, orderByChild, equalTo } from 'firebase/database'
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
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    creditorName: '',
    accountNumber: '',
    disputeReason: '',
    bureau: [] as string[],
    userNotes: ''
  })

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

  const handleBureauToggle = (bureau: string) => {
    setFormData(prev => ({
      ...prev,
      bureau: prev.bureau.includes(bureau)
        ? prev.bureau.filter(b => b !== bureau)
        : [...prev.bureau, bureau]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.creditorName || !formData.accountNumber || !formData.disputeReason || formData.bureau.length === 0) {
      setError('Please fill in all required fields')
      return
    }

    const auth = getAuth()
    const user = auth.currentUser
    if (!user) {
      setError('You must be logged in to submit a dispute')
      return
    }

    setSubmitting(true)
    try {
      const disputesRef = ref(database, 'userDisputes')
      const newDisputeRef = push(disputesRef)
      
      await set(newDisputeRef, {
        userId: user.uid,
        userEmail: user.email,
        creditorName: formData.creditorName.trim(),
        accountNumber: formData.accountNumber.trim(),
        disputeReason: formData.disputeReason.trim(),
        bureau: formData.bureau,
        status: 'pending',
        createdAt: new Date().toISOString(),
        userNotes: formData.userNotes.trim() || ''
      })

      // Reset form
      setFormData({
        creditorName: '',
        accountNumber: '',
        disputeReason: '',
        bureau: [],
        userNotes: ''
      })
      setShowForm(false)
    } catch (err) {
      console.error('Error submitting dispute:', err)
      setError('Failed to submit dispute. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Disputes</h2>
          <p className="text-gray-600 mt-1">Track and manage your credit report disputes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Dispute
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* New Dispute Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Submit New Dispute</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Creditor Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Creditor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.creditorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, creditorName: e.target.value }))}
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
                    value={formData.accountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
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
                    value={formData.disputeReason}
                    onChange={(e) => setFormData(prev => ({ ...prev, disputeReason: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Describe why you're disputing this item (e.g., 'Not my account', 'Already paid', 'Incorrect balance', etc.)"
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
                          checked={formData.bureau.includes(bureau)}
                          onChange={() => handleBureauToggle(bureau)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-gray-700">{bureau}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={formData.userNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, userNotes: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any additional information you'd like to provide"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Dispute'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Disputes Yet</h3>
          <p className="text-gray-600 mb-6">
            Start by submitting a dispute for any inaccurate items on your credit report.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Submit Your First Dispute
          </button>
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

                {dispute.adminNotes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900">Admin Notes:</p>
                    <p className="text-blue-800 text-sm mt-1">{dispute.adminNotes}</p>
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
