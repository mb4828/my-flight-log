/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import * as Luxon from 'luxon';
import Papa from 'papaparse';
import CountUp from 'react-countup';
import { v4 as uuid } from 'uuid';
import InlineBarChart from './components/InlineBarChart';
import FlightMap from './components/FlightMap';
import './App.scss';

function App() {
  const [stats, setStats] = useState({} as any);
  const [data, setData] = useState([] as any[]);
  const [filteredData, setFilteredData] = useState([] as any[]);
  const [filterText, setFilterText] = useState('');
  const [sortIdx, setSortIdx] = useState(2);
  const [sortDir, setSortDir] = useState('d');

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
            const data: any[] = results.data.map((d: any) => {
              d.AIRLINE_FLIGHT = `${d.AIRLINE}${d.FLIGHT}`;
              d.ORIGIN_DEST = `${d.ORIGIN} ‣ ${d.DESTINATION}`;
              d.DEPART_MILLIS = Luxon.DateTime.fromFormat(d.DEPART, 'h:mma').toMillis();
              d.ARRIVE_MILLIS = Luxon.DateTime.fromFormat(d.ARRIVE, 'h:mma').toMillis();
              d.TIME_MILLIS = Luxon.Duration.fromISO(`PT${d.TIME}`).as('milliseconds');
              d.DELAY_MILLIS = Luxon.Duration.fromISO(`PT${d.DELAY}`).as('milliseconds');
              d.DISTANCE_NUM = parseInt(d.DISTANCE) || 0;
              return d;
            });
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
      duration = `<span style="color:${duration.startsWith('-') ? 'green' : 'red'}">${duration.replace(
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

  function onTableSort(colIdx: number, colKey: string) {
    const dir = sortDir === 'a' ? 'd' : 'a';
    const sortedData = filteredData.sort((a, b) => (a[colKey] < b[colKey] ? -1 : 1));
    setSortIdx(colIdx);
    setSortDir(dir);
    setFilteredData(dir === 'a' ? sortedData : sortedData.reverse());
  }

  useEffect(() => {
    initStats();
    // enable horizontal scrolling only when table is onscreen
    window.addEventListener('scroll', () => {
      const table = document.getElementById('flight-log')?.getBoundingClientRect();
      if (table && table.y <= window.innerHeight) {
        document.body.style.overflowX = 'auto';
      } else {
        document.body.style.overflowX = 'hidden';
        if (window.scrollX > 0) {
          window.scrollTo(0, window.scrollY);
        }
      }
    });
  }, []);

  return (
    <>
      <h1>🌐 My Flight Logbook</h1>

      <FlightMap />

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
              <CountUp end={stats['distance']} /> mi
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

        <dl className="stats bars">
          <div className="item">
            <dt>Top Airports</dt>
            <dd>
              <ul>
                {stats['airports']?.slice(0, 5).map((airport: any) => (
                  <li key={uuid()}>
                    📍 {airport[0]} <InlineBarChart value={airport[1]} />
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
                  <li key={uuid()}>
                    <img src={`airlines/${airline[0]}.jpg`} alt="" /> {airline[0]} <InlineBarChart value={airline[1]} />
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
                  <li key={uuid()}>
                    ✈️ {aircraft[0]} <InlineBarChart value={aircraft[1]} />
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
            <th onClick={() => onTableSort(0, 'AIRLINE_FLIGHT')}>
              Flight {sortIdx === 0 ? (sortDir === 'a' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => onTableSort(1, 'ORIGIN_DEST')}>
              From ‣ To {sortIdx === 1 ? (sortDir === 'a' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => onTableSort(2, 'DATE')}>Date {sortIdx === 2 ? (sortDir === 'a' ? '↑' : '↓') : ''}</th>
            <th onClick={() => onTableSort(3, 'DEPART_MILLIS')}>
              Depart {sortIdx === 3 ? (sortDir === 'a' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => onTableSort(4, 'ARRIVE_MILLIS')}>
              Arrive {sortIdx === 4 ? (sortDir === 'a' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => onTableSort(5, 'TIME_MILLIS')}>
              Duration {sortIdx === 5 ? (sortDir === 'a' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => onTableSort(6, 'DELAY_MILLIS')}>
              Delay {sortIdx === 6 ? (sortDir === 'a' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => onTableSort(7, 'DISTANCE_NUM')}>
              Distance {sortIdx === 7 ? (sortDir === 'a' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => onTableSort(8, 'TAIL')}>
              Aircraft {sortIdx === 8 ? (sortDir === 'a' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => onTableSort(9, 'TYPE')}>Type {sortIdx === 8 ? (sortDir === 'a' ? '↑' : '↓') : ''}</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((flight) => (
            <tr key={uuid()}>
              <td>
                <img src={`airlines/${flight.AIRLINE}.jpg`} alt="" /> {flight.AIRLINE_FLIGHT}
              </td>
              <td>{flight.ORIGIN_DEST}</td>
              <td>{flight.DATE}</td>
              <td>{flight.DEPART}</td>
              <td>{flight.ARRIVE}</td>
              <td dangerouslySetInnerHTML={{ __html: formatDuration(flight.TIME) }} />
              <td dangerouslySetInnerHTML={{ __html: formatDuration(flight.DELAY, true) }} />
              <td>{flight.DISTANCE_NUM} mi</td>
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
