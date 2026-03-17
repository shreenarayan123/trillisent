const SERVICE_COLORS = {
  http: 'text-blue-400 bg-blue-400/10',
  https: 'text-blue-300 bg-blue-300/10',
  ssh: 'text-yellow-400 bg-yellow-400/10',
  ftp: 'text-orange-400 bg-orange-400/10',
  smtp: 'text-purple-400 bg-purple-400/10',
  dns: 'text-cyan-400 bg-cyan-400/10',
  rdp: 'text-red-400 bg-red-400/10',
  mysql: 'text-emerald-400 bg-emerald-400/10',
  postgresql: 'text-sky-400 bg-sky-400/10',
};

function getServiceColor(service) {
  if (!service) return 'text-gray-400 bg-gray-400/10';
  const s = service.toLowerCase();
  return SERVICE_COLORS[s] || 'text-cyber-400 bg-cyber-400/10';
}

export default function HostCard({ host }) {
  const openPorts = host.openPorts?.filter((p) => p.state === 'open') ?? [];
  const allPorts = host.openPorts ?? [];

  return (
    <div className="glass-card p-5 animate-slide-up hover:border-gray-700/80 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${host.status === 'up' ? 'bg-cyber-400 shadow-md shadow-cyber-400/50' : 'bg-gray-600'}`} />
          <div>
            <div className="font-mono font-semibold text-gray-100 text-base">{host.ipAddress}</div>
            {host.hostname && (
              <div className="text-xs text-gray-500 mt-0.5">{host.hostname}</div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`status-badge ${host.status === 'up' ? 'bg-cyber-500/15 text-cyber-400 border border-cyber-500/20' : 'bg-gray-700/30 text-gray-500 border border-gray-700/20'}`}>
            {host.status?.toUpperCase()}
          </div>
          {openPorts.length > 0 && (
            <div className="text-xs text-gray-500 mt-1.5">{openPorts.length} open port{openPorts.length !== 1 ? 's' : ''}</div>
          )}
        </div>
      </div>

      {/* OS guess */}
      {host.osGuess && (
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {host.osGuess}
        </div>
      )}

      {/* Ports table */}
      {allPorts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-600 uppercase tracking-wider border-b border-gray-800/60">
                <th className="text-left pb-2 font-medium">Port</th>
                <th className="text-left pb-2 font-medium">Proto</th>
                <th className="text-left pb-2 font-medium">State</th>
                <th className="text-left pb-2 font-medium">Service</th>
                <th className="text-left pb-2 font-medium">Version</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {allPorts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/20 transition-colors">
                  <td className="py-2 font-mono font-semibold text-gray-200">{p.port}</td>
                  <td className="py-2 text-gray-500">{p.protocol}</td>
                  <td className="py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      p.state === 'open'
                        ? 'bg-cyber-500/15 text-cyber-400'
                        : p.state === 'filtered'
                        ? 'bg-yellow-500/15 text-yellow-400'
                        : 'bg-gray-700/40 text-gray-500'
                    }`}>
                      {p.state}
                    </span>
                  </td>
                  <td className="py-2">
                    {p.service ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs ${getServiceColor(p.service)}`}>
                        {p.service}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="py-2 text-gray-500 truncate max-w-[140px]">{p.version || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-xs text-gray-600 italic">No port data reported</div>
      )}
    </div>
  );
}
