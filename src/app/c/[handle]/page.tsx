import { notFound } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PublicCreatorProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  isVerified: boolean;
  subscriberCount: number;
  postCount: number;
  subscriptionPrice: number;
  socialLinks: Record<string, string>;
  category: { id: string; name: string } | null;
}

async function getCreatorProfile(handle: string): Promise<PublicCreatorProfile | null> {
  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000';
  try {
    const response = await fetch(`${baseUrl}/api/public/creator/${handle}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const creator = await getCreatorProfile(handle);

  if (!creator) {
    notFound();
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/40 md:h-64">
        {creator.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creator.coverImageUrl} alt="Cover" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="relative z-10 mx-auto -mt-16 max-w-4xl px-4">
        {/* Profile Header */}
        <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:items-end">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={creator.avatarUrl ?? undefined} alt={creator.displayName} />
            <AvatarFallback className="text-4xl">
              {creator.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{creator.displayName}</h1>
              {creator.isVerified && <Badge variant="secondary">✓ Verified</Badge>}
            </div>
            <p className="text-muted-foreground">@{creator.handle}</p>
            {creator.category && (
              <Badge variant="outline" className="mt-2">
                {creator.category.name}
              </Badge>
            )}
          </div>

          <Button size="lg">Subscribe {formatPrice(creator.subscriptionPrice)}/mo</Button>
        </div>

        {/* Bio */}
        {creator.bio && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="whitespace-pre-wrap">{creator.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{creator.subscriberCount}</p>
              <p className="text-muted-foreground">Subscribers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{creator.postCount}</p>
              <p className="text-muted-foreground">Posts</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Preview */}
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Subscribe to see {creator.displayName}&apos;s content
            </p>
            <Button className="mt-4">
              Subscribe for {formatPrice(creator.subscriptionPrice)}/mo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
