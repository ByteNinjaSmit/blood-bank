import { Droplets, Heart, Users, Zap } from 'lucide-react';
import { SiTicktick } from "react-icons/si";

export default function AboutSection() {
 
  return (
    <div className="w-full bg-linear-to-br from-background to-muted mt-10 lg:mt-0">
      {/* About Section with Inclined Bottom */}
      <div className="bg-primary relative overflow-hidden"
      // style={{
      //   clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0 100%)'
      // }}
      >

        <div className=" mx-auto pr-4 sm:pr-6 lg:pr-8 py-8 sm:py-12 lg:py-16">
          <div className="text-center mb-10 sm:mb-14 flex justify-center items-center">
            <div className="pl-5 border-l-8 ml-2 md:ml-0 border-dotted border-white w-fit space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
                About Sanjivani Blood Bank
              </h1>

              <p className="text-base sm:text-lg  text-white max-w-lg leading-relaxed">
                Dedicated to Saving Lives Through Safe and Reliable Blood Services
                Promising excellence in every drop since 2000,
              </p>
            </div>
          </div>


          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            {/* Left Side - Image */}
            <div className="lg:col-span-2 max-w-2xl border-t-2 border-b-2 border-r-2 border-l-0 border-white  py-2 pr-4 rounded-r-xl">
              <div className="relative">
                <div className="rounded-r-2xl   overflow-hidden shadow-2xl bg-gradient-to-br from-primary-foreground/10 to-primary-foreground/5 border border-primary-foreground/20">
                  <iframe
                    title="Sanjivani Blood Bank location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1921044.762537746!2d72.03193315624995!3d19.880509500000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdc445f2f8849fd%3A0x8d207602e827dc43!2sSanjivani%20Blood%20Bank%2C%20Kopargaon!5e0!3m2!1sen!2sin!4v1763227960100!5m2!1sen!2sin"
                    width="800"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                {/* Decorative accent */}
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary-foreground/10 rounded-full blur-3xl"></div>
              </div>
            </div>

            {/* Right Side - Text Content */}
            <div className="lg:col-span-3 space-y-6 p-2">
              <p className="text-base sm:text-md md:text-lg text-primary-foreground/90 leading-relaxed">
                Welcome to our state-of-the-art blood bank facility. We are dedicated to ensuring a safe, reliable, and accessible blood supply for patients in need.<span className='text-lg sm:text-xl md:text-2xl font-semibold'>  Our mission is to save lives through the generous contributions of our valued donors.</span>
              </p>

              <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 leading-relaxed">
               <span className='text-lg sm:text-xl md:text-2xl font-semibold'> With over 20 years of experience in blood banking and transfusion services, we maintain the highest standards of safety, quality, and professionalism.</span> Our team of trained professionals works tirelessly to collect, test, and distribute blood to hospitals and medical centers across the region.
              </p>

              <div className="bg-primary-foreground/15 backdrop-blur-sm border-l-4 border-primary-foreground/25 border-dotted p-4 mt-8">
                <h3 className="font-semibold text-primary-foreground mb-3 text-sm sm:text-sm md:text-base uppercase tracking-wide">Our Commitment</h3>
                <ul className="space-y-2 text-sm sm:text-base md:text-lg text-primary-foreground/85 p-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-foreground/60 mt-1"><SiTicktick className='text-white' /></span>
                    <span className='text-white'>Strict quality control and safety protocols</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-foreground/60 mt-1"><SiTicktick className='text-white' /></span>
                    <span className='text-white'>Rapid response to emergency blood requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-foreground/60 mt-1"><SiTicktick className='text-white' /></span>
                    <span className='text-white'>Transparent donor screening and testing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Section */}
     
    </div>
  );
}
