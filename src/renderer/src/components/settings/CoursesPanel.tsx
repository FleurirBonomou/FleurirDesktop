import { getCourses, getReviewConfig, updateReviewConfig } from '@renderer/services/api'
import type { Course } from '../../../../shared/types'
import { useEffect, useState } from 'react'

export function CoursesPanel(): React.JSX.Element {
  const [useList, setUseList] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([getReviewConfig(), getCourses()])
      .then(([config, fetchedCourses]) => {
        if (cancelled) return
        setUseList(config.useList)
        setCourses(fetchedCourses)
      })
      .catch((error) => console.error('Error loading settings data', error))
    return () => {
      cancelled = true
    }
  }, [])

  const hasCoursesInList = courses.some((c) => c.inList)
  const switchDisabled = !hasCoursesInList && !useList

  const handleToggleList = async (checked: boolean): Promise<void> => {
    try {
      await updateReviewConfig({ useList: checked })
      setUseList(checked)
    } catch (error) {
      console.error('Error updating useList', error)
    }
  }

  return (
    <div className="courses-panel">
      <label className="switch-row">
        <span className="switch-label">
          Filtrer par cours
          {!hasCoursesInList && <span className="switch-warning">Aucun cours dans la liste</span>}
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={useList}
          disabled={switchDisabled}
          onChange={(e) => handleToggleList(e.target.checked)}
        />
      </label>
    </div>
  )
}
