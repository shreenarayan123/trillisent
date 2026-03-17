const API_BASE = '';

export async function startScan(target, scanType = 'quick') {
  const res = await fetch(`${API_BASE}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, scanType }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to start scan');
  }
  return res.json();
}

export async function listScans() {
  const res = await fetch(`${API_BASE}/api/scans`);
  if (!res.ok) throw new Error('Failed to fetch scans');
  return res.json();
}

export async function getScan(id) {
  const res = await fetch(`${API_BASE}/api/scans/${id}`);
  if (!res.ok) throw new Error('Failed to fetch scan');
  return res.json();
}

export async function deleteScan(id) {
  const res = await fetch(`${API_BASE}/api/scans/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete scan');
  return res.json();
}
