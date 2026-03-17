import { useState } from 'react';
import ScanForm from './components/ScanForm';
import ScanResults from './components/ScanResults';
import ScanHistory from './components/ScanHistory';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [currentJob, setCurrentJob] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const handleScanStarted = (job) => {
    setCurrentJob(job);
    setActiveTab('results');
    // Trigger history refresh so it appears immediately
    setHistoryRefreshKey((k) => k + 1);
  };

  const handleSelectHistory = (job) => {
    setCurrentJob(job);
    setActiveTab('results');
  };

  return (
    <div className="min-h-screen">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(26,181,125,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(26,181,125,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo icon */}
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-cyber-500/20 border border-cyber-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-cyber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyber-400 rounded-full animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-gray-100 tracking-tight">Trillisent</span>
              <span className="text-gray-600 text-xs ml-2">Network Discovery</span>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1">
            {[
              { id: 'scan', label: 'Scanner' },
              { id: 'results', label: 'Results', disabled: !currentJob },
              { id: 'history', label: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`px-3.5 py-1.5 text-sm rounded-lg font-medium transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-cyber-500/15 text-cyber-400 border border-cyber-500/25'
                    : tab.disabled
                      ? 'text-gray-700 cursor-not-allowed'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative">
        {activeTab === 'scan' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            <div>
              <ScanForm onScanStarted={handleScanStarted} />
            </div>

            <div className="space-y-6">
              {/* Tips card */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Target Examples
                </h3>
                <div className="space-y-2">
                  {[
                    ['Single host', '192.168.1.1'],
                    ['CIDR subnet', '192.168.1.0/24'],
                    ['IP range', '192.168.1.1-50'],
                    ['Public test host', 'scanme.nmap.org'],
                  ].map(([label, value]) => (
                    <div key={value} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{label}</span>
                      <code className="text-xs font-mono text-cyber-400/80 bg-gray-900/60 px-2 py-0.5 rounded">{value}</code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scan type info */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Nmap Commands Used
                </h3>
                <div className="space-y-2">
                  {[
                    ['Ping', 'nmap -sn <target>'],
                    ['Quick', 'nmap -T4 -F <target>'],
                    ['Full', 'nmap -T4 -p- -sV <target>'],
                  ].map(([type, cmd]) => (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-10">{type}</span>
                      <code className="text-xs font-mono text-gray-400 bg-gray-900/60 px-2 py-0.5 rounded">{cmd}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && currentJob && (
          <ScanResults key={currentJob.id} initialJob={currentJob} />
        )}

        {activeTab === 'history' && (
          <ScanHistory
            refreshKey={historyRefreshKey}
            onSelect={handleSelectHistory}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-800/40 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-gray-700">
          <span>Trillisent · Nmap Network Discovery</span>
        </div>
      </footer>
    </div>
  );
}
