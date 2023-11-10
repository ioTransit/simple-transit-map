import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // const env = loadEnv(mode, process.cwd(), "");
  return {
    define: {
      // "process.env.VITE_APP_MAPBOX_KEY": env.VITE_APP_MAPBOX_KEY,
      // "process.env.GTFS_URLS": env.GTFS_URLS,
    },
    plugins: [react()],
  };
});
