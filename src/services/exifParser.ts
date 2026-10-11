import { GeointData } from '../types/osint';

export async function parseImageExif(file: File): Promise<GeointData> {
  const buffer = await file.arrayBuffer();
  const dataView = new DataView(buffer);

  const geoint: GeointData = {
    latitude: null,
    longitude: null,
    altitude: null,
    camera_make: null,
    camera_model: null,
    datetime_original: null,
    software: null,
    address: null,
    country: null,
    google_maps_url: null,
    osm_url: null,
    yandex_maps_url: null,
    suncalc_url: null,
    sentinel_url: null,
    raw_exif: {},
    image_preview_url: URL.createObjectURL(file)
  };

  try {
    // Check for JPEG SOI (0xFFD8)
    if (dataView.getUint16(0) !== 0xFFD8) {
      return geoint;
    }

    let offset = 2;
    const length = dataView.byteLength;

    while (offset < length - 2) {
      const marker = dataView.getUint16(offset);
      offset += 2;

      // APP1 marker (0xFFE1) contains EXIF
      if (marker === 0xFFE1) {
        const app1Length = dataView.getUint16(offset);
        const exifHeader = dataView.getUint32(offset + 2);
        // "Exif" in ASCII is 0x45786966
        if (exifHeader === 0x45786966) {
          const tiffStart = offset + 8;
          parseTiff(dataView, tiffStart, geoint);
        }
        break;
      } else if ((marker & 0xFF00) === 0xFF00) {
        // Skip other markers
        const segLength = dataView.getUint16(offset);
        offset += segLength;
      } else {
        break;
      }
    }
  } catch (err) {
    console.warn('Error reading EXIF binary data:', err);
  }

  // If GPS coordinates found, query Nominatim
  if (geoint.latitude !== null && geoint.longitude !== null) {
    await populateGeoUrlsAndAddress(geoint);
  }

  return geoint;
}

function parseTiff(dataView: DataView, tiffStart: number, geoint: GeointData) {
  // Byte order: 0x4949 = Little Endian ('II'), 0x4D4D = Big Endian ('MM')
  const endianTag = dataView.getUint16(tiffStart);
  const littleEndian = endianTag === 0x4949;

  const firstIfdOffset = dataView.getUint32(tiffStart + 4, littleEndian);
  if (firstIfdOffset < 8) return;

  const ifd0Start = tiffStart + firstIfdOffset;
  const numEntries = dataView.getUint16(ifd0Start, littleEndian);

  let gpsOffset: number | null = null;

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifd0Start + 2 + i * 12;
    const tag = dataView.getUint16(entryOffset, littleEndian);
    const type = dataView.getUint16(entryOffset + 2, littleEndian);
    const count = dataView.getUint32(entryOffset + 4, littleEndian);
    const valueOffset = dataView.getUint32(entryOffset + 8, littleEndian);

    if (tag === 0x010F) { // Make
      geoint.camera_make = readAscii(dataView, tiffStart + valueOffset, count);
    } else if (tag === 0x0110) { // Model
      geoint.camera_model = readAscii(dataView, tiffStart + valueOffset, count);
    } else if (tag === 0x0131) { // Software
      geoint.software = readAscii(dataView, tiffStart + valueOffset, count);
    } else if (tag === 0x0132) { // DateTime
      geoint.datetime_original = readAscii(dataView, tiffStart + valueOffset, count);
    } else if (tag === 0x8825) { // GPS Info IFD Pointer
      gpsOffset = tiffStart + valueOffset;
    }
  }

  // Parse GPS IFD if found
  if (gpsOffset !== null && gpsOffset < dataView.byteLength - 2) {
    parseGpsIfd(dataView, gpsOffset, tiffStart, littleEndian, geoint);
  }
}

function parseGpsIfd(dataView: DataView, gpsStart: number, tiffStart: number, littleEndian: boolean, geoint: GeointData) {
  const numGpsEntries = dataView.getUint16(gpsStart, littleEndian);
  let latRef: string | null = null;
  let latValues: number[] = [];
  let lonRef: string | null = null;
  let lonValues: number[] = [];
  let altitude: number | null = null;

  for (let i = 0; i < numGpsEntries; i++) {
    const entryOffset = gpsStart + 2 + i * 12;
    const tag = dataView.getUint16(entryOffset, littleEndian);
    const count = dataView.getUint32(entryOffset + 4, littleEndian);
    const valueOffset = dataView.getUint32(entryOffset + 8, littleEndian);

    if (tag === 1) { // GPSLatitudeRef
      latRef = String.fromCharCode(dataView.getUint8(entryOffset + 8));
    } else if (tag === 2) { // GPSLatitude (3 rationals)
      latValues = readRationals(dataView, tiffStart + valueOffset, 3, littleEndian);
    } else if (tag === 3) { // GPSLongitudeRef
      lonRef = String.fromCharCode(dataView.getUint8(entryOffset + 8));
    } else if (tag === 4) { // GPSLongitude (3 rationals)
      lonValues = readRationals(dataView, tiffStart + valueOffset, 3, littleEndian);
    } else if (tag === 6) { // GPSAltitude (1 rational)
      const altRat = readRationals(dataView, tiffStart + valueOffset, 1, littleEndian);
      if (altRat.length > 0) altitude = Math.round(altRat[0] * 10) / 10;
    }
  }

  if (latValues.length === 3 && lonValues.length === 3) {
    let lat = latValues[0] + latValues[1] / 60 + latValues[2] / 3600;
    let lon = lonValues[0] + lonValues[1] / 60 + lonValues[2] / 3600;

    if (latRef === 'S') lat = -lat;
    if (lonRef === 'W') lon = -lon;

    geoint.latitude = Number(lat.toFixed(6));
    geoint.longitude = Number(lon.toFixed(6));
    geoint.altitude = altitude;
  }
}

function readAscii(dataView: DataView, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length - 1; i++) {
    if (offset + i >= dataView.byteLength) break;
    const char = dataView.getUint8(offset + i);
    if (char === 0) break;
    str += String.fromCharCode(char);
  }
  return str.trim();
}

function readRationals(dataView: DataView, offset: number, count: number, littleEndian: boolean): number[] {
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const numOffset = offset + i * 8;
    if (numOffset + 8 > dataView.byteLength) break;
    const num = dataView.getUint32(numOffset, littleEndian);
    const den = dataView.getUint32(numOffset + 4, littleEndian);
    result.push(den === 0 ? 0 : num / den);
  }
  return result;
}

export async function populateGeoUrlsAndAddress(geoint: GeointData) {
  if (geoint.latitude === null || geoint.longitude === null) return;

  const lat = geoint.latitude;
  const lon = geoint.longitude;

  geoint.google_maps_url = `https://www.google.com/maps?q=${lat},${lon}`;
  geoint.osm_url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
  geoint.yandex_maps_url = `https://yandex.com/maps/?pt=${lon},${lat}&z=16&l=map`;
  geoint.suncalc_url = `https://www.suncalc.org/#/${lat},${lon},16`;
  geoint.sentinel_url = `https://apps.sentinel-hub.com/eo-browser/?lat=${lat}&lng=${lon}&zoom=14`;

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      geoint.address = data.display_name;
      geoint.country = data.address?.country || null;
    }
  } catch (err) {
    console.warn('Reverse geocoding failed:', err);
  }
}
