import { useState } from 'react'
import { Plus, Trash2, Pencil, ChevronDown } from 'lucide-react'

interface CourseCardProps {
  name: string
  questionCount: number
  lastQuestion: string
  cardRef?: React.Ref<HTMLDivElement>
  onAdd?: () => void
  onDelete?: () => void
}

function CourseCard({
  name,
  questionCount,
  lastQuestion,
  cardRef,
  onAdd,
  onDelete
}: CourseCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)

  return (
    <div ref={cardRef} tabIndex={0} className="course-card">
      <div className="course-top">
        <span className="course-name">{name}</span>
        <div className="course-actions">
          <button onClick={onAdd}>
            <Plus size={16} />
          </button>
          <button>
            <Pencil size={16} />
          </button>
          <button
            onClick={onDelete}
            disabled={questionCount > 0}
            title={
              questionCount > 0
                ? 'Supprimez les questions avant de supprimer le cours'
                : 'Supprimer le cours'
            }
          >
            <Trash2 size={16} />
          </button>
          <button onClick={() => setExpanded(!expanded)}>
            <ChevronDown size={16} className={expanded ? 'rotated' : ''} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="course-details">
          {questionCount} questions - Dernière question ajoutée le {lastQuestion}
        </div>
      )}
    </div>
  )
}

export default CourseCard
