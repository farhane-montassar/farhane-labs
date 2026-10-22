import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AuthLayout from '@/pages/AuthLayout'
import { Button, Input, Alert } from '@/components/ui'

/**
 * Page d'inscription — branchée sur POST /api/auth/register.
 * Le backend force le rôle "client". Après succès, l'utilisateur est connecté
 * (token renvoyé) → redirection vers l'accueil.
 */
export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  // Validation côté client avant l'appel réseau
  const validate = () => {
    if (form.name.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Email invalide.'
    if (form.password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères.'
    if (form.password !== form.confirm) return 'Les mots de passe ne correspondent pas.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await register({ name: form.name.trim(), email: form.email, password: form.password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Inscription impossible.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Rejoignez Farhane Labs en quelques secondes."
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Nom complet"
          name="name"
          autoComplete="name"
          placeholder="Jean Dupont"
          value={form.name}
          onChange={handleChange}
          required
        />
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
          autoComplete="new-password"
          placeholder="6 caractères minimum"
          hint="Au moins 6 caractères."
          value={form.password}
          onChange={handleChange}
          required
        />
        <Input
          label="Confirmer le mot de passe"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.confirm}
          onChange={handleChange}
          required
        />

        <Button type="submit" fullWidth loading={submitting}>
          Créer mon compte
        </Button>
      </form>
    </AuthLayout>
  )
}
