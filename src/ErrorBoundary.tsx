import * as React from 'react'
import { ReactNode } from "react";

interface ErrorBoundaryState {hasError: boolean}
interface ErrorBoundaryProps {fallback: ReactNode, children: ReactNode[]}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}