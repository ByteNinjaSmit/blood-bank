import { useState, useEffect } from "react"
import { Home, Shield, Heart, Clock } from "lucide-react"

export default function EnhancedLoader() {
  const [mounted, setMounted] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setMounted(true)

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 300)

    return () => clearInterval(interval)
  }, [])

  const loadingTips = [
    "Preparing your secure session...",
    "Loading blood bank modules...",
    "Authenticating user credentials...",
    "Initializing system components...",
    "Almost ready..."
  ]

  const currentTip = loadingTips[Math.min(Math.floor(progress / 20), loadingTips.length - 1)]

  return (
    <div className="min-h-screen flex flex-col justify-center lg:flex-row">
      <div
        className={`w-full flex items-center justify-center p-4 sm:p-4 lg:p-8 xl:p-10 transition-all duration-1000 relative min-h-[50vh] lg:min-h-screen ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
      >
        <div className="w-full flex flex-col items-center max-w-4xl">
          {/* Loader Header */}
          <div className="w-full flex flex-col lg:flex-row items-center gap-8 mb-8">
            {/* Animated Timer */}
            <div className="flex-shrink-0">
              <div className="relative">
                <img
                  src="/timer.gif"
                  alt="Sand Clock Timer"
                  width="200"
                  height="200"
                  className="sand-clock-gif drop-shadow-2xl"
                />
                {/* Progress Ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border-4 border-gray-200">
                    <div
                      className="w-48 h-48 animate-spin rounded-full border-4 border-red-800 border-t-transparent border-r-transparent transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Loader Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Blood Bank System
              </h1>
              <div className="text-4xl sm:text-5xl font-bold text-red-800 mb-6">
                Loading . . .
              </div>

              {/* Loading Tip */}
              <p className="text-gray-600 text-lg font-medium mb-4">
                {currentTip}
              </p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-6 sm:mt-8 bg-red-800 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg w-full max-w-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center mr-4">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-red-800" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm sm:text-base">Secure Session Initialization</p>
                  <p className="text-white/70 text-xs sm:text-sm">Encrypting your connection</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className="w-2 h-2 bg-white/50 rounded-full animate-pulse"
                    style={{ animationDelay: `${dot * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              This should only take a moment. Please don't refresh the page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}