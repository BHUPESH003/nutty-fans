import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AgeGatePage() {
  return (
    <main>
      <Card className="w-full max-w-md shadow-card">
        <CardHeader>
          <CardTitle className="text-h3">Are you 18 or older?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            NuttyFans includes content that is only appropriate for adults. Please confirm your age
            to continue.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/register">Yes, I am 18 or older</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">No, take me back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
