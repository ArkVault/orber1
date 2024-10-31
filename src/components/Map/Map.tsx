import React from 'react';
import { MapContainer, TileLayer, ZoomControl, WMSTileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Menu, Calendar, MapPin, Activity, ChevronLeft, ChevronRight, Search, Bell } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { DrawControl } from './DrawControl';

// Fix Leaflet default marker icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Add this CSS near the top of your file, after the other imports
import './leaflet-draw-override.css';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  center?: [number, number];
  zoom?: number;
}

const WMS_URL = 'https://sh.dataspace.copernicus.eu/ogc/wms/fd8fbb51-cfdf-460d-9839-6dc55ee39ffa';

const indicators = [
  { 
    name: 'Natural Color',
    color: 'from-blue-500 to-green-500',
    description: 'Natural satellite imagery showing Earth as it appears to the human eye.'
  },
  { 
    name: 'Chlorophyll-a', 
    color: 'from-green-500 to-red-500',
    layer: 'CHLA',
    description: 'Measures the concentration of chlorophyll-a in water bodies, indicating phytoplankton presence.',
    unit: 'mg/m³'
  },
  { 
    name: 'Dissolved Oxygen', 
    color: 'from-red-500 to-green-500',
    layer: 'DISSOLVED-OXYGEN',
    description: 'Shows oxygen levels in water, crucial for aquatic life support.',
    unit: 'mg/L'
  },
  { 
    name: 'Total Suspended Solids', 
    color: 'from-yellow-400 to-purple-600',
    layer: 'TOTAL-SUSPENDED-SOLIDS',
    description: 'Indicates the amount of particles suspended in water, affecting water quality.',
    unit: 'mg/L'
  },
  { 
    name: 'Turbidity', 
    color: 'from-yellow-800 to-purple-900',
    layer: 'TURBIDITY',
    description: 'Measures water clarity and the presence of suspended particles.',
    unit: 'NTU'
  },
  { 
    name: 'Forest Fires', 
    type: 'discrete',
    indicators: [
      { color: 'bg-red-600', label: 'Active Fires' },
      { color: 'bg-yellow-500', label: 'Burned Areas' }
    ],
    layer: 'INCENDIOS-FORESTALES',
    description: 'Monitors active forest fires and recently burned areas.'
  }
];

export function Map({ center = [20.2833, -103.2000], zoom = 11 }: MapProps) {
  const [isPanelVisible, setIsPanelVisible] = React.useState(true);
  const [selectedIndicator, setSelectedIndicator] = React.useState<any>(indicators[0]);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showSensorMenu, setShowSensorMenu] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [wmsLayer, setWmsLayer] = React.useState<any>(null);

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.date-picker-container') && !target.closest('.date-button')) {
      setShowDatePicker(false);
    }
    if (!target.closest('.sensor-menu-container') && !target.closest('.sensor-button')) {
      setShowSensorMenu(false);
    }
  };

  const handleSaveKML = (kml: string) => {
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'area-selection.kml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleIndicatorSelect = (indicator: any) => {
    setSelectedIndicator(indicator);
    if (indicator.layer) {
      setWmsLayer({
        url: WMS_URL,
        params: {
          layers: indicator.layer,
          format: 'image/png',
          transparent: true,
          version: '1.3.0'
        }
      });
    } else {
      setWmsLayer(null);
    }
  };

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="h-screen w-full relative">
      <nav className="absolute top-0 left-0 right-0 z-[1000] bg-black bg-opacity-80 text-white p-4 flex justify-between items-center rounded-b-2xl">
        <div className="w-32 h-16">
          <img 
            src="https://imgur.com/kxmc2AE.png" 
            alt="Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center space-x-4 mx-auto relative">
          <button 
            className={`flex items-center px-4 py-2 rounded-xl ${
              isDrawing ? 'bg-blue-500 text-white' : 'hover:bg-white hover:bg-opacity-20'
            }`}
            onClick={() => setIsDrawing(!isDrawing)}
          >
            <MapPin className="mr-2" /> {isDrawing ? 'Drawing Mode' : 'Select Area'}
          </button>
          <button 
            className="date-button flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-20 rounded-xl"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <Calendar className="mr-2" /> Dates
          </button>
          <button 
            className="sensor-button flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-20 rounded-xl"
            onClick={() => setShowSensorMenu(!showSensorMenu)}
          >
            <Activity className="mr-2" /> Sensors
          </button>
          <button className="flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-20 rounded-xl">
            <Menu className="mr-2" /> Dashboard
          </button>

          {showDatePicker && (
            <div className="date-picker-container absolute top-full mt-2 bg-black bg-opacity-90 rounded-xl p-4 shadow-lg" style={{ left: '50%', transform: 'translateX(-50%)' }}>
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                defaultMonth={new Date()}
                className="bg-transparent text-white"
                modifiersStyles={{
                  selected: {
                    backgroundColor: '#a16207'
                  }
                }}
                showOutsideDays
                fixedWeeks
              />
            </div>
          )}

          {showSensorMenu && (
            <div className="sensor-menu-container absolute top-full mt-2 bg-black bg-opacity-90 rounded-xl p-2 shadow-lg" style={{ left: '50%', transform: 'translateX(-50%)' }}>
              <div className="flex flex-col gap-2">
                <button className="px-4 py-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
                  Sentinel
                </button>
                <button className="px-4 py-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
                  Planetscope
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Search className="text-gray-300 cursor-pointer hover:text-white" />
          <Bell className="text-gray-300 cursor-pointer hover:text-white" />
          <div className="flex items-center space-x-2">
            <span>User</span>
            <div className="w-10 h-10 rounded-full bg-gray-700"></div>
          </div>
        </div>
      </nav>

      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        />
        {wmsLayer && (
          <WMSTileLayer
            url={wmsLayer.url}
            layers={wmsLayer.params.layers}
            format={wmsLayer.params.format}
            transparent={wmsLayer.params.transparent}
            version={wmsLayer.params.version}
          />
        )}
        <ZoomControl position="bottomright" />
        <DrawControl 
          position="bottomright"
          isDrawing={isDrawing}
          onSave={handleSaveKML}
          onDrawingComplete={() => setIsDrawing(false)}
        />
      </MapContainer>

      <div 
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-[1000] bg-black bg-opacity-80 text-white p-4 transition-all duration-300 ease-in-out rounded-r-3xl ${
          isPanelVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 'fit-content', maxWidth: '300px' }}
      >
        <h2 className="text-xl font-bold mb-6">Indicators</h2>
        <div className="space-y-4">
          {indicators.map((indicator) => (
            <button 
              key={indicator.name}
              className={`w-full px-4 py-2 text-left text-white rounded-xl transition-colors ${
                selectedIndicator?.name === indicator.name 
                  ? 'bg-yellow-700'
                  : 'bg-white bg-opacity-10 hover:bg-opacity-20'
              }`}
              onClick={() => handleIndicatorSelect(indicator)}
            >
              {indicator.name}
            </button>
          ))}
        </div>
        <button
          className="absolute -right-12 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-80 text-white p-2 rounded-r-xl transition-all duration-300 ease-in-out"
          onClick={() => setIsPanelVisible(!isPanelVisible)}
          aria-label={isPanelVisible ? "Hide panel" : "Show panel"}
        >
          {isPanelVisible ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>

      {selectedIndicator && isPanelVisible && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-[1000] bg-black bg-opacity-80 text-white p-4 rounded-l-3xl" style={{ width: '300px' }}>
          <h3 className="text-lg font-semibold mb-4">{selectedIndicator.name}</h3>
          <div className="flex items-center mb-4">
            {selectedIndicator.type === 'discrete' ? (
              <div className="flex flex-col gap-4 mr-4">
                {selectedIndicator.indicators.map((ind, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg ${ind.color}`}></div>
                    <span className="text-sm">{ind.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-8 h-32 rounded-full overflow-hidden mr-4">
                <div className={`w-full h-full bg-gradient-to-t ${selectedIndicator.color}`}></div>
              </div>
            )}
            <p className="flex-1">
              {selectedIndicator.description}
            </p>
          </div>
          {selectedIndicator.layer && !selectedIndicator.type && (
            <div className="text-sm">
              <p className="mb-2">High {selectedIndicator.unit && `(${selectedIndicator.unit})`}</p>
              <p className="mb-2">Medium</p>
              <p>Low {selectedIndicator.unit && `(${selectedIndicator.unit})`}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}