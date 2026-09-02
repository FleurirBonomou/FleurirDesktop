// ---------------------------------------------------------------------------
// Page "Courses" : liste des cours avec recherche, création et suppression.
//
// L'ordre du fichier suit un fil logique :
//   1. imports
//   2. état & références
//   3. données dérivées (useMemo)
//   4. effets de montage (useEffect)
//   5. helpers d'animation FLIP
//   6. gestionnaires d'événements
//   7. rendu JSX
// ---------------------------------------------------------------------------

// --- Imports -----------------------------------------------------------------
// Composants d'affichage (présentation uniquement)
import CourseCard from '@renderer/components/CourseCard'
import NewCourseCard from '@renderer/components/NewCourseCard'
// Appels réseau (le composant ne parle jamais directement au serveur)
import { getCourses, deleteCourse, createCourse } from '@renderer/services/api'
// Hooks React
import { useEffect, useState, useMemo, useRef } from 'react'
// flushSync force React à commiter le DOM de façon synchrone (utile pour les animations)
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
// Type partagé entre le main process et le renderer
import type { Course } from '../../../shared/types'

function Courses(): React.JSX.Element {
  // --- 1. État & références --------------------------------------------------
  // courses : liste complète chargée depuis le serveur
  const [courses, setCourses] = useState<Course[]>([])
  // loading : vrai tant que le premier chargement n'est pas terminé
  const [loading, setLoading] = useState(true)
  // search : texte tapé dans le champ de recherche
  const [search, setSearch] = useState('')
  // creating : vrai quand la carte "Nouveau cours" est ouverte
  const [creating, setCreating] = useState(false)

  // searchRef : champ de recherche (focus + navigation clavier)
  const searchRef = useRef<HTMLInputElement>(null)
  // cardRefs : un tableau de refs aligné sur `filtered`, une entrée par carte.
  //            Utilisé uniquement pour animer la carte en cours de suppression.
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])
  // buttonRef : bouton "Nouveau cours"
  const buttonRef = useRef<HTMLButtonElement>(null)
  // listRef : conteneur .course-list — sert de référence de mesure pour les animations FLIP
  const listRef = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()

  // --- 2. Données dérivées ----------------------------------------------------
  // Courses filtrés par la recherche.
  // useMemo : le filtre n'est recalculé que quand `courses` ou `search` changent.
  // Attention : `filtered` doit rester déclaré AVANT les handlers qui l'utilisent
  // (contrainte du React Compiler).
  const filtered = useMemo(
    () =>
      courses.filter((course) => course.name.toLowerCase().includes(search.trim().toLowerCase())),
    [courses, search]
  )

  // --- 3. Effets (au montage du composant) -------------------------------------
  // Donne le focus au champ de recherche dès l'ouverture de la page.
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // Charge les cours au montage, puis coupe le loader.
  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch((error) => console.error('Impossible to load courses', error))
      .finally(() => setLoading(false))
  }, [])

  // --- 4. Helpers d'animation FLIP ---------------------------------------------
  // Technique FLIP (First, Last, Invert, Play) : on note la position des cartes
  // avant un changement de liste (First), on applique le changement (Last), puis
  // chaque carte est décalée de `delta` pour retrouver visuellement sa position
  // d'origine (Invert) et animée vers sa position finale (Play).

  // Retourne le "top" de chaque enfant de la liste (l'étape First).
  const measureTops = (): number[] =>
    Array.from(listRef.current?.children ?? []).map(
      (el) => (el as HTMLElement).getBoundingClientRect().top
    )

  // Anime chaque carte de son ancienne position vers sa position finale.
  // `oldIndex(i)` mappe l'index actuel i vers son index dans la liste mesurée par
  // `first` — c'est lui qui gère la différence insertion / suppression :
  //   - insertion en tête  : oldIndex(i) = i - 1
  //   - suppression en tête : oldIndex(i) = i + 1
  //   - suppression à l'index k : oldIndex(i) = i >= k ? i + 1 : i
  const playFlip = (first: number[], oldIndex: (i: number) => number): void => {
    Array.from(listRef.current?.children ?? []).forEach((el, i) => {
      const card = el as HTMLElement
      const old = first[oldIndex(i)]
      if (old === undefined) return // carte sans position d'avant (ex. celle qu'on vient de créer)
      const last = card.getBoundingClientRect().top
      const delta = old - last
      if (delta === 0) return // la carte n'a pas bougé
      card.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], {
        duration: 250,
        easing: 'ease-out'
      })
    })
  }

  // --- 5. Gestionnaires d'événements ---------------------------------------------
  // Ouvre le formulaire de création : on décale les cartes vers le bas
  // (FLIP avec insertion en tête, une carte ajoutée à l'index 0).
  const startCreate = (): void => {
    const first = measureTops()
    setCreating(true)
    // un frame : le temps que React insère la nouvelle carte dans le DOM
    requestAnimationFrame(() => playFlip(first, (i) => i - 1))
  }

  // Appelé par la carte "Nouveau cours" à la validation : crée le cours puis recharge la liste.
  const handleCreate = async (name: string): Promise<void> => {
    try {
      await createCourse(name)
      const updated = await getCourses()
      setCourses(updated)
    } catch (error) {
      console.error('Impossible to create course', error)
    } finally {
      setCreating(false)
      searchRef.current?.focus()
    }
  }

  const handleAddQuestion = (courseId: number): void => {
    navigate(`/new-question?course=${courseId}`)
  }

  // Ferme le formulaire de création.
  // La carte "Nouveau cours" sort vers le haut (100ms), puis après un court délai
  // les cartes remontent d'un cran (FLIP avec suppression en tête).
  const handleCancel = (): void => {
    const first = measureTops()
    const newCard = listRef.current?.children[0] as HTMLElement | undefined
    newCard?.animate(
      [
        { transform: 'translateY(0)', opacity: 1 },
        { transform: 'translateY(-24px)', opacity: 0 }
      ],
      { duration: 100, easing: 'ease-in', fill: 'forwards' }
    )
    setTimeout(() => {
      setCreating(false)
      requestAnimationFrame(() => playFlip(first, (i) => i + 1))
      searchRef.current?.focus()
    }, 100)
  }

  // Supprime un cours.
  // Phase 1 : la carte supprimée se rétrécit (scale 1 -> 0) pendant que la requête
  //           DELETE part. `first` est mesuré ici, avant toute modification de la liste.
  // Phase 2 : une fois le serveur OK, la carte est retirée et les cartes du dessous
  //           remontent d'un cran (FLIP avec suppression à l'index k).
  //   Attention au décalage d'index (off-by-one) : `first` contient aussi la carte
  //   supprimée, donc les cartes situées en dessous lisent `first[i + 1]`.
  const handleDelete = async (id: number): Promise<void> => {
    const index = filtered.findIndex((course) => course.id === id)
    const card = cardRefs.current[index]
    const first = measureTops()

    const anim = card?.animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0)', opacity: 0 }
      ],
      { duration: 200, easing: 'ease-in', fill: 'forwards' }
    )

    try {
      const updatedPromise = deleteCourse(id).then(() => getCourses())
      // On attend la fin de l'animation ET la mise à jour de la liste
      await Promise.all([updatedPromise, anim?.finished])
      const updated = await updatedPromise

      // Commit synchrone du DOM : la liste sans la carte supprimée est appliquée
      // immédiatement. On mesure et on lance le FLIP dans la MÊME tâche, avant que
      // le navigateur ne peigne : la première image montre déjà les cartes à leur
      // ancienne position (inversées), donc aucun "flash" de réapparition.
      flushSync(() => setCourses(updated))
      playFlip(first, (i) => (i >= index ? i + 1 : i))
    } catch (error) {
      // En cas d'échec, on remet la carte à sa taille normale
      card?.animate(
        [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 }
        ],
        { duration: 150, easing: 'ease-out' }
      )
      console.error('Impossible de supprimer le cours', error)
    } finally {
      searchRef.current?.focus()
    }
  }

  // Navigation clavier : les flèches haut/bas déplacent le focus en ligne
  // entre le champ de recherche, les cartes et le bouton "Nouveau cours".
  // Le parcours est circulaire (wrap-around) : une flèche vers le haut depuis
  // la première cible ramène sur la dernière, et une flèche vers le bas depuis
  // la dernière ramène sur la première.
  // Les cibles sont relues depuis le DOM à chaque pression : robuste même
  // après une suppression (le tableau de refs `cardRefs` peut être obsolète).
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (creating || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return
    event.preventDefault()

    const targets = [
      searchRef.current,
      ...Array.from(listRef.current?.querySelectorAll('.course-card') ?? []),
      buttonRef.current
    ].filter((el): el is HTMLElement => el !== null)

    // Si le focus est sur un bouton interne d'une carte (ex. la corbeille),
    // on navigue à partir de la carte qui le contient.
    let currentIndex = targets.indexOf(document.activeElement as HTMLElement)
    if (currentIndex === -1) {
      const card = document.activeElement?.closest('.course-card')
      currentIndex = card ? targets.indexOf(card as HTMLElement) : -1
    }
    if (currentIndex === -1) return

    const step = event.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (currentIndex + step + targets.length) % targets.length
    targets[nextIndex]?.focus()
  }

  // --- 6. Rendu ------------------------------------------------------------------
  return (
    <div className="radial-bg courses-page" onKeyDown={handleKeyDown}>
      <input
        ref={searchRef}
        className="course-search"
        type="text"
        placeholder="Rechercher un cours"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div ref={listRef} className="course-list">
        {creating && <NewCourseCard onConfirm={handleCreate} onCancel={handleCancel} />}
        {loading ? (
          <p>Chargement...</p>
        ) : courses.length === 0 ? (
          <p className="course-empty">{"Il n'y a pas encore de cours"}</p>
        ) : filtered.length === 0 ? (
          <p>Aucun cours ne correspond à la recherche</p>
        ) : (
          filtered.map((course, index) => (
            <CourseCard
              key={course.id}
              cardRef={(el) => {
                cardRefs.current[index] = el
              }}
              name={course.name}
              questionCount={course.questionCount}
              lastQuestion={
                course.lastQuestionDate
                  ? new Date(course.lastQuestionDate).toLocaleDateString('fr-FR')
                  : '-'
              }
              onDelete={() => handleDelete(course.id)}
              onAdd={() => handleAddQuestion(course.id)}
            />
          ))
        )}
      </div>

      <button ref={buttonRef} className="create-course-button" onClick={startCreate}>
        Nouveau cours
      </button>
    </div>
  )
}

export default Courses
