import React from 'react'
import { User, Award, Clock, DollarSign, Heart } from 'lucide-react'

const Benefits: React.FC = () => {
  return (
    <section id="benefits" className="py-16 bg-gradient-to-b from-[#f0f5ff] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Accredited Financial Services</h2>
          <p className="max-w-2xl mx-auto text-gray-600">We stand out from other credit repair services through our personalized approach and proven results.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-[#f0d541] p-3 rounded-full mr-4"><User className="h-6 w-6 text-blue-800" /></div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Personalized Approach</h3>
              <p className="text-gray-600">We create customized strategies based on your unique credit situation, not a one-size-fits-all solution.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-[#f0d541] p-3 rounded-full mr-4"><Award className="h-6 w-6 text-blue-800" /></div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Expert Knowledge</h3>
              <p className="text-gray-600">Our team has extensive knowledge of credit laws and regulations to effectively advocate on your behalf.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-[#f0d541] p-3 rounded-full mr-4"><Clock className="h-6 w-6 text-blue-800" /></div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Faster Results</h3>
              <p className="text-gray-600">Our proven methods can help you see improvements in your credit score in as little as 30-60 days.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-[#f0d541] p-3 rounded-full mr-4"><DollarSign className="h-6 w-6 text-blue-800" /></div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Transparent Pricing</h3>
              <p className="text-gray-600">No hidden fees or surprises. We offer clear, affordable pricing with a satisfaction guarantee.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-[#f0d541] p-3 rounded-full mr-4"><Heart className="h-6 w-6 text-blue-800" /></div>
            <div>
              <h3 className="text-xl font-semibold mb-2">National Expertise</h3>
              <p className="text-gray-600">We understand the economic factors that impact our clients' credit across the country.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-[#f0d541] p-3 rounded-full mr-4"><User className="h-6 w-6 text-blue-800" /></div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Ongoing Support</h3>
              <p className="text-gray-600">We provide continuous education and support to help you maintain good credit long after our services.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export default Benefits
