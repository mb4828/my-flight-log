import React, { useEffect, useRef } from 'react';
import './InlineBarChart.scss';

interface InlineBarChartProps {
  value: number; // The value of the bar
  maxWidth?: number; // Optional maximum width for scaling
}

const InlineBarChart: React.FC<InlineBarChartProps> = ({ value, maxWidth = 300 }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const number = numberRef.current;
    if (bar && number) {
      const scaledWidth = (Math.min(value, 100) / 100) * maxWidth;
      setTimeout(() => {
        bar.style.width = `${scaledWidth}px`;
      }, 0);

      setTimeout(() => {
        number.textContent = value.toString();
        number.style.opacity = '1';
      }, 1000);
    }
  }, [value, maxWidth]);

  return (
    <div className="inline-bar-container">
      <div ref={barRef} className="inline-bar" data-value={value}></div>
      <span ref={numberRef} className="inline-number"></span>
    </div>
  );
};

export default InlineBarChart;
