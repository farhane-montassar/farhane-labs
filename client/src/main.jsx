import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { CartProvider } from '@/context/CartContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Router en premier, puis le contexte d'auth (qui utilise la navigation),
        puis le panier (indépendant de l'auth). ErrorBoundary entoure l'app : une
        erreur de rendu affiche un écran d'erreur, jamais une page blanche. */}
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <CartProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </CartProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
