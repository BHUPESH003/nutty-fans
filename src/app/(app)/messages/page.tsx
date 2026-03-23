'use client';

export default function MessagesPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-on-surface-variant">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
        <span className="material-symbols-outlined text-[36px] text-primary">chat_bubble</span>
      </div>
      <h3 className="font-headline text-lg font-bold text-on-surface">Your Messages</h3>
      <p className="mt-2 max-w-sm text-sm">
        Select a conversation from the list to start chatting or send a new message to a creator.
      </p>
    </div>
  );
}
