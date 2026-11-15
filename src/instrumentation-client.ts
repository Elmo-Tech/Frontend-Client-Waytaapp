import { reportClientError } from './lib/utils/client-errors';
window.addEventListener('error', (event) =>
  reportClientError(event.error, 'error'),
);
window.addEventListener('unhandledrejection', (event) =>
  reportClientError(event.reason, 'unhandledrejection'),
);
