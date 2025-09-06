import React from 'react'
import { CheckCircle } from 'lucide-react'

const Hero: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-blue-800 to-blue-700 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Rebuild Your Credit. <br />
              Reclaim Your Future.
            </h1>
            <p className="text-xl mb-8 text-blue-100">The premier credit repair service helping individuals and families improve their financial standing with personalized strategies.</p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#f0d541] mr-2" />
                <span>Personalized credit repair strategies</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#f0d541] mr-2" />
                <span>Expert knowledge of credit laws</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#f0d541] mr-2" />
                <span>Proven success with hundreds of clients</span>
              </div>
            </div>
            <a href="#booking" className="inline-block bg-[#f0d541] text-blue-800 font-semibold px-6 py-3 rounded-md hover:bg-[#e6cb3d] transition-colors">Schedule Free Consultation</a>
          </div>
          <div className="md:w-1/2 md:pl-10">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-blue-800 text-xl font-semibold mb-2">See How We Can Help</h3>
              <p className="text-gray-600 mb-6">Enter your information for a free credit score assessment</p>
              <form className="space-y-4">
                <div>
                  <input type="text" placeholder="Full Name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <input type="email" placeholder="Email Address" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <input type="tel" placeholder="Phone Number" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">Get Free Assessment</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export default Hero
