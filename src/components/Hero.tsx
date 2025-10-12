import React from 'react'
import { CheckCircle } from 'lucide-react'

const Hero: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-blue-800 to-blue-700 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Accredited Financial Services
            </h1>
            <p className="text-xl mb-2 text-[#f0d541] font-semibold">Rebuild Your Credit. Reclaim Your Future.</p>
            <p className="text-xl mb-8 text-blue-100">The premier credit repair service helping individuals and families improve their financial standing with personalized strategies and expert knowledge of credit laws.</p>
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
            <a 
              href="#booking" 
              className="inline-block bg-[#f0d541] text-blue-800 font-semibold px-6 py-3 rounded-md hover:bg-[#e6cb3d] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
              aria-label="Schedule your free credit repair consultation"
            >
              Schedule Free Consultation
            </a>
          </div>
          <div className="md:w-1/2 md:pl-10 flex items-center justify-center">
            <div className="w-full max-w-md">
              <img 
                src="/assets/credit_solution-min.png" 
                alt="Arizona credit repair services showing credit score improvement from poor to excellent" 
                className="w-full h-auto rounded-lg shadow-lg bg-white" 
                loading="eager"
                decoding="async"
                width="400"
                height="300"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export default Hero
