import React, { useState } from 'react'
import { Mail, CheckCircle } from 'lucide-react'

const EmailSubscription: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real implementation, this would send the email to a server
    setIsSubmitted(true)
    setEmail('')
    // Reset the submission state after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false)
    }, 5000)
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
                  <button type="submit" className="w-full bg-blue-700 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-800 transition-colors flex items-center justify-center"><Mail className="h-5 w-5 mr-2" />Get Free Dispute Letter</button>
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
export default EmailSubscription
