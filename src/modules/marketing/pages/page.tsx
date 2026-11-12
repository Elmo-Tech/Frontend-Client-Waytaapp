import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getStaffLocale } from '../../../lib/i18n/server';
import { Landing } from '../components/landing/Landing';
import { LANDING_COPY } from '../components/landing/copy';
import { getLandingPlans } from '../components/landing/plans-api';
import { THEME_COOKIE } from '../components/landing/theme';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getStaffLocale();
  const { title, description } = LANDING_COPY[locale].meta;
  return {
    title,
    description,
    alternates: { canonical: 'https://waytaapp.com/' },
    openGraph: {
      title, description, type: 'website', locale: locale === 'ar' ? 'ar_EG' : 'en_US',
      siteName: 'Wayta', url: 'https://waytaapp.com/',
      images: [{ url: 'https://waytaapp.com/share-card', width: 1200, height: 630, alt: 'Wayta' }],
    },
    twitter: {
      card: 'summary_large_image', title, description,
      images: ['https://waytaapp.com/share-card'],
    },
  };
}

/** The public landing page (DEC-053). Restaurant staff sign in from `/staff`. */
export default async function Home() {
  const [locale, plans, cookieStore] = await Promise.all([getStaffLocale(), getLandingPlans(), cookies()]);
  const saved = cookieStore.get(THEME_COOKIE)?.value;
  return <Landing locale={locale} plans={plans} theme={saved === 'light' || saved === 'dark' ? saved : null} />;
}
