import * as glob from "glob";
import fs from "fs";
import AdmZip from "adm-zip";
import axios from "axios";
import gtfs2geojson from "gtfs2geojson";
import { GTFS_URLS } from "../../config/env";
import path from "path";

const createGeojsonFromGtfs = async (url) => {
  const body = await axios.get(url, {
    responseType: "arraybuffer",
  });
  const zip = new AdmZip(body.data); // eslint-disable-line
  const zipEntries = zip.getEntries(); // eslint-disable-line
  if (!zipEntries || !zipEntries.length) return;

  const getFile = (fileName) =>
    zipEntries.find((zipEntry) => {
      return zipEntry.entryName === fileName;
    });

  const stopsFile = getFile("stops.txt");
  const tripsFile = getFile("trips.txt");
  const routesFile = getFile("routes.txt");
  const shapesFile = getFile("shapes.txt");

  const stopsGeojson = stopsFile
    ? gtfs2geojson.stops(zip.readAsText(stopsFile.entryName))
    : null;
  const routesGeojson =
    tripsFile && routesFile && shapesFile
      ? gtfs2geojson.routes(
          zip.readAsText(shapesFile.entryName),
          zip.readAsText(routesFile.entryName),
          zip.readAsText(tripsFile.entryName),
        )
      : null;
  const tripsGeojson = stopsFile
    ? gtfs2geojson.stops(zip.readAsText(stopsFile.entryName))
    : null;

  return { stopsGeojson, routesGeojson, tripsGeojson };
};
const createEmptyFile = async (filePath) => {
  try {
    fs.writeFile(filePath, "", (error) => {
      if (error) {
        console.error(`Error creating empty file: ${error.message}`);
      } else {
        console.log(`Empty file created at ${filePath}`);
      }
    });
  } catch (error) {
    console.error(`Error creating empty file: ${error.message}`);
  }
};

const loopThroughAgencies = async () => {
  for (let i = 0; i < GTFS_URLS.length; i++) {
    const agencyUrl = GTFS_URLS[i];
    const { stopsGeojson, routesGeojson, tripsGeojson } =
      await createGeojsonFromGtfs(agencyUrl);

    await createEmptyFile(`./public/${i}-trips.json`);
    await createEmptyFile(`./public/${i}-routes.json`);
    await createEmptyFile(`./public/${i}-stops.json`);

    fs.writeFileSync(`./public/${i}-trips.json`, JSON.stringify(tripsGeojson));
    fs.writeFileSync(`./public/${i}-stops.json`, JSON.stringify(stopsGeojson));
    fs.writeFileSync(
      `./public/${i}-routes.json`,
      JSON.stringify(routesGeojson),
    );
  }
  generateCatalogue();
};

export function generateCatalogue() {
  const jsonFiles = glob.sync(`./public/*.json`);
  const filteredJsonFiles = jsonFiles.filter(
    (file) => path.basename(file) !== "catalogue.json",
  );
  const fileNamesArray = filteredJsonFiles.map((file) => path.basename(file));

  // Write the array of file names to catalogue.json
  fs.writeFileSync(
    path.join("./public", "catalogue.json"),
    JSON.stringify({ files: fileNamesArray }, null, 2),
  );

  console.log("Catalogue generated successfully.");
}
loopThroughAgencies();
