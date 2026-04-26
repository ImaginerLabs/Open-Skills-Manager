import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Warning, ArrowClockwise, House, Link } from '@phosphor-icons/react';
import { Button } from '../../ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Log error via errorService
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <Warning size={48} weight="fill" className="error-boundary__icon" />
            <h1 className="error-boundary__title">Something went wrong</h1>
            <p className="error-boundary__message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.error && (
              <pre className="error-boundary__stack">{this.state.error.stack}</pre>
            )}
            <div className="error-boundary__actions">
              <Button variant="primary" onClick={this.handleRetry} iconOnly={false}>
                <ArrowClockwise size={16} />
                Retry
              </Button>
              <Button variant="secondary" onClick={this.handleGoHome}>
                <House size={16} />
                Go to Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.open('https://github.com/anthropics/claude-code/issues', '_blank')}
              >
                <Link size={16} />
                Report Issue
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
