'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/chat');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Boltalka</h1>
        <p className="text-gray-600">AI-native chat application</p>
        <p className="text-sm text-gray-500 mt-4">Redirecting...</p>
      </div>
    </div>
  );
}
