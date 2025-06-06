
import type { ReactNode } from 'react';
import AppHeader from './AppHeader';
import Link from 'next/link';

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
          © {new Date().getFullYear()} Local Glow. Cultivating Our Shared Sense of Place.
        </p>
        <div className="mt-2 text-xs text-muted-foreground/80 space-x-4">
          <Link href="/privacy-policy" className="hover:text-accent hover:underline">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms-conditions" className="hover:text-accent hover:underline">
            Terms & Conditions
          </Link>
        </div>
      </footer>
    </>
  );
}
