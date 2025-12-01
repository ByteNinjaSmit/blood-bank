import { Droplets, Heart, Users, Zap, Clock, Shield } from 'lucide-react';
import { SiTicktick } from "react-icons/si";
import { Badge } from "@/components/ui/badge"; // Assuming Badge is available
import type { LucideIcon } from 'lucide-react'; // Import LucideIcon type

// 1. Define the TypeScript interface for the StatCard props
interface StatCardProps {
    icon: LucideIcon | any; // Type for the Lucide or React-Icon component
    value: string | number; // Type for the value displayed
    label: string; // Type for the label
    delay?: number; // Optional type for delay
}

export default function AboutSection() {

    // 2. Apply the interface to the StatCard function signature
    const StatCard = ({ icon: Icon, value, label, delay = 0 }: StatCardProps) => (
        <div
            className="bg-primary-foreground text-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.03] flex flex-col items-center space-y-3 border-b-4 border-primary/50"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="p-3 bg-primary/10 rounded-full w-fit">
                <Icon className="w-8 h-8 text-primary" />
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-foreground">{value}</p>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
    );

    return (
        <div id="about" className="w-full">
            <div className="bg-primary relative overflow-hidden py-16 sm:py-20 lg:py-24 shadow-2xl">

                <div className="absolute top-0 left-0 w-full h-full opacity-5">
                    <div className="absolute top-1/4 -left-32 w-80 h-80 bg-primary-foreground/20 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-primary-foreground/20 rounded-full blur-[100px]"></div>
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

                    <div className="text-center mb-12 sm:mb-16">
                        <div className="inline-block relative w-fit space-y-2 pb-3">
                            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-widest rounded-full">
                                Our Mission
                            </Badge>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                                About Sanjivani Blood Bank
                            </h1>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-white/50 rounded-full"></div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">

                        {/* Left Side - Image/Map */}
                        <div className="lg:col-span-2 order-1 lg:order-1">
                            <div className="relative overflow-hidden rounded-3xl shadow-2xl transform hover:scale-[1.01] transition-transform duration-500 ring-4 ring-white/20">
                                <iframe
                                    title="Sanjivani Blood Bank location"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13614.279379086149!2d74.47097476856362!3d19.886050665822744!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdc445f2f8849fd%3A0x8d207602e827dc43!2sSanjivani%20Blood%20Bank%2C%20Kopargaon!5e1!3m2!1sen!2sin!4v1764143748201!5m2!1sen!2sin"
                                    width="100%"
                                    height="250"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className='rounded-3xl'
                                />
                                {/* Decorative accent */}
                                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                            </div>
                            <p className="text-center mt-4 text-white/70 text-sm font-medium">Find us on the map (For illustrative purposes)</p>
                        </div>

                        {/* Right Side - Text Content */}
                        <div className="lg:col-span-3 space-y-8 p-2 order-1 lg:order-2">
                            <p className="text-xl sm:text-2xl text-white font-semibold leading-relaxed border-l-4 border-white/50 pl-4">
                                Welcome to our state-of-the-art blood bank facility. Our mission is to **save lives** through the generous contributions of our valued donors by ensuring a safe, reliable, and accessible blood supply for patients in need.
                            </p>

                            <p className="text-base sm:text-lg text-white/90 leading-relaxed">
                                <span className='font-bold text-white'>With over 20 years of experience</span> in blood banking and transfusion services, we maintain the highest standards of safety, quality, and professionalism. Our team of trained professionals works tirelessly to collect, test, and distribute blood to hospitals and medical centers across the region.
                            </p>

                            {/* Commitment List - Enhanced Card Styling */}
                            <div className="bg-white/10 rounded-xl p-6 shadow-inner border border-white/20">
                                <h3 className="font-extrabold text-white mb-4 text-lg sm:text-xl uppercase tracking-wider flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-white" />
                                    Our Core Commitment
                                </h3>
                                <ul className="space-y-3 text-base sm:text-lg text-white/90">
                                    <li className="flex items-center gap-3">
                                        <SiTicktick className='text-primary-foreground w-5 h-5 bg-accent rounded-full p-0.5 shrink-0' />
                                        <span className='font-medium'>Strict quality control and safety protocols</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <SiTicktick className='text-primary-foreground w-5 h-5 bg-accent rounded-full p-0.5 shrink-0' />
                                        <span className='font-medium'>Rapid 24/7 response to emergency blood requirements</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <SiTicktick className='text-primary-foreground w-5 h-5 bg-accent rounded-full p-0.5 shrink-0' />
                                        <span className='font-medium'>Transparent donor screening and comprehensive testing</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="text-sm font-medium text-white/70 pt-2">
                                "Promising excellence in every drop since 2000."
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPIs Section - New Section Added for Visual Stats */}
            {/* The stats section is commented out in your original code, but included here for completeness if you uncomment it */}
            {/* <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                    <StatCard icon={Droplets} value="10K+" label="Successful Donations" delay={0} />
                    <StatCard icon={Heart} value="50+" label="Beds Capacity" delay={100} />
                    <StatCard icon={Users} value="400+" label="Active Volunteers" delay={200} />
                    <StatCard icon={Zap} value="24/7" label="Emergency Service" delay={300} />
                </div>
            </div> 
            */}
        </div>
    );
}