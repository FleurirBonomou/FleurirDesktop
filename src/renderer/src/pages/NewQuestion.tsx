import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Course } from '../../../shared/types'
import { useSearchParams } from 'react-router-dom'
import { createQuestion, getCourses } from '@renderer/services/api'
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES_WITHOUT_ANSWER,
  type QuestionType
} from '../../../shared/question-types'
import LatexText from '@renderer/components/LatexText'

// ===========================================================================
// Constantes
// ===========================================================================

/** Clé d'un champ du formulaire : relie erreurs, refs et attributs aria. */
type FieldKey = 'course' | 'question' | 'source' | 'type' | 'answer' | 'history'

/** Ordre de priorité du focus / scroll vers le premier champ invalide. */
const FIELD_ORDER: FieldKey[] = ['course', 'question', 'source', 'type', 'answer', 'history']

/** Vrai/Faux : la route question/create reçoit answer/history pré-remplis
 *  (valeur anglaise du type + libellé français), en miroir pour False/Faux. */
const TRUE_FALSE_VALUES: Partial<Record<QuestionType, { answer: string; history: string }>> = {
  True: { answer: 'True', history: 'Vrai' },
  False: { answer: 'False', history: 'Faux' }
}

/** Un type qui exige la saisie d'une réponse et d'un historique (tout sauf Vrai/Faux). */
const requiresAnswer = (type: QuestionType): boolean => !QUESTION_TYPES_WITHOUT_ANSWER.has(type)

// ===========================================================================
// Sous-composants & helpers
// ===========================================================================

interface FieldAria {
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/** Attributs d'accessibilité d'un champ fautif : aria-invalid + lien vers le
 *  message d'erreur (rendu par <FormField> sous l'id "<id>-error"). */
function fieldAria(id: string, error?: string): FieldAria {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined
  }
}

interface FormFieldProps {
  id: string
  label: string
  error?: string
  /** Incrémenté à chaque soumission échouée : sert de key pour rejouer le shake. */
  shakeKey: number
  children: ReactNode
}

/** Champ de formulaire : label + contenu + message d'erreur. Quand `error` est
 *  défini, applique bordure/fond rouge + shake, et remonte le champ via `key`
 *  pour que l'animation se rejoue à chaque nouvelle tentative. */
function FormField({ id, label, error, shakeKey, children }: FormFieldProps): React.JSX.Element {
  return (
    <div
      key={error ? shakeKey : undefined}
      className={`new-question-field${error ? ' has-error shake' : ''}`}
    >
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

interface CourseComboboxProps {
  inputRef: React.RefObject<HTMLInputElement | null>
  courses: Course[]
  courseId: number | ''
  error?: string
  /** Emet le cours choisi (sélection) ou '' (désélection pendant la frappe). */
  onChange: (courseId: number | '') => void
}

/** Combobox « Cours » : champ texte + liste filtrée par le nom tapé. Remplaçant
 *  du <select> natif (dont le popup ne se stylait pas en sombre). Sélection →
 *  onChange(course.id) ; quand la frappe s'écarte du cours choisi → onChange(''). */
function CourseCombobox({
  inputRef,
  courses,
  courseId,
  error,
  onChange
}: CourseComboboxProps): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedCourse = courses.find((course) => course.id === courseId)
  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(query.trim().toLowerCase())
  )
  // L'input montre le nom du cours choisi (par l'URL ou un clic), sinon le texte tapé.
  const value = selectedCourse ? selectedCourse.name : query

  // Ferme la liste au clic en dehors du combobox.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const handleInput = (text: string): void => {
    setQuery(text)
    setActiveIndex(-1)
    setOpen(true)
    if (selectedCourse && text.trim().toLowerCase() !== selectedCourse.name.toLowerCase()) {
      onChange('')
    }
  }

  const selectCourse = (course: Course): void => {
    setQuery(course.name)
    setOpen(false)
    setActiveIndex(-1)
    onChange(course.id)
  }

  // Clavier : les flèches déplacent le surlignage, Entrée valide, Échap referme.
  // (Le formulaire n'intercepte pas les flèches dans un input.)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (filteredCourses.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((i) => (i + 1) % filteredCourses.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) return
      setActiveIndex((i) => (i - 1 + filteredCourses.length) % filteredCourses.length)
    } else if (event.key === 'Enter') {
      if (open && filteredCourses[activeIndex]) {
        event.preventDefault()
        selectCourse(filteredCourses[activeIndex])
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="course-combobox" ref={rootRef}>
      <input
        id="course"
        ref={inputRef}
        type="text"
        role="combobox"
        autoComplete="off"
        placeholder="Choisir un cours"
        value={value}
        aria-expanded={open}
        aria-controls="course-listbox"
        aria-autocomplete="list"
        aria-activedescendant={
          open && activeIndex >= 0 ? `course-option-${activeIndex}` : undefined
        }
        {...fieldAria('course', error)}
        onChange={(event) => handleInput(event.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && filteredCourses.length > 0 && (
        <ul className="course-listbox" id="course-listbox" role="listbox">
          {filteredCourses.map((course, index) => (
            <li
              key={course.id}
              id={`course-option-${index}`}
              role="option"
              aria-selected={course.id === courseId}
              className={[
                index === activeIndex ? 'active' : '',
                course.id === courseId ? 'selected' : ''
              ]
                .join(' ')
                .trim()}
              onMouseDown={(event) => {
                event.preventDefault()
                selectCourse(course)
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {course.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function NewQuestion(): React.JSX.Element {
  // --- État du formulaire ---
  const [courses, setCourses] = useState<Course[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const [question, setQuestion] = useState('')
  const [source, setSource] = useState('')
  const [type, setType] = useState<QuestionType | null>(null)
  const [answer, setAnswer] = useState('')
  const [history, setHistory] = useState('')

  // --- État de soumission et de validation ---
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [shakeKey, setShakeKey] = useState(0)

  // --- Refs ---
  const formRef = useRef<HTMLFormElement>(null)
  // Miroir synchrone du type : setState est asynchrone, or Vrai/Faux soumet
  // immédiatement — handleSubmit doit lire un type fiable.
  const typeRef = useRef<QuestionType | null>(null)
  const courseRef = useRef<HTMLInputElement>(null)
  const questionRef = useRef<HTMLTextAreaElement>(null)
  const sourceRef = useRef<HTMLInputElement>(null)
  const typeFieldRef = useRef<HTMLDivElement>(null)
  const answerRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<HTMLTextAreaElement>(null)
  // Dernier shakeKey déjà traité : évite de reprendre le focus pendant la
  // frappe quand errors change sans nouvelle soumission.
  const focusedShakeKey = useRef(0)

  // --- Chargement initial : la liste des cours ---
  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch((error) => {
        console.error('Impossible to load courses', error)
      })
  }, [])

  // --- Valeur dérivée : le cours sélectionné ---
  // L'URL dit quel cours, la liste valide qu'il existe (sinon retour à '').
  const rawId = Number(searchParams.get('course'))
  const courseId = courses.some((course) => course.id === rawId) ? rawId : ''

  // --- Validation ---

  // Valide tous les champs d'un coup : renvoie un message d'erreur par champ fautif.
  const validate = (
    courseId: number,
    question: string,
    source: string,
    currentType: QuestionType | null,
    answer: string,
    history: string
  ): Partial<Record<FieldKey, string>> => {
    const errs: Partial<Record<FieldKey, string>> = {}
    if (!courseId) errs.course = 'Choisissez un cours'
    if (!question.trim()) errs.question = 'La question est requise'
    if (!source.trim()) errs.source = 'La source est requise'
    if (currentType === null) errs.type = 'Choisissez un type de question'
    if (currentType !== null && requiresAnswer(currentType)) {
      if (!answer.trim()) errs.answer = 'La réponse est requise'
      if (!history.trim()) errs.history = "L'historique est requis"
    }
    return errs
  }

  // Retire l'erreur d'un champ dès que l'utilisateur le corrige : la bordure
  // rouge disparaît pendant la frappe.
  const clearError = (key: FieldKey): void => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  // Après une soumission échouée, focus + scroll vers le premier champ invalide.
  // Le garde focusedShakeKey évite de reprendre le focus pendant la frappe
  // quand un seul champ est corrigé (errors change sans nouvelle soumission).
  useEffect(() => {
    if (shakeKey === 0 || focusedShakeKey.current === shakeKey) return
    focusedShakeKey.current = shakeKey
    const firstInvalid = FIELD_ORDER.find((key) => errors[key])
    if (!firstInvalid) return
    const refsByKey: Record<FieldKey, HTMLElement | null> = {
      course: courseRef.current,
      question: questionRef.current,
      source: sourceRef.current,
      type: typeFieldRef.current,
      answer: answerRef.current,
      history: historyRef.current
    }
    const el = refsByKey[firstInvalid]
    el?.focus()
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [shakeKey, errors])

  // --- Gestionnaires d'événements ---

  // Changement du cours choisi (par le combobox) : mise à jour de l'URL
  // (?course=<id>, ou sans paramètre si désélection) + retrait de l'erreur.
  const handleCourseChange = (value: number | ''): void => {
    clearError('course')
    if (value === '') {
      setSearchParams({})
    } else {
      setSearchParams({ course: String(value) })
    }
  }

  // Clic sur un type :
  // - Vrai/Faux : sauvegarde directe — le clic appelle toujours la route (même
  //   re-clic = nouvelle tentative), car answer/history sont pré-remplis.
  // - Types à réponse : le re-clic sur le type actif le désélectionne et vide
  //   la réponse / l'historique (garantis vides quand le type est null).
  const handleTypeClick = (t: QuestionType): void => {
    if (submitting) {
      return
    }
    clearError('type')
    if (!requiresAnswer(t)) {
      setType(t)
      typeRef.current = t
      clearError('answer')
      clearError('history')
      formRef.current?.requestSubmit()
      return
    }
    if (t === type) {
      setType(null)
      typeRef.current = null
      setAnswer('')
      setHistory('')
      clearError('answer')
      clearError('history')
      return
    }
    setType(t)
    typeRef.current = t
  }

  // Soumission : le bouton Sauvegarder et Vrai/Faux (sauvegarde directe) passent ici.
  // Validation de tous les champs, puis envoi au serveur via la chaîne IPC.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    const courseId = Number(searchParams.get('course'))
    const currentType = typeRef.current

    // Chaque champ fautif reçoit bordure rouge + message ; le premier reçoit
    // focus + scroll + shake (déclenché via shakeKey). Les messages sous les
    // champs suffisent : le feedback global en bas est réservé aux erreurs
    // serveur (voir le catch plus bas).
    const errs = validate(courseId, question, source, currentType, answer, history)
    const firstInvalid = FIELD_ORDER.find((key) => errs[key])
    if (firstInvalid) {
      setErrors(errs)
      setShakeKey((k) => k + 1)
      return
    }

    setErrors({})
    // TypeScript ne peut pas déduire du résultat de validate() que le type est
    // défini ici (sinon l'erreur 'type' aurait déjà déclenché le retour ci-dessus).
    if (currentType === null) return

    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)
    try {
      // Vrai/Faux : answer/history pré-remplis par le clic (pas de saisie manuelle).
      const tf = TRUE_FALSE_VALUES[currentType]
      await createQuestion({
        courseId,
        question: question.trim(),
        source: source.trim(),
        type: currentType,
        answer: tf?.answer ?? answer.trim(),
        history: tf?.history ?? history.trim()
      })
      // Succès : on vide la question, le type, la réponse et l'historique,
      // mais on garde le cours sélectionné ET la source pour enchaîner
      // les questions d'une même source.
      setQuestion('')
      setType(null)
      typeRef.current = null
      setAnswer('')
      setHistory('')
      setSubmitSuccess(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Échec de la sauvegarde')
    } finally {
      setSubmitting(false)
    }
  }

  // Navigation clavier : les flèches haut/bas font le tour des champs du
  // formulaire en lisant le DOM vivant (champs conditionnels compris).
  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return
    }
    const active = document.activeElement
    // Dans un champ de texte, les flèches déplacent le curseur : la navigation
    // se fait alors avec Tab (comportement natif du navigateur).
    if (
      active instanceof HTMLTextAreaElement ||
      (active instanceof HTMLInputElement && active.type !== 'button' && active.type !== 'submit')
    ) {
      return
    }
    const targets = Array.from(
      formRef.current?.querySelectorAll<HTMLElement>('textarea, input, button') ?? []
    )
    const currentIndex = targets.indexOf(active as HTMLElement)
    if (currentIndex === -1) {
      const fallback = event.key === 'ArrowDown' ? targets[0] : targets[targets.length - 1]
      fallback?.focus()
      return
    }
    const step = event.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (currentIndex + step + targets.length) % targets.length
    targets[nextIndex].focus()
    event.preventDefault()
  }

  // Panneau réponse/historique + bouton Sauvegarder : visibles seulement pour
  // les types qui demandent une réponse (tout sauf Vrai/Faux).
  const showAnswerSection = type !== null && requiresAnswer(type)

  return (
    <form
      className="new-question-page"
      ref={formRef}
      onKeyDown={handleKeyDown}
      onSubmit={handleSubmit}
    >
      <h1>Nouvelle question</h1>

      <FormField id="course" label="Cours :" error={errors.course} shakeKey={shakeKey}>
        <CourseCombobox
          inputRef={courseRef}
          courses={courses}
          courseId={courseId}
          error={errors.course}
          onChange={handleCourseChange}
        />
      </FormField>

      <FormField id="question" label="Question :" error={errors.question} shakeKey={shakeKey}>
        <textarea
          id="question"
          ref={questionRef}
          rows={3}
          autoFocus
          value={question}
          {...fieldAria('question', errors.question)}
          onChange={(event) => {
            setQuestion(event.target.value)
            clearError('question')
          }}
        />
        {question.includes('$') && (
          <div className="latex-preview">
            <span className="latex-preview-label">Aperçu :</span>
            <LatexText className="latex-preview-text">{question}</LatexText>
          </div>
        )}
      </FormField>

      <FormField id="source" label="Source :" error={errors.source} shakeKey={shakeKey}>
        <input
          id="source"
          ref={sourceRef}
          value={source}
          {...fieldAria('source', errors.source)}
          onChange={(event) => {
            setSource(event.target.value)
            clearError('source')
          }}
        />
      </FormField>

      <FormField id="type" label="Type :" error={errors.type} shakeKey={shakeKey}>
        <div
          ref={typeFieldRef}
          role="group"
          tabIndex={-1}
          className={`question-types${errors.type ? ' has-error' : ''}`}
          {...fieldAria('type', errors.type)}
        >
          {QUESTION_TYPES.map((t) => {
            const withoutAnswer = !requiresAnswer(t)
            const selected = t === type
            // Quand un type est choisi, Vrai/Faux passent en blanc soft (moins agressif)
            const soft = withoutAnswer && type !== null && !selected
            const className = [
              withoutAnswer ? 'primary' : '',
              soft ? 'soft' : '',
              selected ? 'selected' : ''
            ]
              .join(' ')
              .trim()
            return (
              <button
                key={t}
                type="button"
                className={className}
                onClick={() => handleTypeClick(t)}
              >
                {QUESTION_TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>
      </FormField>

      {showAnswerSection && (
        <div className="answer-section">
          <FormField id="answer" label="Réponse :" error={errors.answer} shakeKey={shakeKey}>
            <input
              id="answer"
              ref={answerRef}
              type="text"
              value={answer}
              {...fieldAria('answer', errors.answer)}
              onChange={(event) => {
                setAnswer(event.target.value)
                clearError('answer')
              }}
            />
          </FormField>

          <FormField id="history" label="Historique :" error={errors.history} shakeKey={shakeKey}>
            <textarea
              id="history"
              ref={historyRef}
              rows={2}
              value={history}
              {...fieldAria('history', errors.history)}
              onChange={(event) => {
                setHistory(event.target.value)
                clearError('history')
              }}
            />
          </FormField>
        </div>
      )}

      {/* Feedback global de soumission (erreur réseau ou succès) */}
      {(submitError || submitSuccess) && (
        <p className={`submit-feedback ${submitError ? 'error' : 'success'}`}>
          {submitError || 'Question enregistrée'}
        </p>
      )}

      {/* Vrai/Faux sauvegardent directement au clic : le bouton Sauvegarder
          n'apparaît que pour les types qui demandent réponse + historique. */}
      {showAnswerSection && (
        <button type="submit" className="create-question-button" disabled={submitting}>
          Sauvegarder
        </button>
      )}
    </form>
  )
}

export default NewQuestion
