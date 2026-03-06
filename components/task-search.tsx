'use client';

import { Input } from '@/components/ui/input';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

export function TaskSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';

  // local input state
  const [text, setText] = useState(urlQ);

  // track whether the user is currently typing
  const isTypingRef = useRef(false);

  // ✅ If URL changes from outside (sidebar/back), update input
  useEffect(() => {
    if (!isTypingRef.current && urlQ !== text) {
      setText(urlQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ]);

  const debounced = useDebouncedValue(text, 300);

  // ✅ Update URL from input (debounced)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    const nextQ = debounced.trim();
    if (nextQ) params.set('q', nextQ);
    else params.delete('q');

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();

    // avoid unnecessary navigation (causes re-renders)
    if (nextQuery !== currentQuery) {
      router.replace(`${pathname}${nextQuery ? `?${nextQuery}` : ''}`, {
        scroll: false,
      });
    }

    // typing “session” ends once we've applied debounced value
    isTypingRef.current = false;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, pathname]);

  return (
    <Input
      placeholder="Search tasks..."
      value={text}
      onChange={(e) => {
        isTypingRef.current = true;
        setText(e.target.value);
      }}
    />
  );
}
