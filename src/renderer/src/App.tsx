import { useEffect } from 'react'
import { Routes, Route, Outlet, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Session from './pages/Session'
import Courses from './pages/Courses'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'
import NavBar from './components/NavBar'
import NewQuestion from './pages/NewQuestion'

const PAGES = ['/', '/courses', '/statistics', '/settings', '/new-question']

function App(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      // Si un menu/dialog est ouvert (Détails, confirmation de suppression), on
      // laisse son propre gestionnaire Échap le fermer : on ne quitte pas la
      // session dans ce cas.
      const overlayOpen =
        document.querySelector('.details-overlay') !== null ||
        document.querySelector('.delete-overlay') !== null

      if (event.key === 'Escape' && location.pathname === '/session' && !overlayOpen) {
        event.preventDefault()
        navigate('/')
        return
      }

      const directIndex = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(event.code)
      if (event.ctrlKey && directIndex !== -1) {
        event.preventDefault()
        navigate(PAGES[directIndex])
        return
      }
      if (event.ctrlKey && event.code === 'Tab') {
        event.preventDefault()
        const current = PAGES.indexOf(location.pathname)
        const base = current === -1 ? 0 : current
        const step = event.shiftKey ? -1 : 1
        navigate(PAGES[(base + step + PAGES.length) % PAGES.length])
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, location.pathname])

  return (
    <Routes>
      <Route path="/session" element={<Session />} />

      <Route element={<NavBarLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/new-question" element={<NewQuestion />} />
      </Route>
    </Routes>
  )
}

function NavBarLayout(): React.JSX.Element {
  return (
    <div className="app-layout">
      <NavBar />
      <Outlet />
    </div>
  )
}

export default App
