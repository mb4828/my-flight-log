/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import './FlightTable.scss';

interface FlightTableProps {
  data: any[]; // Array of flight data
}

const FlightTable: React.FC<FlightTableProps> = ({ data }) => {
  const [filteredData, setFilteredData] = useState([] as any[]);
  const [filterText, setFilterText] = useState('');
  const [sortIdx, setSortIdx] = useState(2);
  const [sortDir, setSortDir] = useState('d');

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

  function getSortIcon(colIdx: number): string {
    return sortIdx === colIdx ? (sortDir === 'a' ? '↑' : '↓') : '';
  }

  function formatDuration(duration: string, setColor = false): string {
    duration = duration.replace('H', 'H ').toLowerCase();
    if (setColor) {
      duration = `<span style="color:${parseInt(duration) <= 0 ? 'green' : 'red'}">${duration.replace('-', '')}</span>`;
    }
    return duration;
  }

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  return (
    <>
      <input id="filter" type="text" placeholder="⌕ Filter" value={filterText} onChange={onFilterChange} />
      <table id="flight-log">
        <thead>
          <tr>
            <th onClick={() => onTableSort(0, 'AIRLINE_FLIGHT')}>Flight {getSortIcon(0)}</th>
            <th onClick={() => onTableSort(1, 'ORIGIN_DEST')}>From ‣ To {getSortIcon(1)}</th>
            <th onClick={() => onTableSort(2, 'DATE')}>Date {getSortIcon(2)}</th>
            <th onClick={() => onTableSort(3, 'DEPART_MILLIS')}>Depart {getSortIcon(3)}</th>
            <th onClick={() => onTableSort(4, 'ARRIVE_MILLIS')}>Arrive {getSortIcon(4)}</th>
            <th onClick={() => onTableSort(5, 'TIME_MILLIS')}>Duration {getSortIcon(5)}</th>
            <th onClick={() => onTableSort(6, 'DELAY_MILLIS')}>Delay {getSortIcon(6)}</th>
            <th onClick={() => onTableSort(7, 'DISTANCE_NUM')}>Distance {getSortIcon(7)}</th>
            <th onClick={() => onTableSort(8, 'TAIL')}>Aircraft {getSortIcon(8)}</th>
            <th onClick={() => onTableSort(9, 'TYPE')}>Type {getSortIcon(9)}</th>
            <th onClick={() => onTableSort(10, 'SEAT')}>Seat {getSortIcon(10)}</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((flight) => (
            <tr key={uuid()}>
              <td>
                <img className="airline" src={`airlines/${flight.AIRLINE}.png`} alt="" /> {flight.AIRLINE_FLIGHT}
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
              <td>
                <div className="seats">
                  <span className="seatNum">{flight.SEAT_NUM}</span>
                  <span className={`badge badge-${flight.SEAT_CLASS}`}>{flight.SEAT_CLASS}</span>
                  {flight.SEAT_POS && <img className="seatPos" src={`seats/${flight.SEAT_POS}.svg`} alt="" />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default FlightTable;
