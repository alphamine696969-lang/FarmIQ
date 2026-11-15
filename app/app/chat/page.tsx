'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import ChatPage from '@/components/ChatPage';
import { getStoredUserProfile } from '@/lib/data/userState';

export default function AppChatPage() {
  const [fields, setFields] = useState<string[]>([
    'All fields',
    'North field',
    'South field'
  ]);

  useEffect(() => {
    const profile = getStoredUserProfile();
    if (profile?.farms && profile.farms.length > 0) {
      const fieldNames = ['All fields', ...profile.farms.map((f) => f.name)];
      setFields(fieldNames);
    }
  }, []);

  return (
    <AppShell>
      <div className="h-[calc(100vh-130px)] w-full flex flex-col -mt-3">
        <ChatPage
          apiUrl="/api/chat"
          fields={fields}
          suggestions={[
            'Will it rain this week?',
            'Why are my leaves yellowing?',
            'Plan this month’s sowing',
            'What is the optimal soil pH for winter wheat?',
            'How do I identify early blight in tomatoes?'
          ]}
        />
      </div>
    </AppShell>
  );
}
