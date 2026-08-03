import { useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'

interface NewCourseCardProps {
  onConfirm: (name: string) => void
  onCancel: () => void
}

function NewCourseCard({ onConfirm, onCancel }: NewCourseCardProps): React.JSX.Element {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const confirm = (): void => {
    const trimmed = name.trim()
    if (trimmed) onConfirm(trimmed)
  }

  return (
    <div className="course-card new-course-card">
      <div className="course-top">
        <input
          ref={inputRef}
          className="new-course-input"
          type="text"
          placeholder="Nom du nouveau cours..."
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') confirm()
            if (event.key === 'Escape') onCancel()
          }}
        />
        <div className="course-actions">
          <button onClick={confirm} title="Valider">
            <Check size={16} />
          </button>
          <button onClick={onCancel} title="Annuler">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewCourseCard
