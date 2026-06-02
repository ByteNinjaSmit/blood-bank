import React from "react"
import { useState, useEffect, useRef } from "react"
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
import { Link, useNavigate } from "react-router-dom"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/store/auth"
import axios from "axios"
import { toast } from "sonner"

export default function BloodBankDoctorLoginPage() {
  const navigate = useNavigate();
  const { isLoggedIn, loginStartOtp, verifyOtpLogin, resendOtpLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile();
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  // OTP state
  const [step, setStep] = useState("credentials"); // "credentials" | "otp"
  const [txnId, setTxnId] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [expiresIn, setExpiresIn] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === "credentials") {
      setIsLoginLoading(true);
      try {
        const res = await loginStartOtp(formData.username, formData.password);
        setTxnId(res.txnId);
        setExpiresIn(res.expiresInSeconds || 300);
        setResendCooldown(res.resendCooldownSeconds || 30);
        setStep("otp");
        toast.success("OTP sent to your email");
      } catch (error) {
        const message = error?.response?.data?.message || "Login failed. Please try again.";
        toast.error(message);
      } finally {
        setIsLoginLoading(false);
      }
    } else if (step === "otp") {
      // verify OTP
      const code = otp.join("");
      if (code.length !== 6) {
        return toast.error("Enter 6-digit OTP");
      }
      setVerifying(true);
      try {
        await verifyOtpLogin(formData.username, txnId, code);
        toast.success("Login successful");
        navigate("/");
      } catch (error) {
        const message = error?.response?.data?.message || "Invalid OTP";
        toast.error(message);
      } finally {
        setVerifying(false);
      }
    }
  };

  // Countdown timers
  useEffect(() => {
    if (step !== "otp") return;
    if (expiresIn <= 0 && resendCooldown <= 0) return;
    const t = setInterval(() => {
      setExpiresIn((s) => (s > 0 ? s - 1 : 0));
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [step, expiresIn, resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await resendOtpLogin(formData.username, txnId);
      setResendCooldown(res.resendCooldownSeconds || 30);
      setExpiresIn(res.expiresInSeconds ?? expiresIn);
      toast.success("OTP resent");
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to resend OTP";
      toast.error(msg);
    }
  };

  const handleOtpChange = (idx, val) => {
    const v = val.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[idx] = v;
    setOtp(next);
    if (v && idx < otp.length - 1) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (!otp[idx] && idx > 0) {
        otpRefs.current[idx - 1]?.focus();
      }
      return;
    }
    if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      otpRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && idx < otp.length - 1) {
      e.preventDefault();
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const data = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, otp.length);
    if (!data) return;
    e.preventDefault();
    const next = [...otp];
    for (let i = 0; i < data.length; i++) {
      next[i] = data[i];
    }
    setOtp(next);
    const focusIndex = Math.min(data.length, otp.length - 1);
    otpRefs.current[focusIndex]?.focus();
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Blood Bank Panel */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-red-800 via-red-700 to-red-900 relative overflow-hidden min-h-[50vh] lg:min-h-screen">
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 transition-opacity duration-1000 ${mounted ? "opacity-100" : "opacity-0"
            }`}
        >
          {/* Main Heart Icon */}
          <div className="relative mb-4 sm:mb-6 lg:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/20 shadow-2xl">
              <Heart className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-red-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <Droplets className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            </div>
          </div>

          {/* Branding */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            {/* <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="bg-white text-red-800 text-xl sm:text-3xl lg:text-5xl font-bold py-2 sm:py-2 lg:py-3 px-2 sm:px-3 lg:px-4 rounded-xl shadow-lg">
                B
              </div>
              <div className="text-white text-xl sm:text-3xl lg:text-5xl font-bold ml-2 sm:ml-3">LOOD BANK</div>
            </div> */}
            <div className="border-4 border-red-300 text-white text-3xl font-bold rounded-2xl  flex flex-row shadow-2xl">
              <div className="bg-red-800 text-white text-3xl font-bold py-1 px-2 rounded-l-md shadow-2xl">SANJIVANI</div>
              <div className=" text-red-200 text-3xl font-bold py-1 px-2 rounded-md  shadow-2xl">BLOOD BANK</div>
            </div>
            <p className="text-white/90 text-sm sm:text-base lg:text-lg max-w-sm px-4 sm:px-0">
              Secure medical access to blood bank management system
            </p>
          </div>

          {/* Blood Bank Features Grid */}
          {!isMobile && <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 w-full max-w-sm sm:max-w-md px-4 sm:px-0">
            {bloodBankFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300"
              >
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white mb-1 sm:mb-2" />
                <h3 className="text-white font-semibold text-xs sm:text-xs lg:text-sm mb-1">{feature.label}</h3>
                <p className="text-white/70 text-xs leading-tight">{feature.description}</p>
              </div>
            ))}
          </div>}
        </div>

        {/* Decorative Elements - hidden on mobile for cleaner look */}
        <div className="absolute top-20 right-20 w-20 h-20 bg-white/5 rounded-full hidden lg:block"></div>
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-white/5 rounded-full hidden lg:block"></div>
        <div className="absolute top-1/3 left-8 w-12 h-12 bg-white/5 rounded-full hidden lg:block"></div>
      </div>

      {/* Right side - Login Form */}
      <div
        className={`w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 xl:p-16 transition-all duration-1000 relative min-h-[50vh] lg:min-h-screen ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
      >
        <div className="w-full max-w-md">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-800" /> Doctor <span className="text-red-800">Login</span>
          </h1>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Sign in to access the blood bank system</p>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {step === "credentials" && (
              <>
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-gray-700 block">Email ID</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input id="username" name="username" type="email" required value={formData.username} onChange={handleChange}
                      className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-800 text-sm sm:text-base"
                      placeholder="Enter your Email ID" />
                  </div>
                </div>
                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700 block">Password</label>
                    <Link href="#" className="text-sm font-medium text-red-800 hover:text-red-900">Forgot password?</Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input id="password" name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange}
                      className="block w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-800 text-sm sm:text-base"
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute cursor-pointer right-0 pr-3 sm:pr-4 inset-y-0 flex items-center">
                      {showPassword ? (<EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />) : (<Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />)}
                    </button>
                  </div>
                </div>
                <button type="submit" className={`w-full flex cursor-pointer items-center justify-center px-4 sm:px-6 py-3 sm:py-4 border border-transparent rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium text-white bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 transition-all duration-200 ${isLoginLoading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isLoginLoading}>
                  {isLoginLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path fill="currentColor" d="M4 12a8 8 0 1 1 16 0a8 8 0 0 1-16 0zm0 0a8 8 0 0 1 16 0a8 8 0 0 1-16 0z" className="opacity-50" /></svg>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">Enter 6-digit OTP</label>
                  <div className="flex items-center gap-2 justify-between">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={otp[i]}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-semibold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-800"
                      />
                    ))}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 flex items-center justify-between mt-1">
                    <span>Expires in {Math.floor(expiresIn/60)}:{String(expiresIn%60).padStart(2,'0')}</span>
                    <button type="button" onClick={handleResend} disabled={resendCooldown>0}
                      className={`text-red-800 hover:text-red-900 ${resendCooldown>0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      {resendCooldown>0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep("credentials")} className="w-1/3 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700">Back</button>
                  <button type="submit" className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-white bg-gradient-to-r from-red-800 to-red-900 ${verifying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} disabled={verifying}>
                    {verifying ? 'Verifying…' : 'Verify & Login'}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Security Badge */}
          <div className="mt-6 sm:mt-8 bg-red-800 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 shadow-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center mr-3">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-800" />
              </div>
              <div>
                <p className="text-white font-medium text-xs sm:text-sm">Medical Grade Security</p>
                <p className="text-white/70 text-xs">HIPAA compliant and secure access</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
