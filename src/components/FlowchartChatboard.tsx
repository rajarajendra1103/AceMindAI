import React, { useState, useEffect, useRef } from 'react';
import { Send, Download, Copy, RefreshCw, Sparkles, GitBranch, Zap, Brain, Code, Eye, EyeOff, FileText, User } from 'lucide-react';
import mermaid from 'mermaid';
import { geminiService } from '../services/geminiService';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  mermaidCode?: string;
  textFlowchart?: string;
  timestamp: Date;
}

export const FlowchartChatboard: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMermaidCode, setShowMermaidCode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatOutputRef = useRef<HTMLDivElement>(null);
  const diagramRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 20
      },
      themeVariables: {
        primaryColor: '#3B82F6',
        primaryTextColor: '#1F2937',
        primaryBorderColor: '#2563EB',
        lineColor: '#6B7280',
        secondaryColor: '#F3F4F6',
        tertiaryColor: '#EFF6FF'
      }
    });

    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'assistant',
      content: `# Welcome to AI Flowchart ChatBoard! 🎯

I can help you create beautiful flowcharts in multiple formats:

## 🎨 Visual Mermaid Flowcharts
• "How does photosynthesis work?"
• "Show me the software development lifecycle"
• "Create a flowchart for making coffee"

## 📝 Text-Based Flowcharts
• "Create a classification flowchart for animals using text format"
• "Show me the hiring process in plain text"
• "Generate a text-based flowchart for machine learning workflow"

## 🔍 Classification Flowcharts
• "Classify types of renewable energy"
• "Show taxonomy of programming languages"
• "Categorize different learning styles"

Just mention **"text format"**, **"plain text"**, or **"ASCII"** for text-based flowcharts!`,
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

  // Render Mermaid diagrams
  useEffect(() => {
    const renderDiagrams = async () => {
      for (const message of messages) {
        if (message.mermaidCode && message.type === 'assistant') {
          const diagramElement = diagramRefs.current.get(message.id);
          if (diagramElement && !diagramElement.hasAttribute('data-rendered')) {
            try {
              const { svg } = await mermaid.render(`diagram-${message.id}`, message.mermaidCode);
              diagramElement.innerHTML = svg;
              diagramElement.setAttribute('data-rendered', 'true');
            } catch (error) {
              console.error('Mermaid rendering error:', error);
              diagramElement.innerHTML = `
                <div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <p class="font-medium">Diagram Rendering Error</p>
                  <p class="text-sm mt-1">There was an issue rendering this flowchart. Please try regenerating it.</p>
                </div>
              `;
            }
          }
        }
      }
    };

    renderDiagrams();
  }, [messages]);

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
      const result = await geminiService.generateFlowchart(userMessage.content);
      
      // Check if it's a text flowchart
      const isTextFlowchart = result.startsWith('TEXT_FLOWCHART:');
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: `Here's your ${isTextFlowchart ? 'text-based' : 'visual'} flowchart for "${userMessage.content}":`,
        ...(isTextFlowchart 
          ? { textFlowchart: result.replace('TEXT_FLOWCHART:\n', '') }
          : { mermaidCode: result }
        ),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating flowchart:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error generating your flowchart. Please try again with a different description or check your connection.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyMermaidCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const copyTextFlowchart = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadSVG = (messageId: string) => {
    const diagramElement = diagramRefs.current.get(messageId);
    if (diagramElement) {
      const svg = diagramElement.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = `flowchart-${messageId}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
      }
    }
  };

  const downloadTextFlowchart = (text: string, messageId: string) => {
    const textBlob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const textUrl = URL.createObjectURL(textBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = textUrl;
    downloadLink.download = `text-flowchart-${messageId}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(textUrl);
  };

  const regenerateFlowchart = async (originalPrompt: string) => {
    setIsGenerating(true);
    
    try {
      const result = await geminiService.generateFlowchart(originalPrompt);
      const isTextFlowchart = result.startsWith('TEXT_FLOWCHART:');
      
      const newMessage: ChatMessage = {
        id: `regenerated-${Date.now()}`,
        type: 'assistant',
        content: `Here's a regenerated ${isTextFlowchart ? 'text-based' : 'visual'} flowchart for "${originalPrompt}":`,
        ...(isTextFlowchart 
          ? { textFlowchart: result.replace('TEXT_FLOWCHART:\n', '') }
          : { mermaidCode: result }
        ),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error regenerating flowchart:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Format message content with Markdown-like styling
  const formatMessageContent = (content: string): JSX.Element => {
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

  const examplePrompts = [
    "How does online payment work?",
    "Show me the machine learning workflow",
    "Create a classification flowchart for animals using text format",
    "Classify types of renewable energy in plain text",
    "Software bug fixing process"
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <GitBranch className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">AI Flowchart ChatBoard</h1>
          <Sparkles className="h-5 w-5 text-yellow-300" />
        </div>
        <p className="text-blue-100 mb-3">
          Create beautiful flowcharts in visual Mermaid format or plain text/ASCII style
        </p>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowMermaidCode(!showMermaidCode)}
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors ${
              showMermaidCode ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {showMermaidCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showMermaidCode ? 'Hide' : 'Show'} Code</span>
          </button>
          
          <div className="flex items-center space-x-2 text-sm bg-white/10 px-3 py-1 rounded-lg">
            <FileText className="h-4 w-4" />
            <span>Supports: Visual & Text formats</span>
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
                  </div>
                ) : (
                  <div>
                    {/* Content type indicator */}
                    {(message.textFlowchart || message.mermaidCode) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className={`content-badge ${message.textFlowchart ? 'text-flowchart' : 'info-box'}`}>
                          {message.textFlowchart ? (
                            <>
                              <FileText className="h-3 w-3" />
                              <span>Text-based flowchart</span>
                            </>
                          ) : (
                            <>
                              <GitBranch className="h-3 w-3" />
                              <span>Visual Mermaid flowchart</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Formatted message content */}
                    {formatMessageContent(message.content)}

                    {/* Text Flowchart Display */}
                    {message.textFlowchart && (
                      <div className="text-flowchart-container">
                        {message.textFlowchart}
                      </div>
                    )}

                    {/* Mermaid Flowchart Display */}
                    {message.mermaidCode && (
                      <div className="mermaid-chat-container">
                        <div
                          ref={(el) => {
                            if (el) diagramRefs.current.set(message.id, el);
                          }}
                          className="mermaid-diagram flex justify-center"
                        />
                      </div>
                    )}

                    {/* Mermaid Code Display */}
                    {showMermaidCode && message.mermaidCode && (
                      <div className="bg-gray-900 rounded-lg p-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Code className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-400 text-xs">Mermaid Code</span>
                          </div>
                          <button
                            onClick={() => copyMermaidCode(message.mermaidCode!)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        <pre className="text-green-400 text-xs overflow-x-auto">
                          <code>{message.mermaidCode}</code>
                        </pre>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {(message.textFlowchart || message.mermaidCode) && (
                      <div className="message-actions">
                        {message.textFlowchart ? (
                          <>
                            <button
                              onClick={() => copyTextFlowchart(message.textFlowchart!)}
                              className="action-button"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Copy Text</span>
                            </button>
                            
                            <button
                              onClick={() => downloadTextFlowchart(message.textFlowchart!, message.id)}
                              className="action-button"
                            >
                              <Download className="h-3 w-3" />
                              <span>Download TXT</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => copyMermaidCode(message.mermaidCode!)}
                              className="action-button"
                            >
                              <Copy className="h-3 w-3" />
                              <span>Copy Code</span>
                            </button>
                            
                            <button
                              onClick={() => downloadSVG(message.id)}
                              className="action-button"
                            >
                              <Download className="h-3 w-3" />
                              <span>Download SVG</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            const userMessage = messages.find(m => m.type === 'user' && messages.indexOf(m) < messages.indexOf(message));
                            if (userMessage) regenerateFlowchart(userMessage.content);
                          }}
                          className="action-button"
                          disabled={isGenerating}
                        >
                          <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                          <span>Regenerate</span>
                        </button>
                      </div>
                    )}
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
                <span className="text-gray-600 text-sm">Generating your flowchart...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Example Prompts */}
      {messages.length <= 1 && (
        <div>
          <p className="text-sm text-gray-600 mb-3">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setInputValue(prompt)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe the process you want to visualize... (add 'text format' for ASCII style)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>Generate</span>
          </button>
        </div>
      </form>
    </div>
  );
};