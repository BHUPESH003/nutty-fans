'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { Grid, Image as ImageIcon, Info } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface ProfileTabsProps {
  defaultValue?: string;
  className?: string;
}

export function ProfileTabs({ defaultValue = 'posts', className }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  const tabs = [
    { id: 'posts', label: 'Posts', icon: Grid },
    { id: 'media', label: 'Media', icon: ImageIcon },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <TabsPrimitive.Root
      defaultValue={defaultValue}
      value={activeTab}
      onValueChange={setActiveTab}
      className={cn('w-full', className)}
    >
      <div className="sticky top-[60px] z-30 w-full border-b border-white/5 bg-background/80 backdrop-blur-md md:top-[0px]">
        <TabsPrimitive.List className="mx-auto flex w-full max-w-2xl">
          {tabs.map((tab) => (
            <TabsPrimitive.Trigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'group relative flex flex-1 items-center justify-center gap-2 py-4 text-sm font-medium transition-colors',
                'text-muted-foreground hover:text-foreground data-[state=active]:text-primary'
              )}
            >
              <tab.icon className="size-4" />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
      </div>

      <div className="mx-auto min-h-[50vh] max-w-2xl p-4">
        <TabsPrimitive.Content value="posts" className="outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 gap-4">
            {/* Placeholder for posts */}
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-muted-foreground">
              No posts yet
            </div>
          </div>
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="media" className="outline-none focus-visible:ring-0">
          <div className="grid grid-cols-3 gap-1">
            {/* Placeholder for media grid */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="about" className="outline-none focus-visible:ring-0">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>About content goes here...</p>
          </div>
        </TabsPrimitive.Content>
      </div>
    </TabsPrimitive.Root>
  );
}
