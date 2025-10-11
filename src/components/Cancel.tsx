import React from 'react'
import { XCircle } from 'lucide-react'

const Cancel: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-2xl bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-center">
            <div className="rounded-full bg-red-100 p-4 inline-flex">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-red-600 text-center mt-6">
            ❌ Payment Canceled
          </h1>

          <p className="mt-4 text-center text-gray-700 max-w-xl mx-auto">
            It looks like the checkout was not completed. No charges were made.
            You can try again anytime or reach out if you need help.
          </p>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">
              If you have questions about our services or your order, please{' '}
              <a href="/contact" className="text-blue-700 underline">
                contact us
              </a>
              .
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="/"
                className="inline-flex items-center justify-center w-full px-5 py-3 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
              >
                Back to Home
              </a>

              <a
                href="/pricing"
                className="inline-flex items-center justify-center w-full px-5 py-3 rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 transition"
              >
                View Pricing Plans
              </a>
            </div>
          </div>

          <p className="mt-6 text-center text-gray-600 text-sm">
            Need immediate assistance? Email <a href="mailto:support@accreditedfs.web.app" className="text-blue-700 underline">support@accreditedfs.web.app</a> and we'll respond quickly.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Cancel