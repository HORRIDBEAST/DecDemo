// components/claims/ai-processing-indicator.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function AIProcessingIndicator({ claimId }: { claimId: string }) {
  const { user } = useAuth();
  const socket = useWebSocket(user?.id);
  const [progress, setProgress] = useState(10);
  const [message, setMessage] = useState('Initializing AI agents...');

  useEffect(() => {
    if (!socket) return;

    const handleProgress = (data: { claimId: string, agentType: string, progress: number }) => {
      if (data.claimId === claimId) {
        setProgress(data.progress);
        setMessage(`Processing: ${data.agentType.replace('_', ' ')}...`);
      }
    };

    socket.on('aiProcessingUpdate', handleProgress);
    return () => { socket.off('aiProcessingUpdate', handleProgress); };
  }, [socket, claimId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          AI Processing in Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">{message}</p>
        <Progress value={progress} className="w-full" />
        <p className="text-xs text-slate-500">
          Your claim is being analyzed by our AI agents. This may take a moment.
        </p>
      </CardContent>
    </Card>
  );
}