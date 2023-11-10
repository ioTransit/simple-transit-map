import mapboxgl, { MapboxOptions, type Map } from "mapbox-gl";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useEffectOnce } from "../hooks/useEffectOnce";
import { FeatureCollection, MultiLineString } from "geojson";

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
      {map && children}
    </MapBoxContext.Provider>
  );
};
const getCataloge = async () => {
  return (await getJsonFile("catalogue.json")) as {
    files: string[];
  };
};

const getJsonFile = async (fileName: string) => {
  try {
    const response = await fetch(fileName);
    return await response.json();
  } catch (e) {
    throw new Error("Error fetching JSON data " + fileName);
  }
};

const loadRoutes = async (fileName: string) => {
  const fileContents = (await getJsonFile(
    fileName,
  )) as FeatureCollection<MultiLineString>;
  return fileContents;
};

const addSourceToMap = (id: string, source: FeatureCollection, map: Map) => {
  if (map.getSource(id)) return;
  map.addSource(id, { data: source, type: "geojson" });
};

const removeCatalogue = (catalogue: string[], map: Map) => {
  for (const fileName in catalogue) {
    map.removeSource(fileName);
    map.removeLayer(fileName);
  }
};

const addRoutesLayer = (file: string, map: Map) => {
  map.addLayer({
    id: file,
    type: "line",
    source: file,
    layout: {},
  });
};

export const GtfsLayers = () => {
  const map = useMapBox();
  const loadLayers = async () => {
    const catalogue = await getCataloge();
    for (const file of catalogue.files) {
      if (file.includes("route")) {
        const contents = await loadRoutes(file);
        addSourceToMap(file, contents, map);
        addRoutesLayer(file, map);
      }
    }
  };

  useEffect(() => {
    map.once("load", () => {
      loadLayers();
    });
    return () => {
      map.off("load", async () => {
        const catalogue = await getCataloge();
        removeCatalogue(catalogue.files, map);
      });
    };
  }, [map]);

  return null;
};
