'use client';

import * as React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface AvatarUploaderProps {
  avatarUrl: string | null;
  displayName?: string;
  isUploading: boolean;
  error?: string | null;
  onFileSelected: (_file: File) => void; // eslint-disable-line no-unused-vars
  onRemove: () => void;
}

export function AvatarUploader({
  avatarUrl,
  displayName,
  isUploading,
  error,
  onFileSelected,
  onRemove,
}: AvatarUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const initials = (() => {
    const source = displayName || '';
    if (!source) return '';
    return source
      .trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  })();

  const handleClickUpload = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onFileSelected(file);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-4">
        <Avatar className="size-24">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={`${displayName}'s profile photo`} />
          ) : null}
          <AvatarFallback>{initials || 'NF'}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleClickUpload} disabled={isUploading}>
              {isUploading ? 'Uploading…' : 'Upload Photo'}
            </Button>
            {avatarUrl ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onRemove}
                disabled={isUploading}
              >
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Avatars must follow community guidelines and may be reviewed for policy compliance.
          </p>
          {error ? <p className="text-xs text-[hsl(var(--accent-error))]">{error}</p> : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </section>
  );
}
