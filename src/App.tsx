import "./App.css";
import type { Route } from "gtfs-types";
import Map, { useControl, useMap } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useState } from "react";
import { FlexAreas, Routes, Stops } from "./SystemLayers";
import mapboxgl, { LngLatBoundsLike } from "mapbox-gl";
import { FeatureCollection, MultiLineString, Polygon, Position } from "geojson";
import { sortBy } from "lodash";
import clsx from "clsx";
//@ts-expect-error issue with import
import * as turf from "@turf/turf";
//@ts-expect-error issue with import
import bbox from "@turf/bbox"; // es-lint-disable-line
import { z } from "zod";

const zFlexArea = z.object({
  name: z.string().min(1),
  fill: z.string().optional(),
});

function App() {
  const [flexArea, setFlexArea] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [bounds, setBounds] = useState<LngLatBoundsLike | null>(null);
  const [flexAreas, setFlexAreas] = useState<FeatureCollection<
    Polygon,
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
        Polygon,
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
          <Stops></Stops>
          <Tools></Tools>
          <LayersPanel
            filter={filter}
            routes={routes}
            flexAreas={flexAreas}
            setFlexArea={setFlexArea}
            flexArea={flexArea}
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
  flexArea,
  flexAreas,
  filter,
  setFlexArea,
  setFilter,
  bounds,
}: {
  routes: FeatureCollection<MultiLineString, Route> | null;
  flexAreas: FeatureCollection<Polygon, z.infer<typeof zFlexArea>> | null;
  setFlexArea: (flexAreaName: string | null) => void;
  flexArea: string | null;
  filter: string | null;
  setFilter: (e: string | null) => void;
  bounds: LngLatBoundsLike;
}) => {
  const { current: map } = useMap();
  const [currentTab, setCurrentTab] = useState<string>("Routes");
  const clickFlexArea = useCallback(
    (flexAreaName: string | null) => {
      if (!map) return;
      if (flexArea === flexAreaName) {
        setFlexArea(null);
        map.fitBounds(bounds);
      } else {
        setFlexArea(flexAreaName);
        const area = flexAreas?.features.find(
          (feature) => feature.properties.name === flexAreaName,
        );
        if (!area) return;
        if (area.geometry.type === "Polygon") {
          map?.fitBounds(bbox(turf.polygon(area.geometry.coordinates)), {
            padding: 150,
          });
        } else if (area.geometry.type === "MultiPolygon") {
          map?.fitBounds(bbox(turf.multiPolygon(area.geometry.coordinates)), {
            padding: 150,
          });
        }
      }
    },
    [map, bounds, setFlexArea, flexAreas?.features, flexArea],
  );
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

  const tabClick = (id: string) => {
    setCurrentTab(id);
  };

  return (
    <div
      id="layer-panel"
      className="absolute left-6 top-6 bg-white p-6 flex flex-col box-shadow max-w-md max-h-[50%] shadow-xl"
    >
      <div className="flex gap-1 pl-1 border-b-gray-300 border-b ">
        <Tab
          title="Routes"
          onClick={tabClick}
          isActive={currentTab === "Routes"}
        ></Tab>
        {flexAreas && (
          <Tab
            onClick={tabClick}
            title="Flex Areas"
            isActive={currentTab === "Flex Areas"}
          ></Tab>
        )}
      </div>
      <div className="pt-3 grid gap-3 w-full overflow-auto">
        {routes &&
          currentTab === "Routes" &&
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
                <Button
                  key={route.id}
                  name={route.properties.route_short_name || null}
                  onClick={clickButton}
                  isActive={filter === route.properties.route_short_name}
                  fillColor={`#${route.properties.route_color}`}
                />
              );
            })}
      </div>
      {flexAreas && currentTab === "Flex Areas" && (
        <div className="grid gap-3 overflow-auto">
          {flexAreas.features
            .sort((a, b) => {
              if (!a.properties.name || !a.properties.name) return 0;
              else if (a.properties.name > b.properties.name) return 1;
              else return 0;
            })
            .map((area) => {
              return (
                <Button
                  name={area.properties.name}
                  onClick={clickFlexArea}
                  isActive={filter === area.properties.name}
                />
              );
            })}
        </div>
      )}
    </div>
  );
};

const Button = ({
  name,
  onClick,
  fillColor,
  isActive,
}: {
  name: string | null;
  fillColor?: string;
  isActive: boolean;
  onClick: (name: string | null) => void;
}) => {
  return (
    <button
      onClick={() => onClick(name || null)}
      className={clsx(
        "bg-gray-100 text-gray-700 w-full flex gap-3 truncate h-10 items-center",
        isActive && "bg-gray-300",
      )}
    >
      {fillColor && (
        <div
          className="w-6 h-6"
          style={{
            backgroundColor: fillColor,
          }}
        ></div>
      )}
      <span>{name}</span>
    </button>
  );
};

const Tools = () => {
  useControl(() => new mapboxgl.NavigationControl());
  return null;
};

const Tab = ({
  title,
  onClick,
  isActive,
}: {
  onClick: (id: string) => void;
  title: string;
  isActive: boolean;
}) => {
  return (
    <button
      onClick={() => onClick(title)}
      className={clsx(
        "text-base py-2 h-10 rounded-b-none text-gray-500 overflow-auto",
        isActive ? "bg-gray-500 text-white" : "bg-gray-200",
      )}
    >
      {title}
    </button>
  );
};

export default App;
