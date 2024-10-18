import requests
import json
import os
import re

def sanitize_filename(filename):
    # Replace any character that is not alphanumeric, space, hyphen, or underscore with an underscore
    return re.sub(r'[^a-zA-Z0-9_\-\s]', '_', filename)

def get_osm_geojson(city_name):
    # Overpass API URL for GeoJSON output
    overpass_url = "http://overpass-api.de/api/interpreter"

    # Overpass query to get all streets in the area
    overpass_query = f"""
    [out:json];
    area[name="{city_name}"]->.searchArea;
    way["highway"](area.searchArea);
    (._;>;);
    out geom;
    """

    # Request the data from Overpass API
    response = requests.get(overpass_url, params={'data': overpass_query})

    if response.status_code != 200:
        print(f"Error querying Overpass API: {response.status_code}")
        return None

    osm_data = response.json()

    # Dictionary to store features by street name
    street_features = {}

    # Convert OSM data to valid GeoJSON format
    for element in osm_data['elements']:
        if element['type'] == 'way' and 'geometry' in element:
            street_name = element['tags'].get('name', 'unknown_street')

            # Skip streets with only numerical names or unknown names
            if street_name.isdigit() or street_name == 'unknown_street':
                continue

            coordinates = [(point['lon'], point['lat']) for point in element['geometry']]

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": coordinates
                },
                "properties": {
                    "id": element['id'],
                    "name": street_name,
                    "highway": element['tags'].get('highway', 'unknown')
                }
            }

            if street_name not in street_features:
                street_features[street_name] = []
            street_features[street_name].append(feature)

    # Create directory to store GeoJSON files
    output_dir = f"{city_name.lower().replace(' ', '_')}_streets"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Save each street's data to a separate GeoJSON file
    geojson_files = []
    for street_name, features in street_features.items():
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }

        sanitized_street_name = sanitize_filename(street_name.lower().replace(' ', '_'))
        filename = f"{output_dir}/{sanitized_street_name}.geojson"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, ensure_ascii=False, indent=4)

        geojson_files.append(filename)
        print(f"GeoJSON data for {street_name} successfully saved in {filename}.")

    # Save the list of GeoJSON filenames to a JSON file in the output directory
    index_filename = f"{output_dir}/index.json"
    with open(index_filename, 'w', encoding='utf-8') as f:
        json.dump(geojson_files, f, ensure_ascii=False, indent=4)

    print(f"Index of GeoJSON files successfully saved in {index_filename}.")

    # Save the list of GeoJSON filenames to a JSON file in the main directory
    streets_filename = "streets.json"
    with open(streets_filename, 'w', encoding='utf-8') as f:
        json.dump(geojson_files, f, ensure_ascii=False, indent=4)

    print(f"List of all GeoJSON files successfully saved in {streets_filename}.")

def main():
    print("StreetDownloader for ResqGuessr")
    city_name = input("Please enter the name of the city or area you want to download: ")

    # Fetch the GeoJSON data for all streets in the city
    get_osm_geojson(city_name)

if __name__ == "__main__":
    main()
