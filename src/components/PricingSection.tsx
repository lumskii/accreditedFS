import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'

type Tier = {
  id: number
  name: string
  price: string
  originalPrice?: string
  description: string
  features: string[]
  expandedFeatures: string[]
  cta: string
  recommended?: boolean
}

const PricingSection: React.FC = () => {
  // track expanded state per-tier so multiple tiers can be opened independently
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({})
  const toggleExpand = (tierId: number) => {
    setExpandedMap((prev) => ({ ...prev, [tierId]: !prev[tierId] }))
  }
  const pricingTiers = [
    {
      id: 1,
      name: 'Credit Refresh',
      price: '1,100',
      originalPrice: '2,100',
      description: 'Perfect for clients who need a quick win and focused cleanup to move closer to approvals. This entry-level package targets the most harmful inaccuracies on your report — without the extras — giving you the foundation to move forward toward your financial goals.',
      features: [
        'Choose Pay-in-Full and unlock Priority Rush Processing — the fastest path to results.',
        'Or $300 down + $200/mo for 9 months (total $2,100)',
        'Backed by our 90-Day Money-Back Guarantee',
      ],
      expandedFeatures: [
        "What's Included:",
        'Up to 3 Collections Removed',
        'Up to 2 Late Payments Removed',
        'Up to 6 Hard Inquiries Removed',
        'Full 3-Bureau Cleanup of outdated or inaccurate info',
        'Monthly Progress Check-ins',
      ],
      cta: 'Choose Credit Refresh',
    },
    {
      id: 2,
      name: 'Credit Rebuild',
      price: '2,000',
      originalPrice: '3,200',
      description: 'This is the full reset — designed for clients ready to completely restore their credit and aim for the 700+ club. You’ll receive personalized support, monthly progress reviews, and hands-on guidance to keep your credit moving forward.',
      features: [
        'Choose Pay-in-Full and unlock Priority Rush Processing — the fastest path to results.',
        'Or $500 down + $300/mo for 9 months (total $3,200)',
        'Backed by our 90-Day Money-Back Guarantee',
      ],
      expandedFeatures: [
        "What's Included:",
        'Full Negative Item Removal (collections, charge-offs, bankruptcies, repos, evictions, student loans, medical bills)',
        'Late Payment Deletions',
        'Hard Inquiry Removal',
        'One-on-One Mentorship Calls with Ola',
        'Monthly Check-ins + Email & Support',
        'Personalized Credit Strategy & Ongoing Guidance',
      ],
      cta: 'Choose Credit Rebuild',
      recommended: true,
    },
    {
      id: 3,
      name: 'Couples Advantage',
      price: '3,200',
      originalPrice: '4,300',
      description: 'Designed for couples or partners who are serious about building — or rebuilding — their credit together. This plan includes the full benefits of our premium credit repair program, doubled for both partners, along with personalized guidance to ensure each of you is supported on your financial journey.',
      features: [
        'Choose Pay-in-Full and unlock Priority Rush Processing — the fastest path to results.',
        'Or $700 down + $400/mo for 9 months (total $4,300)',
        'Backed by our 90-Day Money-Back Guarantee',
      ],
      expandedFeatures: [
        "What's Included:",
        'Full Negative Item Removal (collections, charge-offs, bankruptcies, repos, evictions, student loans, medical bills)',
        'Late Payment Deletions',
        'Hard Inquiry Removal',
        'One-on-One Mentorship Calls with Ola',
        'Monthly Check-ins + Email & Tech Support',
        'Joint Mentorship Calls + Personalized Guidance',
      ],
      cta: 'Choose Couples Advantage',
    },
  ]
  return (
    <section id="pricing" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Transparent Pricing Plans</h2>
          <p className="max-w-2xl mx-auto text-gray-600">Choose the plan that fits your needs. All plans include our 90-day money back guarantee.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <PriceCard
              key={tier.id}
              tier={tier}
              expanded={!!expandedMap[tier.id]}
              onToggle={() => toggleExpand(tier.id)}
            />
          ))}
        </div>
        <div className="mt-16 flex justify-center">
          <div className="max-w-3xl">
            <MoneyBackGuarantee />
          </div>
        </div>
      </div>
    </section>
  )
}
const MoneyBackGuarantee: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex flex-col md:flex-row items-center">
        <div className="md:w-1/3 bg-blue-800 p-6 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[#f0d541] rounded-full transform rotate-12"></div>
            <div className="absolute inset-0 bg-[#f0d541] rounded-full transform -rotate-12"></div>
            <div className="relative bg-[#f0d541] text-blue-800 rounded-full h-36 w-36 flex flex-col items-center justify-center border-4 border-dashed border-blue-800 transform rotate-3">
              <span className="text-sm font-bold">90-DAY</span>
              <span className="text-xl font-extrabold">MONEY BACK</span>
              <span className="text-lg font-bold">GUARANTEE</span>
            </div>
          </div>
        </div>
        <div className="md:w-2/3 p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Our Risk-Free Guarantee</h3>
          <p className="text-gray-600 mb-4">We're so confident in our ability to improve your credit that we offer a 90-day money back guarantee. If you don't see results, you get your money back.</p>
          <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center text-blue-700 font-medium hover:text-blue-800 transition-colors">{isExpanded ? (<><span>Show Less</span><ChevronUp className="h-5 w-5 ml-1" /></>) : (<><span>Read Guarantee Details</span><ChevronDown className="h-5 w-5 ml-1" /></>)}</button>
          {isExpanded && (<div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn"><h4 className="font-semibold text-gray-800 mb-2">Guarantee Terms:</h4><ul className="space-y-2 text-gray-600"><li className="flex items-start"><Check className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" /><span>If you don't see any improvement in your credit score within 90 days of starting our service, we'll refund 100% of your service fees.</span></li><li className="flex items-start"><Check className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" /><span>You must follow all credit specialist recommendations and provide requested documentation in a timely manner.</span></li><li className="flex items-start"><Check className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" /><span>The guarantee applies to removal of inaccurate, unverifiable, or outdated negative items from your credit report.</span></li><li className="flex items-start"><Check className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" /><span>To claim the guarantee, simply provide before and after credit reports showing no improvements.</span></li></ul></div>)}
        </div>
      </div>
    </div>
  )
}
export default PricingSection

const PriceCard: React.FC<{ tier: Tier; expanded: boolean; onToggle: () => void }> = ({ tier, expanded, onToggle }) => {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [maxH, setMaxH] = useState<string>('0px')

  useEffect(() => {
    const el = contentRef.current
    if (el) {
      if (expanded) {
        setMaxH(`${el.scrollHeight}px`)
      } else {
        setMaxH('0px')
      }
    }
  }, [expanded])

  // when closed, give all cards a baseline min-height so they line up;
  // make the recommended card taller when closed so it appears longest.
  // baseline closed heights (smaller on mobile, larger on md+)
  const closedBaseMinH = !expanded ? 'min-h-[18rem] md:min-h-[22rem]' : ''
  // recommended (middle) card should be clearly taller when closed
  const recommendedClosedMinH = !expanded && tier.recommended ? 'min-h-[28rem] md:min-h-[40rem]' : ''

  return (
    <div className={`self-start bg-white rounded-lg shadow-lg overflow-hidden border ${tier.recommended ? 'border-blue-500' : 'border-gray-200'} hover:shadow-xl transition-shadow ${closedBaseMinH} ${recommendedClosedMinH}`}>
      {tier.recommended && <div className="bg-blue-500 text-white text-center py-2 font-medium">Most Popular</div>}
      <div className={`p-6 ${tier.recommended ? 'bg-blue-50' : ''}`}>
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold text-gray-900">${tier.price}</span>
            {tier.originalPrice && (
              <span className="text-sm text-gray-600 line-through ml-1">${tier.originalPrice}</span>
            )}
          </div>
        </div>
        <p className="text-gray-600 mb-6">{tier.description}</p>
        <div className="space-y-3 mb-6">{tier.features.map((feature, index) => (<div key={index} className="flex items-start"><Check className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">{feature}</span></div>))}</div>

        <button onClick={onToggle} className="w-full flex items-center justify-center text-blue-700 font-medium hover:text-blue-800 transition-colors py-2 mb-4">
          {expanded ? (<><span>Show Less</span><ChevronUp className="h-5 w-5 ml-1" /></>) : (<><span>Show More</span><ChevronDown className="h-5 w-5 ml-1" /></>)}
        </button>

        <div
          ref={contentRef}
          className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
          style={{ maxHeight: maxH }}
          aria-hidden={!expanded}
        >
          <div className="space-y-3 mb-6 pt-4 border-t border-gray-200">
            <p className="font-medium text-gray-800 mb-2">Additional Features:</p>
            {tier.expandedFeatures.map((feature, index) => (
              <div key={index} className="flex items-start">
                <Check className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <button className={`w-full py-3 rounded-md font-semibold transition-colors ${tier.recommended ? 'bg-[#f0d541] text-blue-800 hover:bg-[#e6cb3d]' : 'bg-blue-700 text-white hover:bg-blue-800'}`}>{tier.cta}</button>
      </div>
    </div>
  )
}
