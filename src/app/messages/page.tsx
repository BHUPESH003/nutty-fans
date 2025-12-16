import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
      <div className="mb-4 rounded-full bg-muted/50 p-4">
        <MessageSquare className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-medium text-foreground">Your Messages</h3>
      <p className="mt-2 max-w-sm">
        Select a conversation from the list to start chatting or send a new message to a creator.
      </p>
    </div>
  );
}
