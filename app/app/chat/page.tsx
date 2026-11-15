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
  const [userName, setUserName] = useState<string>('Parth');

  useEffect(() => {
    const profile = getStoredUserProfile();
    if (profile?.displayName && profile.displayName !== 'Farmer') {
      setUserName(profile.displayName.split(' ')[0]);
    }
    if (profile?.farms && profile.farms.length > 0) {
      const fieldNames = ['All fields', ...profile.farms.map((f) => f.name)];
      setFields(fieldNames);
    }
  }, []);

  return (
    <AppShell>
      <div className="h-[calc(100vh-130px)] w-full flex flex-col justify-between -mt-2">
        <ChatPage
          apiUrl="/api/chat"
          fields={fields}
          title={`What’s growing today, ${userName}?`}
          suggestions={[
            '🌦️ Will it rain this week?',
            '🔬 Why are my tomato leaves yellowing?',
            '📅 Plan this month’s sowing schedule',
            '🧪 Optimal soil pH for winter wheat',
            '📈 Mandi wholesale price benchmarks'
          ]}
        />
      </div>
    </AppShell>
  );
}
