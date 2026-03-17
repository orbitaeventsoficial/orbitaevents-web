'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TestimonialForm from '@/app/components/reviews/TestimonialForm';

function ValoracioContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? null;
  const ref = searchParams?.get('ref') ?? null;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <TestimonialForm token={token} bookingRef={ref} />
      </div>
    </div>
  );
}

export default function ValoracioClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ValoracioContent />
    </Suspense>
  );
}
