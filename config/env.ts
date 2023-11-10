import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

// Only use on the server
const envSchema = z.object({
  VITE_APP_MAPBOX_KEY: z
    .string()
    .min(1, { message: "MAPBOX_API_KEY required" }),
  GTFS_URLS: z
    .string()
    .min(1, { message: "MAPBOX_API_KEY required" })
    .transform((d) => {
      const json = z.array(z.string()).min(1).parse(JSON.parse(d));
      return json;
    }),
});
export const { GTFS_URLS, VITE_APP_MAPBOX_KEY } = envSchema.parse(process.env);
