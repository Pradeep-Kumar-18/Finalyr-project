import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Calendar, Zap } from 'lucide-react';
import BackButton from './BackButton';
import '../styles/HealthTracker.css';

const healthData = [
  { month: 'Jul', hb: 13.2, date: '2025-07-15' },
  { month: 'Aug', hb: 13.5, date: '2025-08-12' },
  { month: 'Sep', hb: 13.1, date: '2025-09-20' },
  { month: 'Oct', hb: 13.8, date: '2025-10-05' },
  { month: 'Nov', hb: 14.0, date: '2025-11-18' },
  { month: 'Dec', hb: 13.6, date: '2025-12-10' },
  { month: 'Jan', hb: 14.1, date: '2026-01-14' },
  { month: 'Feb', hb: 14.0, date: '2026-02-22' },
  { month: 'Mar', hb: 14.2, date: '2026-03-22' },
];

const forecastData = [
  { month: 'Apr', hb: 14.3 },
  { month: 'May', hb: 14.4 },
  { month: 'Jun', hb: 14.5 },
];

const HealthTracker = ({ onBack }) => {
  const [showForecast, setShowForecast] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const allData = showForecast ? [...healthData, ...forecastData] : healthData;
  const maxHb = 16;
  const minHb = 10;
  const chartWidth = 800;
  const chartHeight = 250;

  const getY = (hb) => chartHeight - ((hb - minHb) / (maxHb - minHb)) * chartHeight;
  const getX = (i) => (i / (allData.length - 1)) * chartWidth;

  // Build SVG path
  const linePath = healthData.map((d, i) => {
    const x = getX(i);
    const y = getY(d.hb);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const forecastPath = [healthData[healthData.length - 1], ...forecastData].map((d, i) => {
    const x = getX(healthData.length - 1 + i);
    const y = getY(d.hb);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const trend = healthData[healthData.length - 1].hb - healthData[healthData.length - 2].hb;

  return (
    <div className="health-tracker-view">
      <BackButton onClick={onBack} />
      
      <div className="tracker-header slide-down-fade">
        <h2>Health Timeline</h2>
        <p>Longitudinal hemoglobin tracking with AI-powered forecasting</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="card-label">Latest Hb</span>
          <div className="card-value-row">
            <span className="card-big-value">14.2</span>
            <span className="card-unit">g/dL</span>
          </div>
        </div>
        <div className="summary-card">
          <span className="card-label">Trend</span>
          <div className="card-value-row">
            <TrendingUp size={24} className="trend-up" />
            <span className="card-big-value text-green">+0.2</span>
          </div>
        </div>
        <div className="summary-card">
          <span className="card-label">Total Scans</span>
          <div className="card-value-row">
            <Calendar size={20} className="icon-cyan" />
            <span className="card-big-value">24</span>
          </div>
        </div>
        <div className="summary-card">
          <span className="card-label">Health Status</span>
          <div className="card-value-row">
            <span className="status-pill-tracker normal">Normal</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container glass-card-tracker">
        <div className="chart-top-bar">
          <h4>Hemoglobin Levels Over Time</h4>
          <button className={`forecast-btn ${showForecast ? 'active' : ''}`} onClick={() => setShowForecast(!showForecast)}>
            <Zap size={16} /> {showForecast ? 'Hide Forecast' : 'AI Forecast'}
          </button>
        </div>

        <div className="chart-area">
          {/* Y-axis Labels */}
          <div className="y-axis">
            {[16, 14, 12, 10].map(v => <span key={v}>{v}</span>)}
          </div>

          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg" preserveAspectRatio="none">
            {/* Grid Lines */}
            {[10, 12, 14, 16].map(v => (
              <line key={v} x1="0" y1={getY(v)} x2={chartWidth} y2={getY(v)} className="grid-line" />
            ))}

            {/* Normal range band (12-17.5) */}
            <rect x="0" y={getY(17.5)} width={chartWidth} height={getY(12) - getY(17.5)} className="normal-band" />

            {/* Actual data line */}
            <path d={linePath} className="data-line" fill="none" />

            {/* Gradient area under line */}
            <path d={`${linePath} L ${getX(healthData.length - 1)} ${chartHeight} L 0 ${chartHeight} Z`} className="data-area" />

            {/* Forecast line */}
            {showForecast && <path d={forecastPath} className="forecast-line" fill="none" />}

            {/* Data points */}
            {healthData.map((d, i) => (
              <circle
                key={i}
                cx={getX(i)}
                cy={getY(d.hb)}
                r="6"
                className="data-point"
                onMouseEnter={() => setHoveredPoint({ ...d, x: getX(i), y: getY(d.hb) })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}

            {/* Forecast points */}
            {showForecast && forecastData.map((d, i) => (
              <circle
                key={`f-${i}`}
                cx={getX(healthData.length + i)}
                cy={getY(d.hb)}
                r="5"
                className="forecast-point"
              />
            ))}
          </svg>

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div className="chart-tooltip" style={{ left: `${(hoveredPoint.x / chartWidth) * 100}%`, top: `${(hoveredPoint.y / chartHeight) * 100 - 15}%` }}>
              <strong>{hoveredPoint.hb} g/dL</strong>
              <span>{hoveredPoint.month} — {hoveredPoint.date}</span>
            </div>
          )}
        </div>

        {/* X-axis Labels */}
        <div className="x-axis">
          {allData.map((d, i) => (
            <span key={i} className={i >= healthData.length ? 'forecast-label' : ''}>{d.month}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthTracker;
