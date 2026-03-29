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
    _mediaIds?: string[],
    _price?: number,
    _options?: { messageTypeOverride?: Message['messageType']; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  isCreator: boolean;
  conversationId: string;
  recipientId?: string;
  disabled?: boolean;
  className?: string;
}

interface PendingAttachment {
  id: string;
  file: File;
  url: string;
  mediaType: 'image' | 'video';
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
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const { toast } = useToast();

  const socket = getSocket();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingDurationRef = useRef(0);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentsRef = useRef<PendingAttachment[]>([]);

  const revokeAttachmentUrls = (items: PendingAttachment[]) => {
    items.forEach((item) => URL.revokeObjectURL(item.url));
  };

  const emitTypingStop = () => {
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    socket.emit('typing:stop', { conversationId });
  };

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTypingStop();
      revokeAttachmentUrls(attachmentsRef.current);
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

      const uploadResult = await apiClient.content.getUploadUrl(
        filename,
        contentType,
        blob.size,
        conversationId
      );
      const { uploadUrl, mediaId, key } = uploadResult;

      await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': contentType },
      });

      await apiClient.content.confirmUpload(mediaId, key, undefined, conversationId);

      await onSend('', [mediaId], undefined, {
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

  const uploadAttachments = async (files: File[]) => {
    setUploadingAttachment(true);
    try {
      return await Promise.all(
        files.map(async (file) => {
          const uploadResult = await apiClient.content.getUploadUrl(
            file.name,
            file.type,
            file.size,
            conversationId
          );
          const { uploadUrl, mediaId, key } = uploadResult;

          await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          });

          await apiClient.content.confirmUpload(mediaId, key, undefined, conversationId);
          return mediaId;
        })
      );
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleAttachmentPicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter(
      (file) => file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    if (files.length === 0) {
      event.target.value = '';
      return;
    }

    const nextAttachments: PendingAttachment[] = files.map((file) => ({
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      mediaType: file.type.startsWith('video/') ? 'video' : 'image',
    }));

    setAttachments((prev) => [...prev, ...nextAttachments]);
    event.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSend = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent && attachments.length === 0) return;
    if (isRecording) return;

    const pendingContent = trimmedContent;
    const pendingPrice = price || undefined;
    const pendingAttachments = attachments;

    try {
      setSending(true);
      emitTypingStop();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setContent('');
      setPrice(0);
      setAttachments([]);

      const mediaIds =
        pendingAttachments.length > 0
          ? await uploadAttachments(pendingAttachments.map((attachment) => attachment.file))
          : undefined;

      await onSend(pendingContent || '', mediaIds, pendingPrice);
      revokeAttachmentUrls(pendingAttachments);
    } catch (error) {
      setContent(pendingContent);
      setPrice(pendingPrice ?? 0);
      setAttachments(pendingAttachments);
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
    <div className={cn('p-3 md:p-4', className)}>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleAttachmentPicked}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={handleAttachmentPicked}
      />

      {price > 0 && (
        <div className="mb-2 flex w-fit items-center gap-2 rounded-md bg-secondary-fixed/10 p-2 text-sm text-secondary">
          <span className="material-symbols-outlined text-[18px]">toll</span>
          <span>Locked for ${price}</span>
          <button type="button" onClick={() => setPrice(0)} className="hover:text-secondary">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mb-3 flex gap-3 overflow-x-auto pb-1">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container-low"
            >
              {attachment.mediaType === 'video' ? (
                <video
                  src={attachment.url}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachment.url}
                  alt={attachment.file.name}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-5">
                <p className="truncate text-[10px] font-medium text-white">
                  {attachment.file.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/65 p-1 text-white"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            disabled={uploadingAttachment || sending || isRecording}
            onClick={() => imageInputRef.current?.click()}
          >
            <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
              image
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            disabled={uploadingAttachment || sending || isRecording}
            onClick={() => videoInputRef.current?.click()}
          >
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
          disabled={
            (!content.trim() && attachments.length === 0) ||
            sending ||
            isRecording ||
            uploadingVoice ||
            uploadingAttachment
          }
          size="icon"
          className="h-12 w-12 shrink-0 rounded-full bg-primary-container text-white hover:opacity-90"
        >
          {sending || uploadingAttachment ? (
            <span className="material-symbols-outlined animate-spin text-[20px]">
              progress_activity
            </span>
          ) : (
            <span className="material-symbols-outlined text-[20px]">send</span>
          )}
        </Button>
      </div>
    </div>
  );
}
