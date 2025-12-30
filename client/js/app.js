import {
  login,
  register,
  logout,
  verifyAuth,
  getCurrentUser,
  isAuthenticated,
} from "./auth.js"
import { shoppingListsAPI, productsAPI } from "./api.js"
import {
  initCalendar,
  loadReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  getReminderById,
  getAllReminders,
  getRemindersForDate,
  getCurrentMonth,
  getCurrentYear,
  setCurrentMonth,
  setCurrentYear,
  goToPreviousMonth,
  goToNextMonth,
  goToToday,
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDateForInput,
  formatDateDisplay,
  formatDateTimeDisplay,
  isToday,
  isCurrentMonth,
  getHebrewDayNames,
  getHebrewMonthName,
  getColorOptions,
} from "./calendar.js"

// Application state
let state = {
  currentView: "login", // login, register, lists, list-detail, calendar
  currentTab: "lists", // lists, calendar
  shoppingLists: [],
  currentList: null,
  loading: false,
}

// DOM Elements
const app = document.getElementById("app")
const toastContainer = document.getElementById("toast-container")

// Show toast notification
function showToast(message, type = "info") {
  const toast = document.createElement("div")
  toast.className = `toast toast-${type}`
  toast.textContent = message

  toastContainer.appendChild(toast)

  // Trigger animation
  setTimeout(() => toast.classList.add("show"), 10)

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show")
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

// Set loading state
function setLoading(loading) {
  state.loading = loading
  const loadingEl = document.getElementById("loading")
  if (loadingEl) {
    loadingEl.style.display = loading ? "flex" : "none"
  }
}

// Render Login View
function renderLogin() {
  state.currentView = "login"
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">התחברות</h1>
        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label for="login-email">אימייל</label>
            <input type="email" id="login-email" required autocomplete="email">
          </div>
          <div class="form-group">
            <label for="login-password">סיסמה</label>
            <input type="password" id="login-password" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn btn-primary btn-block">התחבר</button>
        </form>
        <p class="auth-switch">
          אין לך חשבון? <a href="#" id="switch-to-register">הירשם כאן</a>
        </p>
      </div>
    </div>
  `

  // Event listeners
  document.getElementById("login-form").addEventListener("submit", handleLogin)
  document
    .getElementById("switch-to-register")
    .addEventListener("click", (e) => {
      e.preventDefault()
      renderRegister()
    })
}

// Render Register View
function renderRegister() {
  state.currentView = "register"
  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">הרשמה</h1>
        <form id="register-form" class="auth-form">
          <div class="form-group">
            <label for="register-username">שם משתמש</label>
            <input type="text" id="register-username" required autocomplete="username" minlength="3" maxlength="30">
            <small>בין 3 ל-30 תווים</small>
          </div>
          <div class="form-group">
            <label for="register-email">אימייל</label>
            <input type="email" id="register-email" required autocomplete="email">
          </div>
          <div class="form-group">
            <label for="register-password">סיסמה</label>
            <input type="password" id="register-password" required autocomplete="new-password" minlength="6">
            <small>לפחות 6 תווים</small>
          </div>
          <button type="submit" class="btn btn-primary btn-block">הירשם</button>
        </form>
        <p class="auth-switch">
          כבר יש לך חשבון? <a href="#" id="switch-to-login">התחבר כאן</a>
        </p>
      </div>
    </div>
  `

  // Event listeners
  document
    .getElementById("register-form")
    .addEventListener("submit", handleRegister)
  document.getElementById("switch-to-login").addEventListener("click", (e) => {
    e.preventDefault()
    renderLogin()
  })
}

// Render Tab Navigation
function renderTabNavigation() {
  return `
    <div class="tabs-container">
      <button class="tab-btn ${state.currentTab === "lists" ? "active" : ""}" data-tab="lists">
        רשימות קניות
      </button>
      <button class="tab-btn ${state.currentTab === "calendar" ? "active" : ""}" data-tab="calendar">
        לוח שנה
      </button>
    </div>
  `
}

// Render Shopping Lists View
async function renderLists() {
  state.currentView = "lists"
  state.currentTab = "lists"
  setLoading(true)

  try {
    const response = await shoppingListsAPI.getAll()
    state.shoppingLists = response.data || []

    app.innerHTML = `
      <div class="container">
        <header class="header">
          <div class="header-content">
            <h1>רשימות קניות שלי</h1>
            <div class="header-actions">
              <span class="user-name">שלום, ${
                getCurrentUser()?.username || "משתמש"
              }</span>
              <button id="logout-btn" class="btn btn-secondary">התנתק</button>
            </div>
          </div>
        </header>

        ${renderTabNavigation()}

        <div class="lists-section">
          <div class="section-header">
            <h2>הרשימות שלי</h2>
            <button id="create-list-btn" class="btn btn-primary">
              <span class="icon">+</span> רשימה חדשה
            </button>
          </div>

          <div id="lists-container" class="lists-grid">
            ${
              state.shoppingLists.length === 0
                ? '<div class="empty-state"><p>אין לך רשימות קניות עדיין. צור רשימה חדשה כדי להתחיל!</p></div>'
                : state.shoppingLists
                    .map(
                      (list) => `
                <div class="list-card" data-list-id="${list._id}">
                  <div class="list-card-header">
                    <h3 class="list-name">${escapeHtml(list.name)}</h3>
                    <button class="btn-icon delete-list-btn" data-list-id="${
                      list._id
                    }" title="מחק רשימה">
                      <span>×</span>
                    </button>
                  </div>
                  <div class="list-card-body">
                    <p class="list-info">
                      <span class="product-count">${
                        list.products?.length || 0
                      } מוצרים</span>
                      <span class="list-date">${formatDate(
                        list.createdAt
                      )}</span>
                    </p>
                  </div>
                  <div class="list-card-footer">
                    <button class="btn btn-outline view-list-btn" data-list-id="${
                      list._id
                    }">צפה ברשימה</button>
                  </div>
                </div>
              `
                    )
                    .join("")
            }
          </div>
        </div>
      </div>
    `

    // Event listeners
    document
      .getElementById("logout-btn")
      .addEventListener("click", handleLogout)
    document
      .getElementById("create-list-btn")
      .addEventListener("click", showCreateListModal)

    // Tab navigation
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tab = e.target.dataset.tab
        if (tab === "calendar") {
          renderCalendar()
        }
      })
    })

    // List card click handlers
    document.querySelectorAll(".view-list-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const listId = e.target.closest(".view-list-btn").dataset.listId
        renderListDetail(listId)
      })
    })

    document.querySelectorAll(".delete-list-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation()
        const listId = e.target.closest(".delete-list-btn").dataset.listId
        if (confirm("האם אתה בטוח שברצונך למחוק רשימה זו?")) {
          await handleDeleteList(listId)
        }
      })
    })
  } catch (error) {
    showToast(error.message, "error")
    if (
      error.message.includes("Not authenticated") ||
      error.message.includes("token")
    ) {
      logout()
      renderLogin()
    }
  } finally {
    setLoading(false)
  }
}

// Render List Detail View
async function renderListDetail(listId) {
  state.currentView = "list-detail"
  setLoading(true)

  try {
    const response = await shoppingListsAPI.getById(listId)
    state.currentList = response.data

    app.innerHTML = `
      <div class="container">
        <header class="header">
          <div class="header-content">
            <button id="back-btn" class="btn btn-secondary">
              <span class="icon">←</span> חזרה
            </button>
            <h1>${escapeHtml(state.currentList.name)}</h1>
            <button id="logout-btn" class="btn btn-secondary">התנתק</button>
          </div>
        </header>

        <div class="list-detail-section">
          <div class="section-header">
            <h2>מוצרים</h2>
            <button id="add-product-btn" class="btn btn-primary">
              <span class="icon">+</span> הוסף מוצר
            </button>
          </div>

          <div id="products-container" class="products-list">
            ${
              state.currentList.products?.length === 0
                ? '<div class="empty-state"><p>אין מוצרים ברשימה זו. הוסף מוצר כדי להתחיל!</p></div>'
                : state.currentList.products
                    .map(
                      (product) => `
                <div class="product-item ${
                  product.isChecked ? "checked" : ""
                }" data-product-id="${product._id}">
                  <div class="product-checkbox">
                    <input type="checkbox" ${
                      product.isChecked ? "checked" : ""
                    } 
                           data-list-id="${listId}" 
                           data-product-id="${product._id}"
                           class="product-check">
                  </div>
                  <div class="product-info">
                    <div class="product-name">${escapeHtml(product.name)}</div>
                    <div class="product-quantity">כמות: ${
                      product.quantity
                    }</div>
                  </div>
                  <div class="product-actions">
                    <button class="btn-icon edit-product-btn" 
                            data-list-id="${listId}" 
                            data-product-id="${product._id}"
                            title="ערוך מוצר">
                      ✏️
                    </button>
                    <button class="btn-icon delete-product-btn" 
                            data-list-id="${listId}" 
                            data-product-id="${product._id}"
                            title="מחק מוצר">
                      🗑️
                    </button>
                  </div>
                </div>
              `
                    )
                    .join("")
            }
          </div>
        </div>
      </div>
    `

    // Event listeners
    document.getElementById("back-btn").addEventListener("click", renderLists)
    document
      .getElementById("logout-btn")
      .addEventListener("click", handleLogout)
    document
      .getElementById("add-product-btn")
      .addEventListener("click", showAddProductModal)

    // Product checkboxes
    document.querySelectorAll(".product-check").forEach((checkbox) => {
      checkbox.addEventListener("change", async (e) => {
        const listId = e.target.dataset.listId
        const productId = e.target.dataset.productId
        const isChecked = e.target.checked
        await handleToggleProduct(listId, productId, isChecked)
      })
    })

    // Edit product buttons
    document.querySelectorAll(".edit-product-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const listId = e.target.closest(".edit-product-btn").dataset.listId
        const productId =
          e.target.closest(".edit-product-btn").dataset.productId
        const product = state.currentList.products.find(
          (p) => p._id === productId
        )
        showEditProductModal(listId, productId, product)
      })
    })

    // Delete product buttons
    document.querySelectorAll(".delete-product-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const listId = e.target.closest(".delete-product-btn").dataset.listId
        const productId = e.target.closest(".delete-product-btn").dataset
          .productId
        if (confirm("האם אתה בטוח שברצונך למחוק מוצר זה?")) {
          await handleDeleteProduct(listId, productId)
        }
      })
    })
  } catch (error) {
    showToast(error.message, "error")
    if (error.message.includes("not found")) {
      renderLists()
    }
  } finally {
    setLoading(false)
  }
}

// Render Calendar View
function renderCalendar() {
  state.currentView = "calendar"
  state.currentTab = "calendar"
  
  // Load reminders (don't reinitialize calendar as it resets month/year)
  loadReminders()

  const month = getCurrentMonth()
  const year = getCurrentYear()
  const monthName = getHebrewMonthName(month)
  const daysInMonth = getDaysInMonth(month, year)
  const firstDay = getFirstDayOfMonth(month, year)
  const dayNames = getHebrewDayNames()
  const today = new Date()
  const currentDate = formatDateForInput(today)

  // For Hebrew calendar (RTL), Sunday (0) is the first column
  // So we use firstDay directly (0 = Sunday, 1 = Monday, etc.)
  const adjustedFirstDay = firstDay

  // Generate calendar grid
  let calendarDays = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push({ day: null, date: null, isCurrentMonth: false })
  }

  // Add days of the current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateString = formatDateForInput(date)
    const reminders = getRemindersForDate(dateString)
    calendarDays.push({
      day,
      date: dateString,
      isCurrentMonth: true,
      isToday: isToday(dateString),
      reminders,
    })
  }

  // Fill remaining cells to complete the grid (6 rows x 7 columns = 42 cells)
  const remainingCells = 42 - calendarDays.length
  for (let i = 0; i < remainingCells; i++) {
    calendarDays.push({ day: null, date: null, isCurrentMonth: false })
  }

  // Get all reminders for display
  const allReminders = getAllReminders()

  app.innerHTML = `
    <div class="container">
      <header class="header">
        <div class="header-content">
          <h1>לוח שנה</h1>
          <div class="header-actions">
            <span class="user-name">שלום, ${
              getCurrentUser()?.username || "משתמש"
            }</span>
            <button id="logout-btn" class="btn btn-secondary">התנתק</button>
          </div>
        </div>
      </header>

      ${renderTabNavigation()}

      <div class="calendar-section">
        <div class="calendar-container">
          <div class="calendar-header">
            <button id="prev-month-btn" class="btn btn-secondary calendar-nav-btn">
              <span class="icon">←</span> חודש קודם
            </button>
            <h2 class="calendar-month-title">${monthName} ${year}</h2>
            <button id="next-month-btn" class="btn btn-secondary calendar-nav-btn">
              חודש הבא <span class="icon">→</span>
            </button>
            <button id="today-btn" class="btn btn-outline calendar-nav-btn">
              היום
            </button>
          </div>

          <div class="calendar-grid">
            <div class="calendar-weekdays">
              ${dayNames.map((day) => `<div class="calendar-weekday">${day}</div>`).join("")}
            </div>
            <div class="calendar-days">
              ${calendarDays
                .map((cell) => {
                  if (!cell.day) {
                    return '<div class="calendar-day empty"></div>'
                  }

                  const remindersHtml = cell.reminders
                    .slice(0, 3)
                    .map(
                      (reminder) => `
                      <div class="reminder-badge" style="background-color: ${reminder.color}" 
                           data-reminder-id="${reminder.id}"
                           title="${escapeHtml(reminder.title)}">
                        ${escapeHtml(reminder.title)}
                      </div>
                    `
                    )
                    .join("")

                  const moreReminders =
                    cell.reminders.length > 3
                      ? `<div class="reminder-more">+${cell.reminders.length - 3}</div>`
                      : ""

                  return `
                    <div class="calendar-day ${cell.isToday ? "today" : ""} ${!cell.isCurrentMonth ? "other-month" : ""}" 
                         data-date="${cell.date || ""}">
                      <div class="calendar-day-number">${cell.day}</div>
                      <div class="calendar-day-reminders">
                        ${remindersHtml}
                        ${moreReminders}
                      </div>
                      <button class="calendar-day-add" data-date="${cell.date || ""}" title="הוסף תזכיר">
                        +
                      </button>
                    </div>
                  `
                })
                .join("")}
            </div>
          </div>
        </div>

        <div class="reminders-list-section">
          <div class="section-header">
            <h2>תזכירים</h2>
            <button id="add-reminder-btn" class="btn btn-primary">
              <span class="icon">+</span> הוסף תזכיר
            </button>
          </div>
          <div id="reminders-list" class="reminders-list">
            ${
              allReminders.length === 0
                ? '<div class="empty-state"><p>אין תזכירים. הוסף תזכיר חדש כדי להתחיל!</p></div>'
                : allReminders
                    .map(
                      (reminder) => `
                  <div class="reminder-item" data-reminder-id="${reminder.id}">
                    <div class="reminder-color-indicator" style="background-color: ${reminder.color}"></div>
                    <div class="reminder-content">
                      <div class="reminder-header">
                        <h3 class="reminder-title">${escapeHtml(reminder.title)}</h3>
                        <div class="reminder-actions">
                          <button class="btn-icon edit-reminder-btn" data-reminder-id="${reminder.id}" title="ערוך">
                            ✏️
                          </button>
                          <button class="btn-icon delete-reminder-btn" data-reminder-id="${reminder.id}" title="מחק">
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div class="reminder-meta">
                        <span class="reminder-date">${formatDateTimeDisplay(reminder.date, reminder.time)}</span>
                      </div>
                      ${reminder.description ? `<p class="reminder-description">${escapeHtml(reminder.description)}</p>` : ""}
                    </div>
                  </div>
                `
                    )
                    .join("")
            }
          </div>
        </div>
      </div>
    </div>
  `

  // Event listeners
  document.getElementById("logout-btn").addEventListener("click", handleLogout)
  document.getElementById("prev-month-btn").addEventListener("click", () => {
    goToPreviousMonth()
    renderCalendar()
  })
  document.getElementById("next-month-btn").addEventListener("click", () => {
    goToNextMonth()
    renderCalendar()
  })
  document.getElementById("today-btn").addEventListener("click", () => {
    goToToday()
    renderCalendar()
  })
  document.getElementById("add-reminder-btn").addEventListener("click", () => {
    showReminderModal()
  })

  // Tab navigation
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tab = e.target.dataset.tab
      if (tab === "lists") {
        renderLists()
      }
    })
  })

  // Calendar day click handlers
  document.querySelectorAll(".calendar-day-add").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const date = e.target.dataset.date
      if (date) {
        showReminderModal(date)
      }
    })
  })

  document.querySelectorAll(".calendar-day").forEach((day) => {
    day.addEventListener("click", (e) => {
      if (!e.target.closest(".calendar-day-add") && !e.target.closest(".reminder-badge")) {
        const date = day.dataset.date
        if (date) {
          showReminderModal(date)
        }
      }
    })
  })

  // Reminder badge click handlers
  document.querySelectorAll(".reminder-badge").forEach((badge) => {
    badge.addEventListener("click", (e) => {
      e.stopPropagation()
      const reminderId = badge.dataset.reminderId
      const reminder = getReminderById(reminderId)
      if (reminder) {
        showReminderModal(null, reminder)
      }
    })
  })

  // Edit reminder buttons
  document.querySelectorAll(".edit-reminder-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const reminderId = btn.dataset.reminderId
      const reminder = getReminderById(reminderId)
      if (reminder) {
        showReminderModal(null, reminder)
      }
    })
  })

  // Delete reminder buttons
  document.querySelectorAll(".delete-reminder-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const reminderId = btn.dataset.reminderId
      if (confirm("האם אתה בטוח שברצונך למחוק תזכיר זה?")) {
        if (deleteReminder(reminderId)) {
          showToast("תזכיר נמחק בהצלחה", "success")
          renderCalendar()
        } else {
          showToast("שגיאה במחיקת התזכיר", "error")
        }
      }
    })
  })
}

// Show Reminder Modal
function showReminderModal(preselectedDate = null, reminder = null) {
  const isEdit = reminder !== null
  const colorOptions = getColorOptions()
  const selectedColor = reminder?.color || colorOptions[0].value

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${isEdit ? "ערוך תזכיר" : "הוסף תזכיר"}</h2>
        <button class="btn-icon close-modal" title="סגור">×</button>
      </div>
      <form id="reminder-form" class="modal-body">
        <div class="form-group">
          <label for="reminder-title">כותרת *</label>
          <input type="text" id="reminder-title" required autofocus value="${reminder ? escapeHtml(reminder.title) : ""}">
        </div>
        <div class="form-group">
          <label for="reminder-date">תאריך *</label>
          <input type="date" id="reminder-date" required value="${reminder ? reminder.date : preselectedDate || formatDateForInput(new Date())}">
        </div>
        <div class="form-group">
          <label for="reminder-time">שעה</label>
          <input type="time" id="reminder-time" value="${reminder ? reminder.time : "00:00"}">
        </div>
        <div class="form-group">
          <label for="reminder-description">תיאור</label>
          <textarea id="reminder-description" rows="3">${reminder ? escapeHtml(reminder.description) : ""}</textarea>
        </div>
        <div class="form-group">
          <label>צבע</label>
          <div class="color-picker">
            ${colorOptions
              .map(
                (color) => `
              <label class="color-option ${selectedColor === color.value ? "selected" : ""}">
                <input type="radio" name="reminder-color" value="${color.value}" ${selectedColor === color.value ? "checked" : ""}>
                <span class="color-swatch" style="background-color: ${color.value}" title="${color.name}"></span>
              </label>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary close-modal">ביטול</button>
          <button type="submit" class="btn btn-primary">${isEdit ? "שמור" : "הוסף"}</button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(modal)
  setTimeout(() => modal.classList.add("show"), 10)

  // Event listeners
  modal.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(modal))
  })

  // Color picker
  modal.querySelectorAll(".color-option").forEach((option) => {
    option.addEventListener("click", (e) => {
      modal.querySelectorAll(".color-option").forEach((opt) => opt.classList.remove("selected"))
      option.classList.add("selected")
      option.querySelector("input[type='radio']").checked = true
    })
  })

  modal.querySelector("#reminder-form").addEventListener("submit", async (e) => {
    e.preventDefault()
    const title = document.getElementById("reminder-title").value.trim()
    const date = document.getElementById("reminder-date").value
    const time = document.getElementById("reminder-time").value
    const description = document.getElementById("reminder-description").value.trim()
    const color = modal.querySelector("input[name='reminder-color']:checked").value

    if (!title || !date) {
      showToast("אנא מלא את כל השדות הנדרשים", "error")
      return
    }

    if (isEdit) {
      if (updateReminder(reminder.id, { title, date, time, description, color })) {
        showToast("תזכיר עודכן בהצלחה!", "success")
        closeModal(modal)
        renderCalendar()
      } else {
        showToast("שגיאה בעדכון התזכיר", "error")
      }
    } else {
      createReminder({ title, date, time, description, color })
      showToast("תזכיר נוסף בהצלחה!", "success")
      closeModal(modal)
      renderCalendar()
    }
  })

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal)
    }
  })
}

// Show Create List Modal
function showCreateListModal() {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>צור רשימה חדשה</h2>
        <button class="btn-icon close-modal" title="סגור">×</button>
      </div>
      <form id="create-list-form" class="modal-body">
        <div class="form-group">
          <label for="list-name">שם הרשימה</label>
          <input type="text" id="list-name" required autofocus>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary close-modal">ביטול</button>
          <button type="submit" class="btn btn-primary">צור</button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(modal)
  setTimeout(() => modal.classList.add("show"), 10)

  // Event listeners
  modal
    .querySelector(".close-modal")
    .addEventListener("click", () => closeModal(modal))
  modal.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(modal))
  })

  modal
    .querySelector("#create-list-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault()
      const name = document.getElementById("list-name").value.trim()
      if (name) {
        await handleCreateList(name)
        closeModal(modal)
      }
    })

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal)
    }
  })
}

// Show Add Product Modal
function showAddProductModal() {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>הוסף מוצר</h2>
        <button class="btn-icon close-modal" title="סגור">×</button>
      </div>
      <form id="add-product-form" class="modal-body">
        <div class="form-group">
          <label for="product-name">שם המוצר</label>
          <input type="text" id="product-name" required autofocus>
        </div>
        <div class="form-group">
          <label for="product-quantity">כמות</label>
          <input type="number" id="product-quantity" min="1" value="1" required>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="product-checked">
            סומן כבר
          </label>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary close-modal">ביטול</button>
          <button type="submit" class="btn btn-primary">הוסף</button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(modal)
  setTimeout(() => modal.classList.add("show"), 10)

  // Event listeners
  modal.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(modal))
  })

  modal
    .querySelector("#add-product-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault()
      const name = document.getElementById("product-name").value.trim()
      const quantity = parseInt(
        document.getElementById("product-quantity").value
      )
      const isChecked = document.getElementById("product-checked").checked

      if (name && quantity > 0) {
        await handleAddProduct(state.currentList._id, name, quantity, isChecked)
        closeModal(modal)
      }
    })

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal)
    }
  })
}

// Show Edit Product Modal
function showEditProductModal(listId, productId, product) {
  const modal = document.createElement("div")
  modal.className = "modal"
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>ערוך מוצר</h2>
        <button class="btn-icon close-modal" title="סגור">×</button>
      </div>
      <form id="edit-product-form" class="modal-body">
        <div class="form-group">
          <label for="edit-product-name">שם המוצר</label>
          <input type="text" id="edit-product-name" value="${escapeHtml(
            product.name
          )}" required autofocus>
        </div>
        <div class="form-group">
          <label for="edit-product-quantity">כמות</label>
          <input type="number" id="edit-product-quantity" min="1" value="${
            product.quantity
          }" required>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="edit-product-checked" ${
              product.isChecked ? "checked" : ""
            }>
            סומן
          </label>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary close-modal">ביטול</button>
          <button type="submit" class="btn btn-primary">שמור</button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(modal)
  setTimeout(() => modal.classList.add("show"), 10)

  // Event listeners
  modal.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(modal))
  })

  modal
    .querySelector("#edit-product-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault()
      const name = document.getElementById("edit-product-name").value.trim()
      const quantity = parseInt(
        document.getElementById("edit-product-quantity").value
      )
      const isChecked = document.getElementById("edit-product-checked").checked

      if (name && quantity > 0) {
        await handleUpdateProduct(listId, productId, {
          name,
          quantity,
          isChecked,
        })
        closeModal(modal)
      }
    })

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal)
    }
  })
}

// Close modal
function closeModal(modal) {
  modal.classList.remove("show")
  setTimeout(() => modal.remove(), 300)
}

// Event Handlers
async function handleLogin(e) {
  e.preventDefault()
  setLoading(true)

  const email = document.getElementById("login-email").value
  const password = document.getElementById("login-password").value

  const result = await login(email, password)

  if (result.success) {
    showToast("התחברת בהצלחה!", "success")
    await renderLists()
  } else {
    showToast(result.error || "שגיאה בהתחברות", "error")
  }

  setLoading(false)
}

async function handleRegister(e) {
  e.preventDefault()
  setLoading(true)

  const username = document.getElementById("register-username").value.trim()
  const email = document.getElementById("register-email").value
  const password = document.getElementById("register-password").value

  if (username.length < 3 || username.length > 30) {
    showToast("שם המשתמש חייב להיות בין 3 ל-30 תווים", "error")
    setLoading(false)
    return
  }

  if (password.length < 6) {
    showToast("הסיסמה חייבת להיות לפחות 6 תווים", "error")
    setLoading(false)
    return
  }

  const result = await register(username, email, password)

  if (result.success) {
    showToast("נרשמת בהצלחה!", "success")
    await renderLists()
  } else {
    showToast(result.error || "שגיאה בהרשמה", "error")
  }

  setLoading(false)
}

function handleLogout() {
  logout()
  showToast("התנתקת בהצלחה", "info")
  renderLogin()
}

async function handleCreateList(name) {
  setLoading(true)
  try {
    await shoppingListsAPI.create(name)
    showToast("רשימה נוצרה בהצלחה!", "success")
    await renderLists()
  } catch (error) {
    showToast(error.message, "error")
  } finally {
    setLoading(false)
  }
}

async function handleDeleteList(listId) {
  setLoading(true)
  try {
    await shoppingListsAPI.delete(listId)
    showToast("רשימה נמחקה בהצלחה", "success")
    await renderLists()
  } catch (error) {
    showToast(error.message, "error")
  } finally {
    setLoading(false)
  }
}

async function handleAddProduct(listId, name, quantity, isChecked) {
  setLoading(true)
  try {
    await productsAPI.add(listId, name, quantity, isChecked)
    showToast("מוצר נוסף בהצלחה!", "success")
    await renderListDetail(listId)
  } catch (error) {
    showToast(error.message, "error")
  } finally {
    setLoading(false)
  }
}

async function handleUpdateProduct(listId, productId, updates) {
  setLoading(true)
  try {
    await productsAPI.update(listId, productId, updates)
    showToast("מוצר עודכן בהצלחה!", "success")
    await renderListDetail(listId)
  } catch (error) {
    showToast(error.message, "error")
  } finally {
    setLoading(false)
  }
}

async function handleDeleteProduct(listId, productId) {
  setLoading(true)
  try {
    await productsAPI.delete(listId, productId)
    showToast("מוצר נמחק בהצלחה", "success")
    await renderListDetail(listId)
  } catch (error) {
    showToast(error.message, "error")
  } finally {
    setLoading(false)
  }
}

async function handleToggleProduct(listId, productId, isChecked) {
  try {
    await productsAPI.update(listId, productId, { isChecked })
    // Update UI immediately for better UX
    const productItem = document.querySelector(
      `[data-product-id="${productId}"]`
    )
    if (productItem) {
      if (isChecked) {
        productItem.classList.add("checked")
      } else {
        productItem.classList.remove("checked")
      }
    }
  } catch (error) {
    showToast(error.message, "error")
    // Revert checkbox on error
    const checkbox = document.querySelector(
      `[data-product-id="${productId}"].product-check`
    )
    if (checkbox) {
      checkbox.checked = !isChecked
    }
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Initialize app
async function init() {
  // Initialize calendar
  initCalendar()
  
  // Check authentication on load
  const authResult = await verifyAuth()

  if (authResult.success) {
    await renderLists()
  } else {
    renderLogin()
  }
}

// Start app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}
