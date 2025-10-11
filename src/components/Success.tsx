import React, { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'

const Success: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('session_id')
    setSessionId(id)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-2xl bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-[#f0d541] p-4 inline-flex">
              <CheckCircle className="h-10 w-10 text-blue-800" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-800 text-center mt-6">
            🎉 Payment Successful
          </h1>

          <p className="mt-4 text-center text-gray-700 max-w-xl mx-auto">
            Thank you for choosing <strong>Accredited Financial Services</strong>.
            We received your payment and will begin onboarding you shortly.
          </p>

          {sessionId && (
            <p className="mt-6 text-sm text-center text-gray-500">
              Payment reference ID: <code className="bg-gray-100 px-2 py-1 rounded">{sessionId}</code>
            </p>
          )}

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="/"
              className="inline-flex items-center justify-center w-full px-5 py-3 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
            >
              Back to Home
            </a>

            <a
              href="/"
              className="inline-flex flex-col items-center justify-center w-full px-5 py-3 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 transition"
            >
              <span className="text-sm">Need help?</span>
              <span className="text-xs text-gray-500">Contact our support team</span>
            </a>
          </div>

          <p className="mt-6 text-center text-gray-600 text-sm">
            One of our specialists will reach out within <strong>24–48 hours</strong> to confirm your onboarding and next steps.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Success