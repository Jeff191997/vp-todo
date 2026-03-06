'use client';

import { SIDEBAR_REFRESH } from '@/lib/events';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

type Filters = { label: string; href: string; count?: number };

type StatusCounts = { PENDING: number; IN_PROGRESS: number; COMPLETED: number };

type CategoryCounts = { name: string; count: number };

const navClass = (active: boolean) =>
  [
    'w-full rounded-lg px-3 py-2 text-sm transition flex items-center justify-between',
    active ? 'bg-blue-100 font-medium' : 'hover:bg-muted',
  ].join(' ');

const Sidebar = () => {
  const sp = useSearchParams();
  const status = sp.get('status');
  const category = sp.get('category');
  const view = sp.get('view');
  const { data: session } = useSession();

  const isDashboard = !status && !category && !view;

  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    PENDING: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
  });
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch('/api/sidebar', { cache: 'no-store' });

      if (!res.ok) return;

      const data = await res.json();

      if (cancelled) return;

      setTotal(data.total ?? 0);
      setStatusCounts(
        data.statusCounts ?? { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 },
      );
      setCategoryCounts(data.categoryCounts ?? []);
    }

    load();
    const handler = () => load();
    window.addEventListener(SIDEBAR_REFRESH, handler);

    return () => {
      cancelled = true;
      window.removeEventListener(SIDEBAR_REFRESH, handler);
    };
  }, []);

  const filters: Filters[] = [
    { label: 'All Tasks', href: '/?view=tasks', count: total },
    { label: 'Pending', href: '/?status=PENDING', count: statusCounts.PENDING },
    {
      label: 'In Progress',
      href: '/?status=IN_PROGRESS',
      count: statusCounts.IN_PROGRESS,
    },
    {
      label: 'Completed',
      href: '/?status=COMPLETED',
      count: statusCounts.COMPLETED,
    },
  ];

  return (
    <div className="h-dvh sticky top-0 p-4 flex flex-col gap-4">
      {/* Brand */}
      <div className="text-lg font-semibold">VP TODO</div>

      {/* Profile placeholder  */}
      <div className="rounded-xl border border-border/60 p-3 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {session?.user?.image ?
            <img src={session.user.image} className="h-10 w-10 rounded-full" />
          : <div className="h-10 w-10 rounded-full bg-muted"></div>}

          <div className="min-w-0">
            <div className="text-sm font-medium truncate">
              {session?.user?.name ?? 'Guest'}
            </div>

            <div className="text-xs text-muted-foreground truncate">
              {session?.user?.email ?? 'Sign in to sync tasks'}
            </div>
          </div>
        </div>

        {!session && (
          <Button size="sm" onClick={() => signIn('github')}>
            Sign in with GitHub
          </Button>
        )}

        {session && (
          <Button size="sm" variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        )}
      </div>

      <Separator />

      {/* Overview */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:bg-muted transition">
          Overview
        </div>
        <div className="space-y-1">
          <Link
            href="/"
            className={[
              'w-full text-left rounded-lg px-3 py-2 text-sm transition',
              isDashboard ? 'bg-blue-100 font-medium' : 'hover:bg-muted',
            ].join(' ')}
          >
            Dashboard
          </Link>
        </div>
      </div>

      <Separator />

      {/* Filters */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Filters
        </div>
        <div className="space-y-1">
          {filters.map((filter) => {
            const url = new URL(filter.href, 'http://dummy'); // parse safely
            const filterStatus = url.searchParams.get('status');
            const filterView = url.searchParams.get('view');

            const active =
              (filterStatus && filterStatus === status) ||
              (filterView && filterView === view) ||
              (filter.href === '/' && isDashboard);

            return (
              <Link
                href={filter.href}
                key={filter.label}
                className={navClass(active)}
              >
                <span>{filter.label}</span>
                <Badge variant={active ? 'default' : 'secondary'}>
                  {filter.count}
                </Badge>
              </Link>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Categories
        </div>
        <div className="space-y-1">
          {categoryCounts.map((c) => {
            const active = category === c.name;

            return (
              <Link
                href={`/?category=${encodeURIComponent(c.name)}`}
                key={c.name}
                className={navClass(active)}
              >
                <span>{c.name}</span>
                <Badge variant={active ? 'default' : 'secondary'}>
                  {c.count}
                </Badge>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
