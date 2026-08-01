import { motion } from "framer-motion";
import { Heart, Droplets, BarChart3, UserCheck, TestTube } from "lucide-react";

    const bloodBankFeatures = [
        { icon: Droplets, label: "Blood Inventory", description: "Manage blood units and stock levels" },
        { icon: UserCheck, label: "Donor Management", description: "Track donors and donation history" },
        { icon: TestTube, label: "Blood Testing", description: "Monitor test results and quality" },
        { icon: BarChart3, label: "Medical Reports", description: "Generate medical and inventory reports" },
    ]

export default function RegistrationBrandingPanel({ mounted, isMobile }) {
    return (
            <div className="w-full lg:w-1/2 bg-gradient-to-br from-red-950 via-red-900 to-red-800 relative overflow-hidden min-h-[50vh] lg:min-h-screen flex flex-col justify-center">
                
                {/* Decorative floating animated blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{
                            x: [0, 30, 0],
                            y: [0, -30, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-red-600/10 blur-3xl"
                    />
                    <motion.div
                        animate={{
                            x: [0, -20, 0],
                            y: [0, 40, 0],
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            duration: 18,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-rose-600/10 blur-3xl"
                    />
                </div>

                <div
                    className={`relative z-10 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 transition-opacity duration-1000 ${
                        mounted ? "opacity-100" : "opacity-0"
                    }`}
                >
                    {/* Main Heart Icon with pulsing ring */}
                    <div className="relative mb-6 sm:mb-8">
                        <motion.div 
                            animate={{ scale: [1, 1.04, 1] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            className="w-24 h-24 sm:w-28 sm:h-28 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl relative"
                        >
                            <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-30" />
                            <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-white fill-white/10" />
                        </motion.div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 sm:w-9 sm:h-9 bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                            <Droplets className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    {/* Branding */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-center mb-8 lg:mb-12 flex flex-col items-center"
                    >
                        <span className="text-[11px] sm:text-xs font-bold tracking-[0.25em] text-red-200/90 uppercase mb-2">
                            Sai Healthcare Foundation's
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md leading-tight">
                            SANJIVANI BLOOD BANK
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md text-white/95 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-widest border border-white/20 shadow-inner mt-3">
                            Kopargaon
                        </span>
                        <p className="text-white/80 text-xs sm:text-sm max-w-sm mt-4 leading-relaxed">
                            Join our secure medical blood bank management system and contribute to saving lives
                        </p>
                    </motion.div>

                    {/* Blood Bank Features Grid */}
                    {!isMobile && (
                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm sm:max-w-md px-4 sm:px-0">
                            {bloodBankFeatures.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                                    whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                                    className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg transition-all duration-300 group cursor-default"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:bg-red-650 group-hover:text-white transition-colors duration-300">
                                        <feature.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-white font-bold text-xs sm:text-sm mb-1">{feature.label}</h3>
                                    <p className="text-white/60 text-[11px] leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
    );
}
