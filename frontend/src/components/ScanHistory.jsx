import { useState, useEffect, useCallback } from 'react';
import { listScans, deleteScan } from '../api/client';

const STATUS_CONFIG = {
  pending:   { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  running:   { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  completed: { color: 'text-cyber-400 bg-cyber-400/10 border-cyber-400/20' },
  failed:    { color: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

export default function ScanHistory({ onSelect, refreshKey }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = useCallback(async () => {
    try {
      const data = await listScans();
      setScans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [refreshKey, fetchScans]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this scan?')) return;
    try {
      await deleteScan(id);
      setScans((s) => s.filter((j) => j.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading scan history…
        </div>
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <svg className="w-10 h-10 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-500">No scans yet. Start one above!</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-800/60 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Scan History</h3>
        <span className="text-xs text-gray-600">{scans.length} job{scans.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="divide-y divide-gray-800/40">
        {scans.map((job) => {
          const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
          return (
            <div
              key={job.id}
              onClick={() => onSelect(job)}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-800/30 cursor-pointer transition-colors group"
            >
              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                job.status === 'completed' ? 'bg-cyber-400' :
                job.status === 'running'   ? 'bg-blue-400 animate-pulse' :
                job.status === 'failed'    ? 'bg-red-400' : 'bg-yellow-400'
              }`} />

              {/* Target */}
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-gray-200 truncate">{job.target}</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {new Date(job.startedAt).toLocaleString()} · <span className="capitalize">{job.scanType}</span>
                  {job._count?.hosts != null && <span> · {job._count.hosts} host{job._count.hosts !== 1 ? 's' : ''}</span>}
                </div>
              </div>

              {/* Status badge */}
              <span className={`status-badge border text-xs flex-shrink-0 ${cfg.color}`}>
                {job.status}
              </span>

              {/* Delete */}
              <button
                onClick={(e) => handleDelete(e, job.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
