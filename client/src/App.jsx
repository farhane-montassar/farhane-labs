import { Routes, Route } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import ProtectedRoute from '@/routes/ProtectedRoute'

import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Profil from '@/pages/Profil'
import Catalogue from '@/pages/Catalogue'
import ComponentDetail from '@/pages/ComponentDetail'
import Configurator from '@/pages/Configurator'
import MyKits from '@/pages/MyKits'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import Payment from '@/pages/Payment'
import OrderDetail from '@/pages/OrderDetail'
import MyOrders from '@/pages/MyOrders'
import ClientDashboard from '@/pages/ClientDashboard'
import SupplierDashboard from '@/pages/SupplierDashboard'
import AdminDashboard from '@/pages/AdminDashboard'
import ComingSoon from '@/pages/ComingSoon'
import Unauthorized from '@/pages/Unauthorized'
import NotFound from '@/pages/NotFound'

/**
 * App — table de routage.
 * Toutes les routes partagent MainLayout (Navbar + Footer).
 * Les routes protégées sont regroupées sous <ProtectedRoute />.
 */
function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/components/:id" element={<ComponentDetail />} />
        <Route path="/configurateur" element={<Configurator />} />
        <Route path="/panier" element={<Cart />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protégé — tout utilisateur connecté */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profil" element={<Profil />} />
        </Route>

        {/* Protégé — rôle client (espace + kits + tunnel d'achat) */}
        <Route element={<ProtectedRoute roles="client" />}>
          <Route path="/mon-compte" element={<ClientDashboard />} />
          <Route path="/mes-kits" element={<MyKits />} />
          <Route path="/commande" element={<Checkout />} />
          <Route path="/commande/:id/paiement" element={<Payment />} />
          <Route path="/commande/:id" element={<OrderDetail />} />
          <Route path="/mes-commandes" element={<MyOrders />} />
        </Route>

        {/* Protégé — rôle fournisseur (dashboard) */}
        <Route element={<ProtectedRoute roles="supplier" />}>
          <Route path="/fournisseur" element={<SupplierDashboard />} />
        </Route>
        <Route element={<ProtectedRoute roles="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
