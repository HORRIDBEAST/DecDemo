'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Check, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaimDraftingAssistantProps {
  currentDescription: string;
  onInsertText: (text: string) => void;
  onClose: () => void;
  claimType?: string;
}

export function ClaimDraftingAssistant({ 
  currentDescription, 
  onInsertText, 
  onClose,
  claimType 
}: ClaimDraftingAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedText, setSuggestedText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Generate initial suggestion based on current description
  useEffect(() => {
    const generateInitialSuggestion = async () => {
      if (!currentDescription || currentDescription.length < 10) {
        setMessages([{
          role: 'assistant',
          content: 'Hi! I can help you write a professional claim description. Tell me what happened, and I\'ll draft it for you.'
        }]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `Improve this claim description to be professional and AI-processing ready:\n\n"${currentDescription}"`
            }],
            currentPath: '/claims/new',
            botType: 'inline',
          }),
        });

        const data = await response.json();
        const suggestion = data.content;
        setSuggestedText(suggestion);
        
        setMessages([{
          role: 'assistant',
          content: suggestion
        }]);
      } catch (error) {
        console.error('Failed to generate suggestion:', error);
        setMessages([{
          role: 'assistant',
          content: 'Failed to generate suggestion. Please describe what happened, and I\'ll help draft it.'
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    generateInitialSuggestion();
  }, []); // Only run once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Include context about current description and claim type
      const contextMessage = currentDescription 
        ? `Current claim description: "${currentDescription}". User request: ${input}`
        : input;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...newMessages,
            { role: 'user', content: contextMessage }
          ],
          currentPath: '/claims/new',
          botType: 'inline',
        }),
      });

      const data = await response.json();
      const assistantMessage = { role: 'assistant' as const, content: data.content };
      setMessages([...newMessages, assistantMessage]);
      setSuggestedText(data.content);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsert = () => {
    if (suggestedText) {
      onInsertText(suggestedText);
      toast.success('Description updated!');
      onClose();
    } else if (messages.length > 0) {
      const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistantMsg) {
        onInsertText(lastAssistantMsg.content);
        toast.success('Description updated!');
        onClose();
      }
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-[#FDC3A1] border-2 border-blue-600 rounded-lg shadow-xl">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 flex items-center justify-between rounded-t-md">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <h3 className="font-semibold text-sm">AI Drafting Assistant</h3>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-3">
        <div className="space-y-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-900 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {/* Insert button for assistant messages - only for actual claim descriptions */}
                {message.role === 'assistant' && 
                 message.content.length > 100 && 
                 !message.content.toLowerCase().includes('help you') &&
                 !message.content.toLowerCase().includes('i can') &&
                 !message.content.toLowerCase().includes('would you like') && (
                  <Button
                    onClick={() => {
                      onInsertText(message.content);
                      toast.success('Description updated!');
                      onClose();
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs mt-2 text-blue-600 hover:bg-blue-50"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Use This
                  </Button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-blue-900 rounded-lg px-3 py-2 shadow-sm">
                <div className="flex gap-1 items-center">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-blue-200 bg-[#FDC3A1]">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask to improve or change..."
            className="flex-1 h-9 text-sm bg-white text-blue-900 border-blue-300 placeholder:text-blue-400"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSubmit}
            size="icon" 
            className="h-9 w-9 bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Insert Button */}
        {suggestedText && (
          <Button
            type="button"
            onClick={handleInsert}
            className="w-full mt-2 h-8 text-xs bg-blue-600 hover:bg-blue-700"
          >
            <Check className="h-3 w-3 mr-1" />
            Insert & Close
          </Button>
        )}
      </div>
    </div>
  );
}
