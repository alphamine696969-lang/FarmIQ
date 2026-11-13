import React from 'react';
import { PageContentTransition } from '@/components/transitions/PageContentTransition';

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageContentTransition>{children}</PageContentTransition>;
}
