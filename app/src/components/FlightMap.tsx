/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Map, Popup } from 'react-map-gl';
import { kml } from '@tmcw/togeojson';
import greatCircle from '@turf/great-circle';
import bbox from '@turf/bbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './FlightMap.scss';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibWI0ODI4IiwiYSI6ImNsMnFweGpuYTAwNXAzY3Bob3lqaG9rMG4ifQ.O8yYprih5CDw3tH0bDrCHw';

interface FlightMapProps {
  year: string;
}

const FlightMap: React.FC<FlightMapProps> = ({ year }) => {
  const mapboxMap = useRef(null as any);
  const [viewMode, setViewMode] = useState('mercator' as any);
  const [geoJson, setGeoJson] = useState(null as null | any);
  const [popup, setPopup] = useState(null as null | any);

  async function loadKML() {
    // fetch
    const response = await fetch('my-flight-log.kml');
    const kmlText = await response.text();

    // convert to geojson
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    const geoJson = kml(kmlDoc);
    geoJson.features = geoJson.features.map((feature: any) => {
      if (feature.geometry.type === 'Point') {
        feature.geometry.coordinates = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
        feature.properties = {
          title: feature.properties.name,
        };
      } else if (feature.geometry.type === 'LineString') {
        const coords = feature.geometry.coordinates;
        const segments = [];

        for (let i = 0; i < coords.length - 1; i++) {
          const start = coords[i];
          const end = coords[i + 1];
          const gc = greatCircle(start, end, { npoints: 100 });
          segments.push(gc);
        }

        feature.geometry.coordinates = segments.reduce((acc: any, segment: any) => {
          return acc.concat(segment.geometry.coordinates);
        }, []);
      }
      return feature;
    });
    setGeoJson(geoJson);
  }

  const filterGeoJsonByYear = useCallback(() => {
    if (!geoJson || year.includes('All')) return geoJson;

    const lines = geoJson.features.filter((f: any) => f.properties.name?.includes(`[${year}`));
    const airports = Array.from(
      new Set(lines.flatMap((line: any) => [line.properties.name?.slice(0, 3), line.properties.name?.slice(6, 9)]))
    );
    const points = geoJson.features.filter((f: any) => airports.includes(f.properties?.title));

    return { ...geoJson, features: [...points, ...lines] };
  }, [geoJson, year]);

  function animateMap(geoJsonData: any) {
    if (geoJsonData.features.length > 0) {
      // update map zoom so everything fits
      const bounds = bbox(geoJsonData);
      mapboxMap.current.fitBounds(
        [
          [bounds[0], bounds[1]], // Southwest corner
          [bounds[2], bounds[3]], // Northeast corner
        ],
        { padding: window.innerWidth < 768 ? 100 : 250, duration: 1000 }
      );

      // fade in points
      mapboxMap.current.setPaintProperty('pushpins', 'icon-opacity', 1);
      mapboxMap.current.setPaintProperty('routes', 'line-opacity', 0.8);
    }
  }

  function onMapLoad(event: any) {
    mapboxMap.current = event.target;

    // load pushpin icon
    event.target.loadImage('pushpin2.png', (error: any, image: any) => {
      if (error) throw error;
      event.target.addImage('pushpin', image);

      // add source to map
      event.target.addSource('geojson', {
        type: 'geojson',
        data: geoJson,
      });

      // add layers to map
      event.target.addLayer({
        id: 'routes',
        type: 'line',
        source: 'geojson',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0000ff',
          'line-width': 2.5,
          'line-opacity': 0,
        },
      });
      event.target.addLayer({
        id: 'pushpins',
        type: 'symbol',
        source: 'geojson',
        layout: {
          'icon-image': 'pushpin',
          'icon-size': 0.3,
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        },
        paint: {
          'icon-opacity': 0,
        },
        minzoom: 0,
        maxzoom: 24,
      });

      animateMap(geoJson);
    });
  }

  function onMapClick(event: any) {
    const feature = event.target
      .queryRenderedFeatures(event.point)
      .find((feature: any) => feature.layer.id === 'pushpins');
    if (feature) {
      setPopup({
        coordinates: feature.geometry.coordinates,
        title: feature.properties.title,
      });
    } else {
      setPopup(null);
    }
  }

  useEffect(() => {
    // initial load of kml data
    loadKML();
  }, []);

  useEffect(() => {
    // filter and redraw map when the year changes
    if (mapboxMap && mapboxMap.current) {
      // fade out points
      mapboxMap.current.setPaintProperty('pushpins', 'icon-opacity', 0);
      mapboxMap.current.setPaintProperty('routes', 'line-opacity', 0);

      setTimeout(() => {
        const filteredGeoJson = filterGeoJsonByYear();
        mapboxMap.current.getSource('geojson')?.setData(filteredGeoJson);
        animateMap(filteredGeoJson);
      }, 500);
    }
  }, [year, geoJson, filterGeoJsonByYear]);

  return (
    <div id="flight-map">
      <button className="view-button" onClick={() => setViewMode(viewMode === 'mercator' ? 'globe' : 'mercator')}>
        {viewMode === 'globe' ? '2D' : '3D'}
      </button>

      <Map
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        projection={viewMode}
        onLoad={onMapLoad}
        onClick={onMapClick}
      >
        {popup && (
          <Popup
            longitude={popup.coordinates[0]}
            latitude={popup.coordinates[1]}
            anchor="top"
            onClose={() => setPopup(null)}
          >
            <div>
              <h2 style={{ fontSize: '110%' }}>{popup.title}</h2>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default FlightMap;
