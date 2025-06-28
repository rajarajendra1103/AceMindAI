import React, { useState, useEffect, useRef } from 'react';
import { Send, Copy, RefreshCw, Sparkles, MessageCircle, Zap, Brain, Youtube, Clock, Globe, TrendingUp, User } from 'lucide-react';
import { askMeService } from '../services/askMeService';
import { searchInfoService } from '../services/searchInfoService';
import { ChatMessage } from '../types';

export const AskMeChatboard: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatOutputRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'assistant',
      content: `# Welcome to Ask Me ChatBoard! 🎓

I'm your AI tutor ready to help with any questions you have. I can:

## 📚 Answer Questions
• Explain complex concepts and topics
• Help with homework and study materials  
• Provide detailed explanations and examples
• Clarify doubts and misconceptions

## 🌐 Real-Time Information
• Get current, up-to-date information when you ask about "latest", "today", "current", "who is", "when is", etc.
• Search recent news and developments
• Provide real-time context for your questions

## 🎥 Summarize YouTube Videos
• Just paste any YouTube link
• Get comprehensive summaries with key takeaways
• Extract main points and insights
• Perfect for educational content

## 💡 Examples
• "What are the latest developments in AI?" *(triggers real-time search)*
• "Who is the current president of France?"
• "When is the next solar eclipse?"
• "Explain quantum physics in simple terms"
• "https://youtube.com/watch?v=example" *(for video summaries)*

Ask me anything - I'm here to help you learn with the most current information! 🚀`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatOutputRef.current) {
      chatOutputRef.current.scrollTop = chatOutputRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    try {
      const result = await askMeService.processQuery(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: result.response,
        timestamp: new Date(),
        isYouTubeLink: result.isYouTubeLink,
        videoTitle: result.videoTitle,
        hasLiveInfo: result.hasLiveInfo
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const regenerateResponse = async (originalPrompt: string) => {
    setIsGenerating(true);
    
    try {
      const result = await askMeService.processQuery(originalPrompt);
      
      const newMessage: ChatMessage = {
        id: `regenerated-${Date.now()}`,
        type: 'assistant',
        content: result.response,
        timestamp: new Date(),
        isYouTubeLink: result.isYouTubeLink,
        videoTitle: result.videoTitle,
        hasLiveInfo: result.hasLiveInfo
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error regenerating response:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if a query will trigger real-time search
  const willTriggerRealTimeSearch = (query: string): boolean => {
    return searchInfoService.needsRealTimeSearch(query);
  };

  // Format message content with Markdown-like styling
  const formatMessageContent = (content: string): JSX.Element => {
    // Split content into lines and process each one
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];
    
    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join('\n');
        elements.push(
          <p key={elements.length} dangerouslySetInnerHTML={{ 
            __html: paragraphText
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`(.*?)`/g, '<code>$1</code>')
          }} />
        );
        currentParagraph = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('# ')) {
        flushParagraph();
        elements.push(<h1 key={elements.length}>{trimmedLine.substring(2)}</h1>);
      } else if (trimmedLine.startsWith('## ')) {
        flushParagraph();
        elements.push(<h2 key={elements.length}>{trimmedLine.substring(3)}</h2>);
      } else if (trimmedLine.startsWith('### ')) {
        flushParagraph();
        elements.push(<h3 key={elements.length}>{trimmedLine.substring(4)}</h3>);
      } else if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ')) {
        flushParagraph();
        const listItems = [];
        let i = index;
        while (i < lines.length && (lines[i].trim().startsWith('• ') || lines[i].trim().startsWith('- '))) {
          const itemText = lines[i].trim().substring(2);
          listItems.push(
            <li key={i} dangerouslySetInnerHTML={{ 
              __html: itemText
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
            }} />
          );
          i++;
        }
        elements.push(<ul key={elements.length}>{listItems}</ul>);
        // Skip the processed lines
        for (let j = index + 1; j < i; j++) {
          lines[j] = '';
        }
      } else if (trimmedLine === '') {
        flushParagraph();
      } else if (trimmedLine) {
        currentParagraph.push(line);
      }
    });
    
    flushParagraph();
    
    return <div className="message-content">{elements}</div>;
  };

  const exampleQuestions = [
    "What are the latest developments in AI?",
    "Who is the current CEO of Tesla?", 
    "When is the next solar eclipse?",
    "Current news about climate change",
    "Explain machine learning in simple terms"
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Ask Me ChatBoard</h1>
          <Sparkles className="h-5 w-5 text-yellow-300" />
        </div>
        <p className="text-purple-100 mb-3">
          Your AI tutor with real-time Google Search and YouTube video summaries
        </p>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm bg-white/10 px-3 py-1 rounded-lg">
            <Brain className="h-4 w-4" />
            <span>Powered by Gemini AI</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm bg-white/10 px-3 py-1 rounded-lg">
            <Globe className="h-4 w-4" />
            <span>Real-Time Search</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm bg-white/10 px-3 py-1 rounded-lg">
            <Youtube className="h-4 w-4" />
            <span>YouTube Summaries</span>
          </div>
        </div>
      </div>

      {/* ChatGPT-style Chat Container */}
      <div className="chat-container">
        <div className="chat-output" ref={chatOutputRef}>
          {messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.type}`}>
              {/* Avatar */}
              <div className={`chat-avatar ${message.type === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                {message.type === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`chat-bubble ${message.type === 'user' ? 'user-message' : 'ai-response'}`}>
                {message.type === 'user' ? (
                  <div className="message-content">
                    <p>{message.content}</p>
                    
                    {/* User message indicators */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.isYouTubeLink && (
                        <div className="content-badge youtube">
                          <Youtube className="h-3 w-3" />
                          <span>YouTube video detected</span>
                        </div>
                      )}
                      {willTriggerRealTimeSearch(message.content) && !message.isYouTubeLink && (
                        <div className="content-badge live-info">
                          <TrendingUp className="h-3 w-3" />
                          <span>Real-time search triggered</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Special content indicators */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {message.isYouTubeLink && message.videoTitle && (
                        <div className="content-badge youtube">
                          <Youtube className="h-3 w-3" />
                          <span>YouTube Summary: {message.videoTitle}</span>
                        </div>
                      )}
                      {message.hasLiveInfo && (
                        <div className="content-badge live-info">
                          <Globe className="h-3 w-3" />
                          <span>Includes real-time information</span>
                        </div>
                      )}
                    </div>

                    {/* Formatted message content */}
                    {formatMessageContent(message.content)}

                    {/* Action Buttons */}
                    <div className="message-actions">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="action-button"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          const userMessage = messages.find(m => m.type === 'user' && messages.indexOf(m) < messages.indexOf(message));
                          if (userMessage) regenerateResponse(userMessage.content);
                        }}
                        className="action-button"
                        disabled={isGenerating}
                      >
                        <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>

                      {message.isYouTubeLink && (
                        <div className="action-button" style={{ cursor: 'default' }}>
                          <Clock className="h-3 w-3" />
                          <span>Video Summary</span>
                        </div>
                      )}

                      {message.hasLiveInfo && (
                        <div className="action-button" style={{ cursor: 'default' }}>
                          <Globe className="h-3 w-3" />
                          <span>Live Data</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="chat-message assistant">
              <div className="chat-avatar ai-avatar">
                <Brain className="h-4 w-4" />
              </div>
              <div className="chat-loading">
                <div className="spinner"></div>
                <span className="text-gray-600 text-sm">
                  {willTriggerRealTimeSearch(inputValue) ? 'Searching for current information...' : 'Thinking and analyzing...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Example Questions */}
      {messages.length <= 1 && (
        <div>
          <p className="text-sm text-gray-600 mb-3">Try these example questions (some will trigger real-time search):</p>
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInputValue(question)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  willTriggerRealTimeSearch(question) 
                    ? 'bg-green-100 hover:bg-green-200 text-green-800 border border-green-300' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {willTriggerRealTimeSearch(question) && <TrendingUp className="inline h-3 w-3 mr-1" />}
                {question}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <TrendingUp className="inline h-3 w-3 mr-1" />
            Green buttons will trigger real-time Google Search
          </p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything, paste a YouTube link, or ask about current events..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>Ask</span>
          </button>
        </div>
        
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Brain className="h-3 w-3" />
              <span>AI-powered responses</span>
            </div>
            <div className="flex items-center space-x-1">
              <Globe className="h-3 w-3" />
              <span>Real-time Google Search</span>
            </div>
            <div className="flex items-center space-x-1">
              <Youtube className="h-3 w-3" />
              <span>YouTube summaries</span>
            </div>
          </div>
          <div className="text-gray-400">
            {willTriggerRealTimeSearch(inputValue) && inputValue.trim() && (
              <span className="text-green-600 mr-2">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                Will search Google
              </span>
            )}
            Powered by Gemini AI
          </div>
        </div>
      </form>
    </div>
  );
};