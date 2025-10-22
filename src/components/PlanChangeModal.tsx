import React, { useState, useEffect } from 'react'
import { 
  X, 
  Check, 
  ArrowRight, 
  ArrowDown, 
  ArrowUp, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react'

interface PlanOption {
  id: string
  name: string
  description: string
  fullPrice: number
  monthlyPrice: number
  setupFee: number
  features: string[]
  recommended?: boolean
}

interface CurrentPlan {
  id: string
  name: string
  billingCycle: 'monthly' | 'yearly' | 'one-time'
  status: string
  nextBilling?: string
  amount: number
}

interface PlanChangeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: CurrentPlan
  onPlanChange: (newPlanId: string, billingCycle: 'full' | 'monthly') => Promise<void>
}

const PlanChangeModal: React.FC<PlanChangeModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  onPlanChange
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [selectedBilling, setSelectedBilling] = useState<'full' | 'monthly'>('full')
  const [step, setStep] = useState<'select' | 'confirm'>('select')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const planOptions: PlanOption[] = [
    {
      id: 'credit-refresh',
      name: 'Credit Refresh',
      description: 'Perfect for focused cleanup and quick wins',
      fullPrice: 800,
      monthlyPrice: 123,
      setupFee: 200,
      features: [
        'Up to 3 Collections Removed',
        'Up to 2 Late Payments Removed', 
        'Up to 6 Hard Inquiries Removed',
        'Full 3-Bureau Cleanup',
        'Monthly Progress Check-ins'
      ]
    },
    {
      id: 'credit-rebuild',
      name: 'Credit Rebuild',
      description: 'Comprehensive credit repair solution',
      fullPrice: 1200,
      monthlyPrice: 156,
      setupFee: 300,
      features: [
        'Full Negative Item Removal',
        'Late Payment Deletions',
        'Hard Inquiry Removal',
        'One-on-One Mentorship Calls',
        'Monthly Check-ins + Email Support'
      ],
      recommended: true
    },
    {
      id: 'couples-advantage',
      name: 'Couples Advantage',
      description: 'Designed for couples building credit together',
      fullPrice: 2000,
      monthlyPrice: 228,
      setupFee: 450,
      features: [
        'Full Negative Item Removal (2 people)',
        'Late Payment Deletions',
        'Hard Inquiry Removal',
        'Joint Mentorship Calls',
        'Personalized Guidance for Both Partners'
      ]
    }
  ]

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSelectedPlan(null)
      setSelectedBilling('full')
      setStep('select')
      setError(null)
    }
  }, [isOpen])

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    setError(null)
  }

  const handleBillingSelect = (billing: 'full' | 'monthly') => {
    setSelectedBilling(billing)
  }

  const getSelectedPlanDetails = () => {
    return planOptions.find(p => p.id === selectedPlan)
  }

  const getCurrentPlanDetails = () => {
    return planOptions.find(p => p.id === currentPlan.id)
  }

  const calculatePriceChange = () => {
    const current = getCurrentPlanDetails()
    const selected = getSelectedPlanDetails()
    
    if (!current || !selected) return null

    const currentPrice = currentPlan.billingCycle === 'monthly' 
      ? current.monthlyPrice 
      : current.fullPrice
    
    const selectedPrice = selectedBilling === 'monthly' 
      ? selected.monthlyPrice 
      : selected.fullPrice

    const difference = selectedPrice - currentPrice
    const isUpgrade = difference > 0
    const isDowngrade = difference < 0

    return {
      difference: Math.abs(difference),
      isUpgrade,
      isDowngrade,
      isLateralMove: difference === 0
    }
  }

  const handleConfirm = async () => {
    if (!selectedPlan) return

    setLoading(true)
    setError(null)

    try {
      await onPlanChange(selectedPlan, selectedBilling)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to change plan')
    } finally {
      setLoading(false)
    }
  }

  const renderProrationNotice = () => {
    const priceChange = calculatePriceChange()
    if (!priceChange) return null

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 mb-1">Proration Policy</p>
            {priceChange.isUpgrade && (
              <p className="text-blue-700">
                You'll be charged the prorated difference immediately and your next billing cycle will reflect the new plan price.
              </p>
            )}
            {priceChange.isDowngrade && (
              <p className="text-blue-700">
                Your plan will be downgraded at the end of your current billing period. You'll receive credit for the difference.
              </p>
            )}
            {priceChange.isLateralMove && (
              <p className="text-blue-700">
                This change will take effect immediately with no additional charges.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'select' ? 'Change Your Plan' : 'Confirm Plan Change'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {step === 'select' && (
            <>
              {/* Current Plan Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Current Plan</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-800">{currentPlan.name}</p>
                    <p className="text-sm text-gray-600">
                      Status: <span className="capitalize">{currentPlan.status}</span>
                    </p>
                    {currentPlan.nextBilling && (
                      <p className="text-sm text-gray-600">
                        Next billing: {new Date(currentPlan.nextBilling).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ${currentPlan.amount}{currentPlan.billingCycle === 'monthly' ? '/month' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Plan Selection */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose New Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {planOptions.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${plan.recommended ? 'ring-2 ring-blue-200' : ''}`}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    {plan.recommended && (
                      <div className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full mb-2 inline-block">
                        Most Popular
                      </div>
                    )}
                    <h4 className="font-semibold text-gray-900 mb-2">{plan.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                    <div className="mb-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Pay in Full:</span> ${plan.fullPrice}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Monthly:</span> ${plan.setupFee} + ${plan.monthlyPrice}/mo
                      </p>
                    </div>
                    <div className="space-y-1">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600">
                          <Check className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {plan.features.length > 3 && (
                        <p className="text-xs text-gray-500">+{plan.features.length - 3} more features</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Billing Cycle Selection */}
              {selectedPlan && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Billing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedBilling === 'full'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="billing"
                        value="full"
                        checked={selectedBilling === 'full'}
                        onChange={() => handleBillingSelect('full')}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Pay in Full</h4>
                        <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                          Best Value
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-blue-800">
                        ${getSelectedPlanDetails()?.fullPrice}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">One-time payment</p>
                    </label>

                    <label
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedBilling === 'monthly'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="billing"
                        value="monthly"
                        checked={selectedBilling === 'monthly'}
                        onChange={() => handleBillingSelect('monthly')}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Monthly Payments</h4>
                      </div>
                      <p className="text-lg font-bold text-blue-800">
                        ${getSelectedPlanDetails()?.setupFee} setup + ${getSelectedPlanDetails()?.monthlyPrice}/mo
                      </p>
                      <p className="text-sm text-gray-600 mt-1">9 monthly payments</p>
                    </label>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!selectedPlan}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && selectedPlan && (
            <>
              {/* Plan Comparison */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Change Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Current Plan */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Current Plan</p>
                    <div className="bg-white rounded-lg p-4 border">
                      <h4 className="font-semibold text-gray-900">{currentPlan.name}</h4>
                      <p className="text-lg font-bold text-blue-800">
                        ${currentPlan.amount}{currentPlan.billingCycle === 'monthly' ? '/mo' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-blue-600" />
                  </div>

                  {/* New Plan */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">New Plan</p>
                    <div className="bg-white rounded-lg p-4 border border-blue-500">
                      <h4 className="font-semibold text-gray-900">{getSelectedPlanDetails()?.name}</h4>
                      <p className="text-lg font-bold text-blue-800">
                        {selectedBilling === 'full' 
                          ? `$${getSelectedPlanDetails()?.fullPrice}`
                          : `$${getSelectedPlanDetails()?.setupFee} + $${getSelectedPlanDetails()?.monthlyPrice}/mo`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price Change Indicator */}
                {(() => {
                  const priceChange = calculatePriceChange()
                  if (!priceChange) return null

                  return (
                    <div className="mt-4 text-center">
                      {priceChange.isUpgrade && (
                        <div className="flex items-center justify-center text-green-600">
                          <ArrowUp className="h-4 w-4 mr-1" />
                          <span className="font-medium">
                            Upgrade (+${priceChange.difference})
                          </span>
                        </div>
                      )}
                      {priceChange.isDowngrade && (
                        <div className="flex items-center justify-center text-blue-600">
                          <ArrowDown className="h-4 w-4 mr-1" />
                          <span className="font-medium">
                            Downgrade (-${priceChange.difference})
                          </span>
                        </div>
                      )}
                      {priceChange.isLateralMove && (
                        <div className="flex items-center justify-center text-gray-600">
                          <span className="font-medium">Billing change only</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Proration Notice */}
              {renderProrationNotice()}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep('select')}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={loading}
                >
                  ← Back
                </button>
                
                <div className="space-x-3">
                  <button
                    onClick={onClose}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Processing...' : 'Confirm Change'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlanChangeModal