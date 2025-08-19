// src/context/AuthContext.jsx

import axios from "axios"
import { createContext, useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export const AuthContext = createContext()

// Helper function to get token from cookies
const getTokenFromCookies = () => {
  if (typeof document === "undefined") return null
  const cookieValue = document.cookie.split("; ").find((row) => row.startsWith("authToken="))
  return cookieValue ? cookieValue.split("=")[1] : null
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(getTokenFromCookies())
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isDeveloper, setIsDeveloper] = useState(false)
  const [isProfileComplete, setIsProfileComplete] = useState(false)

  const navigate = useNavigate()
  const authorizationToken = `Bearer ${token}`

  // Function to store token in cookies
  const storeTokenInCookies = (serverToken) => {
    setToken(serverToken)
    if (typeof document !== "undefined") {
      document.cookie = `authToken=${serverToken}; path=/; max-age=3600; secure; samesite=strict`
    }
  }

  // API URL from environment variables (Vite syntax)
  const API = import.meta.env.VITE_SERVER_URL

  // Check if the user is logged in
  const isLoggedIn = !!token

  const loginUser = async (credentials) => {
    try {
      setIsLoading(true)
      const response = await axios.post(`${API}/api/auth/login`, credentials, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      })

      if (response.status === 200) {
        storeTokenInCookies(response.data.token)
        toast.success(response.data.message || "Login successful")
        await userAuthentication()
        navigate("/dashboard")
        return { success: true }
      }
    } catch (error) {
      console.error("Login error:", error)
      const errorMessage = error.response?.data?.message || "Login failed"
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const LogoutUser = () => {
    setToken(null)
    setUser(null)
    setIsAdmin(false)
    setIsDeveloper(false)
    setIsProfileComplete(false)

    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("cart")
    }

    if (typeof document !== "undefined") {
      document.cookie = "authToken=; path=/; max-age=0"
    }

    toast.success("Logout Successfully")

    setTimeout(() => {
      navigate("/login")
    }, 500)
  }

  const userAuthentication = async () => {
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await axios.get(`${API}/api/auth/current-user`, {
        headers: { Authorization: authorizationToken },
        withCredentials: true,
      })

      if (response.status === 200) {
        const data = response.data
        setUser(data.user)
        setIsProfileComplete(data.user?.isProfileComplete || false)
      } else {
        console.error("Error fetching user data")
        LogoutUser()
      }
    } catch (error) {
      console.log("Error fetching user data", error)
      if (error.response?.status === 401) {
        LogoutUser()
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    userAuthentication()
  }, [token])

  useEffect(() => {
    setIsAdmin(false)
    setIsDeveloper(false)

    if (user) {
      const { isDeveloper, isAdmin } = user
      setIsAdmin(isAdmin || false)
      setIsDeveloper(isDeveloper || false)

      if (isDeveloper) console.log("This is Developer")
      if (isAdmin) console.log("This is Admin")
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        storeTokenInCookies,
        loginUser,
        LogoutUser,
        user,
        authorizationToken,
        isLoading,
        isAdmin,
        isDeveloper,
        isProfileComplete,
        API,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook
export const useAuth = () => {
  const authContextValue = useContext(AuthContext)
  if (!authContextValue) {
    throw new Error("useAuth must be used within the AuthProvider")
  }
  return authContextValue
}
