"use client"
import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
    ArrowRight,
    ArrowLeft,
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
    Mail,
    Phone,
    UserPlus,
    CheckCircle,
} from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { toast } from "sonner"
import axios from "axios"
import { useAuth } from "@/store/auth"

export default function RegisterPage() {
    const navigate = useNavigate();
    const { isLoggedIn, registerStartOtp, verifyRegisterOtp, resendRegisterOtp } = useAuth();
    const [currentStep, setCurrentStep] = useState(1)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        hasUppercase: false,
        hasNumber: false,
        hasSymbol: false,
        label: "Weak",
    })
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "",
        password: "",
        confirmPassword: "",
    })
    const [mounted, setMounted] = useState(false)
    const isMobile = useIsMobile()
    useEffect(() => {
        setMounted(true)
    }, [])

    const checkPasswordStrength = (password) => {
        const hasUppercase = /[A-Z]/.test(password)
        const hasNumber = /[0-9]/.test(password)
        const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

        let score = 0
        if (hasUppercase) score++
        if (hasNumber) score++
        if (hasSymbol) score++

        let label = "Weak"
        if (score === 1) label = "Fair"
        else if (score === 2) label = "Good"
        else if (score === 3) label = "Strong"

        return {
            score,
            hasUppercase,
            hasNumber,
            hasSymbol,
            label,
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))

        if (name === "password") {
            setPasswordStrength(checkPasswordStrength(value))
        }
    }

    const handleNextStep = (e) => {
        e.preventDefault()
        if (currentStep === 1) {
            setCurrentStep(2)
        }
    }

    const handlePrevStep = () => {
        setCurrentStep(1)
    }

    // OTP state and handlers
    const [txnId, setTxnId] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [expiresIn, setExpiresIn] = useState(0);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [verifying, setVerifying] = useState(false);
    const otpRefs = useRef([]);

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (formData.password !== formData.confirmPassword) {
            toast.warning("Passwords don't match!")
            return
        }
        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone || undefined,
                role: formData.role,
                password: formData.confirmPassword,
            };
            const res = await registerStartOtp(payload);
            setTxnId(res.txnId);
            setExpiresIn(res.expiresInSeconds || 300);
            setResendCooldown(res.resendCooldownSeconds || 30);
            setCurrentStep(3);
            toast.success("OTP sent to your email");
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || "Failed to start registration";
            toast.error(msg);
        }
    }

    // Countdown timers
    useEffect(() => {
        if (currentStep !== 3) return;
        if (expiresIn <= 0 && resendCooldown <= 0) return;
        const t = setInterval(() => {
            setExpiresIn((s) => (s > 0 ? s - 1 : 0));
            setResendCooldown((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
        return () => clearInterval(t);
    }, [currentStep, expiresIn, resendCooldown]);

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            const res = await resendRegisterOtp(formData.email, txnId);
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
        for (let i = 0; i < data.length; i++) next[i] = data[i];
        setOtp(next);
        const focusIndex = Math.min(data.length, otp.length - 1);
        otpRefs.current[focusIndex]?.focus();
    };

    const bloodBankFeatures = [
        { icon: Droplets, label: "Blood Inventory", description: "Manage blood units and stock levels" },
        { icon: UserCheck, label: "Donor Management", description: "Track donors and donation history" },
        { icon: TestTube, label: "Blood Testing", description: "Monitor test results and quality" },
        { icon: BarChart3, label: "Medical Reports", description: "Generate medical and inventory reports" },
    ]

    const roles = [
        { value: "system-admin", label: "System Administrator" },
        { value: "bbo", label: "Blood Bank Officer (BBO)" },
        { value: "medical-officer", label: "Medical Officer" },
        { value: "counsellor", label: "Counsellor" },
        { value: "phlebotomist", label: "Phlebotomist" },
        { value: "lab-tech-component", label: "Lab Tech — Component" },
        { value: "lab-tech-serology", label: "Lab Tech — Serology" },
        { value: "store-keeper", label: "Store Keeper" },
        { value: "issue-counter", label: "Issue Counter" },
        { value: "apheresis-tech", label: "Apheresis Technician" },
        { value: "qa-manager", label: "QA Manager" },
        { value: "auditor", label: "Auditor" },
        { value: "camp-organiser", label: "Camp Organiser" },
        { value: "hospital-user", label: "Hospital User" },
    ]

    if (isLoggedIn) {
        navigate('/');
    }


    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Left side - Blood Bank Panel */}
            <div className="w-full lg:w-1/2 bg-gradient-to-br from-red-800 via-red-700 to-red-900 relative overflow-hidden min-h-[50vh] lg:min-h-screen">
                <div
                    className={`absolute inset-0 flex flex-col items-center  p-6 sm:p-8 lg:p-12 transition-opacity duration-1000 ${mounted ? "opacity-100" : "opacity-0"
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
                        {/* Title Section */}
                        <div className="flex flex-col lg:flex-row items-center justify-center mb-4 gap-2 sm:gap-3 lg:gap-4">

                            {/* Logo + First Word */}
                            <div className="border-4 border-red-300 text-white text-3xl font-bold rounded-2xl  flex flex-row shadow-2xl">
                                <div className="bg-red-800 text-white text-3xl font-bold py-1 px-2 rounded-l-md shadow-2xl">SANJIVANI</div>
                                <div className=" text-red-200 text-3xl font-bold py-1 px-2 rounded-md  shadow-2xl">BLOOD BANK</div>
                            </div>


                        </div>

                        {/* Tagline */}
                        <p className="text-white/90 text-sm sm:text-base lg:text-lg max-w-md px-4 sm:px-0 mx-auto">
                            Join our secure medical blood bank management system
                        </p>
                    </div>


                    {/* Blood Bank Features Grid */}
                    {!isMobile && (
                        <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 w-full max-w-sm sm:max-w-md px-4 sm:px-0">
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
                        </div>
                    )}
                </div>

                {/* Decorative Elements - hidden on mobile for cleaner look */}
                <div className="absolute top-20 right-20 w-20 h-20 bg-white/5 rounded-full hidden lg:block"></div>
                <div className="absolute bottom-32 left-16 w-16 h-16 bg-white/5 rounded-full hidden lg:block"></div>
                <div className="absolute top-1/3 left-8 w-12 h-12 bg-white/5 rounded-full hidden lg:block"></div>
            </div>

            {/* Right side - Registration Form */}
            <div
                className={`w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-4 lg:p-12 xl:p-16 transition-all duration-1000 relative min-h-[50vh] lg:min-h-screen ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    }`}
            >
                <div className="w-full flex flex-col items-center">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-red-800" /> Doctor{" "}
                        <span className="text-red-800">Register</span>
                    </h1>
                    <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
                        Create your account to access the blood bank system
                    </p>

                    {/* Step Indicator */}
                    <div className="flex w-full items-center justify-center mb-6 sm:mb-8">
                        <div className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? "bg-red-800 text-white" : "bg-gray-200 text-gray-600"
                                    }`}
                            >
                                {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
                            </div>
                            <div className={`w-16 h-1 mx-2 ${currentStep >= 2 ? "bg-red-800" : "bg-gray-200"}`}></div>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? "bg-red-800 text-white" : "bg-gray-200 text-gray-600"
                                    }`}
                            >
                                2
                            </div>
                            <div className={`w-16 h-1 mx-2 ${currentStep >= 3 ? "bg-red-800" : "bg-gray-200"}`}></div>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 3 ? "bg-red-800 text-white" : "bg-gray-200 text-gray-600"}`}
                            >
                                3
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <form onSubmit={handleNextStep} className="w-full space-y-4 sm:space-y-6">
                            <div className="text-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                                <p className="text-sm text-gray-600">Tell us about yourself</p>
                            </div>

                            {/* First Name */}
                            <div className="space-y-2 w-full">
                                <label htmlFor="firstName" className="text-sm font-medium text-gray-700 block">
                                    First Name
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-800 text-sm sm:text-base"
                                        placeholder="Enter your first name"
                                    />
                                </div>
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="text-sm font-medium text-gray-700 block">
                                    Last Name
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-800 text-sm sm:text-base"
                                        placeholder="Enter your last name"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-800 text-sm sm:text-base"
                                        placeholder="Enter your email address"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-medium text-gray-700 block">
                                    Phone Number
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        required
                                        pattern="[0-9]{10}"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-800 text-sm sm:text-base"
                                        placeholder="Enter 10-digit phone number"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex cursor-pointer items-center justify-center px-4 sm:px-6 py-3 sm:py-4 border border-transparent rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium text-white bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 transition-all duration-200"
                            >
                                Continue to Account Setup
                                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                        </form>
                    )}

                    {/* Step 3: Email OTP Verify */}
                    {currentStep === 3 && (
                        <form onSubmit={(e) => { e.preventDefault(); }} className="w-full space-y-4 sm:space-y-6">
                            <div className="text-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Verify Your Email</h2>
                                <p className="text-sm text-gray-600">Enter the 6-digit OTP sent to <span className="font-medium">{formData.email}</span></p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 block">One-Time Passcode</label>
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
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="w-1/3 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const code = otp.join("");
                                        if (code.length !== 6) return toast.error("Enter 6-digit OTP");
                                        setVerifying(true);
                                        try {
                                            await verifyRegisterOtp(formData.email, txnId, code);
                                            toast.success("Registration complete. You can now login.");
                                            navigate("/login");
                                        } catch (e) {
                                            const msg = e?.response?.data?.message || e?.message || "Invalid OTP";
                                            toast.error(msg);
                                        } finally {
                                            setVerifying(false);
                                        }
                                    }}
                                    className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-white bg-gradient-to-r from-red-800 to-red-900 ${verifying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    disabled={verifying}
                                >
                                    {verifying ? 'Verifying…' : 'Verify & Create Account'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 2: Account Setup */}
                    {currentStep === 2 && (
                        <form onSubmit={handleSubmit} className="w-full space-y-4 sm:space-y-6">
                            <div className="text-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Account Setup</h2>
                                <p className="text-sm text-gray-600">Complete your registration</p>
                            </div>

                            {/* Public ID */}
                            <div className="space-y-2">
                                <label htmlFor="publicId" className="text-sm font-medium text-gray-700 block">
                                    Public ID
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="publicId"
                                        name="publicId"
                                        type="text"
                                        disabled={true}
                                        value={formData.publicId || ''}
                                        onChange={handleChange}
                                        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-800 text-sm sm:text-base"
                                        placeholder="Auto-generated ID"
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <label htmlFor="role" className="text-sm font-medium text-gray-700 block">
                                    Role
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                        <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    </div>
                                    <select
                                        id="role"
                                        name="role"
                                        required
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 focus:outline-none focus:border-red-800 text-sm sm:text-base appearance-none"
                                    >
                                        <option value="" disabled hidden>
                                            Select Role
                                        </option>

                                        {roles.map((role) => (
                                            <option
                                                key={role.value}
                                                value={role.value}
                                                className="bg-white text-gray-900 focus:bg-orange-800 hover:bg-red-100 cursor-pointer"
                                            >
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>

                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-gray-700 block">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="block w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-800 text-sm sm:text-base"
                                        placeholder="Create a strong password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute cursor-pointer right-0 pr-3 sm:pr-4 inset-y-0 flex items-center"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>

                                {formData.password && (
                                    <div className="mt-2 space-y-2">
                                        {/* Progress Bar */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.score === 0
                                                        ? "w-1/4 bg-red-500"
                                                        : passwordStrength.score === 1
                                                            ? "w-2/4 bg-orange-500"
                                                            : passwordStrength.score === 2
                                                                ? "w-3/4 bg-yellow-500"
                                                                : "w-full bg-green-500"
                                                        }`}
                                                />
                                            </div>
                                            <span
                                                className={`text-xs font-medium ${passwordStrength.score === 0
                                                    ? "text-red-600"
                                                    : passwordStrength.score === 1
                                                        ? "text-orange-600"
                                                        : passwordStrength.score === 2
                                                            ? "text-yellow-600"
                                                            : "text-green-600"
                                                    }`}
                                            >
                                                {passwordStrength.label}
                                            </span>
                                        </div>

                                        {/* Requirements Checklist */}
                                        <div className="grid grid-cols-1 gap-1 text-xs">
                                            <div
                                                className={`flex items-center gap-2 ${passwordStrength.hasUppercase ? "text-green-600" : "text-gray-500"}`}
                                            >
                                                <div
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${passwordStrength.hasUppercase ? "bg-green-100" : "bg-gray-100"}`}
                                                >
                                                    {passwordStrength.hasUppercase && <CheckCircle className="w-2 h-2" />}
                                                </div>
                                                <span>Uppercase letter</span>
                                            </div>
                                            <div
                                                className={`flex items-center gap-2 ${passwordStrength.hasNumber ? "text-green-600" : "text-gray-500"}`}
                                            >
                                                <div
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${passwordStrength.hasNumber ? "bg-green-100" : "bg-gray-100"}`}
                                                >
                                                    {passwordStrength.hasNumber && <CheckCircle className="w-2 h-2" />}
                                                </div>
                                                <span>Number</span>
                                            </div>
                                            <div
                                                className={`flex items-center gap-2 ${passwordStrength.hasSymbol ? "text-green-600" : "text-gray-500"}`}
                                            >
                                                <div
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center ${passwordStrength.hasSymbol ? "bg-green-100" : "bg-gray-100"}`}
                                                >
                                                    {passwordStrength.hasSymbol && <CheckCircle className="w-2 h-2" />}
                                                </div>
                                                <span>Symbol (!@#$%^&*)</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block">
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="block w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-800 text-sm sm:text-base"
                                        placeholder="Confirm your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute cursor-pointer right-0 pr-3 sm:pr-4 inset-y-0 flex items-center"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    className="flex-1 flex cursor-pointer items-center justify-center px-4 sm:px-6 py-3 sm:py-4 border-2 border-red-800 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium text-red-800 bg-white hover:bg-red-50 transition-all duration-200"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 flex cursor-pointer items-center justify-center px-4 sm:px-6 py-3 sm:py-4 border border-transparent rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium text-white bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 transition-all duration-200"
                                >
                                    Create
                                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Security Badge */}
                    <div className="mt-6 sm:mt-8 bg-red-800 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 shadow-lg">
                        <div className="flex items-center">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center mr-3">
                                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-800" />
                            </div>
                            <div>
                                <p className="text-white font-medium text-xs sm:text-sm">Medical Grade Security</p>
                                <p className="text-white/70 text-xs">HIPAA compliant registration process</p>
                            </div>
                        </div>
                    </div>

                    {/* Login Link */}
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{" "}
                            <Link href="/login" className="font-medium text-red-800 hover:text-red-900">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
