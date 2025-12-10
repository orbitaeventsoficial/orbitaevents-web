'use client';

/**
 * ERROR BOUNDARY COMPONENT
 * Captura errors en components fills i mostra un fallback amigable
 */

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (_error: Error, _errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Cridar callback opcional per logging
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback personalitzat si es proporciona
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback per defecte
      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Alguna cosa ha anat malament
            </h3>
            <p className="text-text-muted text-sm mb-4">
              Ho sentim, ha ocorregut un error inesperat. Si us plau, recarrega la pàgina.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-oe-gold text-black font-semibold hover:bg-oe-gold-light transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tornar a intentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook per usar ErrorBoundary de forma declarativa
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
