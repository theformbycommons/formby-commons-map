import type { ReactNode } from 'react';
import AppHeader from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-card border-t border-border text-center py-6">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} The Local Glow. Cultivating Our Shared Sense of Place.
        </p>
      </footer>
    </>
  );
}
