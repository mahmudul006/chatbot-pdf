'use client';

import { useEffect } from 'react';

import { useRouter } from 'src/routes/hooks';

import { PATH_AFTER_LOGIN } from 'src/config-global';

// ----------------------------------------------------------------------

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return null;
}
