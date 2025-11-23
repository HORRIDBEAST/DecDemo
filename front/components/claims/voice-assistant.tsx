'use client';

import { useEffect, useState, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceAssistantProps {
  onFormFill: (data: any) => void;
}

export function VoiceClaimAssistant({ onFormFill }: VoiceAssistantProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    // 1. Initialize Vapi only once
    if (!vapiRef.current) {
      vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
    }
    const vapi = vapiRef.current;

    // 2. Event Handlers
    const onCallStart = () => {
      setIsCallActive(true);
      toast.info('Voice assistant connected.');
    };

    const onCallEnd = () => {
      setIsCallActive(false);
      setIsListening(false);
    };

    const onSpeechStart = () => setIsListening(true);
    const onSpeechEnd = () => setIsListening(false);

    const onMessage = (message: any) => {
      // Handle Tool Calls (New Vapi Format)
      if (message.type === 'tool-calls') {
        const toolCall = message.toolCalls[0];
        
        if (toolCall.function.name === 'submitClaimDetails') {
          console.log('📞 Raw Tool Args:', toolCall.function.arguments);

          let formData = toolCall.function.arguments;

          // Defensive Parsing: Handle Object vs String
          if (typeof formData === 'string') {
            try {
              // Sanitize string if it accidentally is "[object Object]"
              if (formData === "[object Object]") {
                 console.error("Vapi sent invalid stringified object");
                 return; 
              }
              formData = JSON.parse(formData);
            } catch (e) {
              console.error("JSON Parse Error:", e);
              return;
            }
          }

          console.log('✅ Parsed Data:', formData);
          toast.success('Details captured! Updating form...');
          
          // Fill Form
          onFormFill(formData);
          
          // Hang up after a short delay to let AI finish speaking "Done."
          setTimeout(() => {
            vapi.stop();
          }, 2000);
        }
      }
    };

    // 3. Attach Listeners
    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('message', onMessage);

    // 4. Cleanup Listeners on Unmount
    return () => {
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('message', onMessage);
    };
  }, [onFormFill]);

  const toggleCall = async () => {
    const vapi = vapiRef.current;
    if (!vapi) return;

    if (isCallActive) {
      vapi.stop();
    } else {
      try {
        setIsListening(true);
        // Ensure you are using the correct Assistant ID from .env
        await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!);
      } catch (err) {
        console.error('Failed to start call:', err);
        toast.error('Could not connect to voice server.');
        setIsListening(false);
      }
    }
  };

  return (
    <Button
      type="button"
      variant={isCallActive ? "destructive" : "outline"}
      className={`w-full h-16 text-lg transition-all ${isCallActive ? 'animate-pulse border-red-400' : ''}`}
      onClick={toggleCall}
    >
      {isCallActive ? (
        <>
          <MicOff className="mr-2 h-6 w-6" />
          {isListening ? 'Listening...' : 'Speak Now'}
        </>
      ) : (
        <>
          <Mic className="mr-2 h-6 w-6 text-blue-600" />
          <span className="flex flex-col items-start text-left">
            <span className="font-bold">Fill with Voice AI</span>
            <span className="text-xs font-normal text-slate-500">Tap to speak</span>
          </span>
          <Sparkles className="ml-auto h-5 w-5 text-yellow-500" />
        </>
      )}
    </Button>
  );
}