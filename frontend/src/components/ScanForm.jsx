import { useState } from 'react';
import { startScan } from '../api/client';

const SCAN_TYPES = [
  { value: 'ping', label: 'Ping Sweep', desc: 'Host discovery only — fastest' },
  { value: 'quick', label: 'Quick Scan', desc: 'Top 100 ports, fast (-T4 -F)' },
  { value: 'full', label: 'Full Scan', desc: 'All ports + service versions' },
];

export default function ScanForm({ onScanStarted }) {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('quick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!target.trim()) {
      setError('Please enter a target IP or range');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const job = await startScan(target.trim(), scanType);
      onScanStarted(job);
      setTarget('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-cyber-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-100">New Network Scan</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Target
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="192.168.1.1 or 192.168.1.0/24 or scanme.nmap.org"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={loading}
          />
          <p className="mt-1.5 text-xs text-gray-600">
            Single IP, CIDR range, or hostname
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Scan Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SCAN_TYPES.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setScanType(st.value)}
                className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                  scanType === st.value
                    ? 'border-cyber-500/60 bg-cyber-500/10 text-gray-100'
                    : 'border-gray-700/50 bg-gray-900/40 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{st.label}</div>
                <div className="text-xs mt-0.5 opacity-70">{st.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <button type="submit" className="cyber-btn w-full flex items-center justify-center gap-2" disabled={loading}>
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Starting Scan…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Launch Scan
            </>
          )}
        </button>
      </form>
    </div>
  );
}
