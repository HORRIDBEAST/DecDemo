'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, ArrowRight, Copy, Check, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SupportBotProps {
  onInsertText?: (text: string) => void;
  defaultOpen?: boolean;
  type?: 'floating' | 'inline';
}

export function SupportBot({ onInsertText, defaultOpen = false, type = 'floating' }: SupportBotProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentPath: pathname,
          botType: type,
        }),
      });

      const data = await response.json();

      // Handle navigation action
      if (data.action === 'navigate' && data.path) {
        toast.success(`Navigating to ${data.path}`);
        router.push(data.path);
      }

      // Add assistant message
      setMessages([...newMessages, { role: 'assistant', content: data.content }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleInsert = (text: string) => {
    if (onInsertText) {
      onInsertText(text);
      toast.success('Text inserted into form');
      // Only auto-close for floating mode, let parent control inline mode
      if (type === 'floating') {
        setIsOpen(false);
      }
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInput('');
    toast.success('Chat cleared');
  };

  // Check if we're on a claim creation page (drafting mode)
  const isDraftingMode = pathname?.includes('/claims/new') || pathname?.includes('/create-claim');

  // ✅ Dynamic CSS based on type
  const cardClasses = type === 'floating'
    ? 'fixed bottom-6 right-6 w-[400px] h-[600px] shadow-2xl z-50'
    : 'w-full h-[500px] shadow-xl';

  return (
    <>
      {/* Floating Trigger Button (only in floating mode) */}
      {!isOpen && type === 'floating' && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn("flex flex-col overflow-hidden border-2", cardClasses)}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">
                  {isDraftingMode ? 'Claim Drafting Assistant' : 'Support Assistant'}
                </h3>
                <p className="text-xs opacity-90">
                  {isDraftingMode ? 'Help writing your claim' : 'Ask me anything'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Refresh button */}
              <Button
                onClick={handleClearChat}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Clear chat"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {/* Only show close button in floating mode */}
              {type === 'floating' && (
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea ref={scrollAreaRef} className="h-full">
              <div className="space-y-4 p-4">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    👋 Hi! I'm your AI assistant
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    {isDraftingMode
                      ? 'I can help you write a professional claim description. Just tell me what happened!'
                      : 'I can help you with:'}
                  </p>
                  {!isDraftingMode && (
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Understanding the claims process</li>
                      <li>• Navigating to different pages</li>
                      <li>• Checking claim status</li>
                      <li>• Explaining features</li>
                    </ul>
                  )}
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((message: any, index: number) => (
                <div
                  key={index}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-2 relative group',
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {/* Action Buttons for Assistant Messages */}
                    {message.role === 'assistant' && message.content && (
                      <div className="flex gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          onClick={() => handleCopy(message.content, index)}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          {copiedIndex === index ? 'Copied' : 'Copy'}
                        </Button>

                        {/* Show Insert button in drafting mode */}
                        {isDraftingMode && onInsertText && (
                          <Button
                            onClick={() => handleInsert(message.content)}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Insert
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-white dark:bg-gray-950">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isDraftingMode
                    ? 'Describe what happened...'
                    : 'Ask me anything...'
                }
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}
