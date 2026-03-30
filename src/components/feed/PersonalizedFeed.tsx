'use client';

import { useState } from 'react';

import { FeedContainer } from '@/components/containers/feed/FeedContainer';
import { ExploreRailContent } from '@/components/explore/ExploreRailExtras';
import { AppRailLayout } from '@/components/layout/AppRailLayout';
import { DesktopTopBar } from '@/components/layout/DesktopTopBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PersonalizedFeed() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');

  return (
    <AppRailLayout
      centerMaxWidthClassName="max-w-[725px]"
      rail={<ExploreRailContent showLiveTeaser={false} />}
    >
      <DesktopTopBar />
      <Tabs
        defaultValue="for-you"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'for-you' | 'following')}
        className="w-full"
      >
        <div className="sticky top-14 z-10 -mx-px border-b border-surface-container-high bg-background/85 backdrop-blur-md md:top-16">
          <TabsList className="grid h-14 w-full grid-cols-2 rounded-none border-0 bg-transparent p-0">
            <TabsTrigger
              value="for-you"
              className="flex h-14 w-full items-center justify-center rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-0 text-[15px] font-semibold text-neutral-500 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              For you
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex h-14 w-full items-center justify-center rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-0 text-[15px] font-semibold text-neutral-500 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Following
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="px-3 sm:px-4">
          <TabsContent value="for-you" className="mt-0 focus-visible:outline-none">
            <FeedContainer
              feedType="for-you"
              inlineRail={<ExploreRailContent showLiveTeaser={false} />}
            />
          </TabsContent>

          <TabsContent value="following" className="mt-0 focus-visible:outline-none">
            <FeedContainer
              feedType="following"
              inlineRail={<ExploreRailContent showLiveTeaser={false} />}
            />
          </TabsContent>
        </div>
      </Tabs>
    </AppRailLayout>
  );
}
