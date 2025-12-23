'use client';

import { XCircle, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const RejectedContainer = () => {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="border-none bg-card/50 shadow-xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Application Not Approved</CardTitle>
          <CardDescription>
            Unfortunately, we were unable to approve your creator application at this time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-background/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              This could be due to one of the following reasons:
            </p>
            <ul className="mt-4 space-y-2 text-left text-sm">
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>Profile content does not meet our community guidelines</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>Username or bio contains restricted content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>Account flagged for review</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              If you believe this was a mistake, please contact our support team.
            </p>
            <Button className="gap-2">
              <Mail className="h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
