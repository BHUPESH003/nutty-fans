'use client';

export default function MessagesPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[linear-gradient(180deg,hsl(var(--surface-container-low))_0%,hsl(var(--surface))_100%)] p-8 text-center text-on-surface-variant">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface-container-lowest shadow-card">
        <span className="material-symbols-outlined text-[36px] text-primary">chat</span>
      </div>
      <h3 className="font-headline text-lg font-bold text-on-surface">Select a conversation</h3>
      <p className="mt-2 max-w-sm text-sm">
        Choose a chat from the left to view messages, unlock PPV content, or send a tip.
      </p>
    </div>
  );
}
