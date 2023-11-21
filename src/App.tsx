import "./App.css";
import type { Route } from "gtfs-types";
import Map, { useControl, useMap } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useState } from "react";
import { FlexAreas, Routes, Stops } from "./SystemLayers";
import mapboxgl, { LngLatBoundsLike } from "mapbox-gl";
import { FeatureCollection, MultiLineString, Position } from "geojson";
import { sortBy } from "lodash";
import clsx from "clsx";
//@ts-expect-error issue with import
import * as turf from "@turf/turf";
//@ts-expect-error issue with import
import bbox from "@turf/bbox"; // es-lint-disable-line

function App() {
  const [filter, setFilter] = useState<string | null>(null);
  const [bounds, setBounds] = useState<LngLatBoundsLike | null>(null);
  const [routes, setRoutes] = useState<FeatureCollection<
    MultiLineString,
    Route
  > | null>(null);

  const setupBounds = async () => {
    const resp = await fetch("bounds.json");
    const _bounds = (await resp.json()) as LngLatBoundsLike;
    setBounds(_bounds);
  };

  const setupLayers = async () => {
    const resp = await fetch("0-routes.json");
    const routes = (await resp.json()) as FeatureCollection<
      MultiLineString,
      Route
    >;
    setRoutes({
      ...routes,
      features: sortBy(routes.features, ["route_short_name"], ["asc"]),
    });
  };

  useEffect(() => {
    setupLayers();
    setupBounds();
  }, []);

  return (
    <>
      {bounds && (
        <Map
          mapboxAccessToken={import.meta.env.VITE_APP_MAPBOX_KEY}
          initialViewState={{
            bounds,
          }}
          style={{ width: "100vw", height: "100vh" }}
          mapStyle="mapbox://styles/mapbox/streets-v9"
        >
          <Routes filter={filter}></Routes>
          <Stops filter={filter}></Stops>
          <FlexAreas></FlexAreas>
          <Tools></Tools>
          <RoutesPanel
            filter={filter}
            routes={routes}
            setFilter={setFilter}
            bounds={bounds}
          ></RoutesPanel>
        </Map>
      )}
    </>
  );
}

const RoutesPanel = ({
  routes,
  filter,
  setFilter,
  bounds,
}: {
  routes: FeatureCollection<MultiLineString, Route> | null;
  filter: string | null;
  setFilter: (e: string | null) => void;
  bounds: LngLatBoundsLike;
}) => {
  const { current: map } = useMap();
  const clickButton = useCallback(
    (route_short_name: string | null) => {
      if (filter === route_short_name) {
        setFilter(null);
        if (!map) {
          return;
        }
        map.fitBounds(bounds);
      } else {
        setFilter(route_short_name);
        const _routes = routes?.features.filter(
          (feature) => feature.properties.route_short_name === route_short_name,
        );
        if (!_routes) return;
        let coordinates: Position[] = [];
        for (const feature of _routes) {
          for (const array of feature.geometry.coordinates) {
            coordinates = coordinates.concat(array);
          }
        }
        map?.fitBounds(bbox(turf.lineString(coordinates)), {
          padding: 150,
        });
      }
    },
    [routes, map, filter, bounds, setFilter],
  );

  return (
    <div id="layer-panel">
      <h2 className="layer-group-title">Routes</h2>
      <div className="layer-group">
        {routes &&
          routes.features
            .sort((a, b) => {
              if (
                !a.properties.route_short_name ||
                !a.properties.route_short_name
              )
                return 0;
              else if (
                //@ts-expect-error unreach
                a.properties.route_short_name > b.properties.route_short_name
              )
                return 1;
              else return 0;
            })
            .map((route) => {
              return (
                <button
                  key={route.id}
                  onClick={() =>
                    clickButton(route.properties.route_short_name || null)
                  }
                  className={clsx(
                    "layer-button",
                    filter === route.properties.route_short_name && "active",
                  )}
                >
                  <div
                    className="route-color-symbol"
                    style={{
                      backgroundColor: `#${route.properties.route_color}`,
                    }}
                  ></div>

                  <span>{route.properties.route_short_name}</span>
                </button>
              );
            })}
      </div>
    </div>
  );
};

const Tools = () => {
  useControl(() => new mapboxgl.NavigationControl());
  return null;
};

export default App;
