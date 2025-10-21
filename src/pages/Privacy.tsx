import React from 'react'

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: October 21, 2025</p>

        <div className="prose prose-blue max-w-none">
          <p>
            Accredited Financial Services ("we", "us", "our") is committed to protecting your
            privacy. This Privacy Policy explains what information we collect, how we use it,
            and your choices. By using our website and services, you agree to this Policy.
          </p>

          <h2>Information We Collect</h2>
          <ul>
            <li>
              <strong>Account information:</strong> name, email address, password hash, and optional profile
              details you provide when signing up or updating your account.
            </li>
            <li>
              <strong>Authentication and security:</strong> we use Firebase Authentication; we receive your
              Firebase user ID and email verification status.
            </li>
            <li>
              <strong>Service data:</strong> information you provide during onboarding and while using the
              service (for example, plan selection, agreements, progress and milestone updates).
            </li>
            <li>
              <strong>Documents you upload:</strong> files uploaded to support your credit repair process. These
              are stored using Vercel Blob Storage and referenced in our Firebase Realtime Database.
            </li>
            <li>
              <strong>Payment data:</strong> we use Stripe to process payments. We do not store full card
              numbers on our servers. Stripe provides us with payment status, customer IDs, and
              related billing information necessary to deliver our services.
            </li>
            <li>
              <strong>Usage data:</strong> device and log information such as IP address, browser type,
              pages visited, and timestamps to maintain security and improve our services.
            </li>
          </ul>

          <h2>How We Use Information</h2>
          <ul>
            <li>Provide, operate, and improve our credit repair services.</li>
            <li>Authenticate users, secure accounts, and prevent fraud or abuse.</li>
            <li>Process payments, manage subscriptions, and provide invoices/receipts.</li>
            <li>Communicate with you about your account, progress, and service announcements.</li>
            <li>Comply with legal obligations and enforce our agreements and policies.</li>
          </ul>

          <h2>Legal Bases for Processing</h2>
          <p>
            Where applicable, we process personal data under one or more of the following legal bases:
            performance of a contract, legitimate interests (such as securing our services), compliance with legal
            obligations, and your consent (where required and separately obtained).
          </p>

          <h2>Cookies and Similar Technologies</h2>
          <p>
            We use cookies and local storage to keep you signed in, remember preferences, and protect your account.
            You can control cookies in your browser settings, but some features may not work as intended if you
            disable them.
          </p>

          <h2>How We Share Information</h2>
          <ul>
            <li>
              <strong>Service providers:</strong> we share information with vendors who help us operate our
              services, including Firebase (authentication and database), Vercel Blob (file storage), and Stripe
              (payments and billing portal).
            </li>
            <li>
              <strong>Legal and safety:</strong> we may disclose information to comply with law, protect our
              rights, or prevent harm.
            </li>
            <li>
              <strong>Business transfers:</strong> if we are involved in a merger, acquisition, or asset sale, your
              information may be transferred subject to this Policy.
            </li>
          </ul>

          <h2>Data Retention</h2>
          <p>
            We retain personal data for as long as needed to provide the services and for legitimate business
            purposes, including compliance with legal obligations, resolving disputes, and enforcing agreements.
            You may request deletion of your account data (see “Your Rights”). Certain records (for example, payment
            records) may be retained as required by law.
          </p>

          <h2>Your Rights and Choices</h2>
          <ul>
            <li>Access, update, or delete certain account information from your dashboard or by contacting us.</li>
            <li>Request a copy of your data or ask us to restrict or object to processing, where applicable.</li>
            <li>Withdraw consent where processing is based on consent.</li>
          </ul>
          <p>
            To exercise these rights, contact us at <a href="mailto:info@accreditedfs.com">info@accreditedfs.com</a>.
            We may need to verify your identity before acting on your request.
          </p>

          <h2>Security</h2>
          <p>
            We implement administrative, technical, and organizational measures to protect personal data. No system is
            completely secure; we encourage you to use a strong, unique password and keep your account information safe.
          </p>

          <h2>Children’s Privacy</h2>
          <p>
            Our services are not directed to children under 13. We do not knowingly collect personal information from
            children. If you believe a child has provided us personal information, contact us and we will take steps to
            remove it.
          </p>

          <h2>International Transfers</h2>
          <p>
            We may process and store information in the United States and other countries. By using the services, you
            understand that your information may be transferred to and processed in jurisdictions that may have data
            protection laws different from those in your location.
          </p>

          <h2>Third-Party Links</h2>
          <p>
            Our website may contain links to third-party sites (for example, the Stripe Billing Portal). We are not
            responsible for their privacy practices. We encourage you to review their policies.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the updated version on this page and
            update the “Last updated” date above. If changes are material, we may provide additional notice.
          </p>

          <h2>Contact Us</h2>
          <p>
            Accredited Financial Services<br/>
            101 N Colonado St, #131, Chandler, AZ 85244<br/>
            Email: <a href="mailto:info@accreditedfs.com">info@accreditedfs.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Privacy
