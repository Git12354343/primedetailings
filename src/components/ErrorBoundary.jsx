import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
          <div style={{ maxWidth:'400px', width:'100%', textAlign:'center' }}>
            <div style={{ width:'64px', height:'64px', background:'rgba(239,68,68,0.12)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <AlertTriangle style={{ width:'32px', height:'32px', color:'#ef4444' }} />
            </div>
            <h1 style={{ color:'#fff', fontSize:'22px', fontWeight:900, marginBottom:'12px' }}>Something went wrong</h1>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'14px', marginBottom:'24px' }}>
              Please try refreshing the page or go back to the homepage.
            </p>
            <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
              <button onClick={() => this.setState({ hasError:false, error:null })}
                style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', background:'linear-gradient(135deg,#c9a84c,#f5d376)', color:'#0a0a0a', borderRadius:'12px', border:'none', fontWeight:700, cursor:'pointer', fontSize:'14px' }}>
                <RefreshCw style={{ width:'16px', height:'16px' }} /> Try Again
              </button>
              <button onClick={() => window.location.href = '/'}
                style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', background:'rgba(255,255,255,0.07)', color:'#fff', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.1)', fontWeight:600, cursor:'pointer', fontSize:'14px' }}>
                <Home style={{ width:'16px', height:'16px' }} /> Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const withErrorBoundary = (Component) => (props) => (
  <ErrorBoundary><Component {...props} /></ErrorBoundary>
);

export default ErrorBoundary;
