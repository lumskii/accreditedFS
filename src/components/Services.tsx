import React from 'react'
import { ClipboardCheck, TrendingUp, Shield, FileText } from 'lucide-react'

const Services: React.FC = () => {
  return (
    <section id="services" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Credit Repair Services</h2>
          <p className="max-w-2xl mx-auto text-gray-600">We offer comprehensive credit repair solutions tailored to your unique financial situation.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-t-4 border-[#f0d541]">
            <div className="text-blue-700 mb-4"><ClipboardCheck size={40} /></div>
            <h3 className="text-xl font-semibold mb-2">Credit Analysis</h3>
            <p className="text-gray-600">Comprehensive review of your credit reports from all three bureaus to identify errors and negative items.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-t-4 border-[#f0d541]">
            <div className="text-blue-700 mb-4"><FileText size={40} /></div>
            <h3 className="text-xl font-semibold mb-2">Dispute Resolution</h3>
            <p className="text-gray-600">Professional handling of disputes for inaccurate, unverifiable, or outdated information on your reports.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-t-4 border-[#f0d541]">
            <div className="text-blue-700 mb-4"><TrendingUp size={40} /></div>
            <h3 className="text-xl font-semibold mb-2">Score Improvement</h3>
            <p className="text-gray-600">Strategic planning to help you build positive credit history and improve your overall credit score.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-t-4 border-[#f0d541]">
            <div className="text-blue-700 mb-4"><Shield size={40} /></div>
            <h3 className="text-xl font-semibold mb-2">Credit Education</h3>
            <p className="text-gray-600">Personalized guidance on maintaining good credit and avoiding common pitfalls in the future.</p>
          </div>
        </div>
        <div className="mt-12 text-center">
          <a href="#booking" className="inline-block bg-[#f0d541] text-blue-800 font-semibold px-6 py-3 rounded-md hover:bg-[#e6cb3d] transition-colors">Get Started Today</a>
        </div>
      </div>
    </section>
  )
}
export default Services
