export type ClientErrorSource = 'boundary' | 'error' | 'unhandledrejection';

/** Only diagnostic metadata: never transmit error messages, URLs, form values or session data. */
export function clientErrorMetadata(error: unknown, source: ClientErrorSource) {
  const digest =
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof error.digest === 'string'
      ? error.digest.slice(0, 128)
      : undefined;
  return {
    source,
    name: error instanceof Error ? error.name : 'UnknownError',
    ...(digest ? { digest } : {}),
  };
}

export function reportClientError(error: unknown, source: ClientErrorSource) {
  const detail = clientErrorMetadata(error, source);
  console.error('[Wayta client error]', detail);
  window.dispatchEvent(new CustomEvent('wayta:client-error', { detail }));
}
