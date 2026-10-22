import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AuthLayout from '@/pages/AuthLayout'
import { Button, Input, Alert } from '@/components/ui'

/**
 * Page de connexion — branchée sur POST /api/auth/login.
 * Après succès, redirige vers la page d'origine (state.from) ou l'accueil.
 */
export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Page d'où l'utilisateur venait (posée par ProtectedRoute), sinon accueil
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(form)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Connexion impossible.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Accédez à votre espace Farhane Labs."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          required
        />

        <Button type="submit" fullWidth loading={submitting}>
          Se connecter
        </Button>
      </form>

      {/* Aide : comptes de démo du seed backend */}
      <p className="mt-6 rounded-lg bg-slate-50 p-3 text-center text-xs text-muted">
        Comptes de démo (après <span className="font-mono">npm run seed</span>) :<br />
        <span className="font-mono">client@farhane.com</span> / client123 ·{' '}
        <span className="font-mono">admin@farhane.com</span> / admin123
      </p>
    </AuthLayout>
  )
}
