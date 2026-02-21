import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Panchayat, DistrictSummary, getRiskLevel, getRiskColor } from '../types';

interface MapProps {
  panchayats: Panchayat[];
  districts: DistrictSummary[];
  selectedId?: number;
  selectedDistrict?: string;
  onSelect: (id: number) => void;
  onDistrictSelect: (name: string) => void;
}

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    map.invalidateSize();
  }, [center, zoom, map]);
  return null;
}

export default function KeralaMap({ panchayats, districts, selectedId, selectedDistrict, onSelect, onDistrictSelect }: MapProps) {
  const selectedPanchayat = panchayats.find(p => p.id === selectedId);
  const selectedDistrictData = districts.find(d => d.name === selectedDistrict);
  
  const center: [number, number] = selectedPanchayat 
    ? [selectedPanchayat.lat, selectedPanchayat.lng] 
    : selectedDistrictData 
      ? [selectedDistrictData.lat, selectedDistrictData.lng]
      : [10.3, 76.5];
      
  const zoom = selectedPanchayat ? 11 : selectedDistrict ? 10 : 7.5;

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[10.3, 76.5]}
        zoom={7.5}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; Google'
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        />
        <MapController center={center} zoom={zoom} />

        {!selectedDistrict ? (
          // Show District Markers initially
          districts.map((d) => (
            <CircleMarker
              key={d.name}
              center={[d.lat, d.lng]}
              radius={12}
              pathOptions={{
                fillColor: d.avg_rainfall > 100 ? '#ef4444' : '#10b981',
                fillOpacity: 0.5,
                color: '#fff',
                weight: 1.5,
              }}
              eventHandlers={{
                click: () => onDistrictSelect(d.name),
              }}
            >
              <Popup>
                <div className="font-sans text-xs">
                  <div className="font-bold border-b border-zinc-200 mb-1 pb-1 uppercase">{d.name}</div>
                  <div>Avg Rainfall: {d.avg_rainfall.toFixed(1)}mm</div>
                  <div className="mt-1 text-emerald-600 font-bold">Click to view details</div>
                </div>
              </Popup>
            </CircleMarker>
          ))
        ) : (
          // Show Panchayat Markers when district is selected
          panchayats.map((p) => {
            const risk = getRiskLevel(p.latest_rainfall, p.latest_discharge);
            const color = getRiskColor(risk);
            
            return (
              <CircleMarker
                key={p.id}
                center={[p.lat, p.lng]}
                radius={selectedId === p.id ? 10 : 6}
                pathOptions={{
                  fillColor: color,
                  color: selectedId === p.id ? '#fff' : color,
                  weight: selectedId === p.id ? 2 : 1,
                  fillOpacity: 0.8,
                }}
                eventHandlers={{
                  click: () => onSelect(p.id),
                }}
              >
                <Popup>
                  <div className="font-sans">
                    <h3 className="font-bold">{p.name}</h3>
                    <p className="text-[10px] uppercase opacity-50">{p.district} District</p>
                    <p className="text-sm mt-1">Risk: <span style={{ color }} className="font-bold">{risk}</span></p>
                    <p className="text-xs">Rain: {p.latest_rainfall.toFixed(1)}mm</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })
        )}
      </MapContainer>
    </div>
  );
}
