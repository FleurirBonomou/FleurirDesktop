import { Link } from 'react-router-dom'

function NavBar(): React.JSX.Element {
  return (
    <nav>
      <Link to="/" title="Question (Ctrl+1)">
        Question <span className="shortcut">Ctrl+1</span>
      </Link>
      <Link to="/courses" title="Courses (Ctrl+2)">
        Courses <span className="shortcut">Ctrl+2</span>
      </Link>
      <Link to="/statistics" title="Statistics (Ctrl+3)">
        Statistics <span className="shortcut">Ctrl+3</span>
      </Link>
      <Link to="/settings" title="Settings (Ctrl+4)">
        Settings <span className="shortcut">Ctrl+4</span>
      </Link>
      <Link to="/new-question" title="Nouvelle question (Ctrl+5)">
        Nouvelle question <span className="shortcut">Ctrl+5</span>
      </Link>
    </nav>
  )
}

export default NavBar
