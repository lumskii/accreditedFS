import React from 'react'
import { Star } from 'lucide-react'

const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
          <p className="max-w-2xl mx-auto text-gray-600">See how we've helped our clients achieve their financial goals through effective credit repair.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-[#f0d541]">
            <div className="flex text-[#f0d541] mb-4">
              <Star size={20} /><Star size={20} /><Star size={20} /><Star size={20} /><Star size={20} />
            </div>
            <p className="text-gray-600 mb-4">"After struggling with poor credit for years, Prestigious Financial Services helped me increase my score by 120 points in just 4 months. I was finally able to qualify for a home loan!"</p>
            <div className="font-semibold">Michael R.</div>
            <div className="text-sm text-gray-500">Scottsdale, AZ</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-[#f0d541]">
            <div className="flex text-[#f0d541] mb-4">
              <Star size={20} /><Star size={20} /><Star size={20} /><Star size={20} /><Star size={20} />
            </div>
            <p className="text-gray-600 mb-4">"The personalized approach made all the difference. They identified errors on my report that I had no idea existed and got them removed within weeks. My score jumped 85 points!"</p>
            <div className="font-semibold">Sarah T.</div>
            <div className="text-sm text-gray-500">Phoenix, AZ</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-[#f0d541]">
            <div className="flex text-[#f0d541] mb-4">
              <Star size={20} /><Star size={20} /><Star size={20} /><Star size={20} /><Star size={20} />
            </div>
            <p className="text-gray-600 mb-4">"I was denied for an auto loan due to my credit score. After working with Prestigious Financial Services for 3 months, I was approved with a great interest rate. Their expertise is worth every penny."</p>
            <div className="font-semibold">David L.</div>
            <div className="text-sm text-gray-500">Tempe, AZ</div>
          </div>
        </div>
        <div className="mt-12 bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-6 md:mb-0 md:pr-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Real Results</h3>
              <p className="text-gray-600 mb-4">Our clients see an average credit score increase of 75+ points within the first 90 days of working with us. We've helped hundreds of Phoenix residents qualify for better loans, lower interest rates, and improved financial opportunities.</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-700">75+</div>
                  <div className="text-sm text-gray-500">Avg. Point Increase</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-700">90</div>
                  <div className="text-sm text-gray-500">Days Average</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-700">500+</div>
                  <div className="text-sm text-gray-500">Satisfied Clients</div>
                </div>
              </div>
            </div>
            <div className="md:w-1/3">
              <a href="#booking" className="block w-full bg-[#f0d541] text-blue-800 text-center font-semibold px-6 py-3 rounded-md hover:bg-[#e6cb3d] transition-colors">Get Your Free Consultation</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export default Testimonials
