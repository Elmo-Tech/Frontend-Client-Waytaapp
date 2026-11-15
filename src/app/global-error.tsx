'use client';
import { ErrorRecovery } from '../components/common/ErrorRecovery';
export default function GlobalError(props: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorRecovery {...props} />
      </body>
    </html>
  );
}
