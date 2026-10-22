import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

/**
 * MainLayout — gabarit principal : Navbar + contenu (Outlet) + Footer.
 * La structure flex-col + min-h-screen colle le footer en bas même
 * quand le contenu est court.
 */
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
