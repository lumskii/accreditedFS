import React, { useEffect, useState } from 'react'
import { database } from '../firebase'
import { ref, onValue, off } from 'firebase/database'

type DisputeRequest = {
  email: string
  createdAt?: string
  status?: { error?: boolean; message?: string; updatedAt?: string }
}

const AdminDisputes: React.FC = () => {
  const [requests, setRequests] = useState<Record<string, DisputeRequest>>({})
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Dispute Requests</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="space-y-4">
          {Object.keys(requests).length === 0 && <p>No dispute requests yet.</p>}
          {Object.entries(requests).map(([id, req]) => (
            <div key={id} className="p-4 border rounded-lg bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-gray-500">{req.createdAt}</div>
                  <div className="text-lg font-medium">{req.email}</div>
                </div>
                <div className="text-right">
                  {req.status?.error ? (
                    <div className="text-red-600">Error: {req.status?.message}</div>
                  ) : (
                    <div className="text-green-600">Queued / Sent</div>
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

export default AdminDisputes
