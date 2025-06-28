import React from 'react';
import { CheckCircle, XCircle, Clock, Target, TrendingUp, RotateCcw, Home } from 'lucide-react';
import { TestResult } from '../types';

interface TestResultsProps {
  result: TestResult;
  onRetakeTest: () => void;
  onBackToHome: () => void;
}

export const TestResults: React.FC<TestResultsProps> = ({ result, onRetakeTest, onBackToHome }) => {
  const { score, correctAnswers, incorrectAnswers, unanswered, questions, userAnswers } = result;
  const totalQuestions = questions.length;
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 8) return { level: 'Excellent', color: 'green' };
    if (score >= 6) return { level: 'Good', color: 'yellow' };
    if (score >= 4) return { level: 'Fair', color: 'orange' };
    return { level: 'Needs Improvement', color: 'red' };
  };

  const performance = getPerformanceLevel(score);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Results Header */}
      <div className="text-center">
        <div className="mb-4">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
            score >= 8 ? 'bg-green-100' : score >= 6 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score.toFixed(1)}
            </span>
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Completed!</h2>
        <p className="text-gray-600">
          Your performance: <span className={`font-semibold text-${performance.color}-600`}>
            {performance.level}
          </span>
        </p>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{score.toFixed(1)}/10</div>
          <div className="text-sm text-gray-600">Overall Score</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
          <div className="text-sm text-gray-600">Correct</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-3">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{incorrectAnswers}</div>
          <div className="text-sm text-gray-600">Incorrect</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3">
            <Clock className="h-6 w-6 text-gray-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{unanswered}</div>
          <div className="text-sm text-gray-600">Unanswered</div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <span>Performance Analysis</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Score Breakdown</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Accuracy Rate</span>
                <span className="font-semibold text-gray-900">{accuracy}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold text-gray-900">
                  {Math.round(((totalQuestions - unanswered) / totalQuestions) * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Time Spent</span>
                <span className="font-semibold text-gray-900">
                  {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {score >= 8 ? (
                <>
                  <li>• Excellent performance! You have mastered the material.</li>
                  <li>• Consider trying a harder difficulty level for more challenge.</li>
                  <li>• Review any incorrect answers to maintain your understanding.</li>
                </>
              ) : score >= 6 ? (
                <>
                  <li>• Good understanding of the material with room for improvement.</li>
                  <li>• Focus on areas where you got questions wrong.</li>
                  <li>• Review the document highlights for better retention.</li>
                </>
              ) : (
                <>
                  <li>• Consider reviewing the document more thoroughly.</li>
                  <li>• Focus on understanding key concepts and highlights.</li>
                  <li>• Try taking the test again after additional study.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Question Review */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Question Review</h3>
        <div className="space-y-6">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            const wasAnswered = userAnswer !== null;

            return (
              <div key={question.id} className="border-l-4 pl-4 ${
                !wasAnswered ? 'border-gray-300' : isCorrect ? 'border-green-500' : 'border-red-500'
              }">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {index + 1}. {question.question}
                  </h4>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    {!wasAnswered ? (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        Unanswered
                      </span>
                    ) : isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>

                <div className="text-sm space-y-2">
                  {wasAnswered && (
                    <p>
                      <span className="font-medium">Your answer:</span>{' '}
                      <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {question.options[userAnswer!]}
                      </span>
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Correct answer:</span>{' '}
                    <span className="text-green-600">
                      {question.options[question.correctAnswer]}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Explanation:</span> {question.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onRetakeTest}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Retake Test</span>
        </button>
        <button
          onClick={onBackToHome}
          className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
};