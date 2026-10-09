import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getCoordinates } from './geoCoordinates';

export interface ProjectData {
  id: string | number;
  work_category: string;
  state: string;
  constituency: string;
  risk_category: 'Critical' | 'High' | 'Medium' | 'Low';
  work_status: string;
  risk_score: number;
  cost_deviation_pct: number;
}

interface GeoMonitoringProps {
  onNavigate: (page: string, data?: any) => void;
}

const RISK_COLORS = {
  Critical: '#DC2626',
  High: '#EA580C',
  Medium: '#D97706',
  Low: '#15803D',
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
    padding: '24px',
    color: '#1B3A6B'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#0F172A',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#64748B'
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1px solid #E2E5EA',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  filterGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #E2E5EA',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  filterButtonActive: {
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    borderColor: '#CBD5E1',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  legend: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    fontSize: '13px',
    color: '#64748B',
    flexWrap: 'wrap'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  legendColor: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '24px'
  },
  mapContainer: {
    height: '520px',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #E2E5EA',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'
  },
  sidePanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #E2E5EA',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  cardTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: '#0F172A'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94A3B8',
    fontSize: '20px',
    padding: 0,
    lineHeight: 1
  },
  emptyState: {
    color: '#94A3B8',
    fontSize: '14px',
    textAlign: 'center',
    padding: '32px 0'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    fontSize: '14px'
  },
  detailLabel: {
    color: '#64748B'
  },
  detailValue: {
    fontWeight: 500,
    color: '#0F172A',
    textAlign: 'right'
  },
  buttonPrimary: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#2563EB',
    color: '#FFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '16px',
    transition: 'background-color 0.2s'
  },
  stateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #F1F5F9'
  },
  stateName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#334155'
  },
  stateCount: {
    fontSize: '13px',
    color: '#64748B'
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    marginLeft: '8px'
  }
};

const getBadgeStyle = (risk: string) => {
  let bgColor = '#F1F5F9';
  let color = '#475569';
  if (risk === 'High') {
    bgColor = '#FEE2E2';
    color = '#DC2626';
  } else if (risk === 'Medium') {
    bgColor = '#FEF3C7';
    color = '#D97706';
  } else if (risk === 'Low') {
    bgColor = '#DCFCE7';
    color = '#15803D';
  }
  return { ...styles.badge, backgroundColor: bgColor, color };
};

export const GeoMonitoring: React.FC<GeoMonitoringProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [filter, setFilter] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low'>('All');
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        } else if (data?.data && Array.isArray(data.data)) {
          setProjects(data.data);
        } else {
          throw new Error('Invalid format');
        }
      })
      .catch(() => {
        setProjects([
          { id: '1', work_category: 'Road Construction', state: 'Maharashtra', constituency: 'Mumbai South', risk_category: 'High', work_status: 'Delayed', risk_score: 75, cost_deviation_pct: 12 },
          { id: '2', work_category: 'Water Supply', state: 'Karnataka', constituency: 'Bangalore South', risk_category: 'Medium', work_status: 'On Track', risk_score: 45, cost_deviation_pct: 2 },
          { id: '3', work_category: 'Hospital Upgradation', state: 'Uttar Pradesh', constituency: 'Lucknow', risk_category: 'Critical', work_status: 'Stalled', risk_score: 92, cost_deviation_pct: 25 },
          { id: '4', work_category: 'School Building', state: 'Kerala', constituency: 'Wayanad', risk_category: 'Low', work_status: 'Completed', risk_score: 10, cost_deviation_pct: -5 },
          { id: '5', work_category: 'Bridge Repair', state: 'Assam', constituency: 'Guwahati', risk_category: 'Critical', work_status: 'Delayed', risk_score: 88, cost_deviation_pct: 18 },
          { id: '6', work_category: 'Solar Power Plant', state: 'Gujarat', constituency: 'Ahmedabad East', risk_category: 'High', work_status: 'In Progress', risk_score: 65, cost_deviation_pct: 8 },
          { id: '7', work_category: 'Community Hall', state: 'Punjab', constituency: 'Amritsar', risk_category: 'Low', work_status: 'On Track', risk_score: 20, cost_deviation_pct: 0 },
          { id: '8', work_category: 'Dam Reinforcement', state: 'Uttarakhand', constituency: 'Tehri Garhwal', risk_category: 'Critical', work_status: 'Stalled', risk_score: 95, cost_deviation_pct: 30 },
          { id: '9', work_category: 'Metro Phase II', state: 'Maharashtra', constituency: 'Pune', risk_category: 'High', work_status: 'Delayed', risk_score: 70, cost_deviation_pct: 15 },
          { id: '10', work_category: 'Sewage Treatment', state: 'Tamil Nadu', constituency: 'Chennai Central', risk_category: 'Medium', work_status: 'In Progress', risk_score: 55, cost_deviation_pct: 5 },
          { id: '11', work_category: 'Road Expansion', state: 'Uttar Pradesh', constituency: 'Varanasi', risk_category: 'High', work_status: 'Delayed', risk_score: 78, cost_deviation_pct: 14 },
          { id: '12', work_category: 'Public Park', state: 'Delhi', constituency: 'New Delhi', risk_category: 'Low', work_status: 'Completed', risk_score: 15, cost_deviation_pct: 1 },
          { id: '13', work_category: 'Irrigation Canal', state: 'Bihar', constituency: 'Patna Sahib', risk_category: 'Medium', work_status: 'In Progress', risk_score: 40, cost_deviation_pct: 3 },
          { id: '14', work_category: 'IT Park Infrastructure', state: 'Telangana', constituency: 'Hyderabad', risk_category: 'High', work_status: 'Delayed', risk_score: 68, cost_deviation_pct: 10 },
          { id: '15', work_category: 'Airport Upgradation', state: 'West Bengal', constituency: 'Kolkata Dakshin', risk_category: 'Critical', work_status: 'Stalled', risk_score: 85, cost_deviation_pct: 22 }
        ]);
      });
  }, []);

  const markers = useMemo(() => {
    return projects
      .filter((p) => filter === 'All' || p.risk_category === filter)
      .map((p) => {
        const [lat, lng] = getCoordinates(p.state, p.constituency);
        return { ...p, lat, lng };
      });
  }, [projects, filter]);

  const topStates = useMemo(() => {
    const stateMap = new Map<string, { total: number; highRisk: number }>();
    projects.forEach((p) => {
      const state = p.state || 'Unknown';
      const existing = stateMap.get(state) || { total: 0, highRisk: 0 };
      existing.total += 1;
      if (p.risk_category === 'High' || p.risk_category === 'Critical') {
        existing.highRisk += 1;
      }
      stateMap.set(state, existing);
    });

    return Array.from(stateMap.entries())
      .map(([name, stats]) => ({
        name,
        total: stats.total,
        overallRisk: stats.highRisk > 10 ? 'High' : stats.highRisk > 0 ? 'Medium' : 'Low'
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [projects]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Geo-Spatial Project Monitoring</h1>
        <p style={styles.subtitle}>Interactive risk visualization of projects across India</p>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map(f => (
            <button
              key={f}
              style={{
                ...styles.filterButton,
                ...(filter === f ? styles.filterButtonActive : {})
              }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={styles.legend}>
          {Object.entries(RISK_COLORS).map(([risk, color]) => (
            <div key={risk} style={styles.legendItem}>
              <div style={{ ...styles.legendColor, backgroundColor: color }} />
              <span>{risk}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.mapContainer}>
          <MapContainer 
            center={[20.5937, 78.9629]} 
            zoom={5} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            />
            {markers.map((p) => {
              const isSelected = selectedProject?.id === p.id;
              // Add type assertion to assure TS that color is valid
              const color = RISK_COLORS[p.risk_category as keyof typeof RISK_COLORS];
              return (
                <CircleMarker
                  key={p.id}
                  center={[p.lat, p.lng]}
                  radius={isSelected ? 10 : 6}
                  pathOptions={{
                    color: isSelected ? '#000000' : color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    weight: isSelected ? 3 : 1,
                  }}
                  eventHandlers={{
                    click: () => setSelectedProject(p)
                  }}
                >
                  <Tooltip>
                    <strong>{p.work_category}</strong><br />
                    {p.constituency}, {p.state}<br />
                    Risk: {p.risk_category}
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <div style={styles.sidePanel}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Selected Project</h3>
              {selectedProject && (
                <button 
                  style={styles.closeButton} 
                  onClick={() => setSelectedProject(null)}
                  title="Close"
                >
                  &times;
                </button>
              )}
            </div>
            
            {!selectedProject ? (
              <div style={styles.emptyState}>
                Click a map marker to view project details
              </div>
            ) : (
              <div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>ID</span>
                  <span style={styles.detailValue}>#{selectedProject.id}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Work Category</span>
                  <span style={styles.detailValue}>{selectedProject.work_category}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Location</span>
                  <span style={styles.detailValue}>{selectedProject.constituency}, {selectedProject.state}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Status</span>
                  <span style={styles.detailValue}>{selectedProject.work_status}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>AI Risk Score</span>
                  <span style={styles.detailValue}>{selectedProject.risk_score}/100</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Risk Level</span>
                  <span style={{ 
                    ...styles.detailValue, 
                    color: RISK_COLORS[selectedProject.risk_category as keyof typeof RISK_COLORS] 
                  }}>
                    {selectedProject.risk_category}
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Cost Variance</span>
                  <span style={{ 
                    ...styles.detailValue,
                    color: selectedProject.cost_deviation_pct > 0 ? '#DC2626' : '#15803D'
                  }}>
                    {selectedProject.cost_deviation_pct > 0 ? '+' : ''}{selectedProject.cost_deviation_pct}%
                  </span>
                </div>
                <button 
                  style={styles.buttonPrimary}
                  onClick={() => onNavigate('project-detail', selectedProject)}
                >
                  Full Analysis
                </button>
              </div>
            )}
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Top Active States</h3>
            <div>
              {topStates.map((state) => (
                <div key={state.name} style={styles.stateRow}>
                  <div>
                    <span style={styles.stateName}>{state.name}</span>
                    <span style={styles.stateCount}> ({state.total})</span>
                  </div>
                  <span style={getBadgeStyle(state.overallRisk)}>
                    {state.overallRisk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoMonitoring;
