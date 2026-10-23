import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Lesson } from '../types';
import { api } from '../services/api';

export const LearningPage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  // Quiz active state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await api.getLessons();
      setLessons(res.lessons);
      if (res.lessons.length > 0 && !selectedLesson) {
        setSelectedLesson(res.lessons[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setFeedback([]);
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedLesson) return;
    const answersArray = selectedLesson.quiz.map((_, idx) => quizAnswers[idx] ?? -1);

    if (answersArray.some((a) => a === -1)) {
      alert('Please answer all quiz questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitQuiz(selectedLesson.id, answersArray);
      setQuizScore(res.score);
      setFeedback(res.feedback);
      setQuizSubmitted(true);
      fetchLessons();
    } catch (err: unknown) {
      alert('Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setFeedback([]);
  };

  const completedCount = lessons.filter((l) => l.progress !== null).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900">Student Financial Literacy</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Interactive Micro-Lessons
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Master the 50/30/20 rule, beat campus FOMO, build an emergency buffer, and pass quick quizzes.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900 self-start sm:self-auto">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>
            {completedCount} of {lessons.length} Modules Completed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lesson Modules Menu */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">
            Learning Modules
          </div>
          {lessons.map((lesson) => {
            const isSelected = selectedLesson?.id === lesson.id;
            const isCompleted = !!lesson.progress;

            return (
              <button
                key={lesson.id}
                onClick={() => handleSelectLesson(lesson)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-emerald-950 text-white border-emerald-900 shadow-md'
                    : 'bg-white hover:bg-stone-50 border-stone-200/90 text-stone-900 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {lesson.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isCompleted && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" />
                        <span>{lesson.progress?.score}/{lesson.progress?.max_score}</span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] flex items-center gap-1 ${
                        isSelected ? 'text-emerald-300' : 'text-stone-400'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{lesson.readTime}</span>
                    </span>
                  </div>
                </div>

                <div className="font-bold text-xs sm:text-sm leading-snug">{lesson.title}</div>
                <p
                  className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                    isSelected ? 'text-emerald-200/80' : 'text-stone-500'
                  }`}
                >
                  {lesson.summary}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Selected Lesson Detail & Interactive Quiz */}
        <div className="lg:col-span-2 space-y-6">
          {selectedLesson && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-xs space-y-6">
              {/* Lesson Header */}
              <div className="border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {selectedLesson.category}
                  </span>
                  <span className="text-xs text-stone-400">· {selectedLesson.readTime} read</span>
                </div>
                <h3 className="text-lg font-bold text-stone-900">{selectedLesson.title}</h3>
              </div>

              {/* Lesson Prose Content */}
              <div className="prose prose-sm max-w-none text-stone-700 space-y-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {selectedLesson.content}
              </div>

              {/* Interactive Quiz Section */}
              <div className="pt-6 border-t border-stone-200/80 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>Knowledge Check Quiz</span>
                    </h4>
                    <p className="text-xs text-stone-500">Test your understanding to earn points</p>
                  </div>
                  {quizSubmitted && (
                    <button
                      onClick={handleRetakeQuiz}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </button>
                  )}
                </div>

                {/* Score Banner if completed */}
                {quizSubmitted && quizScore !== null && (
                  <div
                    className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                      quizScore === selectedLesson.quiz.length
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">
                        You scored {quizScore} / {selectedLesson.quiz.length}!
                      </div>
                      <p className="text-[11px] mt-0.5">
                        {quizScore === selectedLesson.quiz.length
                          ? '🎉 Flawless! You have fully mastered this lesson.'
                          : 'Review the explanations below and feel free to retake the quiz anytime.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quiz Questions */}
                <div className="space-y-4">
                  {selectedLesson.quiz.map((q, qIdx) => {
                    const fb = feedback.find((f) => f.questionIndex === qIdx);

                    return (
                      <div
                        key={qIdx}
                        className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5"
                      >
                        <div className="font-semibold text-xs text-stone-900">
                          {qIdx + 1}. {q.question}
                        </div>

                        <div className="space-y-1.5">
                          {q.options.map((opt, optIdx) => {
                            const isChosen = quizAnswers[qIdx] === optIdx;
                            let btnStyle = 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100';

                            if (quizSubmitted) {
                              if (optIdx === q.answerIndex) {
                                btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold';
                              } else if (isChosen && optIdx !== q.answerIndex) {
                                btnStyle = 'bg-rose-100 border-rose-300 text-rose-900 line-through';
                              }
                            } else if (isChosen) {
                              btnStyle = 'bg-emerald-600 border-emerald-600 text-white font-semibold shadow-xs';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={quizSubmitted}
                                onClick={() => handleSelectOption(qIdx, optIdx)}
                                className={`w-full text-left px-3.5 py-2 rounded-lg border text-xs transition-colors flex items-center justify-between ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && optIdx === q.answerIndex && (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation on submit */}
                        {quizSubmitted && fb && (
                          <div className="mt-2 p-2.5 rounded-lg bg-stone-100/80 text-[11px] text-stone-600 leading-snug">
                            <strong>Explanation:</strong> {fb.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!quizSubmitted && (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    {submitting ? 'Submitting & Recording Score...' : 'Submit Answers'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
