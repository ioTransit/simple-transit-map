# Simple Transit Map

Simple Transit Map is a way for transit agencies to generate simple to use transit maps that stay up to date with their [GTFS](https://www.gtfs.org). This common data set is made up of zipped csv files that show the agency(ies) schedules, but do not have geojson currently supported in the specification. In order for transit agencies to communicate in the 21st century agencies need to show off their routes in simple online maps.

That is where Simple Transit Map Steps in. Through preconfigured Github actions it will pull down the gtfs(s) of your choosing and create geojson that will automatically get updated at the interval of your choosing using a chron schedule.

At this moment Simple Transit Map is to be used for Transit agencies that just want a simple way to show and maintain their routes and is not trying to make it routable. This is a simple visualization of where routes go and the daily footprint of their route alignment. Because of this simplicity it is extremely easy to setup, but in order to extend the work of this repo additional work will need to be done.

![Simple Transit Map](https://github.com/AvidDabbler/simple-transit-map/assets/8471756/0306a1a1-a7c5-4906-a6f9-ac357284679b)


## Development
To work with simple transit map you need to be able to provide 2 items to the `.env` the Mapbox API key and the GTFS url that you are working with. You can simply copy the `.example.env` and rename it `.env` and add in your values to it. Then to start development you will need to run `npm run dev` and that will start the development server for the application

### Flex Areas
If you want to add flex areas to the map you just have to add a geojson file to the `/public` directory and name it `flex-areas.geojson` and that will add the geometry to the map. Currently this will support polygons and multipolygons only.


Styling:
In order for you to style your flex areas you are going to need to setup a style in geojson.io and click the `Add Simple Style` button. You can then configure the fill outline color and opacity and those styles will be applied to the map when loaded.

Route Colors
When it comes to route colors these will need to be setup in the GTFS `routes.txt` file itself under the `route_color` field as a hex color.

![Add Simple Style](https://github.com/AvidDabbler/simple-transit-map/assets/8471756/daf9f01d-9863-4223-885b-f6860d3473fa)

Required Fields:
`name`: The name of the area that you want it assigned in the left panel

[Working with GeoJson.io](https://handsondataviz.org/geojsonio.html)

## Configuring the update frequency

[Github Schedule Actions](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
[Crontab interval tool](https://crontab.guru/)


## Deployment
Once you have finished testing and styling your map you are going to need to setup a hosting solution. This code base was designed to be depolyed through Github and using in cooperation with Github actions for easy updates to the schedule information, but this can be hosted on its own server, however, you will need to configure a way to update the schedules on your own using the `npm run gtfs` command on a predetermined schedule using some interface or cron scheduler.

If you end up using Github as a means of deployment and want it to manage the schedule updates for you. You will need to migrate over the `.env` values that you want to use in your Github actions. The instructions for this can be found below. 

On Merge:
This repo has an action that will update on merge so if anything is changed and then merged into the `main` branch that will trigger and update to the production release. This action can be configured wit hthe `deploy.yml` file in the workflows directory.

On Schedule:
By default this schedule will be updated on `2am every Monday` and released after procesing. 

***Mapbox Keys***
It is recommended that you have seperate keys for both development and production so in cased you have to delete that key you have been using on development you will not lose your production environment.

Hosting:
[Vercel](https://vercel.com/)
[Github Pages](https://pages.github.com/)

Managing secrets in Github
[Create Github Actions Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)

[Generating a Map Key](https://docs.mylistingtheme.com/article/how-to-generate-a-mapbox-api-key/)
