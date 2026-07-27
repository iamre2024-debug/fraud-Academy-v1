import React from 'react';

const MAX_RESET_ATTEMPTS = 2;

const shellStyle = {
  minHeight: '100vh',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px 20px',
  backgroundColor: '#020716',
  color: '#f7fbff',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const cardStyle = {
  width: '100%',
  maxWidth: '560px',
  boxSizing: 'border-box',
  padding: '28px',
  borderRadius: '18px',
  border: '1px solid rgba(56, 189, 248, 0.32)',
  backgroundColor: 'rgba(8, 17, 40, 0.92)',
  boxShadow: '0 24px 60px rgba(2, 7, 22, 0.65)',
};

const headingStyle = {
  margin: '0 0 10px',
  fontSize: '1.25rem',
  lineHeight: 1.3,
  color: '#ff8bd5',
};

const bodyStyle = {
  margin: '0 0 18px',
  fontSize: '0.95rem',
  lineHeight: 1.6,
  color: 'rgba(247, 251, 255, 0.82)',
};

const detailStyle = {
  margin: '0 0 20px',
  fontSize: '0.8rem',
  lineHeight: 1.5,
  color: 'rgba(247, 251, 255, 0.6)',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  wordBreak: 'break-word',
};

const buttonStyle = {
  appearance: 'none',
  cursor: 'pointer',
  minHeight: '44px',
  padding: '11px 22px',
  borderRadius: '999px',
  border: '1px solid #38bdf8',
  backgroundColor: 'rgba(56, 189, 248, 0.14)',
  color: '#7de7ff',
  fontSize: '0.95rem',
  fontWeight: 700,
};

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetCount: 0 };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Fraud Academy render error', error, errorInfo?.componentStack ?? '');
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.error && this.state.error === null && this.state.resetCount !== 0) {
      this.setState({ resetCount: 0 });
    }
  }

  handleReset() {
    this.setState((state) => ({ error: null, resetCount: state.resetCount + 1 }));
  }

  render() {
    const { error, resetCount } = this.state;
    if (!error) return this.props.children ?? null;

    const retriesExhausted = resetCount >= MAX_RESET_ATTEMPTS;
    return (
      <div style={shellStyle} role="alert">
        <div style={cardStyle}>
          <h1 style={headingStyle}>This screen stopped responding</h1>
          <p style={bodyStyle}>
            Something in the workspace failed to render. Your saved case work remains in local
            storage and cloud recovery. {retriesExhausted
              ? 'Reload the page to start the screen from a clean state.'
              : 'Try again to rebuild the screen.'}
          </p>
          <p style={detailStyle}>{String(error?.message || error || 'Unknown error')}</p>
          <button
            type="button"
            style={buttonStyle}
            onClick={retriesExhausted ? () => window.location.reload() : this.handleReset}
          >
            {retriesExhausted ? 'Reload the page' : 'Try again'}
          </button>
        </div>
      </div>
    );
  }
}
