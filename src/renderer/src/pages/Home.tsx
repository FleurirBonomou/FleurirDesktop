import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Home(): React.JSX.Element {
  const navigate = useNavigate()

  // La touche Espace lance la session directement depuis l'écran d'accueil.
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === ' ' || e.code === 'Space') navigate('/session')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  return (
    <div className="radial-bg">
      <div className="home-center">
        <button type="button" className="home-start-btn" onClick={() => navigate('/session')}>
          Questions !
        </button>
      </div>
    </div>
  )
}

export default Home
