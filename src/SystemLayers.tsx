import { useEffect, useMemo, useState } from "react";
import {
  Layer,
  FillLayer,
  LineLayer,
  Source,
  Marker,
  CircleLayer,
} from "react-map-gl";
import { getJsonFile } from "./lib";
import { FeatureCollection, Point } from "geojson";

const pointStyle = (id: string, color: string, minzoom: number = 12) => {
  const style: CircleLayer = {
    id: id,
    source: id,
    type: "circle",
    minzoom,
    paint: {
      "circle-radius": 10,
      "circle-color": color,
    },
  };
  return style;
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

export const Stops = ({ filter }: { filter: string | null }) => {
  const _filter = useMemo(
    () =>
      filter ? ["==", "route_short_name", filter] : ["has", "route_short_name"],
    [filter],
  );

  const style = pointStyle("stops", "#795548");

  return (
    <Source id="routes" type="geojson" data="0-stops.json">
      <Layer {...style} beforeId="road-label-small" filter={_filter}></Layer>
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

  return (
    <Source id="routes" type="geojson" data="0-routes.json">
      <Layer {...style} beforeId="road-label-small" filter={_filter}></Layer>
    </Source>
  );
};
