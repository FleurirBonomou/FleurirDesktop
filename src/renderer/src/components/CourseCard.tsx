import { useState } from 'react'
import { Plus, Trash2, Pencil, ChevronDown, Heart } from 'lucide-react'

interface CourseCardProps {
  name: string
  questionCount: number
  lastQuestion: string
  inList: boolean
  cardRef?: React.Ref<HTMLDivElement>
  onAdd?: () => void
  onDelete?: () => void
  onAddToList?: () => void
}

function CourseCard({
  name,
  questionCount,
  lastQuestion,
  cardRef,
  onAdd,
  onDelete,
  onAddToList,
  inList
}: CourseCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)

  return (
    <div ref={cardRef} tabIndex={0} className="course-card">
      <div className="course-top">
        <span className="course-name">{name}</span>
        <div className="course-actions">
          <button type="button" onClick={onAdd}>
            <Plus size={16} />
          </button>
          <button
            type="button"
            className={inList ? 'course-action-add-to-list' : ''}
            title={inList ? 'Remove from list' : 'Add to list'}
            onClick={onAddToList}
          >
            <Heart size={16} />
          </button>
          <button type="button">
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
