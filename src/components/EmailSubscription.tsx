import React, { useState } from 'react'
import { Mail, CheckCircle } from 'lucide-react'
import { push, ref, set } from 'firebase/database'
import { database } from '../firebase'
import { jsPDF } from 'jspdf'
import emailjs from '@emailjs/browser'

// Configure these with your EmailJS values (replace in production)
const EMAILJS_SERVICE_ID = (import.meta as any).env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID'
const EMAILJS_TEMPLATE_ID = (import.meta as any).env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID'
const EMAILJS_PUBLIC_KEY = (import.meta as any).env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY'

const EmailSubscription: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)
    try {
      const requestsRef = ref(database, 'disputeRequests')
      const newRef = push(requestsRef)
      await set(newRef, {
        email: trimmed,
        createdAt: new Date().toISOString(),
      })

      // Generate PDF client-side and send via EmailJS
      try {
        const { base64, filename } = generatePdfBase64(trimmed)
        // EmailJS accepts attachments as base64 data URI in template params for many setups
        // We'll use the browser SDK to send the template with an attachment param
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: trimmed,
            attachment: `data:application/pdf;base64,${base64}`,
            filename,
          },
          EMAILJS_PUBLIC_KEY
        )
      } catch (sendErr) {
        console.warn('EmailJS send failed; user can download the PDF instead', sendErr)
      }

      setIsSubmitted(true)
      setEmail('')
      // keep success visible for 8 seconds
      setTimeout(() => {
        setIsSubmitted(false)
      }, 8000)
    } catch (err) {
      console.error('Failed to submit dispute request', err)
      setError('There was a problem submitting your request. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <section className="py-16 bg-[#f0d541]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-8 md:mb-0 md:pr-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Your Free Credit Dispute Letter</h2>
              <p className="text-gray-600 mb-4">Subscribe to our newsletter and receive a professionally crafted dispute letter template that you can use to challenge inaccurate items on your credit report. Our dispute letters have helped hundreds of clients improve their credit scores.</p>
              <div className="flex items-start space-x-2 mb-4"><CheckCircle className="h-5 w-5 text-blue-700 mt-1 flex-shrink-0" /><p className="text-gray-600">Professionally written by credit experts</p></div>
              <div className="flex items-start space-x-2 mb-4"><CheckCircle className="h-5 w-5 text-blue-700 mt-1 flex-shrink-0" /><p className="text-gray-600">Customizable to your specific situation</p></div>
              <div className="flex items-start space-x-2"><CheckCircle className="h-5 w-5 text-blue-700 mt-1 flex-shrink-0" /><p className="text-gray-600">Includes follow-up tips and strategies</p></div>
            </div>
            <div className="md:w-1/3 w-full">
              {isSubmitted ? (
                <div className="bg-green-100 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-800 mb-2">Thank You!</h3>
                  <p className="text-green-700">Your dispute letter is on its way to your inbox. Please check your email!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-blue-800 mb-4">Subscribe Now</h3>
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="youremail@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {error && <div className="text-sm text-red-700 mb-3">{error}</div>}
                  <button type="submit" disabled={isSubmitting} className={`w-full ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''} bg-blue-700 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-800 transition-colors flex items-center justify-center`}>
                    <Mail className="h-5 w-5 mr-2" />
                    {isSubmitting ? 'Submitting...' : 'Get Free Dispute Letter'}
                  </button>
                  <p className="text-xs text-gray-500 mt-3 text-center">We respect your privacy. Unsubscribe at any time.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Helper: returns base64 string (no data: prefix) and filename
function generatePdfBase64(emailAddress: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  doc.setFontSize(18)
  doc.text('Credit Dispute Letter', 72, 72)
  doc.setFontSize(11)
  const body = [
    'To Whom It May Concern,',
    '',
    `This is a drafted dispute letter for ${emailAddress}.`,
    '',
    'Please edit the name/address fields and send to the bureaus.',
    '',
    'Sincerely,',
    'Accredited Financial Services',
  ]
  let y = 120
  body.forEach(line => {
    doc.text(line, 72, y)
    y += 18
  })

  const dataUri = doc.output('datauristring')
  const base64 = dataUri.split(',')[1]
  return { base64, filename: 'dispute-letter.pdf' }
}
export default EmailSubscription
