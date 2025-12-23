'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getMosaicImages } from './actions';

export default function AgeGatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mosaicImages, setMosaicImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      const images = await getMosaicImages();
      setMosaicImages(images);
    };
    void fetchImages();
  }, []);

  const handleConfirm = () => {
    setIsLoading(true);
    // Set cookie to expire in 30 days
    document.cookie = 'age_verified=true; path=/; max-age=2592000; SameSite=Lax';
    router.push('/');
    router.refresh();
  };

  const handleExit = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <main className="relative flex min-h-[calc(100vh_-_var(--header-h))] items-end justify-center overflow-hidden bg-black p-4 pb-8 sm:items-center sm:pb-4">
      {/* Background: Mosaic or Fallback */}
      <div className="absolute inset-0 z-0">
        {mosaicImages.length > 0 ? (
          <div className="grid h-full w-full grid-cols-3 grid-rows-5 gap-1 opacity-80">
            {/* Ensure we fill 15 slots even if we have fewer images by repeating */}
            {Array.from({ length: 15 }).map((_, i) => {
              const imgUrl = mosaicImages[i % mosaicImages.length] || '';
              return (
                <div key={i} className="relative h-full w-full overflow-hidden">
                  <Image
                    src={imgUrl}
                    alt={`Mosaic ${i}`}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-110"
                    sizes="(max-width: 768px) 33vw, 20vw"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <Image
            src="/images/age-gate-bg.jpg"
            alt="Background"
            fill
            className="object-cover opacity-60"
            priority
            sizes="100vw"
          />
        )}
        {/* Gradient Overlay - Lighter at top to show images, darker at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90 backdrop-blur-[1px]" />
      </div>

      <Card className="relative z-10 w-full max-w-md border-white/10 bg-black/60 shadow-2xl backdrop-blur-xl sm:bg-black/40">
        <CardHeader className="space-y-4 pb-2 text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/20">
            <span className="text-3xl">🔞</span>
          </div>
          <div className="space-y-1">
            <h1 className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              NuttyFans
            </h1>
            <CardTitle className="text-xl font-medium text-white/90">Age Verification</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-2 text-center">
            <p className="text-base leading-relaxed text-white/90 shadow-black drop-shadow-md">
              This website contains age-restricted content. You must be 18 years or older to enter.
            </p>
            <p className="text-sm text-white/70 shadow-black drop-shadow-md">
              By entering, you confirm that you are at least 18 years of age and agree to our Terms
              of Service.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="h-12 w-full bg-gradient-to-r from-primary to-purple-600 text-lg font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:shadow-primary/40"
            >
              {isLoading ? 'Verifying...' : 'I am 18 or older - Enter'}
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              onClick={handleExit}
            >
              I am under 18 - Exit
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
