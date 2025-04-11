import React from 'react';
import * as Sentry from "@sentry/react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null 
    };
  }

  // Static method to derive state from an error
  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      error 
    };
  }

  // Lifecycle method to catch errors
  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    Sentry.captureException(error, { 
      extra: errorInfo 
    });

    // Log to console for local debugging
    console.error("Uncaught error:", error, errorInfo);

    // Update component state with error details
    this.setState({ 
      error,
      errorInfo 
    });
  }

  // Error recovery method
  resetErrorBoundary = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null 
    });
  }

  render() {
    // If an error has occurred, render fallback UI
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          textAlign: 'center'
        }}>
          <h1>Oops! Something went wrong.</h1>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            margin: '20px 0',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2>Error Details</h2>
            <p><strong>Error:</strong> {this.state.error.toString()}</p>
            
            {/* Show technical details in development */}
            {process.env.NODE_ENV === 'development' && (
              <details 
                style={{ 
                  marginTop: '15px', 
                  backgroundColor: '#f4f4f4', 
                  padding: '10px', 
                  borderRadius: '4px' 
                }}
              >
                <summary>Technical Stacktrace</summary>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  fontSize: '0.8rem'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Reload Page
            </button>

            <button 
              onClick={this.resetErrorBoundary}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Try Again
            </button>
          </div>

          <div style={{ 
            marginTop: '20px', 
            fontSize: '0.9rem', 
            color: '#6c757d' 
          }}>
            <p>If the problem persists, please contact support.</p>
            <p>Error reported and logged for investigation.</p>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

// Higher-order component to wrap components with error boundary
export const withErrorBoundary = (WrappedComponent, fallbackComponent) => {
  return Sentry.withErrorBoundary(WrappedComponent, {
    fallback: fallbackComponent || ErrorBoundary,
    onError(error, errorInfo) {
      // Optional: custom error logging
      Sentry.captureException(error, { extra: errorInfo });
    }
  });
};

export default ErrorBoundary;