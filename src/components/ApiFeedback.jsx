import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";

export function ApiError({ error, onRetry }) {
  if (!error) return null;
  return (
    <div style={{ 
      padding: '12px 16px', 
      backgroundColor: 'var(--status-danger)', 
      color: 'white', 
      borderRadius: 'var(--radius-md)', 
      marginBottom: 'var(--space-md)', 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '12px',
      fontSize: '0.95rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={18} />
        <span style={{ fontWeight: 500 }}>{error}</span>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry} 
          type="button"
          style={{ 
            background: 'rgba(255,255,255,0.2)', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer', 
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500,
            transition: 'background 0.2s',
            fontFamily: 'inherit'
          }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}

export function ApiLoading({ message = "Loading..." }) {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px', 
      color: 'var(--text-muted)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }}>
      <style>
        {`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .api-spinner {
            animation: spin-slow 2s linear infinite;
            opacity: 0.5;
          }
        `}
      </style>
      <Loader2 size={32} className="api-spinner" />
      <span>{message}</span>
    </div>
  );
}
