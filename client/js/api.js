// API Configuration
const API_BASE_URL = "http://localhost:3000/api"

// Generic API call function
async function apiCall(method, endpoint, data = null, requiresAuth = true) {
  const url = `${API_BASE_URL}${endpoint}`
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  }

  // Add authentication token if required
  if (requiresAuth) {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No authentication token found")
    }
    options.headers["Authorization"] = `Bearer ${token}`
  }

  // Add body for POST, PUT requests
  if (data && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(url, options)
    const responseData = await response.json()

    if (!response.ok) {
      // Handle validation errors
      if (responseData.errors && Array.isArray(responseData.errors)) {
        const errorMessages = responseData.errors
          .map((err) => err.msg || err.message)
          .join(", ")
        throw new Error(errorMessages)
      }
      throw new Error(
        responseData.message || `HTTP error! status: ${response.status}`
      )
    }

    return responseData
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Network error: Could not connect to server")
    }
    throw error
  }
}

// Authentication API calls
export const authAPI = {
  register: async (username, email, password) => {
    return await apiCall(
      "POST",
      "/auth/register",
      { username, email, password },
      false
    )
  },

  login: async (email, password) => {
    return await apiCall("POST", "/auth/login", { email, password }, false)
  },

  getMe: async () => {
    return await apiCall("GET", "/auth/me", null, true)
  },
}

// Shopping Lists API calls
export const shoppingListsAPI = {
  getAll: async () => {
    return await apiCall("GET", "/shopping-lists", null, true)
  },

  getById: async (id) => {
    return await apiCall("GET", `/shopping-lists/${id}`, null, true)
  },

  create: async (name) => {
    return await apiCall("POST", "/shopping-lists", { name }, true)
  },

  delete: async (id) => {
    return await apiCall("DELETE", `/shopping-lists/${id}`, null, true)
  },
}

// Products API calls
export const productsAPI = {
  add: async (listId, name, quantity, isChecked = false) => {
    return await apiCall(
      "POST",
      `/shopping-lists/${listId}/products`,
      {
        name,
        quantity: parseInt(quantity),
        isChecked,
      },
      true
    )
  },

  update: async (listId, productId, updates) => {
    const data = {}
    if (updates.name !== undefined) data.name = updates.name
    if (updates.quantity !== undefined)
      data.quantity = parseInt(updates.quantity)
    if (updates.isChecked !== undefined) data.isChecked = updates.isChecked

    return await apiCall(
      "PUT",
      `/shopping-lists/${listId}/products/${productId}`,
      data,
      true
    )
  },

  delete: async (listId, productId) => {
    return await apiCall(
      "DELETE",
      `/shopping-lists/${listId}/products/${productId}`,
      null,
      true
    )
  },
}
