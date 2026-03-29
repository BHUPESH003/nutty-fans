'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AgeGateScreenProps {
  initialMosaicUrls: string[];
}

function TrustItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-on-surface-variant">
      <span
        className="material-symbols-outlined text-[22px] text-on-surface-variant/70"
        aria-hidden
      >
        {icon}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function AgeGateScreen({ initialMosaicUrls }: AgeGateScreenProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const mosaicImages = initialMosaicUrls;

  const handleConfirm = () => {
    setIsLoading(true);
    document.cookie = 'age_verified=true; path=/; max-age=2592000; SameSite=Lax';
    router.push('/');
    router.refresh();
  };

  const handleExit = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
      {/* Mobile header — centered wordmark */}
      <header className="border-b border-surface-container-high bg-white px-4 py-4 lg:hidden">
        <div className="flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-headline text-lg font-extrabold tracking-wide text-primary"
            style={{ letterSpacing: '0.08em' }}
          >
            <Image
              src="/Group.svg"
              alt=""
              width={32}
              height={20}
              className="h-5 w-auto"
              unoptimized
            />
            NuttyFans
          </Link>
        </div>
      </header>

      {/* Desktop header — logo + nav */}
      <header className="hidden border-b border-surface-container-high bg-white px-8 py-3 lg:block">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-headline text-sm font-bold tracking-tight"
          >
            <Image
              src="/Group.svg"
              alt=""
              width={36}
              height={22}
              className="h-6 w-auto"
              unoptimized
            />
            <span className="text-primary">NuttyFans</span>
          </Link>
          <nav className="flex items-center gap-8 text-sm">
            <a href="#" className="text-on-surface-variant transition-colors hover:text-on-surface">
              Support
            </a>
            <a href="#" className="text-on-surface-variant transition-colors hover:text-on-surface">
              Safety
            </a>
            <a href="#" className="text-on-surface-variant transition-colors hover:text-on-surface">
              Privacy
            </a>
            <Link href="/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
            <Button
              asChild
              className="rounded-lg bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Link href="/register">Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main: split desktop / stack mobile */}
      <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-2">
        {/* Hero — dark */}
        <section
          className={cn(
            'relative flex min-h-[40vh] flex-col justify-between overflow-hidden bg-[#121212] px-6 pb-8 pt-8',
            'lg:h-full lg:min-h-0 lg:px-12 lg:pb-10 lg:pt-10'
          )}
        >
          {mosaicImages.length > 0 ? (
            <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
              <div className="grid h-full w-full grid-cols-3 grid-rows-4 gap-0.5 sm:grid-rows-5">
                {Array.from({ length: 12 }).map((_, i) => {
                  const imgUrl = mosaicImages[i % mosaicImages.length] || '';
                  return (
                    <div key={i} className="relative min-h-0 overflow-hidden">
                      <Image src={imgUrl} alt="" fill className="object-cover" sizes="20vw" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0">
              <Image
                src="/images/age-gate-bg.jpg"
                alt=""
                fill
                className="object-cover opacity-40"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          )}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#121212]/90 to-[#121212]"
            aria-hidden
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,rgba(186,0,72,0.15),transparent_60%)]" />

          <div className="relative z-10 flex flex-1 flex-col justify-between gap-8">
            <div>
              <span className="inline-block rounded-full bg-primary px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                18+ Platform
              </span>

              {/* Mobile-only tagline block */}
              <div className="mt-8 lg:hidden">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-extrabold text-white shadow-lg shadow-primary/30">
                  18+
                </div>
                <h2 className="mt-6 text-center font-headline text-2xl font-bold text-white">
                  Premium Creator Platform
                </h2>
                <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                  Exclusive • Private • Adults only
                </p>
              </div>

              {/* Desktop headline */}
              <div className="mt-10 hidden lg:block">
                <h2 className="font-headline text-4xl font-bold leading-[1.15] text-white xl:text-5xl">
                  Premium creators.
                  <br />
                  <span className="text-primary-fixed-dim">Exclusive content.</span>
                </h2>
              </div>
            </div>

            {/* Stats — desktop only */}
            <div className="hidden grid-cols-3 divide-x divide-white/15 border-t border-white/10 pt-6 lg:grid">
              <div className="px-4 text-center">
                <div className="font-headline text-2xl font-bold text-white xl:text-3xl">50K+</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  Creators
                </div>
              </div>
              <div className="px-4 text-center">
                <div className="font-headline text-2xl font-bold text-white xl:text-3xl">2M+</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  Members
                </div>
              </div>
              <div className="px-4 text-center">
                <div className="font-headline text-2xl font-bold text-primary-fixed-dim xl:text-3xl">
                  100%
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  Private
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Age gate card — white */}
        <section
          className={cn(
            'relative z-20 flex flex-col justify-center bg-white px-6 py-8',
            '-mt-10 rounded-t-3xl shadow-[0_-12px_48px_rgba(0,0,0,0.12)] lg:mt-0 lg:rounded-none lg:px-12 lg:py-10 lg:shadow-none'
          )}
        >
          <div className="mx-auto w-full max-w-md">
            <div className="hidden justify-center lg:flex">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-xl font-bold text-primary shadow-md lg:mb-2">
                18+
              </div>
            </div>

            <h1 className="mt-0 text-center font-headline text-2xl font-bold text-on-surface lg:mt-3 lg:text-3xl">
              Adults only
            </h1>
            <p className="mt-1.5 text-center text-sm font-medium text-on-surface-variant lg:text-base">
              You must be 18+ to enter.
            </p>

            <p className="mt-5 text-center text-[13px] leading-relaxed text-on-surface-variant lg:text-sm">
              This site contains adult-oriented content including nudity and depictions of sexual
              activity. By entering, you confirm you are at least{' '}
              <strong className="font-semibold text-primary">18 years of age or older</strong> and
              agree to our Terms of Service.
            </p>

            {/* Mobile legal callout */}
            <div className="mt-5 rounded-xl bg-surface-container-low px-4 py-3 lg:hidden">
              <p className="text-center text-[10px] font-semibold uppercase leading-relaxed tracking-wide text-on-surface-variant">
                Registration and viewing of content is strictly prohibited for minors. We utilize
                robust age verification systems.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className="h-11 w-full rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(233,30,99,0.28)] transition hover:bg-primary/95"
              >
                {isLoading ? 'Continuing…' : 'I am 18 or older — Enter NuttyFans'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-full border-surface-container-high bg-white text-[15px] font-medium text-on-surface hover:bg-surface-container-low"
                onClick={handleExit}
              >
                I am under 18 — Exit
              </Button>
            </div>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-on-surface-variant">
              By continuing you acknowledge our Terms of Service, Privacy Policy, and that you meet
              the legal age requirement in your jurisdiction.
            </p>

            <div className="mt-6 flex items-start justify-center gap-8 sm:gap-12">
              <TrustItem icon="lock" label="SSL" />
              <TrustItem icon="visibility_off" label="Private" />
              <TrustItem icon="shield" label="GDPR" />
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-surface-container-high bg-surface-container-low px-4 py-4 lg:py-5">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 text-[10px] uppercase tracking-wide text-on-surface-variant sm:flex-row sm:text-xs">
          <span>© {new Date().getFullYear()} NuttyFans. Adults only (18+).</span>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#" className="hover:text-on-surface">
              Terms of Service
            </a>
            <a href="#" className="hover:text-on-surface">
              Compliance
            </a>
            <a href="#" className="hover:text-on-surface">
              Content guidelines
            </a>
            <a href="#" className="hover:text-on-surface">
              Cookie policy
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
