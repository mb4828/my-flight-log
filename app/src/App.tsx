/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import * as Luxon from 'luxon';
import Papa from 'papaparse';
import CountUp from 'react-countup';
import FlightMap from './components/FlightMap';
import FlightTable from './components/FlightTable';
import Highchart from './components/Highchart';
import Placeholder from './components/Placeholder';
import './App.scss';

let ticking = false;

function App() {
  const [data, setData] = useState([] as any[]);
  const [filteredData, setFilteredData] = useState([] as any[]);
  const [filterYear, setFilterYear] = useState('All Time');
  const [stats, setStats] = useState({} as any);

  function loadData() {
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
              d.SEAT_NUM = d.SEAT.split('|')[0];
              d.SEAT_CLASS = d.SEAT.split('|')[1];
              d.SEAT_POS = d.SEAT.split('|')[2];
              return d;
            });
            data.sort((a: any, b: any) => (a.DATE < b.DATE ? 1 : -1));
            setData(data);
            setFilteredData(data);
          },
          error: (error: any) => console.error('Error parsing CSV:', error),
        });
      });
  }

  function getYearList() {
    const years = new Set(data.map((d) => d.DATE.split('-')[0]));
    return ['All Time'].concat(Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)));
  }

  useEffect(() => {
    // generate stats
    if (filteredData.length > 0) {
      const stats = {
        numFlights: filteredData.length,
        distance: filteredData.map((d) => parseInt(d.DISTANCE) || 0).reduce((a, c) => a + c, 0),
        flightTime: filteredData
          .map((d) => Luxon.Duration.fromISO(`PT${d.TIME}`))
          .reduce((a, c) => a.plus(c))
          .shiftTo('days', 'hours')
          .toObject(),
        delays: filteredData
          .map((d) => (d.DELAY.startsWith('-') ? Luxon.Duration.fromMillis(0) : Luxon.Duration.fromISO(`PT${d.DELAY}`)))
          .reduce((a, c) => a.plus(c))
          .shiftTo('hours', 'minutes')
          .toObject(),
        airports: Object.entries(
          filteredData
            .map((d) => d.ORIGIN)
            .concat(filteredData.map((d) => d.DESTINATION))
            .reduce((acc, item) => ((acc[item] = (acc[item] || 0) + 1), acc), {})
        ).sort((a: any, b: any) => b[1] - a[1]),
        airlines: Object.entries(
          filteredData.map((d) => d.AIRLINE).reduce((acc, item) => ((acc[item] = (acc[item] || 0) + 1), acc), {})
        ).sort((a: any, b: any) => b[1] - a[1]),
        aircraft: Object.entries(
          filteredData.map((d) => d.TYPE).reduce((acc, item) => ((acc[item] = (acc[item] || 0) + 1), acc), {})
        ).sort((a: any, b: any) => b[1] - a[1]),
        seatClasses: Object.entries(
          filteredData.map((d) => d.SEAT_CLASS).reduce((acc, item) => ((acc[item] = (acc[item] || 0) + 1), acc), {})
        ).sort((a: any, b: any) => b[1] - a[1]),
      };
      setStats(stats);
    }
  }, [filteredData]);

  useEffect(() => {
    // filter data by year
    if (filterYear === 'All Time') {
      setFilteredData(data);
    } else {
      const filtered = data.filter((d) => d.DATE.split('-')[0] === filterYear);
      setFilteredData(filtered);
    }
  }, [data, filterYear]);

  useEffect(() => {
    // load data and set up scroll event listener
    loadData();
    window.addEventListener('scroll', () => {
      // if table is wider than screen width
      if (window.innerWidth <= 1400) {
        // enable horizontal scrolling when filter is visible onscreen
        const filter = document.getElementById('filter')?.getBoundingClientRect();
        if (filter && filter.y <= window.innerHeight) {
          document.body.style.overflowX = 'auto';
        } else {
          document.body.style.overflowX = 'hidden';
          if (window.scrollX > 0) {
            window.scrollTo({ left: 0 });
          }
        }

        // sliding content slides horizontally with window scroll
        if (!ticking) {
          requestAnimationFrame(() => {
            const slidingContent = document.getElementById('sliding-content');
            const xScrollPos = Math.min(window.scrollX, 1400 - window.innerWidth); // 1400 is table min-width on mobile
            slidingContent?.setAttribute('style', `transform: translateX(${xScrollPos}px)`);
            ticking = false;
          });
          ticking = true;
        }
      }
    });
  }, []);

  return (
    <>
      <h1>📔 My Flight Logbook</h1>

      <FlightMap />

      <div id="content">
        <div id="sliding-content">
          <div id="data-card">
            <ul className="nav">
              {getYearList().map((year: any) => (
                <li key={year}>
                  <button onClick={() => setFilterYear(year)} className={filterYear === year ? 'active' : ''}>
                    {year}
                  </button>
                </li>
              ))}
            </ul>

            <dl className="stats countup">
              <div className="item">
                <dt>
                  <Placeholder width={50} height={14} isReady={!!stats['numFlights']}>
                    Flights
                  </Placeholder>
                </dt>
                <dd>
                  <Placeholder width={125} height={37} isReady={!!stats['numFlights']}>
                    <CountUp end={stats['numFlights']} duration={1} preserveValue />
                  </Placeholder>
                </dd>
              </div>

              <div className="item">
                <dt>
                  <Placeholder width={50} height={14} isReady={!!stats['distance']}>
                    Distance
                  </Placeholder>
                </dt>
                <dd>
                  <Placeholder width={125} height={37} isReady={!!stats['distance']}>
                    <CountUp end={stats['distance']} duration={1} suffix=" mi" preserveValue />
                  </Placeholder>
                </dd>
              </div>

              <div className="item">
                <dt>
                  <Placeholder width={50} height={14} isReady={!!stats['flightTime']}>
                    Flight Time
                  </Placeholder>
                </dt>
                <dd>
                  <Placeholder width={125} height={37} isReady={!!stats['flightTime']}>
                    <CountUp end={parseInt(stats['flightTime']?.days)} duration={1} suffix="d " preserveValue />
                    <CountUp end={parseInt(stats['flightTime']?.hours)} duration={1} suffix="h" preserveValue />
                  </Placeholder>
                </dd>
              </div>

              <div className="item">
                <dt>
                  <Placeholder width={50} height={14} isReady={!!stats['delays']}>
                    Delays
                  </Placeholder>
                </dt>
                <dd>
                  <Placeholder width={125} height={37} isReady={!!stats['delays']}>
                    <CountUp end={parseInt(stats['delays']?.hours)} duration={1} suffix="h " preserveValue />
                    <CountUp end={parseInt(stats['delays']?.minutes)} duration={1} suffix="m" preserveValue />
                  </Placeholder>
                </dd>
              </div>

              <div className="item">
                <dt>
                  <Placeholder width={50} height={14} isReady={!!stats['airports']}>
                    Airports
                  </Placeholder>
                </dt>
                <dd>
                  <Placeholder width={125} height={37} isReady={!!stats['airports']}>
                    <CountUp end={stats['airports']?.length} />
                  </Placeholder>
                </dd>
              </div>

              <div className="item">
                <dt>
                  <Placeholder width={50} height={14} isReady={!!stats['airlines']}>
                    Airlines
                  </Placeholder>
                </dt>
                <dd>
                  <Placeholder width={125} height={37} isReady={!!stats['airlines']}>
                    <CountUp end={stats['airlines']?.length} />
                  </Placeholder>
                </dd>
              </div>
            </dl>
            <dl className="stats charts">
              <div className="item">
                <dt>
                  <Placeholder width={50} height={14} isReady={!!stats['airports']}>
                    Top Airports
                  </Placeholder>
                </dt>
                <dd>
                  <ul>
                    <Placeholder width={250} height={12} marginBottom={12} numRows={5} isReady={!!stats.airports}>
                      <Highchart
                        options={{
                          chart: {
                            type: 'bar',
                            backgroundColor: 'transparent',
                            height: Math.min(120, stats.airports?.length * 24),
                            width: 250,
                            spacing: [0, 0, 0, 0],
                          },
                          xAxis: {
                            title: { text: '' },
                            categories: stats.airports?.slice(0, 5).map((airports: any) => `📍 ${airports[0]}`),
                            labels: {
                              enabled: true,
                            },
                            lineWidth: 0,
                          },
                          series: [
                            {
                              type: 'bar',
                              name: 'Flights',
                              data: stats.airports?.slice(0, 5).map((airports: any) => airports[1]),
                              color: 'var(--bar-chart-color)',
                              borderWidth: 0,
                              pointWidth: 12,
                              dataLabels: { enabled: true },
                            },
                          ],
                        }}
                      />
                    </Placeholder>
                  </ul>
                </dd>
              </div>
              <div className="item">
                <dt>
                  <Placeholder width={50} height={14} isReady={!!stats['airlines']}>
                    Top Airlines
                  </Placeholder>
                </dt>
                <dd>
                  <ul>
                    <Placeholder width={250} height={12} marginBottom={12} numRows={5} isReady={!!stats.airlines}>
                      <Highchart
                        options={{
                          chart: {
                            type: 'bar',
                            backgroundColor: 'transparent',
                            height: Math.min(120, stats.airlines?.length * 24),
                            width: 250,
                            spacing: [0, 0, 0, 0],
                          },
                          xAxis: {
                            title: { text: '' },
                            categories: stats.airlines?.slice(0, 5).map((airline: any) => airline[0]),
                            labels: {
                              enabled: true,
                              useHTML: true,
                              formatter: function () {
                                return `<img src="/airlines/${this.value}.png" alt="" /> ${this.value}`;
                              },
                            },
                            lineWidth: 0,
                          },
                          series: [
                            {
                              type: 'bar',
                              name: 'Flights',
                              data: stats.airlines?.slice(0, 5).map((airline: any) => airline[1]),
                              color: 'var(--bar-chart-color)',
                              borderWidth: 0,
                              pointWidth: 12,
                              dataLabels: { enabled: true },
                            },
                          ],
                        }}
                      />
                    </Placeholder>
                  </ul>
                </dd>
              </div>
              <div className="item">
                <dt>
                  <Placeholder width={50} height={14} isReady={!!stats['aircraft']}>
                    Top Aircraft
                  </Placeholder>
                </dt>
                <dd>
                  <ul>
                    <Placeholder width={250} height={12} marginBottom={12} numRows={5} isReady={!!stats.aircraft}>
                      <Highchart
                        options={{
                          chart: {
                            type: 'bar',
                            backgroundColor: 'transparent',
                            height: Math.min(120, stats.aircraft?.length * 24),
                            width: 250,
                            spacing: [0, 0, 0, 0],
                          },
                          xAxis: {
                            title: { text: '' },
                            categories: stats.aircraft?.slice(0, 5).map((aircraft: any) => `✈️ ${aircraft[0]}`),
                            labels: {
                              enabled: true,
                            },
                            lineWidth: 0,
                          },
                          series: [
                            {
                              type: 'bar',
                              name: 'Flights',
                              data: stats.aircraft?.slice(0, 5).map((aircraft: any) => aircraft[1]),
                              color: 'var(--bar-chart-color)',
                              borderWidth: 0,
                              pointWidth: 12,
                              dataLabels: { enabled: true },
                            },
                          ],
                        }}
                      />
                    </Placeholder>
                  </ul>
                </dd>
              </div>
              <div className="item">
                <dt>
                  <Placeholder width={50} height={14} isReady={!!stats['seatClasses']}>
                    Top Seat Classes
                  </Placeholder>
                </dt>
                <dd>
                  <ul>
                    <Placeholder width={250} height={108} marginBottom={12} isReady={!!stats.seatClasses}>
                      <Highchart
                        options={{
                          chart: {
                            type: 'pie',
                            backgroundColor: 'transparent',
                            height: 120,
                            width: 120,
                            margin: 0,
                            spacing: [0, 0, 0, 0],
                          },
                          series: [
                            {
                              type: 'pie',
                              name: 'Flights',
                              data: stats.seatClasses?.map((seatClass: any) => ({
                                name: seatClass[0],
                                y: seatClass[1],
                                color:
                                  seatClass[0] === 'F'
                                    ? '#7A36B1'
                                    : seatClass[0] === 'P'
                                    ? '#F13D65'
                                    : seatClass[0] === 'E+'
                                    ? '#FDAD0F'
                                    : '#05BA48',
                              })),
                              innerSize: '65%',
                              dataLabels: {
                                enabled: true,
                                crop: false,
                                connectorWidth: 0,
                                distance: -10,
                                format: '{y}',
                                style: { textOutline: 'none' },
                              },
                              borderWidth: 0,
                            },
                          ],
                        }}
                      />
                    </Placeholder>
                  </ul>
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <FlightTable data={filteredData} />
      </div>
    </>
  );
}

export default App;
