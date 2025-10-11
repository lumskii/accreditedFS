import React from 'react'
import { FileText, Calendar, DollarSign } from 'lucide-react'

interface PlanDetails {
  id: number
  name: string
  price: string
  originalPrice?: string
  setupFee?: string
  monthlyFee?: string
  paymentType: 'upfront' | 'monthly'
}

interface AgreementDisplayProps {
  planDetails?: PlanDetails | null
  showSignature?: boolean
  signedData?: {
    signedBy: string
    signedAt: number
  }
  className?: string
}

const AgreementDisplay: React.FC<AgreementDisplayProps> = ({ 
  planDetails, 
  showSignature = false, 
  signedData,
  className = ""
}) => {
  const formatCurrency = (amount: string) => `$${amount}`
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const getPlanDetails = () => {
    if (!planDetails) return null

    const isMonthly = planDetails.paymentType === 'monthly'
    
    return {
      totalCost: planDetails.originalPrice || planDetails.price,
      upfrontCost: planDetails.price,
      setupFee: planDetails.setupFee || '0',
      monthlyFee: planDetails.monthlyFee || '0',
      isMonthly,
      termLength: isMonthly ? '9 Months' : 'One-time Payment'
    }
  }

  const details = getPlanDetails()

  return (
    <div className={`bg-white ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex items-center mb-4">
          <FileText className="h-8 w-8 text-blue-800 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Credit Repair Services Agreement</h1>
        </div>
        <p className="text-lg text-gray-600 font-medium">(Accredited Financial Services)</p>
        
        {/* Plan Details Banner */}
        {planDetails && details && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Your Selected Plan: {planDetails.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Total Plan Cost:</span>
                <div className="text-lg font-bold text-blue-800">{formatCurrency(details.totalCost)}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  {details.isMonthly ? 'Upfront Cost:' : 'One-time Payment:'}
                </span>
                <div className="text-lg font-bold text-blue-800">{formatCurrency(details.upfrontCost)}</div>
              </div>
              {details.isMonthly && (
                <>
                  <div>
                    <span className="font-medium text-gray-700">Setup Fee:</span>
                    <div className="text-lg font-bold text-blue-800">{formatCurrency(details.setupFee)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Monthly Payment:</span>
                    <div className="text-lg font-bold text-blue-800">{formatCurrency(details.monthlyFee)}</div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <strong>Billing Frequency:</strong> {details.isMonthly ? 'Monthly payments for 9 months' : 'One-time upfront payment'}
            </div>
          </div>
        )}

        {/* Signature Display */}
        {showSignature && signedData && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center text-green-800">
              <Calendar className="h-5 w-5 mr-2" />
              <div>
                <div className="font-semibold">Agreement Signed</div>
                <div className="text-sm">
                  Signed by: <strong>{signedData.signedBy}</strong> on {formatDate(signedData.signedAt)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Agreement Content */}
      <div className="prose prose-lg max-w-none space-y-6">
        
        {/* Section 1 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction & Agreement Overview</h2>
          <p className="mb-4">By signing this Agreement, you acknowledge and agree:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Voluntary Entry:</strong> You are entering into this Agreement voluntarily, with a full understanding of the services offered, the associated fees, any limitations, and your rights under federal and state law.</li>
            <li><strong>Compliance:</strong> Company complies with all applicable federal and state laws, including but not limited to the Credit Repair Organizations Act ("CROA"), the Telemarketing Sales Rule ("TSR"), the Fair Credit Reporting Act ("FCRA"), and your state's consumer protection statutes.</li>
          </ul>

          {planDetails && details && (
            <div className="mt-6 bg-gray-50 border-l-4 border-blue-500 p-4">
              <h3 className="text-lg font-semibold mb-3">Your Plan Breakdown</h3>
              <ul className="space-y-2 text-sm">
                <li><strong>Total Plan Cost:</strong> {formatCurrency(details.totalCost)} - This is the total cost of the plan you are enrolling in.</li>
                <li><strong>Startup Fee:</strong> {formatCurrency(details.setupFee)} - The required startup fee {details.setupFee === '0' ? '(No startup fee for upfront payment)' : '(if applicable)'}.</li>
                <li><strong>Billing Frequency:</strong> {details.isMonthly ? 'Monthly payments. Payments will be billed on a recurring basis (monthly) until the total cost of the program is paid in full.' : 'One-time upfront payment.'}</li>
                {details.isMonthly && (
                  <>
                    <li><strong>Recurring Service Fee (Monthly Plan Only):</strong> {formatCurrency(details.monthlyFee)} - This is the agreed-upon monthly amount that will be charged automatically until the program cost has been satisfied.</li>
                    <li><strong>Term Length (Monthly Only):</strong> {details.termLength} — the length of time that payments will continue for the selected monthly plan.</li>
                  </>
                )}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Upfront Acknowledgments</h4>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>No Unlawful Solicitation:</strong> You confirm that you were not solicited unlawfully.</li>
              <li><strong>Acknowledgment of TSR/CROA Compliance:</strong> You specifically acknowledge that the Company has fully complied with CROA and TSR with respect to disclosures, payment handling, and cancellation rights.</li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Services Provided</h2>
          <p className="mb-4">Company agrees to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Review your credit reports (Experian, Equifax, and TransUnion)</li>
            <li>Identify inaccurate, unverifiable, or obsolete information</li>
            <li>Prepare and submit dispute correspondence on your behalf</li>
            <li>Provide progress updates, coaching, and strategic recommendations</li>
          </ul>
          <p className="mt-4">All services are performed on a best-efforts basis in compliance with CROA, TSR, FCRA, and applicable state law.</p>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Service Limitations & Client Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Guidance and Recommendations:</strong> Company will provide strategic advice to support your credit improvement efforts.</li>
            <li><strong>Scope of Disputes:</strong> Company will address only the number of disputes specified in your plan.</li>
            <li><strong>Targeted Items:</strong> Only items present on your credit report at signup are covered.</li>
            <li><strong>Client Responsibilities:</strong> You agree to maintain credit monitoring, make timely payments, avoid unauthorized inquiries, and cooperate fully.</li>
          </ul>
          <p className="mt-4">Refunds are limited to unearned fees held in escrow as required by CROA. Once services are performed and documented, fees are deemed earned and non-refundable.</p>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Prohibited Actions by Client</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Run or authorize unknown credit inquiries</li>
            <li>Provide false or misleading information</li>
            <li>Fail to comply with program requirements</li>
          </ul>
          <p className="mt-4">Violations may result in termination of services without refund, except as required by CROA for unearned escrowed funds.</p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Understanding Credit Scores, Variations & Limitations</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Normal Score Variations:</strong> Minor fluctuations are normal and not a service failure.</li>
            <li><strong>No Guaranteed Score Increase:</strong> Company cannot guarantee any specific score increase or lending outcome.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Fees, Payment Terms & Escrow of Initial Deposit</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Program Fee:</strong> The agreed-upon price for the selected plan.</li>
            <li><strong>Initial Deposit:</strong> Held in escrow by a third-party agent until services are performed and verified.</li>
            <li><strong>Release of Fees:</strong> Fees are released from escrow upon completion of each service milestone.</li>
            <li><strong>Payment Commitment:</strong> Binding obligation per service event.</li>
            <li><strong>Declined Payments:</strong> Must be cured within 24 hours or services may be suspended.</li>
            <li><strong>Collections:</strong> Failure to pay may lead to collections or arbitration.</li>
          </ul>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Credit Monitoring Membership Requirement</h2>
          <p>You must maintain an active credit monitoring membership during the agreement term. Failure to do so may suspend services and void refund eligibility.</p>
        </section>

        {/* Section 8 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Refunds, Guarantees & Non-Refundable Fees</h2>
          <p className="mb-4">Refunds are only available for unearned fees held in escrow in accordance with CROA. Once services are performed and documented, fees are deemed earned and are non-refundable. 
Any unearned funds remaining in escrow upon cancellation will be returned to Client within fifteen (10) business days.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">90-Day Results Guarantee</h4>
            <p className="text-green-700">If, after ninety (90) consecutive days of active participation in the Program and full compliance with Client obligations under this Agreement, Company has not achieved at least one Verifiable Result for Client, only the unearned funds remaining in escrow will be refunded. Fees already earned and released to Company are non-refundable regardless of cancellation.</p>
          </div>
        </section>

        {/* Section 9 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Right to Cancel (CROA Notice)</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="font-semibold text-yellow-800 mb-2">You have the right to cancel this Agreement without penalty or obligation within five (5) calendar days after the date you sign it. To cancel, you must notify the Company in writing by certified mail or email. Any unearned fees held in escrow will be refunded promptly. </p>
            <div className="text-yellow-700">
              <p className="font-medium">Send cancellations via mail or email to:</p>
              <div className="mt-2">
                <strong>Accredited Financial Services</strong><br />
                Attn: Cancellations<br />
                PO Box 131<br />
                Chandler, AZ 85244<br />
                📧 info@accreditedfs.com
              </div>
            </div>
          </div>
        </section>

        {/* Section 10-12 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Chargeback Policy</h2>
          <p>Unauthorized chargebacks are prohibited and treated as a material breach. Clients should resolve issues directly with the Company.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Client Acknowledgments</h2>
          <p className="mb-2">By signing, the Client acknowledges:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Results vary; no guarantees.</li>
            <li>Credit repair is legal but limited.</li>
            <li>All required disclosures under CROA and Arizona law have been reviewed.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">12. No Legal or Financial Advice</h2>
          <p>The Company is not a law, financial, or tax advisory firm. Clients are encouraged to seek independent counsel.</p>
        </section>

        {/* Sections 13-20 */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Limitation of Liability & Indemnification</h2>
          <p>Company liability is limited to total fees paid. Client agrees to indemnify the Company against claims arising from inaccurate information or breach.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">14. State-Specific Disclosures</h2>
          <p>Additional addenda will be provided for states with extra credit repair requirements.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Dispute Resolution & Arbitration</h2>
          <p>Disputes are subject to <strong>binding arbitration in Arizona</strong>, unless CROA preserves the right to federal court. Each party bears its own legal fees unless otherwise awarded.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Electronic Signature Acknowledgment</h2>
          <p>Electronic signatures are binding under the <strong>E-SIGN Act</strong>.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Severability</h2>
          <p>If any provision is invalid, the remainder shall continue in full force.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Entire Agreement</h2>
          <p>This document represents the full and final agreement between the parties.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">19. Confidentiality</h2>
          <p>All personal and financial information remains confidential except as required by law.</p>
        </section>

        {/* Section 20 - Know Your Rights */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">20. Know Your Rights</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-semibold text-blue-800 mb-3">Under Section 405 of the Credit Repair Organizations Act (CROA):</p>
            <ul className="list-disc pl-6 space-y-1 text-blue-700">
              <li>You can dispute inaccurate information directly with credit bureaus.</li>
              <li>Credit bureaus must remove negative but inaccurate info, not accurate info.</li>
              <li>You're entitled to free reports under certain conditions (e.g., denied credit).</li>
              <li>You can sue credit repair companies that violate CROA.</li>
              <li>You may cancel any credit repair contract within 5 business days.</li>
            </ul>
            <div className="mt-4 text-blue-700">
              <p className="font-medium">For more information, contact:</p>
              <p>Federal Trade Commission<br />
              Public Reference Branch<br />
              Washington, D.C. 20580</p>
            </div>
          </div>
        </section>

        {/* Limited Power of Attorney */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">LIMITED POWER OF ATTORNEY</h2>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            {/* Client Information Fields */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="font-semibold min-w-[120px]">Client Name:</span>
                <div className="flex-1 border-b border-gray-400 h-6"></div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold min-w-[120px]">Client Address:</span>
                <div className="flex-1 border-b border-gray-400 h-6"></div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold min-w-[120px]">City, State, ZIP:</span>
                <div className="flex-1 border-b border-gray-400 h-6"></div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">1. Grant of Limited Authority</h3>
            <p className="mb-4">
              I, the undersigned Client, hereby appoint <strong>Accredited Financial Services</strong> ("Company") as 
              my authorized representative with limited authority to:
            </p>
            <ul className="list-disc pl-8 space-y-2 mb-6">
              <li>
                Prepare, sign, and submit written correspondence on my behalf to the three major 
                credit reporting agencies (Experian, Equifax, and TransUnion).
              </li>
              <li>
                Communicate with creditors, lenders, or furnishers of information for the sole 
                purpose of disputing or requesting correction of inaccurate, unverifiable, or 
                obsolete information appearing on my credit reports.
              </li>
            </ul>

            <h3 className="text-lg font-semibold mb-4">2. Restrictions</h3>
            <p className="mb-4">This Limited Power of Attorney <strong>does not</strong> authorize Company to:</p>
            <ul className="list-disc pl-8 space-y-2 mb-6">
              <li>Apply for credit, loans, or services in my name.</li>
              <li>Incur debt or enter into contracts on my behalf.</li>
              <li>Take any financial actions beyond the dispute process described above.</li>
            </ul>

            <h3 className="text-lg font-semibold mb-4">3. Term & Revocation</h3>
            <p className="mb-6">
              This Limited Power of Attorney shall remain in effect until the completion of credit repair 
              services or until revoked by me in writing. I may revoke this authorization at any time by 
              delivering written notice to Company.
            </p>

            <h3 className="text-lg font-semibold mb-4">4. Governing Law</h3>
            <p className="mb-8">
              This Limited Power of Attorney shall be governed by and construed in accordance with the 
              laws of the State of Arizona and applicable federal law.
            </p>

            {/* Signature Section */}
            <div className="border-t border-gray-300 pt-6 space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-semibold min-w-[140px]">Client Signature:</span>
                <div className="flex-1 border-b border-gray-400 h-8"></div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-semibold min-w-[140px]">Date:</span>
                <div className="w-40 border-b border-gray-400 h-8"></div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-semibold min-w-[140px]">Printed Name:</span>
                <div className="flex-1 border-b border-gray-400 h-8"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AgreementDisplay