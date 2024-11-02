import React from 'react';
import { MapContainer, TileLayer, ZoomControl, WMSTileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Menu, Calendar, MapPin, Activity, ChevronLeft, ChevronRight, Search, Bell, X } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { DrawControl } from './DrawControl';

// Fix Leaflet default marker icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Add this CSS near the top of your file, after the other imports
import './leaflet-draw-override.css';

// Add these to your imports at the top
import { 
  Droplets, // for Chlorophyll
  Wind, // for Dissolved Oxygen
  Container, // for Total Suspended Solids
  Waves, // for Turbidity
  Flame, // for Forest Fires
  Eye // for Natural Color
} from 'lucide-react';

// Add this import at the top
import './loader.css';

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
    type: 'natural',
    icon: Eye,
    description: 'Natural satellite imagery showing Earth as it appears to the human eye. This view helps identify surface features, vegetatNatural color satellite imagery utilizes a combination of visible red, green, and blue bands to create images that closely resemble how the human eye perceives the Earth. This method allows for the effective analysis of land cover, vegetation health, and urban development, providing critical insights into environmental changes and anthropogenic impactsion patterns, and water bodies in their true colors.',
    quote: '"Natural satellite imagery showing Earth as it appears to the human eye. This view helps identify surface features, vegetation patterns, and water bodies in their true colors'
  },
  { 
    name: 'Chlorophyll-a',
    icon: Droplets,
    color: 'from-green-500 to-red-500',
    layer: 'CHLA',
    description: 'Chlorophyll-a is the primary photosynthetic pigment found in all plants and algae. High concentrations in water bodies indicate algal blooms, which can affect water quality and ecosystem health. Regular monitoring helps identify potential eutrophication issues and assess the overall health of aquatic ecosystems.',
    unit: 'mg/m³',
    quote: 'Reference: Gitelson, A. A., et al. (2008). "A simple semi-analytical model for remote estimation of chlorophyll-a in turbid waters." Remote Sensing of Environment, 112(9), 3582-3593.'
  },
  { 
    name: 'Dissolved Oxygen',
    icon: Wind,
    color: 'from-red-500 to-green-500',
    layer: 'DISSOLVED-OXYGEN',
    description: 'Dissolved oxygen (DO) is essential for aquatic life and ecosystem health. Low DO levels can stress or kill fish and other organisms. Levels are affected by temperature, atmospheric pressure, biological activity, and water movement. Healthy water bodies typically maintain DO levels between 6-10 mg/L.',
    unit: 'mg/L',
    quote: 'Reference: Diaz, R. J., & Rosenberg, R. (2008). "Spreading dead zones and consequences for marine ecosystems." Science, 321(5891), 926-929.'
  },
  { 
    name: 'Total Suspended Solids',
    icon: Container,
    color: 'from-yellow-400 to-purple-600',
    layer: 'TOTAL-SUSPENDED-SOLIDS',
    description: 'Total Suspended Solids (TSS) measures particles suspended in water, including sediment, algae, and organic matter. High TSS levels can reduce water clarity, affect aquatic life, and indicate pollution or erosion. It\'s a key indicator of water quality and can impact ecosystem functioning and recreational water use.',
    unit: 'mg/L',
    quote: 'Reference: Ritchie, J. C., et al. (2003). "Remote sensing techniques to assess water quality." Photogrammetric Engineering & Remote Sensing, 69(6), 695-704.'
  },
  { 
    name: 'Turbidity',
    icon: Waves,
    color: 'from-yellow-800 to-purple-900',
    layer: 'TURBIDITY',
    description: 'Turbidity measures water clarity and how much light can penetrate through water. It\'s affected by suspended particles like clay, silt, organic matter, and microorganisms. High turbidity can harm aquatic life by reducing light penetration, increasing water temperature, and decreasing dissolved oxygen levels. It\'s also an important indicator for drinking water quality.',
    unit: 'NTU',
    quote: 'Reference: Kirk, J. T. O. (1994). "Light and photosynthesis in aquatic ecosystems." Cambridge University Press, 3rd Edition.'
  },
  { 
    name: 'Forest Fires',
    icon: Flame,
    type: 'discrete',
    indicators: [
      { color: 'bg-red-600', label: 'Active Fires' },
      { color: 'bg-yellow-500', label: 'Burned Areas' }
    ],
    layer: 'INCENDIOS-FORESTALES',
    description: 'Satellite-based monitoring of forest fires. Red indicators show currently active fires, while yellow areas represent recently burned zones. This information is crucial for emergency response and forest management.',
    quote: 'Reference: Giglio, L., et al. (2016). "Active fire detection and characterization with the MODIS sensor." Remote Sensing of Environment, 178, 31-41.'
  }
];

// Update the WMS_RANGES constant with more precise ranges
const WMS_RANGES = {
  'CHLA': {
    min: 0,
    mid: 5,
    max: 10,
    unit: 'mg/m³'
  },
  'DISSOLVED-OXYGEN': {
    min: 0,
    mid: 7,
    max: 14,
    unit: 'mg/L'
  },
  'TOTAL-SUSPENDED-SOLIDS': {
    min: 0,
    mid: 50,
    max: 100,
    unit: 'mg/L'
  },
  'TURBIDITY': {
    min: 0,
    mid: 25,
    max: 50,
    unit: 'NTU'
  }
};

// Add this function to fetch the actual ranges
const fetchWMSCapabilities = async () => {
  const url = `${WMS_URL}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`;
  try {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    // Parse the XML to get the ranges for each layer
    // You'll need to adapt this based on the actual XML structure
    console.log(xmlDoc);
  } catch (error) {
    console.error('Error fetching WMS capabilities:', error);
  }
};

export function Map({ center = [20.2700, -103.2000], zoom = 12 }: MapProps) {
  const [isPanelVisible, setIsPanelVisible] = React.useState(true);
  const [selectedIndicator, setSelectedIndicator] = React.useState<any>(indicators[0]);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showSensorMenu, setShowSensorMenu] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [selectedLayer, setSelectedLayer] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const mapRef = React.useRef<L.Map | null>(null);

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

  const handleIndicatorSelect = async (indicator: any) => {
    setIsLoading(true);
    setSelectedIndicator(indicator);
    
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (indicator.type !== 'natural') {
      setSelectedLayer(indicator.layer || '');
    } else {
      setSelectedLayer('');
    }
    setIsLoading(false);
  };

  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data.slice(0, 5));
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const handleLocationSelect = (result: SearchResult) => {
    if (mapRef.current) {
      mapRef.current.setView([parseFloat(result.lat), parseFloat(result.lon)], 12);
    }
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    fetchWMSCapabilities();
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
          <div className="relative">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="text-gray-300 cursor-pointer hover:text-white p-2 rounded-xl hover:bg-white hover:bg-opacity-20"
            >
              <Search className="w-5 h-5" />
            </button>
            
            {showSearch && (
              <div className="absolute right-0 mt-2 w-80 bg-black bg-opacity-90 rounded-xl shadow-lg p-4 z-50">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    placeholder="Search places..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {isSearching && (
                  <div className="text-center text-gray-400 py-2">
                    Searching...
                  </div>
                )}
                
                {!isSearching && searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelect(result)}
                        className="w-full text-left px-3 py-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors text-sm truncate"
                      >
                        {result.display_name}
                      </button>
                    ))}
                  </div>
                )}
                
                {!isSearching && searchQuery.length >= 3 && searchResults.length === 0 && (
                  <div className="text-center text-gray-400 py-2">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
          
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
        ref={mapRef}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        />
        {selectedLayer && selectedIndicator?.type !== 'natural' && (
          <WMSTileLayer
            key={selectedLayer}
            url={WMS_URL}
            layers={selectedLayer}
            format="image/png"
            transparent={true}
            version="1.3.0"
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
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-[1000] bg-black bg-opacity-80 text-white p-6 transition-all duration-300 ease-in-out rounded-r-3xl ${
          isPanelVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 'fit-content', maxWidth: '300px' }}
      >
        <h2 className="text-xl font-bold mb-8">Indicators</h2>
        <div className="space-y-6">
          {indicators.map((indicator) => {
            const Icon = indicator.icon;
            return (
              <button 
                key={indicator.name}
                className={`w-full px-6 py-3 text-left text-white rounded-xl transition-colors flex items-center gap-3 ${
                  selectedIndicator?.name === indicator.name 
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-white bg-opacity-10 hover:bg-opacity-20'
                }`}
                onClick={() => handleIndicatorSelect(indicator)}
              >
                <Icon className="w-5 h-5" />
                <span>{indicator.name}</span>
              </button>
            );
          })}
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
            ) : selectedIndicator.type === 'natural' ? (
              <p className="text-sm">
                {selectedIndicator.description}
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex flex-col justify-between text-xs text-right h-32">
                  {selectedIndicator.layer && WMS_RANGES[selectedIndicator.layer] ? (
                    <>
                      <span>{WMS_RANGES[selectedIndicator.layer].max}</span>
                      <span>{WMS_RANGES[selectedIndicator.layer].mid}</span>
                      <span>{WMS_RANGES[selectedIndicator.layer].min}</span>
                    </>
                  ) : (
                    <>
                      <span>100</span>
                      <span>50</span>
                      <span>0</span>
                    </>
                  )}
                </div>
                <div className="w-8 h-32 rounded-full overflow-hidden">
                  <div className={`w-full h-full bg-gradient-to-t ${selectedIndicator.color}`}></div>
                </div>
                {selectedIndicator.unit && (
                  <div className="text-xs ml-1 self-center">
                    {selectedIndicator.unit}
                  </div>
                )}
              </div>
            )}
            {selectedIndicator.type !== 'natural' && (
              <p className="flex-1 ml-4">
                {selectedIndicator.description}
              </p>
            )}
          </div>
          <p className="text-sm italic text-gray-300 border-l-2 border-gray-500 pl-3">
            {selectedIndicator.quote}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="loader">
            <div className="intern"></div>
            <div className="external-shadow">
              <div className="central"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}