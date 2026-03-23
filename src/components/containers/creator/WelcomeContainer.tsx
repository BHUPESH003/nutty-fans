'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const WelcomeContainer = () => {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center">
        {/* Celebration */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600">
            <span className="material-symbols-outlined text-5xl text-white">celebration</span>
          </div>
        </div>

        <h1 className="mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text font-headline text-4xl font-bold text-transparent">
          Welcome, Creator!
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Your account is fully set up and ready to go. Time to create your first post!
        </p>

        {/* Stats Preview */}
        <Card className="mb-8 border-none bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Subscribers</p>
              </div>
              <div>
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div>
                <p className="text-3xl font-bold">$0</p>
                <p className="text-sm text-muted-foreground">Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => router.push('/creator/posts/new')}
          >
            <span className="material-symbols-outlined text-[22px]">add_circle</span>
            Create Your First Post
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2"
            onClick={() => router.push('/creator/dashboard')}
          >
            Go to Dashboard
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-8 text-left">
          <h3 className="mb-4 font-semibold">Quick Tips to Get Started:</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              <span>Create a welcome post introducing yourself to potential subscribers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              <span>Post consistently to keep your subscribers engaged</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              <span>Share your NuttyFans link on your social media profiles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">4.</span>
              <span>Respond to messages promptly to build relationships with fans</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
