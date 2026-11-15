'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { reportClientError } from '../../lib/utils/client-errors';
const subscribe = () => () => {};
const language = () => document.documentElement.lang;
const serverLanguage = () => 'en';

/** Context independent: remains usable when the application providers fail. */
export function ErrorRecovery({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const ar = useSyncExternalStore(subscribe, language, serverLanguage) === 'ar';
  useEffect(() => {
    reportClientError(error, 'boundary');
  }, [error]);
  return (
    <main
      dir={ar ? 'rtl' : 'ltr'}
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-12 text-center"
    >
      <h1>{ar ? 'تعذّر عرض الصفحة' : 'This page could not be displayed'}</h1>
      <p role="alert">
        {ar
          ? 'حاول مرة أخرى. لو المشكلة مستمرة، أعد تحميل الصفحة.'
          : 'Try again. If the problem continues, reload the page.'}
      </p>
      <button
        type="button"
        onClick={retry}
        className="rounded-md border px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {ar ? 'حاول مرة أخرى' : 'Try again'}
      </button>
    </main>
  );
}
