import { authAPI } from "./api.js"

// Authentication state management
let currentUser = null

// Check if user is authenticated
export function isAuthenticated() {
  return localStorage.getItem("token") !== null
}

// Get authentication token
export function getToken() {
  return localStorage.getItem("token")
}

// Get current user
export function getCurrentUser() {
  return currentUser
}

// Set authentication token
function setToken(token) {
  localStorage.setItem("token", token)
}

// Remove authentication token
function removeToken() {
  localStorage.removeItem("token")
}

// Login user
export async function login(email, password) {
  try {
    const response = await authAPI.login(email, password)

    if (response.success && response.token) {
      setToken(response.token)
      currentUser = response.user
      return { success: true, user: response.user }
    }

    throw new Error("Login failed: Invalid response")
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Register new user
export async function register(username, email, password) {
  try {
    const response = await authAPI.register(username, email, password)

    if (response.success && response.token) {
      setToken(response.token)
      currentUser = response.user
      return { success: true, user: response.user }
    }

    throw new Error("Registration failed: Invalid response")
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Logout user
export function logout() {
  removeToken()
  currentUser = null
}

// Verify token and get current user
export async function verifyAuth() {
  if (!isAuthenticated()) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const response = await authAPI.getMe()

    if (response.success && response.user) {
      currentUser = response.user
      return { success: true, user: response.user }
    }

    // Token is invalid
    logout()
    return { success: false, error: "Invalid token" }
  } catch (error) {
    // Token is invalid or expired
    logout()
    return { success: false, error: error.message }
  }
}
