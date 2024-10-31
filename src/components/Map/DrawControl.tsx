import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

interface DrawControlProps {
  isDrawing: boolean;
  onSave: (kml: string) => void;
  onDrawingComplete: () => void;
}

export function DrawControl({ isDrawing, onSave, onDrawingComplete }: DrawControlProps) {
  const map = useMap();

  useEffect(() => {
    // Initialize draw controls
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: isDrawing,
        polyline: false,
        circle: false,
        rectangle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: drawnItems,
      },
    });

    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e: any) => {
      drawnItems.addLayer(e.layer);
      onDrawingComplete();
      // Here you would typically convert to KML
      // For now, just passing a placeholder
      onSave('<kml>Placeholder KML content</kml>');
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, isDrawing, onSave, onDrawingComplete]);

  return null;
}