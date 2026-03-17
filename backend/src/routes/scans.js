const { PrismaClient } = require('@prisma/client');
const { runNmapScan } = require('../scanner');
const { v4: uuidv4 } = require('uuid');
const express = require('express');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/scans — start a new scan
router.post('/', async (req, res) => {
  const { target, scanType = 'quick' } = req.body;

  if (!target) {
    return res.status(400).json({ error: 'target is required (e.g. 192.168.1.1 or 192.168.1.0/24)' });
  }

  // Create the job record in DB
  let job;
  try {
    job = await prisma.scanJob.create({
      data: {
        target,
        scanType,
        status: 'running',
      },
    });
  } catch (dbErr) {
    console.error('[scans] DB create error:', dbErr);
    return res.status(500).json({ error: 'Failed to create scan job' });
  }

  // Run nmap asynchronously; respond immediately with the job so frontend can poll
  runNmapScan(target, scanType)
    .then(async (hosts) => {
      // Persist hosts and ports
      for (const h of hosts) {
        const hostRecord = await prisma.host.create({
          data: {
            scanJobId: job.id,
            ipAddress: h.ipAddress,
            hostname: h.hostname,
            status: h.status,
            osGuess: h.osGuess,
          },
        });

        if (h.ports && h.ports.length > 0) {
          await prisma.openPort.createMany({
            data: h.ports.map((p) => ({
              hostId: hostRecord.id,
              port: p.port,
              protocol: p.protocol,
              state: p.state,
              service: p.service,
              version: p.version,
            })),
          });
        }
      }

      await prisma.scanJob.update({
        where: { id: job.id },
        data: { status: 'completed', completedAt: new Date() },
      });

      console.log(`[scans] Job ${job.id} completed — ${hosts.length} hosts found`);
    })
    .catch(async (err) => {
      console.error(`[scans] Job ${job.id} failed:`, err.message);
      await prisma.scanJob.update({
        where: { id: job.id },
        data: { status: 'failed', errorMessage: err.message, completedAt: new Date() },
      });
    });

  // Return job immediately (client will poll for results)
  return res.status(202).json({ jobId: job.id, status: 'running', target, scanType });
});

// GET /api/scans — list all scan jobs (summary)
router.get('/', async (req, res) => {
  try {
    const jobs = await prisma.scanJob.findMany({
      orderBy: { startedAt: 'desc' },
      include: {
        _count: { select: { hosts: true } },
      },
    });
    return res.json(jobs);
  } catch (err) {
    console.error('[scans] list error:', err);
    return res.status(500).json({ error: 'Failed to fetch scan jobs' });
  }
});

// GET /api/scans/:id — get full scan result with hosts + ports
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const job = await prisma.scanJob.findUnique({
      where: { id },
      include: {
        hosts: {
          include: { openPorts: { orderBy: { port: 'asc' } } },
          orderBy: { ipAddress: 'asc' },
        },
      },
    });

    if (!job) return res.status(404).json({ error: 'Scan job not found' });
    return res.json(job);
  } catch (err) {
    console.error('[scans] get error:', err);
    return res.status(500).json({ error: 'Failed to fetch scan job' });
  }
});

// DELETE /api/scans/:id — delete a scan job and its data
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.scanJob.delete({ where: { id } });
    return res.json({ message: 'Scan job deleted' });
  } catch (err) {
    console.error('[scans] delete error:', err);
    return res.status(500).json({ error: 'Failed to delete scan job' });
  }
});

module.exports = router;
