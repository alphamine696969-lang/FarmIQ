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
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const profile = getStoredUserProfile();
    if (profile?.displayName && profile.displayName !== 'Farmer') {
      const first = profile.displayName.trim().split(/\s+/)[0];
      if (first) setUserName(first);
    }
    if (profile?.farms && profile.farms.length > 0) {
      const fieldNames = ['All fields', ...profile.farms.map((f) => f.name)];
      setFields(fieldNames);
    }

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          const rawName = data.user.name || data.user.given_name || profile?.displayName;
          if (rawName && rawName !== 'Farmer') {
            const first = rawName.trim().split(/\s+/)[0];
            if (first) setUserName(first);
          }
        }
      })
      .catch(() => {});
  }, []);

  const greeting = userName ? `What’s growing today, ${userName}?` : 'What’s growing today?';

  return (
    <AppShell>
      <div className="h-[calc(100dvh-75px)] md:h-[calc(100vh-85px)] w-full flex flex-col justify-between">
        <ChatPage
          apiUrl="/api/chat"
          fields={fields}
          title={greeting}
          suggestions={[
            '📸 Diagnose leaf disease from photo',
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
