'use client';

import { useState } from 'react';

import { FeedContainer } from '@/components/containers/feed/FeedContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PersonalizedFeed() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Home</h2>
      </div>

      <Tabs
        defaultValue="for-you"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'for-you' | 'following')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="for-you">For You</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>

        <TabsContent value="for-you" className="mt-6">
          <FeedContainer feedType="for-you" />
        </TabsContent>

        <TabsContent value="following" className="mt-6">
          <FeedContainer feedType="following" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
