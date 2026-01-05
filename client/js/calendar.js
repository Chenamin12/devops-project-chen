// Calendar and Reminders Management

// Calendar state
let calendarState = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  reminders: [],
}

// Color palette for reminders
const REMINDER_COLORS = [
  { name: "כחול", value: "#4a90e2" },
  { name: "סגול", value: "#7b68ee" },
  { name: "ירוק", value: "#52c41a" },
  { name: "כתום", value: "#faad14" },
  { name: "אדום", value: "#ff4d4f" },
  { name: "ורוד", value: "#eb2f96" },
  { name: "טורקיז", value: "#13c2c2" },
  { name: "זהוב", value: "#fadb14" },
]

// Load reminders from localStorage
export function loadReminders() {
  try {
    const stored = localStorage.getItem("calendarReminders")
    if (stored) {
      calendarState.reminders = JSON.parse(stored)
    } else {
      calendarState.reminders = []
    }
  } catch (error) {
    console.error("Error loading reminders:", error)
    calendarState.reminders = []
  }
  return calendarState.reminders
}

// Save reminders to localStorage
function saveReminders() {
  try {
    localStorage.setItem(
      "calendarReminders",
      JSON.stringify(calendarState.reminders)
    )
  } catch (error) {
    console.error("Error saving reminders:", error)
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Get reminders for a specific date
export function getRemindersForDate(dateString) {
  return calendarState.reminders.filter((r) => r.date === dateString)
}

// Create a new reminder
export function createReminder(reminderData) {
  const reminder = {
    id: generateId(),
    title: reminderData.title.trim(),
    date: reminderData.date,
    time: reminderData.time || "00:00",
    description: reminderData.description || "",
    color: reminderData.color || REMINDER_COLORS[0].value,
    createdAt: new Date().toISOString(),
  }

  calendarState.reminders.push(reminder)
  saveReminders()
  return reminder
}

// Update an existing reminder
export function updateReminder(id, reminderData) {
  const index = calendarState.reminders.findIndex((r) => r.id === id)
  if (index === -1) return null

  calendarState.reminders[index] = {
    ...calendarState.reminders[index],
    title: reminderData.title.trim(),
    date: reminderData.date,
    time: reminderData.time || "00:00",
    description: reminderData.description || "",
    color: reminderData.color || REMINDER_COLORS[0].value,
    updatedAt: new Date().toISOString(),
  }

  saveReminders()
  return calendarState.reminders[index]
}

// Delete a reminder
export function deleteReminder(id) {
  const index = calendarState.reminders.findIndex((r) => r.id === id)
  if (index === -1) return false

  calendarState.reminders.splice(index, 1)
  saveReminders()
  return true
}

// Get reminder by ID
export function getReminderById(id) {
  return calendarState.reminders.find((r) => r.id === id)
}

// Get all reminders sorted by date and time
export function getAllReminders() {
  return [...calendarState.reminders].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return a.time.localeCompare(b.time)
  })
}

// Get reminders for current month
export function getRemindersForCurrentMonth() {
  const month = calendarState.currentMonth
  const year = calendarState.currentYear
  return calendarState.reminders.filter((r) => {
    const reminderDate = new Date(r.date)
    return (
      reminderDate.getMonth() === month && reminderDate.getFullYear() === year
    )
  })
}

// Calendar navigation
export function getCurrentMonth() {
  return calendarState.currentMonth
}

export function getCurrentYear() {
  return calendarState.currentYear
}

export function setCurrentMonth(month) {
  calendarState.currentMonth = month
}

export function setCurrentYear(year) {
  calendarState.currentYear = year
}

export function goToPreviousMonth() {
  if (calendarState.currentMonth === 0) {
    calendarState.currentMonth = 11
    calendarState.currentYear--
  } else {
    calendarState.currentMonth--
  }
}

export function goToNextMonth() {
  if (calendarState.currentMonth === 11) {
    calendarState.currentMonth = 0
    calendarState.currentYear++
  } else {
    calendarState.currentMonth++
  }
}

export function goToToday() {
  const today = new Date()
  calendarState.currentMonth = today.getMonth()
  calendarState.currentYear = today.getFullYear()
}

// Date utility functions
export function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(month, year) {
  return new Date(year, month, 1).getDay()
}

export function formatDateForInput(date) {
  // Convert Date object to YYYY-MM-DD format
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatDateDisplay(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatDateTimeDisplay(dateString, timeString) {
  const date = new Date(dateString)
  const time = timeString || "00:00"
  return `${formatDateDisplay(dateString)} בשעה ${time}`
}

export function isToday(dateString) {
  const today = new Date()
  const date = new Date(dateString)
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function isCurrentMonth(date, month, year) {
  return date.getMonth() === month && date.getFullYear() === year
}

// Get Hebrew day names
export function getHebrewDayNames() {
  return ["א", "ב", "ג", "ד", "ה", "ו", "ש"]
}

// Get Hebrew month names
export function getHebrewMonthName(month) {
  const months = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ]
  return months[month]
}

// Get color options
export function getColorOptions() {
  return REMINDER_COLORS
}

// Initialize calendar
export function initCalendar() {
  loadReminders()
  goToToday()
}


