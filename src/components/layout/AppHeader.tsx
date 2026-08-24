import Link from 'next/link';
import { bp } from "@/lib/basePath";
import { Star, PlusCircle, Home as HomeIconNav } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Link: Points directly to the main website */}
        <a 
          href="https://theformbycommons.github.io/" 
          className="flex items-center gap-2 text-xl font-headline font-bold text-primary hover:text-accent transition-colors"
        >
          <Star className="h-7 w-7 text-accent fill-accent drop-shadow-[0_0_6px_hsl(var(--accent-foreground))]" />
          <span>The Formby Commons</span>
        </a>

        <nav className="flex items-center gap-2 sm:gap-4">
          {/* Home Button: Stays within the map app landing page */}
          <Button variant="ghost" asChild>
            <Link href={bp('/')} className="flex items-center gap-1.5 text-sm sm:text-base">
              <HomeIconNav className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </Button>
          
          <Button variant="default" size="sm" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href={bp('/suggest-location')} className="flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Suggest Action</span>
              <span className="sm:hidden">Suggest</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
