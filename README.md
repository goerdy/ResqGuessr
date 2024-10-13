
# ResqGuessr
Local Knowledge Training Tool for Rescue Workers, inspired by GeoGuessr

This tool is designed to help rescue workers, such as ambulance drivers, improve their knowledge of streets and important points of interest (POIs) in their area. Users are given the name of a POI, such as hospitals, nursing homes, or fire stations, or a street name, and must select the correct location on the map. This helps responders navigate more efficiently to critical destinations, making it ideal for training and improving response times.

## Features
- Utilizes [Leaflet](https://leafletjs.com/) and [OpenStreetMap](https://www.openstreetmap.org/) for map visualization and interaction.
- Customizable POI and street data.
- Responsive design for web-based training.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/goerdy/ResqGuessr.git
   ```

2. **Copy to your web server or start a local web server**

3. **Configure**
   - `settings.json` (basic information, center of the map, and default zoom level):
   ```json
   {
       "title": "Title of your Instance, maybe your Cityname",
       "description": "A short description about the purpose and the target group, this is shown in the help dialog",
       "timeLimit": 30, // seconds to click, reduce to increase the difficulty
       "maxDistance": 500, // allowed distance between users click and the POIs possition in meters, reduce to increse difficulty
       "map": {
           "center": {
               "latitude": 53.549487, // center of the Map
               "longitude": 8.100014 // could be your citycenter
           },
           "zoom": 12 //zoomlevel, adjust to fit your are in one Map window
       },
       "maintainer": {
           "name": "Your Name",
           "organization": "Yor Organisations name",
           "email": "yourName@YourOrganisation.xyz"
       },
       "version": "0.0.2",
       "license": "MIT License",
       "github": "https://github.com/goerdy/ResqGuessr"
   }
   ```

    - `locations.json` (enter your POIs with name, longitude, and latitude).
   ```json
   [
    {
        "name": "Your POI 1",
        "latitude": 53.545714,
        "longitude": 8.082805,
        "group": "Kliniken"
    },
    {
        "name": "Your POI 2",
        "latitude": 53.516567,
        "longitude": 8.120608,
        "group": "Pflegeheime"
    },
   ]
   ```
     
   - `streets.json` (feature coming soon).
