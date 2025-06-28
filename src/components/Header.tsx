import React from 'react';
import { BookOpen, Home, Upload, FileText, Brain, Search, GitBranch, MessageCircle, LogOut, User } from 'lucide-react';
import { AppView } from '../types';
import { authService } from '../services/authService';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  documentCount: number;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, documentCount, onLogout }) => {
  const currentUser = authService.getCurrentUser();

  const navItems = [
    { id: 'home' as AppView, icon: Home, label: 'Dashboard', active: currentView === 'home' },
    { id: 'upload' as AppView, icon: Upload, label: 'Upload', active: currentView === 'upload' },
    { id: 'search' as AppView, icon: Search, label: 'Search Library', active: currentView === 'search' },
    { id: 'flowchart' as AppView, icon: GitBranch, label: 'AI Flowcharts', active: currentView === 'flowchart' },
    { id: 'askme' as AppView, icon: MessageCircle, label: 'Ask Me', active: currentView === 'askme' },
  ];

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AceMind AI</h1>
                <p className="text-xs text-gray-500">Smart Prep for Smart Minds</p>
              </div>
            </div>
          </div>
          
          <nav className="flex space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  item.active
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="p-1.5 bg-blue-100 rounded-full">
                  <User className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-gray-700 font-medium">{currentUser?.username}</span>
              </div>
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};