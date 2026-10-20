'use client';

import { Component, type ReactNode } from 'react';
import { ErrorState } from './states';

interface State {
  error: Error | null;
}

/** Catches render errors in a subtree so one broken widget does not take down the page. */
export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.error)
      return this.props.fallback ?? <ErrorState message="This section failed to load." onRetry={() => this.setState({ error: null })} testId="error-boundary" />;
    return this.props.children;
  }
}
