import "./App.css";
import { GtfsLayers, MapComponent } from "./components/map";
import "mapbox-gl/dist/mapbox-gl.css";

function App() {
  return (
    <>
      <MapComponent
        className="map"
        MAPBOX_API_KEY={import.meta.env.VITE_APP_MAPBOX_KEY ?? ""}
        options={{
          container: "map-container",
        }}
      >
        <GtfsLayers> </GtfsLayers>
      </MapComponent>
    </>
  );
}

export default App;
