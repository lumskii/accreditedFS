import React, { useState } from 'react'

type FormData = {
  name: string
  email: string
  phone: string
  preferredDate: string
  message: string
}

const BookingCTA: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', phone: '', preferredDate: '', message: '' })
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real implementation, this would send the data to a server
    alert('Thank you for booking a consultation! We will contact you shortly to confirm your appointment.')
    setFormData({ name: '', email: '', phone: '', preferredDate: '', message: '' })
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
                  <label htmlFor="preferredDate" className="block text-gray-700 mb-1">Preferred Date & Time</label>
                  <input type="datetime-local" id="preferredDate" name="preferredDate" value={formData.preferredDate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-gray-700 mb-1">Additional Information (Optional)</label>
                  <textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                <button type="submit" className="w-full bg-[#f0d541] text-blue-800 font-semibold py-3 px-4 rounded-md hover:bg-[#e6cb3d] transition-colors">Book My Free Consultation</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export default BookingCTA
