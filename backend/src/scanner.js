const { exec } = require('child_process');
const xml2js = require('xml2js');

/**
 * Build the nmap command based on scan type.
 */
function buildNmapCommand(target, scanType) {
  const base = `nmap -oX -`;

  switch (scanType) {
    case 'ping':
      // Host discovery only — no port scan
      return `${base} -sn ${target}`;
    case 'quick':
      // Fast scan of top 100 ports
      return `${base} -T4 -F ${target}`;
    case 'full':
      // All ports + OS + version detection
      return `${base} -T4 -p- -sV ${target}`;
    default:
      return `${base} -T4 -F ${target}`;
  }
}

/**
 * Run an nmap scan against target and return parsed host data.
 * Returns a Promise that resolves to an array of host objects.
 */
function runNmapScan(target, scanType = 'quick') {
  return new Promise((resolve, reject) => {
    const command = buildNmapCommand(target, scanType);
    console.log(`[scanner] Running: ${command}`);

    exec(command, { timeout: 5 * 60 * 1000 }, (error, stdout, stderr) => {
      if (error) {
        // nmap exits with non-zero on some networks — check if we got output anyway
        if (!stdout || stdout.trim() === '') {
          return reject(new Error(`nmap failed: ${error.message}\n${stderr}`));
        }
      }

      xml2js.parseString(stdout, { explicitArray: false }, (parseError, result) => {
        if (parseError) {
          return reject(new Error(`XML parse error: ${parseError.message}`));
        }

        try {
          const hosts = parseNmapResult(result);
          resolve(hosts);
        } catch (e) {
          reject(new Error(`Result parsing error: ${e.message}`));
        }
      });
    });
  });
}

/**
 * Parse nmap XML result object into a flat array of host descriptors.
 */
function parseNmapResult(result) {
  const nmaprun = result?.nmaprun;
  if (!nmaprun) return [];

  let rawHosts = nmaprun.host;
  if (!rawHosts) return [];

  // xml2js returns an object (not array) when there's only one host
  if (!Array.isArray(rawHosts)) rawHosts = [rawHosts];

  return rawHosts.map((h) => {
    // IP address
    let ipAddress = '';
    let hostname = null;
    const addresses = Array.isArray(h.address) ? h.address : h.address ? [h.address] : [];
    for (const addr of addresses) {
      if (addr?.$?.addrtype === 'ipv4' || addr?.$?.addrtype === 'ipv6') {
        ipAddress = addr.$.addr;
      }
    }

    // Hostname
    const hostnames = h.hostnames?.hostname;
    if (hostnames) {
      const arr = Array.isArray(hostnames) ? hostnames : [hostnames];
      const found = arr.find((hn) => hn?.$?.name);
      if (found) hostname = found.$.name;
    }

    // Host status
    const status = h.status?.$?.state ?? 'unknown';

    // OS guess
    let osGuess = null;
    const osmatch = h.os?.osmatch;
    if (osmatch) {
      const arr = Array.isArray(osmatch) ? osmatch : [osmatch];
      osGuess = arr[0]?.$?.name ?? null;
    }

    // Ports
    const ports = [];
    let rawPorts = h.ports?.port;
    if (rawPorts) {
      if (!Array.isArray(rawPorts)) rawPorts = [rawPorts];
      for (const p of rawPorts) {
        if (!p?.$) continue;
        ports.push({
          port: parseInt(p.$.portid, 10),
          protocol: p.$.protocol ?? 'tcp',
          state: p.state?.$?.state ?? 'unknown',
          service: p.service?.$?.name ?? null,
          version: p.service?.$?.version
            ? `${p.service.$.product ?? ''} ${p.service.$.version ?? ''}`.trim()
            : null,
        });
      }
    }

    return { ipAddress, hostname, status, osGuess, ports };
  });
}

module.exports = { runNmapScan };
