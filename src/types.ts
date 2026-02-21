export interface Panchayat {
  id: number;
  name: string;
  district: string;
  lat: number;
  lng: number;
  base_risk: number;
  latest_rainfall: number;
  latest_discharge: number;
}

export interface DistrictSummary {
  name: string;
  lat: number;
  lng: number;
  avg_rainfall: number;
  avg_discharge: number;
}

export interface RainfallRecord {
  id: number;
  panchayat_id: number;
  date: string;
  rainfall_mm: number;
  river_discharge: number;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export function getRiskLevel(rainfall: number, discharge: number): RiskLevel {
  const score = (rainfall / 150) * 0.6 + (discharge / 200) * 0.4;
  if (score > 0.7) return 'High';
  if (score > 0.4) return 'Medium';
  return 'Low';
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'High': return '#ef4444';
    case 'Medium': return '#f59e0b';
    case 'Low': return '#10b981';
  }
}
