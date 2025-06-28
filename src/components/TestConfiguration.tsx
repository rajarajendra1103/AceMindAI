import React, { useState } from 'react';
import { Settings, Target, Clock, Brain, ArrowRight } from 'lucide-react';
import { Document, TestConfig } from '../types';

interface TestConfigurationProps {
  document: Document;
  onStartTest: (config: TestConfig) => void;
}

export const TestConfiguration: React.FC<TestConfigurationProps> = ({ document, onStartTest }) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const getQuestionCount = (difficulty: string, contentLength: number): number => {
    const pageCount = Math.ceil(contentLength / 2000); // Rough estimate
    
    switch (difficulty) {
      case 'easy':
        return pageCount <= 2 ? 10 : 15;
      case 'medium':
        return pageCount >= 5 ? 25 : 30;
      case 'hard':
        return pageCount >= 5 ? 30 : 40;
      default:
        return 20;
    }
  };

  const questionCount = getQuestionCount(difficulty, document.content.length);

  const difficultyOptions = [
    {
      level: 'easy' as const,
      title: 'Easy',
      description: 'Basic concepts and straightforward questions',
      questions: getQuestionCount('easy', document.content.length),
      time: '15-20 min',
      icon: '🟢',
      color: 'green'
    },
    {
      level: 'medium' as const,
      title: 'Medium',
      description: 'Moderate complexity with analytical questions',
      questions: getQuestionCount('medium', document.content.length),
      time: '25-35 min',
      icon: '🟡',
      color: 'yellow'
    },
    {
      level: 'hard' as const,
      title: 'Hard',
      description: 'Advanced concepts and challenging problems',
      questions: getQuestionCount('hard', document.content.length),
      time: '35-50 min',
      icon: '🔴',
      color: 'red'
    }
  ];

  const handleStartTest = () => {
    const config: TestConfig = {
      difficulty,
      documentId: document.id,
      questionCount
    };
    onStartTest(config);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Configure Your Practice Test</h2>
        <p className="text-gray-600">Choose difficulty level and customize your learning experience</p>
      </div>

      {/* Document Info Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{document.summary?.title || document.name}</h3>
            <p className="text-gray-600 text-sm">
              {document.summary?.keyTopics.length || 0} key topics • {document.summary?.estimatedReadTime || 0} min read
            </p>
          </div>
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <span>Select Difficulty Level</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {difficultyOptions.map((option) => (
            <div
              key={option.level}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                difficulty === option.level
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => setDifficulty(option.level)}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{option.icon}</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{option.title}</h4>
                <p className="text-gray-600 text-sm mb-4">{option.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-sm">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{option.questions} Questions</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{option.time}</span>
                  </div>
                </div>
              </div>

              {difficulty === option.level && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Test Preview */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Test Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Questions</span>
              <span className="font-semibold text-gray-900">{questionCount}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Difficulty</span>
              <span className="font-semibold text-gray-900 capitalize">{difficulty}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Estimated Time</span>
              <span className="font-semibold text-gray-900">
                {difficultyOptions.find(opt => opt.level === difficulty)?.time}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">What to Expect:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Multiple choice questions based on document content</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Detailed explanations for each answer</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Comprehensive performance analysis</span>
              </li>
              <li className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Score breakdown and improvement suggestions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Start Test Button */}
      <div className="text-center">
        <button
          onClick={handleStartTest}
          className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Brain className="h-5 w-5" />
          <span>Start Practice Test</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};