import "./App.css";
import { MapComponent } from "./components/map";
import "mapbox-gl/dist/mapbox-gl.css";

function App() {
  console.log(import.meta.env);
  return (
    <>
      <MapComponent
        className="map"
        MAPBOX_API_KEY={import.meta.env.VITE_APP_MAPBOX_KEY ?? ""}
        options={{
          container: "map-container",
        }}
      ></MapComponent>
    </>
  );
}

export default App;
