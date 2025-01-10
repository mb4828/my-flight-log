import * as L from 'leaflet';

declare module 'leaflet' {
  class KML extends FeatureGroup {
    constructor(kml: Document, options?: LayerOptions);
    getBounds(): LatLngBounds;
  }

  function kml(kml: Document, options?: LayerOptions): KML;
}