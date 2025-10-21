import React from 'react'

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: October 21, 2025</p>

        <div className="prose prose-blue max-w-none">
          <p>
            These Terms of Service ("Terms") govern your access to and use of the websites, dashboards,
            products, and services provided by Accredited Financial Services ("Accredited Financial Services",
            "we", "our", or "us"). By accessing or using our services, you agree to be bound by these Terms.
            If you do not agree, do not use the services.
          </p>

          <h2>1. Service Description</h2>
          <p>
            We provide credit repair and related services, including document management, education, and
            subscription or one-time plan options designed to help identify and dispute inaccuracies
            in credit reports. We do not provide legal, tax, or investment advice and we are not a law firm.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 18 years old and capable of entering into a binding agreement to use
            the services. You are responsible for ensuring your use of the services complies with all
            applicable laws and regulations in your jurisdiction.
          </p>

          <h2>3. Accounts and Security</h2>
          <ul>
            <li>You must provide accurate information when creating an account and keep it up to date.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials and for
              all activities under your account.</li>
            <li>Notify us immediately at <a href="mailto:info@accreditedfs.com">info@accreditedfs.com</a> if you suspect unauthorized use.</li>
          </ul>

          <h2>4. Payments and Billing</h2>
          <ul>
            <li>
              Payments are processed by Stripe. By purchasing a plan, you authorize us and Stripe to charge
              your payment method for fees associated with your selected plan (one-time or subscription).
            </li>
            <li>
              Subscription plans renew automatically unless you cancel through your account or the Stripe
              Billing Portal before the renewal date. Any applicable taxes will be charged in addition to
              the listed prices.
            </li>
            <li>
              Refunds (including any 90-day money-back guarantee if advertised) are governed by the policy
              stated at the time of purchase. Where permitted, refunds are issued to the original payment
              method through Stripe.
            </li>
          </ul>

          <h2>5. User Responsibilities</h2>
          <ul>
            <li>Provide complete and accurate information necessary to perform credit repair services.</li>
            <li>Upload only documents relevant to your case and that you have the right to share.</li>
            <li>Do not upload content that is unlawful, confidential to others, or infringes third-party rights.</li>
            <li>Do not attempt to interfere with or disrupt the services or other users' access.</li>
          </ul>

          <h2>6. Documents and Content</h2>
          <p>
            Documents you upload may be stored using third-party infrastructure (e.g., Vercel Blob) and
            referenced in our systems (e.g., Firebase). You retain ownership of your content; you grant us a
            limited license to host, process, and use the content solely to provide the services. We may remove
            content that violates these Terms or applicable law.
          </p>

          <h2>7. Privacy</h2>
          <p>
            Our <a href="/privacy">Privacy Policy</a> explains how we collect, use, and protect your information.
            By using the services, you consent to our collection and use of information as described there.
          </p>

          <h2>8. Prohibited Conduct</h2>
          <ul>
            <li>Reverse engineer, decompile, or otherwise attempt to extract source code from the services.</li>
            <li>Use the services for fraudulent, unlawful, or misleading purposes.</li>
            <li>Interfere with the normal operation of the services, including security features.</li>
          </ul>

          <h2>9. Intellectual Property</h2>
          <p>
            We and our licensors own all rights, title, and interest in and to the services, including the
            website, software, graphics, and content, excluding content you upload. These are protected by
            intellectual property laws. No rights are granted except as expressly set forth in these Terms.
          </p>

          <h2>10. Disclaimers</h2>
          <p>
            THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS
            OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. We do not guarantee specific credit score outcomes or results. Actual results depend on
            numerous factors, including the accuracy of information provided, credit bureau responses, and your
            personal financial behavior.
          </p>

          <h2>11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR USE,
            ARISING OUT OF OR IN CONNECTION WITH THE SERVICES OR THESE TERMS, EVEN IF ADVISED OF THE POSSIBILITY OF
            SUCH DAMAGES. OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICES SHALL NOT EXCEED THE AMOUNT
            YOU PAID TO US FOR THE SERVICES IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
          </p>

          <h2>12. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless Accredited Financial Services and its officers,
            employees, and agents from and against any claims, liabilities, damages, losses, and expenses,
            including reasonable legal and accounting fees, arising out of or in any way connected with your
            access to or use of the services or your violation of these Terms.
          </p>

          <h2>13. Suspension and Termination</h2>
          <p>
            We may suspend or terminate your access to the services at any time, with or without notice, if we
            believe you have violated these Terms, engaged in fraudulent or unlawful activities, or present a
            risk to the security or operation of the services.
          </p>

          <h2>14. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms are governed by the laws of the State of Arizona, without regard to its conflict of law
            principles. You agree to the exclusive jurisdiction and venue of the state and federal courts located
            in Maricopa County, Arizona for any dispute not subject to arbitration (if mutually agreed in writing).
          </p>

          <h2>15. Changes to the Services or Terms</h2>
          <p>
            We may modify the services or these Terms at any time. We will post updates on this page and update
            the "Last updated" date above. Your continued use after changes become effective constitutes your
            acceptance of the revised Terms.
          </p>

          <h2>16. Contact</h2>
          <p>
            Questions about these Terms? Contact us at <a href="mailto:info@accreditedfs.com">info@accreditedfs.com</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Terms
