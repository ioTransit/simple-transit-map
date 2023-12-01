import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

// Only use on the server
const envSchema = z.object({
  VITE_APP_MAPBOX_KEY: z
    .string()
    .min(1, { message: "MAPBOX_API_KEY required" }),
  GTFS_URL: z.string().min(1, { message: "MAPBOX_API_KEY required" }),
});
export const { GTFS_URL, VITE_APP_MAPBOX_KEY } = envSchema.parse(process.env);
