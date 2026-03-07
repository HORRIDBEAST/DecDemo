'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal, Loader2, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LogEntry {
  step: string;
  message: string;
  status: 'processing' | 'complete' | 'done';
  timestamp: string;
}

interface AiThinkingLogsProps {
  claimId: string;
  onComplete?: () => void; // ✅ NEW: Callback when processing is done
}

export function AiThinkingLogs({ claimId, onComplete }: AiThinkingLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to the FastAPI SSE endpoint
    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000'}/claims/${claimId}/stream-logs`);

    eventSource.onmessage = (event) => {
      const newLog = JSON.parse(event.data);
      
      setLogs(prev => [...prev, { 
        ...newLog, 
        timestamp: new Date().toLocaleTimeString() 
      }]);

      // Auto-scroll to bottom
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }

      // ✅ Close connection when done and notify parent
      if (newLog.status === 'done') {
        setIsComplete(true);
        eventSource.close();
        
        // Call the completion callback after a short delay
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 1000);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [claimId, onComplete]);

  if (logs.length === 0) return null;

  return (
    <Card className={`border-slate-800 text-slate-200 ${isComplete ? 'bg-slate-900' : 'bg-slate-950'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono flex items-center text-green-400">
          <Terminal className="w-4 h-4 mr-2" />
          AI Agent Process Logs {isComplete && '✓ Complete'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] w-full pr-4">
          <div className="space-y-3 font-mono text-xs">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start space-x-2">
                <span className="text-slate-500 min-w-[60px]">{log.timestamp}</span>
                
                {log.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-yellow-500 mt-0.5" />}
                {log.status === 'complete' && <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5" />}
                {log.status === 'done' && <CheckCircle2 className="w-3 h-3 text-blue-500 mt-0.5" />}
                
                <span className={log.status === 'complete' || log.status === 'done' ? 'text-slate-400' : 'text-slate-100'}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}