import "./App.css";
import type { Route } from "gtfs-types";
import Map, { useControl, useMap } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useState } from "react";
import { FlexAreas, Routes, Stops } from "./SystemLayers";
import mapboxgl, { LngLatBoundsLike } from "mapbox-gl";
import {
  FeatureCollection,
  MultiLineString,
  MultiPolygon,
  Position,
} from "geojson";
import { sortBy } from "lodash";
import clsx from "clsx";
//@ts-expect-error issue with import
import * as turf from "@turf/turf";
//@ts-expect-error issue with import
import bbox from "@turf/bbox"; // es-lint-disable-line
import { z } from "zod";

const zFlexArea = z.object({
  name: z.string().min(1),
  "fill-color": z.string().optional(),
});

function App() {
  const [filter, setFilter] = useState<string | null>(null);
  const [bounds, setBounds] = useState<LngLatBoundsLike | null>(null);
  const [flexAreas, setFlexAreas] = useState<FeatureCollection<
    MultiPolygon,
    z.infer<typeof zFlexArea>
  > | null>(null);
  const [routes, setRoutes] = useState<FeatureCollection<
    MultiLineString,
    Route
  > | null>(null);

  const setupBounds = async () => {
    const resp = await fetch("bounds.json");
    const _bounds = (await resp.json()) as LngLatBoundsLike;
    setBounds(_bounds);
  };

  const setupFlexAreas = async () => {
    try {
      const resp = await fetch("flex-areas.geojson");
      const areas = (await resp.json()) as FeatureCollection<
        MultiPolygon,
        z.infer<typeof zFlexArea>
      >;
      setFlexAreas(areas);
    } catch (e) {
      console.warn("no flex areas found");
      return;
    }
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
    setupFlexAreas();
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
          <FlexAreas></FlexAreas>
          <Routes filter={filter}></Routes>
          <Stops filter={filter}></Stops>
          <Tools></Tools>
          <LayersPanel
            filter={filter}
            routes={routes}
            flexAreas={flexAreas}
            setFilter={setFilter}
            bounds={bounds}
          ></LayersPanel>
        </Map>
      )}
    </>
  );
}

const LayersPanel = ({
  routes,
  flexAreas,
  filter,
  setFilter,
  bounds,
}: {
  routes: FeatureCollection<MultiLineString, Route> | null;
  flexAreas: FeatureCollection<MultiPolygon, z.infer<typeof zFlexArea>> | null;
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
      {flexAreas && (
        <>
          {" "}
          <h2 className="layer-group-panel">Flex Areas</h2>
          {flexAreas && (
            <div className="layer-group">
              {flexAreas.features
                .sort((a, b) => {
                  if (!a.properties.name || !a.properties.name) return 0;
                  else if (a.properties.name > b.properties.name) return 1;
                  else return 0;
                })
                .map((area) => {
                  return (
                    <button
                      key={area.properties.name}
                      onClick={() => clickButton(area.properties.name || null)}
                      className={clsx(
                        "layer-button",
                        filter === area.properties.name && "active",
                      )}
                    >
                      {
                        <div
                          className="route-color-symbol"
                          style={{
                            backgroundColor: `#${area.properties["fill-color"]}`,
                          }}
                        ></div>
                      }
                      <span>{area.properties.name}</span>
                    </button>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Tools = () => {
  useControl(() => new mapboxgl.NavigationControl());
  return null;
};

export default App;
