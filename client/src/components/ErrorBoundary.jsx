import { Component } from 'react'

/**
 * ErrorBoundary — filet de sécurité global.
 *
 * Capture toute exception levée pendant le rendu d'un sous-arbre React et affiche
 * un message clair AU LIEU de démonter toute l'application (= page blanche).
 *
 * Doit être une classe : seuls les composants classe peuvent implémenter
 * getDerivedStateFromError / componentDidCatch.
 *
 * Placé haut dans l'arbre (autour de <App />), il garantit qu'aucune donnée
 * manquante ou erreur de rendu ne puisse jamais aboutir à un écran blanc.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Trace en console pour le diagnostic (et un éventuel report futur).
    console.error('ErrorBoundary a capturé une erreur de rendu :', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false })
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <div className="mb-4 text-4xl" aria-hidden>
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-navy">Une erreur est survenue</h1>
        <p className="mt-3 text-sm text-muted">
          Un problème inattendu a interrompu l'affichage de cette page. Vos données ne sont pas perdues —
          vous pouvez revenir à l'accueil et réessayer.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          className="mt-6 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          Retour à l'accueil
        </button>
      </div>
    )
  }
}
