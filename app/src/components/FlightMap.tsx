/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Map, Popup } from 'react-map-gl';
import { kml } from '@tmcw/togeojson';
import 'mapbox-gl/dist/mapbox-gl.css';
import './FlightMap.scss';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibWI0ODI4IiwiYSI6ImNsMnFweGpuYTAwNXAzY3Bob3lqaG9rMG4ifQ.O8yYprih5CDw3tH0bDrCHw';
const IS_MOBILE = window.innerWidth < 768;

const FlightMap = () => {
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
      }
      return feature;
    });
    setGeoJson(geoJson);
  }

  function onMapLoad(event: any) {
    // load pushpin icon
    event.target.loadImage('pushpin.png', (error: any, image: any) => {
      if (error) throw error;
      event.target.addImage('pushpin', image);

      // add source to map
      event.target.addSource('geojson', {
        type: 'geojson',
        data: geoJson,
      });

      // add layers to map
      event.target.addLayer({
        id: 'route',
        type: 'line',
        source: 'geojson',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0000ff',
          'line-width': 2.5,
          'line-opacity': 0.8,
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
        minzoom: 0,
        maxzoom: 24,
      });
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
    loadKML();
  }, []);

  return (
    <div id="flight-map">
      <button className="view-button" onClick={() => setViewMode(viewMode === 'mercator' ? 'globe' : 'mercator')}>
        {viewMode === 'globe' ? '2D' : '3D'}
      </button>

      <Map
        initialViewState={{
          longitude: -74.006,
          latitude: 40.7128,
          zoom: !IS_MOBILE ? 2 : 0.8,
        }}
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
