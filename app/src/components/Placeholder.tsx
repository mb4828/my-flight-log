import React from 'react';
import './Placeholder.scss';

interface PlaceholderProps {
  width: number; // Width of the placeholder in pixels
  height: number; // Height of the placeholder in pixels
  borderRadius?: number; // Optional border radius for the placeholder
  marginBottom?: number; // Optional margin bottom for the placeholder
  numRows?: number; // Optional number of rows for the placeholder
  isReady?: boolean; // Whether the placeholder is ready to be displayed
  children?: React.ReactNode; // Children to be rendered inside the placeholder once ready
}

const Placeholder: React.FC<PlaceholderProps> = ({
  width,
  height,
  borderRadius = 0,
  marginBottom = 0,
  numRows = 1,
  isReady = false,
  children,
}) => {
  return (
    // render children if isReady is true, otherwise render a placeholder
    <div className="placeholder-wrapper" style={{ height: `${(height + marginBottom) * numRows}px` }}>
      {isReady ? (
        <>{children}</>
      ) : (
        Array.from({ length: numRows }).map((_, index) => (
          <div
            key={index}
            className="placeholder shimmer"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              borderRadius: `${borderRadius}px`,
              marginBottom: `${marginBottom}px`,
            }}
          />
        ))
      )}
    </div>
  );
};

export default Placeholder;
