import { useState } from 'react'

const initialForm = {
  name: '',
  email: '',
  password: '',
}

function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isRegister = mode === 'register'

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!form.email.trim() || !form.password.trim()) {
        throw new Error('Email y contraseña son obligatorios.')
      }

      if (isRegister && !form.name.trim()) {
        throw new Error('El nombre es obligatorio para registrarse.')
      }

      if (isRegister) {
        await onRegister({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        })
      } else {
        await onLogin({
          email: form.email.trim(),
          password: form.password,
        })
      }

      setForm(initialForm)
    } catch (submitError) {
      setError(submitError.message || 'No se pudo completar la operación.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app-shell auth-shell" translate="no">
      <section className="task-card auth-card">
        <h1>Gestor de tareas</h1>
        <p className="auth-subtitle">Accede con tu cuenta para ver solo tus tareas.</p>

        <div className="auth-mode-switch" role="tablist" aria-label="Modo de autenticación">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login')
              setError('')
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register')
              setError('')
            }}
          >
            Registrarse
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <input
              type="text"
              placeholder="Nombre"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              autoComplete="name"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default AuthScreen
