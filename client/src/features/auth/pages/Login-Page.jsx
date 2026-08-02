import React from "react"
import { useState, useEffect } from "react"
import {
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  User,
  Shield,
  BarChart3,
  Droplets,
  Heart,
  TestTube,
  UserCheck,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/store/auth"
import { toast } from "sonner"
import { motion } from "framer-motion"

export default function BloodBankDoctorLoginPage() {
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile();
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoginLoading(true);
    try {
      await login(formData.username, formData.password);
      toast.success("Login successful");
      navigate("/");
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoginLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);



  const bloodBankFeatures = [
    { icon: Droplets, label: "Blood Inventory", description: "Manage blood units and stock levels" },
    { icon: UserCheck, label: "Donor Management", description: "Track donors and donation history" },
    { icon: TestTube, label: "Blood Testing", description: "Monitor test results and quality" },
    { icon: BarChart3, label: "Medical Reports", description: "Generate medical and inventory reports" },
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#faf9f9] overflow-x-hidden">
      {/* Left side - Blood Bank Panel */}
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
              Secure medical portal for blood inventory, testing and distribution operations
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

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 xl:p-16 relative min-h-[50vh] lg:min-h-screen">
        {/* Background decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-2xl shadow-slate-100/50 relative z-10"
        >
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 flex items-center gap-2.5">
              <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-red-600 fill-red-500/10 animate-pulse shrink-0" /> 
              <span className="bg-gradient-to-r from-red-800 to-red-600 bg-clip-text text-transparent">Login</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Enter your credentials to access the Sanjivani Blood Bank operations portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Email ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                </div>
                <input 
                  id="username" 
                  name="username" 
                  type="email" 
                  required 
                  value={formData.username} 
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all text-sm sm:text-base"
                  placeholder="Enter your registered email" 
                />
              </div>
            </div>
            
            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => toast.info('Contact your system administrator to reset your password.')}
                  className="text-[11px] font-bold text-red-650 hover:text-red-750 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                </div>
                <input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={formData.password} 
                  onChange={handleChange}
                  className="block w-full pl-11 pr-11 py-3.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all text-sm sm:text-base"
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute cursor-pointer right-3 inset-y-0 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5 sm:h-5 sm:w-5" /> : <Eye className="h-4.5 w-4.5 sm:h-5 sm:w-5" />}
                </button>
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className={`w-full flex cursor-pointer items-center justify-center px-6 py-3.5 border border-transparent rounded-xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 shadow-lg shadow-red-900/10 hover:shadow-red-900/20 transition-all duration-200 ${isLoginLoading ? 'opacity-50 cursor-not-allowed' : ''}`} 
              disabled={isLoginLoading}
            >
              {isLoginLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          {/* Security Badge */}
          <div className="mt-6 sm:mt-8 bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-all duration-300 hover:bg-slate-100/50 flex items-center gap-3.5">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-800 font-bold text-xs sm:text-sm">Medical Grade Security</p>
              <p className="text-slate-500 text-[10px] sm:text-xs">Secure and compliant authentication protocol</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
