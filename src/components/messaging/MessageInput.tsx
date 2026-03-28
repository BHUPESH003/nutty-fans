import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSocket } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import type { Message } from '@/types/messaging';

import { InChatTipModal } from './InChatTipModal';

interface MessageInputProps {
  onSend: (
    _content: string,
    _mediaId?: string,
    _price?: number,
    _options?: { messageTypeOverride?: Message['messageType']; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  isCreator: boolean;
  conversationId: string;
  recipientId?: string;
  disabled?: boolean;
  className?: string;
}

export function MessageInput({
  onSend,
  isCreator,
  conversationId,
  recipientId,
  disabled: _disabled,
  className,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [sending, setSending] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const { toast } = useToast();

  const socket = getSocket();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingDurationRef = useRef(0);

  const emitTypingStop = () => {
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    socket.emit('typing:stop', { conversationId });
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTypingStop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const stopRecording = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = null;
    setIsRecording(false);

    mediaRecorderRef.current?.stop();
  };

  const uploadAndSendVoiceMessage = async (blob: Blob, durationSeconds: number) => {
    setUploadingVoice(true);
    try {
      const filename = `voice-${Date.now()}.webm`;
      const contentType = 'audio/webm';

      const uploadResult = await apiClient.content.getUploadUrl(filename, contentType, blob.size);
      const { uploadUrl, mediaId, key } = uploadResult;

      await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': contentType },
      });

      await apiClient.content.confirmUpload(mediaId, key);

      await onSend('', mediaId, undefined, {
        messageTypeOverride: 'audio',
        metadata: { duration: durationSeconds },
      });
    } catch (error) {
      toast({
        title: 'Failed to send voice message',
        description:
          error instanceof Error ? error.message : 'An error occurred while uploading your voice',
        variant: 'destructive' as const,
      });
    } finally {
      setUploadingVoice(false);
    }
  };

  const startRecording = async () => {
    if (uploadingVoice) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioChunksRef.current = [];
      recordingDurationRef.current = 0;
      setRecordingDuration(0);
      setIsRecording(true);

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (!e.data) return;
        audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const s = mediaStreamRef.current;
        s?.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;

        if (audioChunksRef.current.length === 0) {
          setIsRecording(false);
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const durationSeconds = recordingDurationRef.current;

        setIsRecording(false);
        await uploadAndSendVoiceMessage(blob, durationSeconds);
      };

      recorder.start();

      durationTimerRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration(recordingDurationRef.current);

        if (recordingDurationRef.current >= 120) {
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      toast({
        title: 'Microphone permission denied',
        description: error instanceof Error ? error.message : 'Could not access microphone',
        variant: 'destructive' as const,
      });
      setIsRecording(false);
    }
  };

  // MVP: No real media upload yet, just placeholder logic
  // In real app: Use MediaUpload component to get mediaId

  const handleSend = async () => {
    if (!content.trim()) return;
    if (isRecording) return;

    try {
      setSending(true);
      await onSend(content, undefined, price);
      emitTypingStop();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setContent('');
      setPrice(0);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to send message',
        description:
          error instanceof Error ? error.message : 'An error occurred while sending your message',
        variant: 'destructive' as const,
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setContent(next);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing:start', { conversationId });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop();
    }, 3000);
  };

  return (
    <div className={cn('bg-white p-3 md:p-4', className)}>
      {price > 0 && (
        <div className="mb-2 flex w-fit items-center gap-2 rounded-md bg-secondary-fixed/10 p-2 text-sm text-secondary">
          <span className="material-symbols-outlined text-[18px]">toll</span>
          <span>Locked for ${price}</span>
          <button type="button" onClick={() => setPrice(0)} className="hover:text-secondary">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" disabled>
            <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
              image
            </span>
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" disabled>
            <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
              videocam
            </span>
          </Button>
          {isRecording ? (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-error" />
              <span className="w-10 text-center font-mono text-[10px] text-error">
                {Math.floor(recordingDuration / 60)}:
                {String(recordingDuration % 60).padStart(2, '0')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-error hover:bg-error/10"
                onClick={stopRecording}
                disabled={uploadingVoice}
              >
                <span className="material-symbols-outlined text-[22px]">stop</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={startRecording}
              disabled={uploadingVoice}
            >
              <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
                mic
              </span>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isCreator && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-full px-3 text-xs">
                  <span className="material-symbols-outlined mr-1 text-[16px]">lock</span>
                  PPV
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Set Price</h4>
                  <p className="text-sm text-muted-foreground">
                    Lock this message behind a paywall.
                  </p>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          {!isCreator && recipientId && (
            <>
              <Button
                size="sm"
                className="h-9 rounded-full px-3 text-xs"
                onClick={() => setShowTipModal(true)}
                disabled={uploadingVoice}
              >
                <span className="material-symbols-outlined mr-1 text-[16px]">add_card</span>
                Tip
              </Button>
              <InChatTipModal
                open={showTipModal}
                onClose={() => setShowTipModal(false)}
                conversationId={conversationId}
                recipientId={recipientId}
                onSent={() => setShowTipModal(false)}
              />
            </>
          )}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <Textarea
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-full border-none bg-surface-container-low px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-primary-fixed"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!content.trim() || sending || isRecording || uploadingVoice}
          size="icon"
          className="h-12 w-12 shrink-0 rounded-full bg-primary-container text-white hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </Button>
      </div>
    </div>
  );
}
