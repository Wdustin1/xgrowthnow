const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Calculate projections
app.post('/api/project', (req, res) => {
  const { handle, dataPoints } = req.body;

  // dataPoints: array of { month: 'Jan 2025', followers: 12345 }
  // sorted oldest to newest
  if (!dataPoints || dataPoints.length < 1) {
    return res.status(400).json({ error: 'At least one data point required' });
  }

  const sorted = [...dataPoints].sort((a, b) => new Date(a.month) - new Date(b.month));
  const current = sorted[sorted.length - 1].followers;

  let avgMonthlyGrowth;

  if (sorted.length >= 2) {
    // Calculate average monthly growth from historical data
    const growthRates = [];
    for (let i = 1; i < sorted.length; i++) {
      growthRates.push(sorted[i].followers - sorted[i - 1].followers);
    }
    avgMonthlyGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  } else {
    // Only current count — use 2% monthly as baseline estimate
    avgMonthlyGrowth = Math.round(current * 0.02);
  }

  // Rates
  const bearRate = avgMonthlyGrowth * 0.25;   // 25% — significant slowdown
  const baseRate = avgMonthlyGrowth * 1.0;    // 100% — status quo
  const bullRate = avgMonthlyGrowth * 2.5;    // 250% — strong momentum

  // Project 12 months
  const now = new Date(sorted[sorted.length - 1].month);
  const labels = [];
  const bearProj = [];
  const baseProj = [];
  const bullProj = [];

  for (let i = 1; i <= 12; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + i);
    labels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
    bearProj.push(Math.max(0, Math.round(current + bearRate * i)));
    baseProj.push(Math.max(0, Math.round(current + baseRate * i)));
    bullProj.push(Math.max(0, Math.round(current + bullRate * i)));
  }

  // Historical labels
  const histLabels = sorted.map(d => {
    const date = new Date(d.month);
    return date.toLocaleString('default', { month: 'short', year: '2-digit' });
  });
  const histData = sorted.map(d => d.followers);

  res.json({
    handle,
    current,
    avgMonthlyGrowth: Math.round(avgMonthlyGrowth),
    rates: {
      bear: Math.round(bearRate),
      base: Math.round(baseRate),
      bull: Math.round(bullRate),
    },
    projections: {
      labels,
      bear: bearProj,
      base: baseProj,
      bull: bullProj,
    },
    history: {
      labels: histLabels,
      data: histData,
    },
    summary: {
      bear6mo: bearProj[5],
      bear12mo: bearProj[11],
      base6mo: baseProj[5],
      base12mo: baseProj[11],
      bull6mo: bullProj[5],
      bull12mo: bullProj[11],
    }
  });
});

app.listen(PORT, () => {
  console.log(`X Pilot running on http://localhost:${PORT}`);
});
