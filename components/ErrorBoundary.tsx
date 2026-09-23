import React, { Component, type ComponentType, type ErrorInfo, type PropsWithChildren } from "react";
import { ErrorFallback, type ErrorFallbackProps } from "@/components/ErrorFallback";

export type ErrorBoundaryProps = PropsWithChildren<{
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, stackTrace: string) => void;
}>;

type ErrorBoundaryState = { error: Error | null };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info.componentStack ?? "");
  }

  resetError = () => {
    this.setState({ error: null });
  };

  render() {
    const FallbackComponent = this.props.FallbackComponent ?? ErrorFallback;
    return this.state.error
      ? <FallbackComponent error={this.state.error} resetError={this.resetError} />
      : this.props.children;
  }
}