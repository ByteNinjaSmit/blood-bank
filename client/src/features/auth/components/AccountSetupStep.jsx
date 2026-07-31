import { Shield, UserCheck, Lock, Eye, EyeOff, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";

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

export default function AccountSetupStep({ formData, handleChange, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword, passwordStrength, handleSubmit, handlePrevStep }) {
    return (
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
    );
}
