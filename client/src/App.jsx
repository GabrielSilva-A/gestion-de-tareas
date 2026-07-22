import { useEffect, useMemo, useState } from 'react'
import './App.css'

const defaultTasks = [
  { id: 1, title: 'Aprender React', completed: false, completedAt: null, important: true, estimatedTime: '', categories: [] },
  { id: 2, title: 'Revisar proyecto', completed: false, completedAt: null, important: false, estimatedTime: '2026-07-22T18:00', categories: [] }
]

const TASKS_HISTORY_KEY = 'tasksHistory'

const getInitialTasks = () => {
  if (typeof window === 'undefined') return defaultTasks

  try {
    const savedTasks = window.localStorage.getItem('tasks')
    return savedTasks ? JSON.parse(savedTasks) : defaultTasks
  } catch {
    return defaultTasks
  }
}

const getInitialHistory = () => {
  if (typeof window === 'undefined') return []

  try {
    const savedHistory = window.localStorage.getItem(TASKS_HISTORY_KEY)
    return savedHistory ? JSON.parse(savedHistory) : []
  } catch {
    return []
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

function App() {
  const [tasks, setTasks] = useState(getInitialTasks)
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
  const [historyTasks, setHistoryTasks] = useState(getInitialHistory)
  const safeTasks = Array.isArray(tasks) ? tasks : []
  const safeHistoryTasks = Array.isArray(historyTasks) ? historyTasks : []

  useEffect(() => {
    window.localStorage.setItem('tasks', JSON.stringify(safeTasks))
  }, [safeTasks])

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

  useEffect(() => {
    setTasks((prevTasks) => {
      const baseTasks = Array.isArray(prevTasks) ? prevTasks : []

      const completedToArchive = baseTasks.filter((task) => {
        if (!task.completed) return false
        if (!task.completedAt) return false
        return formatDateKey(new Date(task.completedAt)) < currentDayKey
      })

      if (completedToArchive.length === 0) return baseTasks

      const completedHistory = completedToArchive.map((task) => ({
        ...task,
        archivedAt: new Date().toISOString()
      }))
      const nextHistory = [...safeHistoryTasks, ...completedHistory]

      window.localStorage.setItem(TASKS_HISTORY_KEY, JSON.stringify(nextHistory))
      setHistoryTasks(nextHistory)

      return baseTasks.filter((task) => {
        if (!task.completed) return true
        if (!task.completedAt) return true
        return formatDateKey(new Date(task.completedAt)) >= currentDayKey
      })
    })
  }, [currentDayKey, safeHistoryTasks])

  const getTaskAccent = (task) => {
    if (task.estimatedTime) return 'scheduled'
    if (task.important) return 'important'
    return 'normal'
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!title.trim()) return

    const taskTitle = title.trim()

    const nextEstimatedTime = isProgramable ? estimatedTime : ''
    const nextImportant = isProgramable ? false : important

    if (editingId) {
      setTasks((prevTasks) => {
        const baseTasks = Array.isArray(prevTasks) ? prevTasks : []
        return baseTasks.map((task) => task.id === editingId
          ? {
            ...task,
            title: taskTitle,
            important: nextImportant,
            estimatedTime: nextEstimatedTime,
            completedAt: task.completed ? task.completedAt || new Date().toISOString() : null
          }
          : task)
      })
      setEditingId(null)
    } else {
      setTasks((prevTasks) => {
        const baseTasks = Array.isArray(prevTasks) ? prevTasks : []
        return [
          ...baseTasks,
          {
            id: Date.now(),
            title: taskTitle,
            completed: false,
            completedAt: null,
            important: nextImportant,
            estimatedTime: nextEstimatedTime
          }
        ]
      })
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

  const handleDelete = (id) => {
    setTasks((prevTasks) => {
      const baseTasks = Array.isArray(prevTasks) ? prevTasks : []
      return baseTasks.filter((task) => task.id !== id)
    })
  }

  const handleToggle = (id) => {
    setTasks((prevTasks) => {
      const baseTasks = Array.isArray(prevTasks) ? prevTasks : []
      return baseTasks.map((task) => {
        if (task.id !== id) return task

        const nextCompleted = !task.completed
        return {
          ...task,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : null
        }
      })
    })
  }

  const startEdit = (task) => {
    setEditingId(task.id)
    setTitle(task.title)
    setImportant(task.estimatedTime ? false : task.important)
    setEstimatedTime(task.estimatedTime || '')
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
      if (!task.estimatedTime) return true

      const scheduledDate = new Date(task.estimatedTime)
      if (Number.isNaN(scheduledDate.getTime())) return false

      return formatDateKey(scheduledDate) <= currentDayKey
    })
  }, [safeTasks, currentDayKey])

  const scheduledFutureTasks = useMemo(() => {
    return safeTasks
      .filter((task) => {
        if (!task.estimatedTime) return false

        const scheduledDate = new Date(task.estimatedTime)
        if (Number.isNaN(scheduledDate.getTime())) return false

        return formatDateKey(scheduledDate) > currentDayKey
      })
      .sort((taskA, taskB) => new Date(taskA.estimatedTime) - new Date(taskB.estimatedTime))
  }, [safeTasks, currentDayKey])

  const historyTasksSorted = useMemo(() => {
    return [...safeHistoryTasks].sort((taskA, taskB) => {
      const dateA = new Date(taskA.archivedAt || taskA.completedAt || 0)
      const dateB = new Date(taskB.archivedAt || taskB.completedAt || 0)
      return dateB - dateA
    })
  }, [safeHistoryTasks])

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

  return (
    <main className="app-shell" translate="no">
      <section className="task-card">
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
