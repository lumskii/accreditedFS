import React from 'react'

const About: React.FC = () => {
  return (
    <section id="about" className="py-16 bg-gradient-to-b from-white to-[#f8f8f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-12">
            <img src="/assets/profilePic2.jpg" alt="Accredited Financial Services Team" className="rounded-lg shadow-lg w-full" />
              <div className="mt-4 text-center">
                <p className="text-xl font-semibold text-blue-800">Ola S. <span className="text-sm font-medium text-[#000]">(CEO)</span></p>
              </div>
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About Me</h2>
            <p className="text-gray-600 mb-6">As a finance major, I began my credit journey in 2018, determined to build strong credit for myself. Through strategic planning and persistence, I raised my score into the high 700s and discovered a passion for helping others do the same.</p>
            <p className="text-gray-600 mb-6">Along the way, friends and family began asking me for guidance, and I discovered how much I enjoy teaching others what most of us were never taught in school — how credit really works. Over time, I turned this knowledge into a service that makes credit repair simple and effective.</p>
            <p className="text-gray-600 mb-6">Today, I use that same approach to help individuals take control of their credit, overcome challenges, and build a foundation for lasting financial success.</p>
            <div className="flex space-x-4">
              <a href="#booking" className="bg-[#f0d541] text-blue-800 font-semibold px-6 py-3 rounded-md hover:bg-[#e6cb3d] transition-colors">Schedule a Consultation</a>
              <a href="#contact" className="bg-white text-gray-800 font-semibold px-6 py-3 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export default About
