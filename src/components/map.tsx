import mapboxgl, { MapboxOptions, type Map } from "mapbox-gl";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { useEffectOnce } from "../hooks/useEffectOnce";

export const MapBoxContext = createContext<mapboxgl.Map | null>(null);

export const useMapBox = () => {
  const map = useContext(MapBoxContext);
  if (!map) {
    throw new Error("useMap should be used in <Map> child components");
  }
  return map;
};

export const useMapBoxStore = ({
  MAPBOX_API_KEY,
  options,
}: {
  options: MapboxOptions;
  MAPBOX_API_KEY: string;
}) => {
  const [map, setMap] = useState<Map | null>(null);
  const initialize = useCallback(() => {
    mapboxgl.accessToken = MAPBOX_API_KEY;
    const _map = new mapboxgl.Map({
      fitBoundsOptions: {
        maxZoom: 18,
        padding: { top: 25, bottom: 25, left: 25, right: 25 },
      },
      container: options.container,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 0],
      zoom: 0.4,
    });
    setMap(_map);
  }, []); // eslint-disable-line

  useEffectOnce(initialize);

  return { map };
};

export const MapComponent = ({
  children,
  MAPBOX_API_KEY,
  options,
  className,
}: {
  children?: ReactNode;
  MAPBOX_API_KEY: string;
  options: MapboxOptions & { container: string };
  className: string;
}) => {
  const { map } = useMapBoxStore({
    MAPBOX_API_KEY,
    options,
  });

  return (
    <MapBoxContext.Provider value={map}>
      <div id={options.container} className={className}></div>
      {children}
    </MapBoxContext.Provider>
  );
};
