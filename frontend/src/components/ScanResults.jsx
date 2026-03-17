import { useEffect, useState, useRef } from 'react';
import { getScan } from '../api/client';
import HostCard from './HostCard';

const STATUS_CONFIG = {
  pending:   { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', dot: 'bg-yellow-400', pulse: true },
  running:   { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',       dot: 'bg-blue-400',   pulse: true },
  completed: { color: 'text-cyber-400 bg-cyber-400/10 border-cyber-400/20',    dot: 'bg-cyber-400',  pulse: false },
  failed:    { color: 'text-red-400 bg-red-400/10 border-red-400/20',          dot: 'bg-red-400',    pulse: false },
};

// Normalize: POST returns { jobId, ... } but GET returns { id, ... }
function normalizeJob(j) {
  if (!j) return null;
  return { ...j, id: j.id || j.jobId };
}

export default function ScanResults({ initialJob }) {
  const [job, setJob] = useState(() => normalizeJob(initialJob));
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  // Poll while running/pending
  useEffect(() => {
    const normalized = normalizeJob(initialJob);
    if (!normalized?.id) return;
    setJob(normalized);

    const shouldPoll = normalized.status === 'running' || normalized.status === 'pending';
    if (!shouldPoll) {
      fetchFull(normalized.id);
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const updated = await getScan(normalized.id);
        setJob(updated);
        if (updated.status !== 'running' && updated.status !== 'pending') {
          clearInterval(pollRef.current);
        }
      } catch (e) {
        console.error(e);
      }
    }, 2500);

    return () => clearInterval(pollRef.current);
  }, [initialJob?.id || initialJob?.jobId]);

  async function fetchFull(id) {
    if (!id) return;
    setLoading(true);
    try {
      const full = await getScan(id);
      setJob(full);
    } finally {
      setLoading(false);
    }
  }


  if (!job) return null;

  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const isActive = job.status === 'running' || job.status === 'pending';
  const hosts = job.hosts ?? [];
  const upHosts = hosts.filter((h) => h.status === 'up');
  const totalPorts = hosts.reduce((sum, h) => sum + (h.openPorts?.filter(p => p.state === 'open').length ?? 0), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Job header */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-cyber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <div>
              <div className="font-mono text-gray-100 font-semibold">{job.target}</div>
              <div className="text-xs text-gray-500 mt-0.5 capitalize">{job.scanType} scan · {new Date(job.startedAt).toLocaleString()}</div>
            </div>
          </div>

          {/* Status badge */}
          <div className={`status-badge border ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
            {job.status.toUpperCase()}
          </div>
        </div>

        {/* Scanning animation */}
        {isActive && (
          <div className="mt-4">
            <div className="relative h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-500 to-transparent animate-[scanLine_2s_linear_infinite] w-1/3" />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Scanning in progress… this may take a minute</p>
          </div>
        )}

        {/* Error */}
        {job.status === 'failed' && job.errorMessage && (
          <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-red-400 text-sm font-mono">
            {job.errorMessage}
          </div>
        )}

        {/* Stats */}
        {job.status === 'completed' && !isActive && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Hosts Found', value: hosts.length },
              { label: 'Hosts Up', value: upHosts.length },
              { label: 'Open Ports', value: totalPorts },
            ].map((s) => (
              <div key={s.label} className="bg-gray-800/40 rounded-lg p-3 text-center">
                <div className="text-xl font-bold font-mono text-cyber-400">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Host cards */}
      {hosts.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Discovered Hosts
          </h3>
          <div className="grid gap-3">
            {hosts.map((h) => <HostCard key={h.id} host={h} />)}
          </div>
        </div>
      )}

      {job.status === 'completed' && hosts.length === 0 && (
        <div className="glass-card p-8 text-center text-gray-500">
          <svg className="w-10 h-10 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No hosts discovered. Try a different target or scan type.</p>
        </div>
      )}
    </div>
  );
}
