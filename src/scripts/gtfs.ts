import * as glob from "glob";
import fs from "fs";
import { GTFS_URLS } from "../../config/env";
import path from "path";
import { Gtfs } from "gtfs-parser";

const createEmptyFile = async (filePath: string) => {
  try {
    fs.writeFile(filePath, "", (error) => {
      if (error) {
        console.error(`Error creating empty file: ${error.message}`);
      } else {
        console.log(`Empty file created at ${filePath}`);
      }
    });
    // eslint-disable-next-line
  } catch (error: any) {
    console.error(`Error creating empty file: ${error.message}`);
  }
};

const loopThroughAgencies = async () => {
  for (let i = 0; i < GTFS_URLS.length; i++) {
    const agencyUrl = GTFS_URLS[i];
    const gtfs = new Gtfs(agencyUrl);
    await gtfs.init();

    const tripsGeojson = await gtfs.tripsToGeojson();
    const routesGeojson = await gtfs.routesToGeojson();
    const stopsGeojson = await gtfs.stopsToGeojson();

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
