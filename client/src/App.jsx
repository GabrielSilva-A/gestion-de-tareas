import { useEffect, useMemo, useState } from 'react'
import AuthScreen from './features/auth/AuthScreen'
import { authApi, tasksApi } from './lib/api'
import './App.css'

const SESSION_TOKEN_KEY = 'sessionToken'
const SESSION_USER_KEY = 'sessionUser'

const getStoredSession = () => {
  if (typeof window === 'undefined') return null

  try {
    const token = window.localStorage.getItem(SESSION_TOKEN_KEY)
    const rawUser = window.localStorage.getItem(SESSION_USER_KEY)
    if (!token || !rawUser) return null

    const user = JSON.parse(rawUser)
    return { token, user }
  } catch {
    return null
  }
}

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateLabel = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

const formatDateTimeLabel = (value) => {
  if (!value) return ''

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return value

  return parsedDate.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toApiDateTime = (localDateTimeValue) => {
  if (!localDateTimeValue) return null

  const parsedDate = new Date(localDateTimeValue)
  if (Number.isNaN(parsedDate.getTime())) return null

  return parsedDate.toISOString()
}

const toInputDateTime = (apiDateTimeValue) => {
  if (!apiDateTimeValue) return ''

  const parsedDate = new Date(apiDateTimeValue)
  if (Number.isNaN(parsedDate.getTime())) {
    return String(apiDateTimeValue).slice(0, 16)
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')
  const hours = String(parsedDate.getHours()).padStart(2, '0')
  const minutes = String(parsedDate.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function App() {
  const [session, setSession] = useState(getStoredSession)
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [important, setImportant] = useState(false)
  const [estimatedTime, setEstimatedTime] = useState('')
  const [isProgramable, setIsProgramable] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [activeSection, setActiveSection] = useState('diarias')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()))
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentDayKey, setCurrentDayKey] = useState(formatDateKey(new Date()))
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState('')
  const safeTasks = Array.isArray(tasks) ? tasks : []

  const runTaskAction = async (action, fallbackMessage) => {
    try {
      setTasksError('')
      return await action()
    } catch (error) {
      setTasksError(error.message || fallbackMessage)
      if (error.message?.toLowerCase().includes('token')) {
        setSession(null)
      }
      return null
    }
  }

  const loadTasks = async (token) => {
    setTasksLoading(true)
    await runTaskAction(async () => {
      const data = await tasksApi.list(token)
      setTasks(Array.isArray(data) ? data : [])
    }, 'No se pudieron cargar las tareas.')
    setTasksLoading(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!session) {
      window.localStorage.removeItem(SESSION_TOKEN_KEY)
      window.localStorage.removeItem(SESSION_USER_KEY)
      setTasks([])
      return
    }

    window.localStorage.setItem(SESSION_TOKEN_KEY, session.token)
    window.localStorage.setItem(SESSION_USER_KEY, JSON.stringify(session.user))
  }, [session])

  useEffect(() => {
    if (!session?.token) return
    loadTasks(session.token)
  }, [session?.token])

  useEffect(() => {
    const scheduleMidnightRefresh = () => {
      const now = new Date()
      const nextMidnight = new Date(now)
      nextMidnight.setHours(24, 0, 0, 0)
      return nextMidnight.getTime() - now.getTime()
    }

    const timeoutId = window.setTimeout(() => {
      setCurrentDayKey(formatDateKey(new Date()))
    }, scheduleMidnightRefresh())

    return () => window.clearTimeout(timeoutId)
  }, [currentDayKey])

  const getTaskAccent = (task) => {
    if (task.estimatedTime) return 'scheduled'
    if (task.important) return 'important'
    return 'normal'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!session?.token) return
    if (!title.trim()) return

    const taskTitle = title.trim()

    const nextEstimatedTime = isProgramable ? estimatedTime : ''
    const nextImportant = isProgramable ? false : important

    if (editingId !== null) {
      const updatedTask = await runTaskAction(async () => {
        return tasksApi.update(session.token, editingId, {
          title: taskTitle,
          important: nextImportant,
          estimatedTime: toApiDateTime(nextEstimatedTime),
        })
      }, 'No se pudo actualizar la tarea.')

      if (!updatedTask) return

      setTasks((prevTasks) => prevTasks.map((task) => (task.id === editingId ? updatedTask : task)))
      setEditingId(null)
    } else {
      const newTask = await runTaskAction(async () => {
        return tasksApi.create(session.token, {
          title: taskTitle,
          completed: false,
          completedAt: null,
          important: nextImportant,
          estimatedTime: toApiDateTime(nextEstimatedTime),
          categories: [],
        })
      }, 'No se pudo crear la tarea.')

      if (!newTask) return
      setTasks((prevTasks) => [newTask, ...prevTasks])
    }

    const nextDate = nextEstimatedTime ? formatDateKey(new Date(nextEstimatedTime)) : selectedDate
    setSelectedDate(nextDate)
    setActiveSection(nextEstimatedTime ? 'programadas' : 'diarias')
    setTitle('')
    setImportant(false)
    setEstimatedTime('')
    setIsProgramable(false)
    setShowTaskForm(false)
  }

  const handleDelete = async (id) => {
    if (!session?.token) return

    const deleted = await runTaskAction(async () => {
      await tasksApi.remove(session.token, id)
      return true
    }, 'No se pudo eliminar la tarea.')

    if (!deleted) return

    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id))
  }

  const handleToggle = async (id) => {
    if (!session?.token) return

    const currentTask = safeTasks.find((task) => task.id === id)
    if (!currentTask) return

    const nextCompleted = !currentTask.completed
    const nextCompletedAt = nextCompleted ? new Date().toISOString() : null

    const updatedTask = await runTaskAction(async () => {
      return tasksApi.update(session.token, id, {
        completed: nextCompleted,
        completedAt: nextCompletedAt,
      })
    }, 'No se pudo actualizar la tarea.')

    if (!updatedTask) return

    setTasks((prevTasks) => prevTasks.map((task) => (task.id === id ? updatedTask : task)))
  }

  const startEdit = (task) => {
    setEditingId(task.id)
    setTitle(task.title)
    setImportant(task.estimatedTime ? false : task.important)
    setEstimatedTime(toInputDateTime(task.estimatedTime))
    setIsProgramable(Boolean(task.estimatedTime))
    setActiveSection(task.estimatedTime ? 'programadas' : 'diarias')
    setShowTaskForm(true)
  }

  const monthDays = useMemo(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const start = new Date(firstDay)
    const offset = (firstDay.getDay() + 6) % 7
    start.setDate(firstDay.getDate() - offset)

    const days = []
    for (let index = 0; index < 42; index += 1) {
      const day = new Date(start)
      day.setDate(start.getDate() + index)
      days.push(day)
    }

    return days
  }, [currentMonth])

  const tasksByDate = useMemo(() => {
    return safeTasks.reduce((accumulator, task) => {
      if (!task.estimatedTime) return accumulator

      const dayKey = formatDateKey(new Date(task.estimatedTime))
      if (!accumulator[dayKey]) {
        accumulator[dayKey] = []
      }
      accumulator[dayKey].push(task)
      return accumulator
    }, {})
  }, [safeTasks])

  const selectedDayTasks = useMemo(() => tasksByDate[selectedDate] || [], [selectedDate, tasksByDate])

  const visibleTasks = useMemo(() => {
    return safeTasks.filter((task) => {
      if (task.completed) return false
      if (!task.estimatedTime) return true

      const scheduledDate = new Date(task.estimatedTime)
      if (Number.isNaN(scheduledDate.getTime())) return false

      return formatDateKey(scheduledDate) <= currentDayKey
    })
  }, [safeTasks, currentDayKey])

  const scheduledFutureTasks = useMemo(() => {
    return safeTasks
      .filter((task) => {
        if (task.completed) return false
        if (!task.estimatedTime) return false

        const scheduledDate = new Date(task.estimatedTime)
        if (Number.isNaN(scheduledDate.getTime())) return false

        return formatDateKey(scheduledDate) > currentDayKey
      })
      .sort((taskA, taskB) => new Date(taskA.estimatedTime) - new Date(taskB.estimatedTime))
  }, [safeTasks, currentDayKey])

  const historyTasksSorted = useMemo(() => {
    return safeTasks
      .filter((task) => task.completed)
      .sort((taskA, taskB) => {
      const dateA = new Date(taskA.completedAt || 0)
      const dateB = new Date(taskB.completedAt || 0)
      return dateB - dateA
    })
  }, [safeTasks])

  const tasksToRender = activeSection === 'programadas'
    ? scheduledFutureTasks
    : activeSection === 'historico'
      ? historyTasksSorted
      : visibleTasks

  const handleAddTaskForSelectedDay = () => {
    setShowTaskForm(true)
    setEditingId(null)
    setTitle('')
    setImportant(false)
    setIsProgramable(true)

    const fallbackTime = `${selectedDate}T09:00`
    if (!estimatedTime || formatDateKey(new Date(estimatedTime)) !== selectedDate) {
      setEstimatedTime(fallbackTime)
    }
  }

  const handleAuthSuccess = (payload) => {
    setSession({ token: payload.token, user: payload.user })
    setTasksError('')
  }

  const handleLogin = async (credentials) => {
    const payload = await authApi.login(credentials)
    handleAuthSuccess(payload)
  }

  const handleRegister = async (userData) => {
    const payload = await authApi.register(userData)
    handleAuthSuccess(payload)
  }

  const handleLogout = () => {
    setSession(null)
    setTasks([])
    setShowTaskForm(false)
    setEditingId(null)
  }

  if (!session?.token) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />
  }

  return (
    <main className="app-shell" translate="no">
      <section className="task-card">
        <header className="session-header">
          <div>
            <strong>{session.user?.name || 'Usuario'}</strong>
            <p>{session.user?.email || ''}</p>
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </header>

        {tasksError && <p className="api-error">{tasksError}</p>}
        {tasksLoading && <p className="api-loading">Cargando tareas...</p>}

        <button
          type="button"
          className="add-task-btn"
          onClick={() => setShowTaskForm((prev) => !prev)}
          aria-label="Agregar tareas"
          title="Agregar tareas"
        >
          +
        </button>

        {showTaskForm && (
          <form onSubmit={handleSubmit} className="task-form">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe una tarea"
            />
            <button
              type="button"
              className={`programable-toggle ${isProgramable ? 'active' : ''}`}
              onClick={() => {
                setIsProgramable((prev) => {
                  const next = !prev
                  if (!next) {
                    setEstimatedTime('')
                  } else {
                    setImportant(false)
                  }
                  return next
                })
              }}
              aria-pressed={isProgramable}
            >
              Programar
            </button>
            {!isProgramable && (
              <label className="important-check">
                <input
                  type="checkbox"
                  checked={important}
                  onChange={(e) => setImportant(e.target.checked)}
                />
                <span>Importante</span>
              </label>
            )}
            {isProgramable && (
              <input
                type="datetime-local"
                className="scheduled-datetime-input"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
              />
            )}
            <button type="submit">{editingId ? 'Guardar' : 'Agregar'}</button>
          </form>
        )}

        <div className="top-actions">
          <button type="button" className="toggle-calendar-btn" onClick={() => setShowCalendar((prev) => !prev)}>
            {showCalendar ? 'Ocultar calendario' : 'Mostrar calendario'}
          </button>
          <button
            type="button"
            className={`history-btn ${activeSection === 'historico' ? 'back-mode' : 'active-mode'}`}
            onClick={() => setActiveSection(activeSection === 'historico' ? 'diarias' : 'historico')}
            aria-label={activeSection === 'historico' ? 'Volver' : 'Abrir histórico'}
            title={activeSection === 'historico' ? 'Volver' : 'Histórico'}
          >
            {activeSection === 'historico' ? (
              <svg className="history-icon-back" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M10 8L6 12L10 16M6 12H15C17.76 12 20 14.24 20 17V18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <span aria-hidden="true">⏳</span>
            )}
          </button>
        </div>

        {activeSection !== 'historico' && (
          <div className="section-switch">
            <button
              type="button"
              className={activeSection === 'diarias' ? 'active' : ''}
              onClick={() => setActiveSection('diarias')}
            >
              Diarias
            </button>
            <button
              type="button"
              className={activeSection === 'programadas' ? 'active' : ''}
              onClick={() => setActiveSection('programadas')}
            >
              Programadas
            </button>
          </div>
        )}

        {showCalendar && (
          <div className="calendar-section">
            <div className="calendar-header">
              <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                ←
              </button>
              <h2>{currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
              <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                →
              </button>
            </div>

            <div className="calendar-grid">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dayName) => (
                <div key={dayName} className="calendar-weekday">{dayName}</div>
              ))}

              {monthDays.map((day) => {
                const dayKey = formatDateKey(day)
                const dayTasks = tasksByDate[dayKey] || []
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                const isSelected = dayKey === selectedDate

                return (
                  <button
                    key={dayKey}
                    type="button"
                    className={`calendar-day ${isCurrentMonth ? '' : 'muted'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(dayKey)}
                  >
                    <span className="calendar-day-number">{day.getDate()}</span>
                    {dayTasks.length > 0 && <span className="calendar-day-count">{dayTasks.length}</span>}
                  </button>
                )
              })}
            </div>

            <div className="calendar-details">
              <h3>Tareas para {formatDateLabel(selectedDate)}</h3>
              <button
                type="button"
                className="calendar-add-task-btn"
                onClick={handleAddTaskForSelectedDay}
              >
                Agregar tarea para este dia
              </button>

              {selectedDayTasks.length > 0 ? (
                <ul className="calendar-task-list">
                  {selectedDayTasks.map((task) => (
                    <li key={task.id} className="calendar-task-item">
                      <div>
                        <strong>{task.title}</strong>
                        <div className="calendar-task-time">{formatDateTimeLabel(task.estimatedTime)}</div>
                      </div>
                      <div className="calendar-task-actions">
                        <button type="button" onClick={() => startEdit(task)}>Editar</button>
                        <button type="button" onClick={() => handleDelete(task.id)}>Eliminar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay tareas para este dia.</p>
              )}
            </div>

          </div>
        )}

        <h3 className="section-title">
          {activeSection === 'diarias' && 'Tareas diarias'}
          {activeSection === 'programadas' && 'Tareas programadas futuras'}
          {activeSection === 'historico' && 'Historico de tareas cumplidas'}
        </h3>

        {tasksToRender.length === 0 && (
          <p className="empty-state">
            {activeSection === 'diarias'
              ? 'No hay tareas diarias para mostrar.'
              : activeSection === 'programadas'
                ? 'No hay tareas programadas a futuro.'
                : 'Aun no hay tareas cumplidas en el historico.'}
          </p>
        )}

        <ul className="task-list">
          {tasksToRender.map((task) => (
            <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''} ${getTaskAccent(task)}`}>
              <div className="task-content">
                {activeSection === 'historico' ? (
                  <p className="history-task-title">{task.title}</p>
                ) : (
                  <label>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggle(task.id)}
                    />
                    <span>{task.title}</span>
                  </label>
                )}
                <div className="task-meta">
                  {task.important && <span className="task-badge important-badge">Importante</span>}
                  {task.estimatedTime && (
                    <>
                      <span className="task-badge scheduled-badge">Programada</span>
                      <span className="task-badge datetime-badge">{formatDateTimeLabel(task.estimatedTime)}</span>
                    </>
                  )}
                  {activeSection === 'historico' && task.completedAt && (
                    <span className="task-badge completed-at-badge">Cumplida: {formatDateTimeLabel(task.completedAt)}</span>
                  )}
                </div>
              </div>
              {activeSection !== 'historico' && (
                <div className="task-actions">
                  <button type="button" onClick={() => startEdit(task)}>Editar</button>
                  <button type="button" onClick={() => handleDelete(task.id)}>Eliminar</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
