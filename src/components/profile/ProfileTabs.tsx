'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import * as React from 'react';

import { SettingsPageContainer } from '@/components/containers/settings/SettingsPageContainer';
import { PurchasesTab } from '@/components/profile/tabs/PurchasesTab';
import { WalletTab } from '@/components/profile/tabs/WalletTab';
import { cn } from '@/lib/utils';

interface ProfileTabsProps {
  defaultValue?: string;
  className?: string;
}

const tabs = [
  { id: 'wallet', label: 'Wallet', icon: 'credit_card' as const },
  { id: 'purchases', label: 'Purchases', icon: 'shopping_bag' as const },
  { id: 'settings', label: 'Settings', icon: 'settings' as const },
];

export function ProfileTabs({ defaultValue = 'wallet', className }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  // Update active tab when defaultValue changes (e.g., from URL parameter)
  React.useEffect(() => {
    if (defaultValue) {
      setActiveTab(defaultValue);
    }
  }, [defaultValue]);

  return (
    <TabsPrimitive.Root
      defaultValue={defaultValue}
      value={activeTab}
      onValueChange={setActiveTab}
      className={cn('w-full', className)}
    >
      <div className="sticky top-[60px] z-30 w-full border-b border-surface-container-high bg-background/80 backdrop-blur-md md:top-[0px]">
        <TabsPrimitive.List className="no-scrollbar mx-auto flex w-full max-w-2xl overflow-x-auto">
          {tabs.map((tab) => (
            <TabsPrimitive.Trigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'group relative flex min-w-[80px] flex-1 items-center justify-center gap-2 py-4 font-headline text-sm font-semibold transition-colors',
                'text-on-surface-variant hover:text-on-surface data-[state=active]:text-primary'
              )}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
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

      <div className="min-h-[50vh] max-w-2xl px-4 py-4 sm:px-6 sm:py-6">
        <TabsPrimitive.Content value="wallet" className="outline-none focus-visible:ring-0">
          <WalletTab />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="purchases" className="outline-none focus-visible:ring-0">
          <PurchasesTab />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="settings" className="outline-none focus-visible:ring-0">
          <SettingsPageContainer />
        </TabsPrimitive.Content>
      </div>
    </TabsPrimitive.Root>
  );
}
