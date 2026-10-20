import { config } from './config';
import { errors } from './api';

/** Guards test-only endpoints: only reachable when NEXT_PUBLIC_TEST_MODE=true. */
export function requireTestMode() {
  if (!config.testMode) throw errors.notFound();
}
