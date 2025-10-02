import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import app from '../firebase'
import { getAuth, applyActionCode } from 'firebase/auth'
import Toast from '../components/Toast'
import Spinner from '../components/Spinner'

const Verify: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const auth = getAuth(app)
      const oobCode = searchParams.get('oobCode')
      if (!oobCode) {
        setError('Missing verification code')
        setLoading(false)
        return
      }
      try {
        await applyActionCode(auth, oobCode)
        // reload current user state
        if (auth.currentUser) await auth.currentUser.reload()
        setToast('Email verified! Redirecting...')
        setTimeout(() => navigate('/agreement'), 1200)
      } catch (err: any) {
        setError(err.message || 'Verification failed')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {loading ? (
          <div className="flex items-center space-x-3"><Spinner size={20} /><div>Verifying your email…</div></div>
        ) : error ? (
          <div>
            <div className="text-red-600 mb-3">{error}</div>
            <button className="bg-blue-700 text-white px-4 py-2 rounded" onClick={() => navigate('/signup')}>Back to Signup</button>
          </div>
        ) : (
          <div>
            <div className="text-green-700 mb-3">Verification successful.</div>
            <button className="bg-blue-700 text-white px-4 py-2 rounded" onClick={() => navigate('/agreement')}>Continue</button>
          </div>
        )}
        <Toast message={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  )
}

export default Verify
