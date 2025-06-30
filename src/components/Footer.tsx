import React from 'react';
import { Zap, Heart, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Left side - Copyright */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>© 2025 AceMind AI</span>
            <span>•</span>
            <span>Smart Prep for Smart Minds</span>
          </div>

          {/* Center - Built on Bolt Badge */}
          <div className="flex items-center">
            <a
              href="https://bolt.new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <Zap className="h-4 w-4" />
              <span>Built on Bolt</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Right side - Made with love */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 fill-current" />
            <span>for learners worldwide</span>
          </div>
        </div>

        {/* Bottom row - Additional links */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap items-center justify-center space-x-6 text-xs text-gray-500">
            <span>Powered by Google Gemini AI</span>
            <span>•</span>
            <span>Secure data with Supabase</span>
            <span>•</span>
            <span>Real-time search & YouTube summaries</span>
          </div>
        </div>
      </div>
    </footer>
  );
};