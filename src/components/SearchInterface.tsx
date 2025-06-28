import React, { useState } from 'react';
import { Search, Book, Video, ExternalLink, Download, Calendar, Eye, ThumbsUp, Clock, Globe, Tag, User } from 'lucide-react';
import { searchService } from '../services/searchService';
import { BookResult, VideoResult } from '../types';

export const SearchInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'books' | 'videos'>('books');
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [bookResults, setBookResults] = useState<BookResult[]>([]);
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const languages = [
    'English', 'Hindi', 'Telugu', 'Tamil', 'Bengali', 'Marathi', 
    'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Spanish', 'French'
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'books') {
        const results = await searchService.searchBooks(query);
        setBookResults(results);
        if (results.length === 0) {
          setError('No books found for your search. Try different keywords.');
        }
      } else {
        const results = await searchService.searchVideos(query, language);
        setVideoResults(results);
        if (results.length === 0) {
          setError(`No educational videos found in ${language}. Try searching in English or with different keywords.`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Search Educational Resources</h2>
        <p className="text-gray-600">Find free books and educational videos to enhance your learning</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('books')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'books'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Book className="h-5 w-5" />
            <span>📚 Free Books</span>
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'videos'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Video className="h-5 w-5" />
            <span>🎥 Educational Videos</span>
          </button>
        </div>
      </div>

      {/* Search Interface */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={activeTab === 'books' ? 'Search for books (e.g., "calculus", "physics")' : 'Search for educational videos (e.g., "photosynthesis", "algebra")'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {activeTab === 'videos' && (
              <div className="md:w-48">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            )}
            
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {activeTab === 'books' ? 'Searching Open Library...' : `Searching YouTube for ${language} content...`}
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          {/* Book Results */}
          {activeTab === 'books' && bookResults.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Found {bookResults.length} books
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookResults.map((book, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow duration-200">
                    <div className="p-6">
                      {book.cover_id && (
                        <div className="mb-4">
                          <img
                            src={`https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`}
                            alt={book.title}
                            className="w-full h-48 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{book.title}</h4>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{book.author}</span>
                        </div>
                        
                        {book.first_publish_year && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{book.first_publish_year}</span>
                          </div>
                        )}
                        
                        {book.subject && book.subject.length > 0 && (
                          <div className="flex items-start space-x-2">
                            <Tag className="h-4 w-4 mt-0.5" />
                            <div className="flex flex-wrap gap-1">
                              {book.subject.slice(0, 3).map((subject, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {subject}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <a
                          href={book.read_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Read</span>
                        </a>
                        
                        {book.download_url && (
                          <a
                            href={book.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Results */}
          {activeTab === 'videos' && videoResults.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Found {videoResults.length} educational videos in {language}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videoResults.map((video, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow duration-200">
                    <div className="relative">
                      {video.thumbnail && (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-48 object-cover rounded-t-xl"
                        />
                      )}
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                          {video.duration}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{video.title}</h4>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <Video className="h-4 w-4" />
                          <span>{video.channel}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs">{video.rating}</span>
                          {video.viewCount && (
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span className="text-xs">{video.viewCount}</span>
                            </div>
                          )}
                        </div>
                        
                        {video.publishedAt && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{video.publishedAt}</span>
                          </div>
                        )}
                      </div>
                      
                      <a
                        href={video.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Watch Video</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Section */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
              <Book className="h-5 w-5" />
              <span>About Book Search</span>
            </h4>
            <p className="text-blue-800 text-sm">
              Powered by Open Library, providing access to millions of free books. 
              All books are legally available for reading and many for download.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-red-900 mb-2 flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>About Video Search</span>
            </h4>
            <p className="text-red-800 text-sm">
              AI-enhanced YouTube search finds the best educational content. 
              Search in multiple languages with smart query optimization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};