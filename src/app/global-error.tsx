'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <button className="mt-4 rounded bg-primary px-4 py-2 text-white" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
