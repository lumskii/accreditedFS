import React, { useState } from 'react'
import emailjs from '@emailjs/browser'

type FormData = {
  name: string
  email: string
  phone: string
  preferredDate: string
  preferredTime: string
  message: string
}

const BookingCTA: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', phone: '', preferredDate: '', preferredTime: '', message: '' })
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    // Phone input: format as (123) 456-7890 while typing (basic US-style mask)
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '')
      let formatted = digits
      if (digits.length > 3 && digits.length <= 6) {
        formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      } else if (digits.length > 6) {
        formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
      }
      setFormData((prev) => ({ ...prev, [name]: formatted }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  const [isSending, setIsSending] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateAdminId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const templateReplyId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_REPLY
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  const rawRecipient = import.meta.env.VITE_BOOKING_RECIPIENT
  const recipient = (rawRecipient && String(rawRecipient).trim()) || 'info@accreditedfs.com'

    // Combine date + time (if provided) so templates receive the full preferred datetime
    const dateTimeStr = formData.preferredDate
      ? `${formData.preferredDate}${formData.preferredTime ? 'T' + formData.preferredTime : ''}`
      : ''

    let formattedPreferredDateLocale = ''
    let formattedPreferredDate = ''
    if (dateTimeStr) {
      const dt = new Date(dateTimeStr)
      if (!isNaN(dt.getTime())) {
        formattedPreferredDateLocale = dt.toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
        // use 12-hour clock with AM/PM for the manual formatted string
        const hours24 = dt.getHours()
        const minutes = dt.getMinutes().toString().padStart(2, '0')
        const ampm = hours24 >= 12 ? 'PM' : 'AM'
        const hours12 = (hours24 % 12) === 0 ? 12 : hours24 % 12
        formattedPreferredDate = `${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt
          .getDate()
          .toString()
          .padStart(2, '0')}-${dt.getFullYear()} at ${hours12.toString().padStart(2, '0')}:${minutes} ${ampm}`
      }
    }

    const adminParams = {
      from_name: formData.name,
      from_email: formData.email,
      phone: formData.phone,
      // include both formats if you want; templates can use either
      preferred_date: formattedPreferredDate,
      preferred_date_locale: formattedPreferredDateLocale,
      message: formData.message,
      // common template variables for recipient
      to_email: recipient,
      to: recipient,
      recipient_email: recipient,
      recipient: recipient,
      email_to: recipient,
    }

    const senderEmailRaw = (formData.email || '').toString().trim()
    const senderEmail = senderEmailRaw

    // reply params include several common recipient keys so templates expecting
    // different variable names will receive the address
    // Build reply params with the exact fields required by the client confirmation template
    const replyParams = {
      to_name: formData.name,
      from_name: formData.name,
      from_email: senderEmail,
      to_email: senderEmail,
      phone: formData.phone,
      preferred_date: formattedPreferredDate,
      preferred_date_locale: formattedPreferredDateLocale,
      message: formData.message,
    }

    if (!serviceId || !templateAdminId || !publicKey) {
      setErrorMessage('Booking submission not configured. Please contact support.')
      return
    }

    setIsSending(true)
    try {
      // send admin notification
      await emailjs.send(serviceId, templateAdminId, adminParams, publicKey)

      // optionally send client auto-reply only if template id is set and senderEmail is valid
      if (templateReplyId && senderEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(senderEmail)) {
          await emailjs.send(serviceId, templateReplyId, replyParams, publicKey)
        } else {
          console.warn('Skipping auto-reply: invalid sender email', senderEmail)
        }
      }

      setSuccessMessage('Thank you for booking a consultation! We will contact you shortly to confirm your appointment.')
      setErrorMessage(null)
      setFormData({ name: '', email: '', phone: '', preferredDate: '', preferredTime: '', message: '' })
    } catch (err: unknown) {
      console.error('EmailJS error', err)
      setErrorMessage('There was an error sending your booking. Please try again or email info@accreditedfs.com directly.')
      setSuccessMessage(null)
    } finally {
      setIsSending(false)
    }
  }
  return (
    <section id="booking" className="py-16 bg-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Book Your Free Consultation</h2>
          <p className="max-w-2xl mx-auto text-blue-100">Take the first step toward financial freedom. Schedule a free consultation with our credit repair experts.</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-gradient-to-br from-blue-700 to-blue-800 p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">What to Expect</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[#f0d541] flex items-center justify-center mr-3 mt-0.5 text-blue-800 font-semibold">1</span>
                  <div>
                    <h4 className="font-semibold">Free Credit Assessment</h4>
                    <p className="text-blue-200">We'll review your current credit situation and identify areas for improvement.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[#f0d541] flex items-center justify-center mr-3 mt-0.5 text-blue-800 font-semibold">2</span>
                  <div>
                    <h4 className="font-semibold">Personalized Strategy</h4>
                    <p className="text-blue-200">Our experts will create a customized plan to address your specific credit issues.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[#f0d541] flex items-center justify-center mr-3 mt-0.5 text-blue-800 font-semibold">3</span>
                  <div>
                    <h4 className="font-semibold">Clear Timeline</h4>
                    <p className="text-blue-200">We'll provide a realistic timeline for when you can expect to see improvements.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-[#f0d541] flex items-center justify-center mr-3 mt-0.5 text-blue-800 font-semibold">4</span>
                  <div>
                    <h4 className="font-semibold">Transparent Pricing</h4>
                    <p className="text-blue-200">You'll receive a clear breakdown of our services and pricing options.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 p-8 bg-white text-gray-800">
              <h3 className="text-2xl font-bold text-blue-800 mb-4">Schedule Now</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* inline status messages */}
                <div aria-live="polite" className="min-h-[2rem]">
                  {successMessage && <div className="bg-green-100 text-green-800 px-3 py-2 rounded-md mb-2">{successMessage}</div>}
                  {errorMessage && <div className="bg-red-100 text-red-800 px-3 py-2 rounded-md mb-2">{errorMessage}</div>}
                </div>
                <div>
                  <label htmlFor="name" className="block text-gray-700 mb-1">Full Name</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-700 mb-1">Email Address</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="preferredDate" className="block text-gray-700 mb-1">Preferred Date</label>
                      <input type="date" id="preferredDate" name="preferredDate" value={formData.preferredDate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label htmlFor="preferredTime" className="block text-gray-700 mb-1">Preferred Time </label>
                      <input type="time" id="preferredTime" name="preferredTime" value={formData.preferredTime} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="message" className="block text-gray-700 mb-1">Additional Information (Optional)</label>
                  <textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                <button type="submit" disabled={isSending} className={`w-full ${isSending ? 'opacity-60 cursor-not-allowed' : ''} bg-[#f0d541] text-blue-800 font-semibold py-3 px-4 rounded-md hover:bg-[#e6cb3d] transition-colors flex items-center justify-center`}>
                  {isSending ? (
                    // simple inline spinner + text
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2 text-blue-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Book My Free Consultation'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export default BookingCTA
