import React from 'react';
import { motion } from 'motion/react';
import { GeointData } from '../types/osint';
import { MapPin, Camera, ExternalLink, Sun, Navigation, Compass } from 'lucide-react';

interface GeointViewProps {
  geoint: GeointData;
}

export const GeointView: React.FC<GeointViewProps> = ({ geoint }) => {
  const hasGps = geoint.latitude !== null && geoint.longitude !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            Geospatial Intelligence & Metadata Analysis (GEOINT)
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>EXIF IFD0 & GPS Tags Parsing</span>
            <span aria-hidden="true">·</span>
            <span>OpenStreetMap Reverse Geocoding</span>
            <span aria-hidden="true">·</span>
            <span>SunCalc Solar Azimuth Mapping</span>
          </div>
        </div>

        {hasGps && (
          <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded font-mono text-xs flex items-center gap-1.5 tabular-nums">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{geoint.latitude}, {geoint.longitude}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Details + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Metadata & Photo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="space-y-4"
        >
          
          {/* Photo Preview with HUD overlay */}
          {geoint.image_preview_url && (
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center group">
              <img
                src={geoint.image_preview_url}
                alt="Analyzed target imagery"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none"></div>
              
              {/* HUD Coordinates Bar */}
              {hasGps && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-cyan-300 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded border border-cyan-500/30">
                  <span>LAT: {geoint.latitude} | LON: {geoint.longitude}</span>
                  <span>ALT: {geoint.altitude ? `${geoint.altitude}m` : 'SEA LEVEL'}</span>
                </div>
              )}
            </div>
          )}

          {/* Hardware & Environmental Data */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              Hardware & Capture Telemetry
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Device Make / Model:</span>
                <div className="text-white font-mono mt-0.5">
                  {geoint.camera_make || geoint.camera_model
                    ? `${geoint.camera_make || ''} ${geoint.camera_model || ''}`.trim()
                    : 'Unspecified Sensor'}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Capture Timestamp:</span>
                <div className="text-white font-mono mt-0.5">
                  {geoint.datetime_original || 'Metadata Stripped'}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Software / Processing:</span>
                <div className="text-white font-mono mt-0.5">
                  {geoint.software || 'Raw Hardware Pipeline'}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Calculated Altitude:</span>
                <div className="text-white font-mono mt-0.5">
                  {geoint.altitude !== null ? `${geoint.altitude} meters` : 'Elevation unavailable'}
                </div>
              </div>
            </div>

            {/* Resolved Physical Address */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-slate-500 text-xs">Nominatim Resolved Address:</span>
              <div className="text-cyan-300 text-xs font-medium mt-1 break-words">
                {geoint.address || (hasGps ? 'Querying OpenStreetMap reverse index...' : 'No GPS coordinates found in file header')}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Embedded Map & Satellite Portals */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="space-y-4"
        >
          {hasGps ? (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-72 relative">
              <iframe
                title="OSM Location Map"
                className="w-full h-full border-0 filter invert contrast-125"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${geoint.longitude! - 0.01}%2C${geoint.latitude! - 0.01}%2C${geoint.longitude! + 0.01}%2C${geoint.latitude! + 0.01}&layer=mapnik&marker=${geoint.latitude}%2C${geoint.longitude}`}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 h-72 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <MapPin className="w-8 h-8 text-slate-700 mb-2" />
              <p className="text-xs">No GPS tags present in uploaded file.</p>
              <p className="text-[11px] text-slate-600 mt-1">Try one of the test presets in the search console (e.g., Eiffel Tower or Tokyo Skytree).</p>
            </div>
          )}

          {/* External Recon Mapping Portals */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              External Geolocation & Orbital Satellite Portals
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href={geoint.google_maps_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2.5 rounded border transition-colors flex items-center justify-between ${
                  hasGps
                    ? 'bg-slate-900 hover:bg-slate-850 text-white border-slate-800 hover:border-cyan-400'
                    : 'bg-slate-950 text-slate-600 border-slate-900 pointer-events-none'
                }`}
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href={geoint.osm_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2.5 rounded border transition-colors flex items-center justify-between ${
                  hasGps
                    ? 'bg-slate-900 hover:bg-slate-850 text-white border-slate-800 hover:border-cyan-400'
                    : 'bg-slate-950 text-slate-600 border-slate-900 pointer-events-none'
                }`}
              >
                <span>OpenStreetMap</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href={geoint.yandex_maps_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2.5 rounded border transition-colors flex items-center justify-between ${
                  hasGps
                    ? 'bg-slate-900 hover:bg-slate-850 text-white border-slate-800 hover:border-cyan-400'
                    : 'bg-slate-950 text-slate-600 border-slate-900 pointer-events-none'
                }`}
              >
                <span>Yandex Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href={geoint.suncalc_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2.5 rounded border transition-colors flex items-center justify-between ${
                  hasGps
                    ? 'bg-slate-900 hover:bg-slate-850 text-white border-slate-800 hover:border-yellow-400'
                    : 'bg-slate-950 text-slate-600 border-slate-900 pointer-events-none'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-yellow-400" />
                  SunCalc (Shadows)
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href={geoint.sentinel_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`col-span-2 p-2.5 rounded border transition-colors flex items-center justify-between ${
                  hasGps
                    ? 'bg-slate-900 hover:bg-slate-850 text-white border-slate-800 hover:border-cyan-400'
                    : 'bg-slate-950 text-slate-600 border-slate-900 pointer-events-none'
                }`}
              >
                <span>Sentinel Hub EO Browser (Multispectral Satellite Imagery)</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};
