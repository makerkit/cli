import { VARIANT_REPO_MAP } from '@/src/utils/upstream';
import type { Variant } from '@/src/utils/workspace';

export interface VariantInfo {
  id: Variant;
  name: string;
  description: string;
  repo: string;
  tech: string[];
  database: string;
  auth: string;
  status: 'stable' | 'beta' | 'deprecated';
}

export const VARIANT_CATALOG: VariantInfo[] = [
  {
    id: 'next-supabase',
    name: 'Next.js + Supabase',
    description: 'Full-stack SaaS kit with Next.js App Router and Supabase',
    repo: VARIANT_REPO_MAP['next-supabase'],
    tech: ['Next.js', 'Supabase', 'Tailwind CSS', 'shadcn/ui'],
    database: 'PostgreSQL (Supabase)',
    auth: 'Supabase Auth',
    status: 'stable',
  },
  {
    id: 'next-drizzle',
    name: 'Next.js + Drizzle',
    description: 'Full-stack SaaS kit with Next.js and Drizzle ORM',
    repo: VARIANT_REPO_MAP['next-drizzle'],
    tech: ['Next.js', 'Drizzle', 'Tailwind CSS', 'shadcn/ui'],
    database: 'PostgreSQL',
    auth: 'Better Auth',
    status: 'stable',
  },
  {
    id: 'next-prisma',
    name: 'Next.js + Prisma',
    description: 'Full-stack SaaS kit with Next.js and Prisma ORM',
    repo: VARIANT_REPO_MAP['next-prisma'],
    tech: ['Next.js', 'Prisma', 'Tailwind CSS', 'shadcn/ui'],
    database: 'PostgreSQL',
    auth: 'Better Auth',
    status: 'stable',
  },
  {
    id: 'react-router-supabase',
    name: 'React Router + Supabase',
    description: 'Full-stack SaaS kit with React Router and Supabase',
    repo: VARIANT_REPO_MAP['react-router-supabase'],
    tech: ['React Router', 'Supabase', 'Tailwind CSS', 'shadcn/ui'],
    database: 'PostgreSQL (Supabase)',
    auth: 'Supabase Auth',
    status: 'stable',
  },
];

export interface ListVariantsResult {
  variants: VariantInfo[];
}

export function listVariants(): ListVariantsResult {
  return { variants: VARIANT_CATALOG };
}
