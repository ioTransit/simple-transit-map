# Simple Transit Map

Simple Transit Map is a way for transit agencies to generate simple to use transit maps that stay up to date with their [GTFS](https://www.gtfs.org). This common data set is made up of zipped csv files that show the agency(ies) schedules, but do not have geojson currently supported in the specification. In order for transit agencies to communicate in the 21st century agencies need to show off their routes in simple online maps.

That is where Simple Transit Map Steps in. Through preconfigured Github actions it will pull down the gtfs(s) of your choosing and create geojson that will automatically get updated at the interval of your choosing using a chron schedule.

At this moment Simple Transit Map is to be used for Transit agencies that just want a simple way to show and maintain their routes and is not trying to make it routable. This is a simple visualization of where routes go and the daily footprint of their route alignment. Because of this simplicity it is extremely easy to setup, but in order to extend the work of this repo additional work will need to be done.

## Configuration

In order for you to setup this map you will need to configure the `.env` file you will need to add the Mapbox api key and gtfs url's. You can do this by copying and configuring the `.example.env` file and update with your parameters.
