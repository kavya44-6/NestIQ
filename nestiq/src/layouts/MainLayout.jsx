import Navbar from '../components/navigation/NavBar'
import Footer from '../components/navigation/Footer'

export default function MainLayout({ children, noFooter = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: 'var(--navbar-height)' }}>
        {children}
      </main>
      {!noFooter && <Footer />}
    </div>
  )
}