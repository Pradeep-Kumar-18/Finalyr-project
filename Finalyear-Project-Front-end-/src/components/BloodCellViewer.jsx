import React, { useState } from 'react';
import { Microscope, Maximize2 } from 'lucide-react';
import BackButton from './BackButton';
import '../styles/BloodCellViewer.css';

const cellTypes = [
  { id: 1, type: 'Normocyte', status: 'normal', size: 80, x: 15, y: 20, delay: 0 },
  { id: 2, type: 'Normocyte', status: 'normal', size: 70, x: 45, y: 15, delay: 0.5 },
  { id: 3, type: 'Microcyte', status: 'warning', size: 50, x: 75, y: 25, delay: 1.0 },
  { id: 4, type: 'Normocyte', status: 'normal', size: 85, x: 25, y: 55, delay: 1.5 },
  { id: 5, type: 'Macrocyte', status: 'critical', size: 110, x: 60, y: 50, delay: 2.0 },
  { id: 6, type: 'Normocyte', status: 'normal', size: 75, x: 80, y: 60, delay: 0.3 },
  { id: 7, type: 'Normocyte', status: 'normal', size: 72, x: 35, y: 80, delay: 0.8 },
  { id: 8, type: 'Microcyte', status: 'warning', size: 55, x: 65, y: 78, delay: 1.3 },
  { id: 9, type: 'Normocyte', status: 'normal', size: 78, x: 10, y: 70, delay: 1.8 },
  { id: 10, type: 'Normocyte', status: 'normal', size: 82, x: 90, y: 40, delay: 0.7 },
  { id: 11, type: 'Normocyte', status: 'normal', size: 68, x: 50, y: 90, delay: 1.1 },
  { id: 12, type: 'Macrocyte', status: 'critical', size: 105, x: 20, y: 40, delay: 2.2 },
];

const BloodCellViewer = ({ onBack }) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  const normalCount = cellTypes.filter(c => c.status === 'normal').length;
  const microCount = cellTypes.filter(c => c.status === 'warning').length;
  const macroCount = cellTypes.filter(c => c.status === 'critical').length;
  const total = cellTypes.length;

  return (
    <div className="blood-cell-viewer">
      <BackButton onClick={onBack} />

      {/* Microscope Viewport Header */}
      <div className="viewer-header slide-down-fade">
        <h2>Blood Cell Morphology Viewer</h2>
        <p>CNN-detected erythrocyte classification and 3D structural analysis</p>
      </div>

      {/* Microscope Viewport */}
      <div className="microscope-viewport">
        <div className="viewport-border"></div>
        <div className="viewport-crosshair h"></div>
        <div className="viewport-crosshair v"></div>

        {cellTypes.map(cell => (
          <div
            key={cell.id}
            className={`rbc-cell ${cell.status}`}
            style={{
              left: `${cell.x}%`,
              top: `${cell.y}%`,
              width: `${cell.size}px`,
              height: `${cell.size}px`,
              animationDelay: `${cell.delay}s`
            }}
            onMouseEnter={() => setHoveredCell(cell)}
            onMouseLeave={() => setHoveredCell(null)}
          >
            <div className="cell-inner"></div>
            <div className="cell-highlight"></div>
          </div>
        ))}

        {/* Glassmorphic Tooltip */}
        {hoveredCell && (
          <div className="cell-tooltip" style={{ left: `${hoveredCell.x + 5}%`, top: `${hoveredCell.y - 5}%` }}>
            <Maximize2 size={14} />
            <strong>{hoveredCell.type}</strong>
            <span className={`tooltip-status ${hoveredCell.status}`}>
              {hoveredCell.status === 'normal' ? 'Normal' : hoveredCell.status === 'warning' ? 'Microcytic' : 'Macrocytic'}
            </span>
            <span className="tooltip-size">Ø {(hoveredCell.size / 10).toFixed(1)} μm</span>
          </div>
        )}
      </div>

      {/* Cell Population Density Bar */}
      <div className="population-density slide-up-fade" style={{ '--stagger-idx': 0 }}>
        <h4>Cell Population Distribution</h4>
        <div className="density-bar-container">
          <div className="density-segment normal-seg" style={{ width: `${(normalCount / total) * 100}%` }}>
            <span>Normocyte {Math.round((normalCount / total) * 100)}%</span>
          </div>
          <div className="density-segment warning-seg" style={{ width: `${(microCount / total) * 100}%` }}>
            <span>Micro {Math.round((microCount / total) * 100)}%</span>
          </div>
          <div className="density-segment critical-seg" style={{ width: `${(macroCount / total) * 100}%` }}>
            <span>Macro {Math.round((macroCount / total) * 100)}%</span>
          </div>
        </div>
        <div className="density-legend">
          <span className="legend-item"><span className="dot normal"></span> Normocyte (6-8 μm)</span>
          <span className="legend-item"><span className="dot warning"></span> Microcyte (&lt;6 μm)</span>
          <span className="legend-item"><span className="dot critical"></span> Macrocyte (&gt;8 μm)</span>
        </div>
      </div>
    </div>
  );
};

export default BloodCellViewer;
