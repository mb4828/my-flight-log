/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import L from 'leaflet';
import * as Luxon from 'luxon';
import Papa from 'papaparse';
import 'leaflet-kml';
import 'leaflet.geodesic';
import 'leaflet/dist/leaflet.css';
import './App.scss';
import CountUp from 'react-countup';

function App() {
  const [stats, setStats] = useState({} as any);
  const [data, setData] = useState([] as any[]);
  const [filteredData, setFilteredData] = useState([] as any[]);
  const [filterText, setFilterText] = useState('');
  let flightMap: L.Map;

  function initMap() {
    if (flightMap === undefined) {
      flightMap = L.map('flight-map', { center: [0, 0], zoom: 2, scrollWheelZoom: false });

      // Add mapbox tiles layer
      L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Imagery &copy; <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/outdoors-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoibWI0ODI4IiwiYSI6ImNsMnFweGpuYTAwNXAzY3Bob3lqaG9rMG4ifQ.O8yYprih5CDw3tH0bDrCHw',
      }).addTo(flightMap);

      // Load the KML file
      fetch('my-flight-log.kml')
        .then((response) => response.text())
        .then((kmlText) => {
          const parser = new DOMParser();
          const kml = parser.parseFromString(kmlText, 'text/xml');
          const track = new L.KML(kml);

          const layers = track.getLayers();
          while (layers.length > 0) {
            const layer = layers.pop();
            if (layer instanceof L.LayerGroup) {
              layers.push(...layer.getLayers());
            } else if (layer instanceof L.Marker) {
              const customIcon = L.icon({
                iconUrl: 'pushpin.png',
                iconSize: [13.5, 30],
                iconAnchor: [7, 26],
              });
              layer.setIcon(customIcon);
              flightMap.addLayer(layer);
            } else if (layer instanceof L.Polyline) {
              const latlngs = layer.getLatLngs();
              const geodesicLayer = L.geodesic(latlngs as L.LatLngExpression[], {
                color: '#6d6875',
                weight: 3,
                opacity: 0.5,
              });
              flightMap.removeLayer(layer);
              flightMap.addLayer(geodesicLayer);
            }
          }

          flightMap.fitBounds(track.getBounds());
        })
        .catch((err) => console.error('Failed to load KML file', err));
    }
  }

  function initStats() {
    fetch('MyFlightLog.csv')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load the CSV file.');
        }
        return response.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => {
            const data: any[] = results.data;
            const stats = {
              numFlights: data.length,
              distance: data.map((d) => parseInt(d.DISTANCE) || 0).reduce((a, c) => a + c, 0),
              flightTime: data
                .map((d) => Luxon.Duration.fromISO(`PT${d.TIME}`))
                .reduce((a, c) => a.plus(c))
                .shiftTo('days', 'hours')
                .toObject(),
              delays: data
                .map((d) =>
                  d.DELAY.startsWith('-') ? Luxon.Duration.fromMillis(0) : Luxon.Duration.fromISO(`PT${d.DELAY}`)
                )
                .reduce((a, c) => a.plus(c))
                .shiftTo('hours', 'minutes')
                .toObject(),
              airports: Object.entries(
                data
                  .map((d) => d.ORIGIN)
                  .concat(data.map((d) => d.DESTINATION))
                  .reduce((acc, item) => ((acc[item] = (acc[item] || 0) + 1), acc), {})
              ).sort((a: any, b: any) => b[1] - a[1]),
              airlines: Object.entries(
                data.map((d) => d.AIRLINE).reduce((acc, item) => ((acc[item] = (acc[item] || 0) + 1), acc), {})
              ).sort((a: any, b: any) => b[1] - a[1]),
              aircraft: Object.entries(
                data.map((d) => d.TYPE).reduce((acc, item) => ((acc[item] = (acc[item] || 0) + 1), acc), {})
              ).sort((a: any, b: any) => b[1] - a[1]),
            };
            data.sort((a: any, b: any) => (a.DATE < b.DATE ? 1 : -1));
            setStats(stats);
            setData(data);
            setFilteredData(data);
          },
          error: (error: any) => console.error('Error parsing CSV:', error),
        });
      });
  }

  function formatDuration(duration: string, setColor = false): string {
    duration = duration.replace('H', 'H ').toLowerCase();
    if (setColor) {
      duration = `<span style="color:${duration.startsWith('-') ? 'red' : 'green'}">${duration.replace(
        '-',
        ''
      )}</span>`;
    }
    return duration;
  }

  function onFilterChange(event: any) {
    const value = event.target.value;
    setFilterText(value);
    if (value.length > 0) {
      setFilteredData(data.filter((d) => JSON.stringify(d).toLowerCase().includes(value.toLowerCase())));
    } else {
      setFilteredData(data);
    }
  }

  useEffect(() => {
    initMap();
    initStats();

    // enable horizontal scrolling only when at bottom
    window.addEventListener('scroll', () => {
      const filterRect = document.getElementById('filter')?.getBoundingClientRect();
      if (filterRect && filterRect.y === 0) {
        document.body.style.overflowX = 'auto';
      } else if (filterRect && filterRect.y > 0 && filterRect.y < 10) {
        document.body.style.overflowX = 'hidden';
        window.scrollTo(0, window.scrollY);
      }
    });
  }, []);

  return (
    <>
      <h1>🌐 My Flight Logbook</h1>
      <div id="flight-map"></div>

      <div id="data-overlay">
        <dl className="stats countup">
          <div className="item">
            <dt>Flights</dt>
            <dd>
              <CountUp end={stats['numFlights']} />
            </dd>
          </div>

          <div className="item">
            <dt>Distance</dt>
            <dd>
              <CountUp end={stats['distance']} />
              mi
            </dd>
          </div>

          <div className="item">
            <dt>Flight Time</dt>
            <dd>
              <CountUp end={parseInt(stats['flightTime']?.days)} />d{' '}
              <CountUp end={parseInt(stats['flightTime']?.hours)} />h
            </dd>
          </div>

          <div className="item">
            <dt>Delays</dt>
            <dd>
              <CountUp end={parseInt(stats['delays']?.hours)} />h <CountUp end={parseInt(stats['delays']?.minutes)} />m
            </dd>
          </div>

          <div className="item">
            <dt>Airports</dt>
            <dd>
              <CountUp end={stats['airports']?.length} />
            </dd>
          </div>

          <div className="item">
            <dt>Airlines</dt>
            <dd>
              <CountUp end={stats['airlines']?.length} />
            </dd>
          </div>
        </dl>

        <dl className="stats">
          <div className="item">
            <dt>Top Airports</dt>
            <dd>
              <ul>
                {stats['airports']?.slice(0, 5).map((airport: any) => (
                  <li key={airport.id}>
                    📍 {airport[0]} <span className="sparkline">{'❙'.repeat(airport[1])}</span> {airport[1]}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="item">
            <dt>Top Airlines</dt>
            <dd>
              <ul>
                {stats['airlines']?.slice(0, 5).map((airline: any) => (
                  <li key={airline.id}>
                    <img src={`airlines/${airline[0]}.jpg`} alt="" /> {airline[0]}{' '}
                    <span className="sparkline">{'❙'.repeat(airline[1])}</span> {airline[1]}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="item">
            <dt>Top Aircraft</dt>
            <dd>
              <ul>
                {stats['aircraft']?.slice(0, 5).map((aircraft: any) => (
                  <li key={aircraft.id}>
                    ✈️ {aircraft[0]} <span className="sparkline">{'❙'.repeat(aircraft[1])}</span> {aircraft[1]}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>

      <input id="filter" type="text" placeholder="⌕ Filter" value={filterText} onChange={onFilterChange} />

      <table id="flight-log">
        <thead>
          <tr>
            <th>Flight</th>
            <th>From ‣ To</th>
            <th>Date ▾</th>
            <th>Depart</th>
            <th>Arrive</th>
            <th>Duration</th>
            <th>Delay</th>
            <th>Aircraft</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((flight) => (
            <tr key={flight.id}>
              <td>
                <img src={`airlines/${flight.AIRLINE}.jpg`} alt="" />
                {flight.AIRLINE}
                {flight.FLIGHT}
              </td>
              <td>
                {flight.ORIGIN} ‣ {flight.DESTINATION}
              </td>
              <td>{flight.DATE}</td>
              <td>{flight.DEPART}</td>
              <td>{flight.ARRIVE}</td>
              <td dangerouslySetInnerHTML={{ __html: formatDuration(flight.TIME) }} />
              <td dangerouslySetInnerHTML={{ __html: formatDuration(flight.DELAY, true) }} />
              <td>
                <a href={`https://www.flightradar24.com/data/aircraft/${flight.TAIL}`} target="_blank" rel="noreferrer">
                  {flight.TAIL}
                </a>
              </td>
              <td>{flight.TYPE}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default App;
