// ---------------------------------------------------------------------------
// Page "Question" : une session de révision question par question.
//
// L'ordre du fichier suit un fil logique :
//   1. imports
//   2. session de question (chargement, clé de session) & état complémentaire
//   3. hooks de session (révélation, réponse) et résultat collé
//   4. gestionnaires d'événements
//   5. rendu JSX
//
// Déroulé d'une question :
//   1. la question est chargée depuis le serveur (useQuestion) ;
//   2. sa phrase s'affiche mot à mot, révélée par la touche Espace ;
//   3. une fois la question entièrement affichée, on peut répondre (Vrai/Faux,
//      texte, choix multiples) ;
//   4. le panneau de résultat confirme la bonne ou la mauvaise réponse ;
//   5. la question suivante est chargée automatiquement dès la réponse envoyée.
//      La carte et la zone de réponse passent à la nouvelle question, mais le
//      panneau de résultat reste affiché : on peut lire le verdict de la
//      question précédente pendant qu'on lit la suivante. Il ne change qu'à la
//      réponse suivante.
// ---------------------------------------------------------------------------

// --- Imports -----------------------------------------------------------------
import { useCallback, useEffect, useRef, useState } from 'react'
// Types partagés entre le main process et le renderer
import type { Course, Question as QuestionItem } from '../../../shared/types'
import { splitSentences } from '../../../shared/sentences'
// Appels réseau (le composant ne parle jamais directement au serveur)
import { getCourses, answerQuestion as submitAnswer } from '@renderer/services/api'
// Hooks de session : chargement de la question + révélation + réponse
import { useQuestion } from '@renderer/hooks/useQuestion'
import { useSentenceReveal } from '@renderer/hooks/useSentenceReveal'
import { useAnswer } from '@renderer/hooks/useAnswer'
// Verdict local : la bonne réponse dépend du type (Choix multiples : 1re option)
import { isAnswerCorrect, expectedAnswer } from '@renderer/lib/answers'
// Sous-composants de la session
import SessionHeader from '@renderer/components/question/SessionHeader'
import QuestionCard from '@renderer/components/question/QuestionCard'
import AnswerPanel from '@renderer/components/question/AnswerPanel'
import ResultPanel from '@renderer/components/question/ResultPanel'

function Question(): React.JSX.Element {
  // --- 1. Session de question & état complémentaire --------------------------
  // question/sessionKey/loading/error/reload/loadNext : le chargement est porté
  // par le hook useQuestion. La session est identifiée par sessionKey, un
  // compteur qui change à chaque question reçue : les hooks de révélation et de
  // réponse s'y rattachent pour repartir de zéro sans remonter la carte.
  const { question, sessionKey, stats, loading, error, reload, loadNext } = useQuestion()

  // courses : liste complète des cours, pour résoudre le nom du thème.
  const [courses, setCourses] = useState<Course[]>([])
  // lastResult : verdict de la dernière question répondue, « collé » : il reste
  // affiché quand la question suivante remplace la carte, pour qu'on puisse le
  // lire pendant qu'on lit la nouvelle question. Il ne change qu'à la réponse
  // suivante.
  const [lastResult, setLastResult] = useState<{
    question: QuestionItem
    selectedAnswer: string
  } | null>(null)

  // Charge la liste des cours au montage (utilisée pour le thème de la carte).
  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
  }, [])

  // --- 2. Hooks de session ----------------------------------------------------
  // Phrases de la question courante, découpées sur les fins de phrase.
  const sentences = question ? splitSentences(question.question) : []

  // Quand la dernière phrase s'affiche, le focus passe au champ de réponse texte.
  const inputRef = useRef<HTMLInputElement>(null)
  const focusAnswerInput = useCallback((): void => {
    inputRef.current?.focus()
  }, [])
  const visible = useSentenceReveal(sessionKey, sentences.length, focusAnswerInput)
  // selectedAnswer : réponse donnée à la question COURANTE (null tant qu'on n'a
  // pas répondu, ou dès que la question suivante arrive). Il désactive la zone
  // de réponse. Le verdict affiché, lui, vient de lastResult (persistant).
  const { selectedAnswer, answerQuestion } = useAnswer(sessionKey)

  // --- 3. Gestionnaires d'événements ------------------------------------------
  // Réponse donnée : le verdict s'affiche (et reste affiché), la réponse est
  // envoyée au serveur (grade, date de pose, compteur, dernier verdict), puis
  // la question suivante est chargée et remplace le contenu de la carte. On
  // attend la confirmation du serveur avant de tirer la suivante, afin que le
  // tirage (getNextQuestion) tienne compte de la réponse donnée.
  const handleAnswer = async (value: string): Promise<void> => {
    answerQuestion(value)
    if (question !== null) {
      setLastResult({ question, selectedAnswer: value })
      const correct = isAnswerCorrect(expectedAnswer(question.answer), value)
      try {
        await submitAnswer(question.id, correct)
      } catch {
        // La réponse reste enregistrée localement ; le serveur n'a pas confirmé.
      }
      loadNext()
    }
  }

  // --- 4. Rendu ----------------------------------------------------------------
  // Nom du thème de la question, replié sur "Cours <id>" si le cours est inconnu.
  const courseName = question
    ? courses.find((course) => course.id === question.courseId)?.name
    : undefined

  return (
    <div className="question-page">
      <SessionHeader
        correctCount={stats.correctCount}
        answeredCount={stats.answeredCount}
        dailyQuestionGoal={stats.dailyQuestionGoal}
      />

      {/* Chargement en cours */}
      {loading && <p className="question-message">Chargement…</p>}

      {/* Échec de chargement : erreur + bouton Réessayer */}
      {!loading && error && (
        <div className="question-message error">
          <p>{error}</p>
          <button type="button" onClick={reload}>
            Réessayer
          </button>
        </div>
      )}

      {/* Aucune question à proposer */}
      {!loading && !error && question === null && (
        <p className="question-message">Aucune question disponible pour le moment.</p>
      )}

      {/* Session : une seule carte en permanence, son contenu suit la question
          courante (aucune `key` : remonter la carte faisait coexister deux
          cards en mode dev). La révélation et la réponse repartent de zéro
          grâce à la clé de session (sessionKey), pas via un remontage. Le
          panneau de résultat, lui, reste affiché avec le verdict de la
          question précédente. */}
      {!loading && !error && question !== null && (
        <div className="question-session">
          <QuestionCard
            question={question}
            courseName={courseName}
            sentences={sentences}
            visible={visible}
          />
          <AnswerPanel
            question={question}
            sessionKey={sessionKey}
            disabled={visible < sentences.length || selectedAnswer !== null}
            onAnswer={handleAnswer}
            inputRef={inputRef}
          />
          {lastResult !== null && (
            <ResultPanel
              question={lastResult.question}
              selectedAnswer={lastResult.selectedAnswer}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default Question
