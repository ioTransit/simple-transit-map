import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Layer,
  FillLayer,
  LineLayer,
  Source,
  Marker,
  CircleLayer,
  Popup,
} from "react-map-gl";
import { getJsonFile } from "./lib";
import { Feature, FeatureCollection, Point } from "geojson";
import { useMap } from "react-map-gl/dist/esm/components/use-map";
import { Route, Stop } from "gtfs-types";

const pointStyle = (id: string, color: string, minzoom: number = 12) => {
  const style: CircleLayer = {
    id: id,
    source: id,
    type: "circle",
    minzoom,
    paint: {
      "circle-stroke-color": "#4d473a",
      "circle-stroke-width": 2,
      "circle-radius": 10,
      "circle-color": color,
    },
  };
  return style;
};

const flexAreaStyle = (color: string) => {
  const fillStyle: FillLayer = {
    id: "flex-area",
    source: "flex-area",
    type: "fill",
    minzoom: 8,
    paint: {
      "fill-color": ["case", ["has", "fill"], ["get", "fill"], color],
      "fill-opacity": [
        "case",
        ["has", "fill-opacity"],
        ["get", "fill-opacity"],
        0.5,
      ],
    },
  };
  const outlineStyle: LineLayer = {
    id: "flex-area-outline",
    source: "flex-area",
    type: "line",
    minzoom: 8,
    paint: {
      "line-color": ["case", ["has", "stroke"], ["get", "stroke"], "black"],
      "line-opacity": [
        "case",
        ["has", "stroke-opacity"],
        ["get", "stroke-opacity"],
        1,
      ],
      "line-width": [
        "case",
        ["has", "stroke-width"],
        ["get", "stroke-width"],
        3,
      ],
    },
  };
  return { fillStyle, outlineStyle };
};
const polygonStyle = (id: string, color: string) => {
  const style: FillLayer = {
    id: id,
    source: id,
    type: "fill",
    paint: {
      "fill-color": color,
      "fill-opacity": 0.5,
    },
  };
  return style;
};
const lineStyle = (id: string, color: string) => {
  const style: LineLayer = {
    id: id,
    source: id,
    type: "line",
    paint: {
      "line-color": [
        "case",
        ["has", "route_color"], // Check if the property 'route_color' exists
        [
          "concat",
          "#",
          ["get", "route_color"], // Concatenate "#" with route_color value
        ], // If it exists, use its value for line-color
        color, // If 'route_color' doesn't exist, use a default color
      ],
      "line-width": 6,
    },
  };
  return style;
};

export const LineSourceLayer = ({
  id,
  color,
  file,
}: {
  id: string;
  file: string;
  color: string;
}) => {
  const style = lineStyle(id, color);
  return (
    <Source id={id} type="geojson" data={file}>
      <Layer {...style} beforeId="road-label-small"></Layer>
    </Source>
  );
};

export const PolygonSourceLayer = ({
  id,
  color,
  file,
}: {
  id: string;
  file: string;
  color: string;
}) => {
  const style = polygonStyle(id, color);
  return (
    <Source id={id} type="geojson" data={file}>
      <Layer {...style} beforeId="tunnel-oneway-arrows-blue-minor"></Layer>
    </Source>
  );
};

export const PointSourceLayer = ({
  file,
  icon,
}: {
  file: string;
  icon: string;
}) => {
  const [data, setData] = useState<FeatureCollection<Point> | null>(null);
  const updateData = async () => {
    const _data = await getJsonFile(file);
    setData(_data);
  };
  useEffect(() => {
    updateData();
  }, []); // eslint-disable-line

  return (
    <>
      {data &&
        data.features.map((item) => {
          return (
            <Marker
              key={crypto.randomUUID()}
              longitude={item.geometry.coordinates[0]}
              latitude={item.geometry.coordinates[1]}
              anchor="bottom"
            >
              <img src={icon} className="marker" />
            </Marker>
          );
        })}
    </>
  );
};

export const FlexAreas = () => {
  const style = flexAreaStyle("#795548");

  return (
    <Source id="flex-areas" type="geojson" data="flex-areas.geojson">
      <Layer {...style.fillStyle} beforeId="road-label-small"></Layer>
      <Layer {...style.outlineStyle} beforeId="road-label-small"></Layer>
    </Source>
  );
};

export const Routes = ({ filter }: { filter: string | null }) => {
  const _filter = useMemo(
    () =>
      filter ? ["==", "route_short_name", filter] : ["has", "route_short_name"],
    [filter],
  );

  const style = lineStyle("routes", "#795548");

  const { current: map } = useMap();
  const [popupInfo, setPopupInfo] = useState<null | {
    feature: Feature<Point, Route>;
    lngLat: { lng: number; lat: number };
  }>(null);

  const onClick = useCallback(
    (
      e: FeatureCollection<Point, Route> & {
        lngLat: { lng: number; lat: number };
      },
    ) => {
      if (e.features[0])
        setPopupInfo({ feature: e.features[0], lngLat: e.lngLat });
    },
    [],
  );
  useEffect(() => {
    if (!map) return;
    else {
      map.on("load", () => {
        // @ts-expect-error on click should have 3 arguements
        map?.on("click", "routes", onClick);
      });
    }
    return () => {
      // @ts-expect-error on click should have 3 arguements
      map?.off("click", "routes", onClick);
    };
  }, [map, onClick]);

  return (
    <>
      {popupInfo && (
        <Popup
          anchor="top"
          longitude={popupInfo.lngLat.lng}
          latitude={popupInfo.lngLat.lat}
          onClose={() => setPopupInfo(null)}
        >
          <span className="text-black">
            <strong>Route Name: </strong>
            {popupInfo.feature.properties.route_short_name}
          </span>
        </Popup>
      )}
      <Source id="routes" type="geojson" data="0-routes.json">
        <Layer {...style} beforeId="road-label-small" filter={_filter}></Layer>
      </Source>
    </>
  );
};
export const Stops = () => {
  const style = pointStyle("stops", "#ccb583");
  const { current: map } = useMap();
  const [popupInfo, setPopupInfo] = useState<null | Feature<Point, Stop>>(null);

  const onClick = useCallback((e: FeatureCollection<Point, Stop>) => {
    if (e.features[0]) setPopupInfo(e.features[0]);
  }, []);
  useEffect(() => {
    if (!map) return;
    else {
      map.on("load", () => {
        // @ts-expect-error on click should have 3 arguements
        map?.on("click", "stops", onClick);
      });
    }
    return () => {
      // @ts-expect-error on click should have 3 arguements
      map?.off("click", "stops", onClick);
    };
  }, [map, onClick]);
  return (
    <>
      {popupInfo && (
        <Popup
          anchor="top"
          longitude={popupInfo.geometry.coordinates[0]}
          latitude={popupInfo.geometry.coordinates[1]}
          onClose={() => setPopupInfo(null)}
        >
          <span className="text-black">
            <strong>Stop Name: </strong>
            {popupInfo.properties.stop_name}
          </span>
        </Popup>
      )}
      <Source id="stops" type="geojson" data="0-stops.json">
        <Layer {...style}></Layer>
      </Source>
    </>
  );
};
