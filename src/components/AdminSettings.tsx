import React, { useEffect, useState } from 'react'
import { ExternalLink, Tag, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

type PromoCode = {
  id: string
  code: string
  active: boolean
  percentOff?: number
  amountOff?: number
  currency?: string
  redeemBy?: number
  maxRedemptions?: number
  timesRedeemed: number
  created: number
}

const AdminSettings: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const fetchPromoCodes = async () => {
    setLoading(true)
    setError(null)
    
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
        ? `${resolvedApiBase.replace(/\/$/, '')}/api/admin-users?action=getPromoCodes`
        : `/api/admin-users?action=getPromoCodes`
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch promo codes')
      }

      const data = await response.json()
      setPromoCodes(data.promoCodes || [])
    } catch (err: any) {
      console.error('Error fetching promo codes:', err)
      setError(err.message || 'Failed to load promo codes')
    } finally {
      setLoading(false)
    }
  }

  const formatDiscount = (code: PromoCode) => {
    if (code.percentOff) {
      return `${code.percentOff}% off`
    }
    if (code.amountOff && code.currency) {
      return `${(code.amountOff / 100).toFixed(2)} ${code.currency.toUpperCase()} off`
    }
    return 'Discount'
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Quick Links Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Links
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://dashboard.stripe.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Stripe Dashboard</p>
                  <p className="text-sm text-gray-500">Manage payments & subscriptions</p>
                </div>
              </div>
              <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
            </a>

            <a
              href="https://dashboard.stripe.com/coupons"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Tag className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Promotion Codes</p>
                  <p className="text-sm text-gray-500">Create & manage promo codes</p>
                </div>
              </div>
              <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
            </a>

            <a
              href="https://dashboard.stripe.com/customers"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Customers</p>
                  <p className="text-sm text-gray-500">View customer details</p>
                </div>
              </div>
              <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
            </a>

            <a
              href="https://dashboard.stripe.com/subscriptions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Subscriptions</p>
                  <p className="text-sm text-gray-500">Manage active subscriptions</p>
                </div>
              </div>
              <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
            </a>
          </div>
        </div>
      </div>

      {/* Promotion Codes Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Active Promotion Codes
            </h3>
            <button
              onClick={fetchPromoCodes}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading && !promoCodes.length ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading promotion codes...</p>
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading promotion codes</h3>
                  <p className="mt-2 text-sm text-red-700">{error}</p>
                  <p className="mt-2 text-sm text-red-600">
                    Note: This feature requires the admin-settings API endpoint. You may need to implement it.
                  </p>
                </div>
              </div>
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">No active promotion codes found</p>
              <a
                href="https://dashboard.stripe.com/coupons"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                Create one in Stripe
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {promoCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 font-mono">
                            {code.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {formatDiscount(code)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {code.timesRedeemed}
                        {code.maxRedemptions && ` / ${code.maxRedemptions}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {code.redeemBy ? formatDate(code.redeemBy) : 'No expiry'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {code.active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(code.created)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            System Information
          </h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Environment</dt>
              <dd className="mt-1 text-sm text-gray-900">{import.meta.env.MODE}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">API Base URL</dt>
              <dd className="mt-1 text-sm text-gray-900 break-all">
                {import.meta.env.VITE_API_BASE || 'https://api.accreditedfs.com'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Firebase Project</dt>
              <dd className="mt-1 text-sm text-gray-900">{import.meta.env.VITE_FIREBASE_PROJECT_ID}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">App Version</dt>
              <dd className="mt-1 text-sm text-gray-900">1.0.0</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
