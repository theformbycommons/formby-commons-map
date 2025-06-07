
'use client';

import { useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Client-side Firebase auth
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { KeyRound, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    console.log('Admin login: handleLogin initiated.'); // Client-side log

    try {
      console.log('Admin login: Attempting signInWithEmailAndPassword...'); // Client-side log
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Admin login: signInWithEmailAndPassword successful.', userCredential.user); // Client-side log

      console.log('Admin login: Attempting getIdToken...'); // Client-side log
      const idToken = await getIdToken(userCredential.user);
      console.log('Admin login: getIdToken successful. Token length:', idToken.length); // Client-side log (don't log the full token)

      console.log('Admin login: Attempting fetch to /api/auth/session-login...'); // Client-side log
      const response = await fetch('/api/auth/session-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });
      console.log('Admin login: Fetch response status:', response.status); // Client-side log

      if (!response.ok) {
        const data = await response.json();
        console.error('Admin login: Session login API error response data:', data); // Client-side log
        throw new Error(data.error || 'Failed to set session cookie.');
      }
      
      toast({
        title: 'Login Successful',
        description: 'Redirecting to admin dashboard...',
      });
      console.log('Admin login: Session cookie set, redirecting to /admin/suggestions.'); // Client-side log
      startTransition(() => {
        router.push('/admin/suggestions'); 
      });
    } catch (err: any) {
      console.error('Admin login: Error during login process:', err); // Client-side log
      setError(err.message || 'An unknown error occurred during login.');
      toast({
        title: 'Login Failed',
        description: err.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      console.log('Admin login: handleLogin finished.'); // Client-side log
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <KeyRound className="h-7 w-7" />
          </div>
          <CardTitle className="font-headline text-2xl text-primary">Admin Login</CardTitle>
          <CardDescription>Access the Local Glow administration panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6" suppressHydrationWarning={true}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Login Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" /> Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground pt-4">
            <p>Ensure you are an authorized administrator.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
