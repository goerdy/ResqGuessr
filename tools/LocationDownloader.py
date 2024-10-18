import requests
import json

def overpass_query(area_name, amenity):
    query = f"""
    [out:json];
    area[name="{area_name}"]->.suchgebiet;
    (node["amenity"="{amenity}"](area.suchgebiet);
    way["amenity"="{amenity}"](area.suchgebiet);
    relation["amenity"="{amenity}"](area.suchgebiet););
    out center;
    """
    response = requests.post("https://overpass-api.de/api/interpreter", data={'data': query})
    response.raise_for_status()
    return response.json()

def extract_locations(data, group_name):
    locations = []
    for element in data.get("elements", []):
        if "lat" in element and "lon" in element:
            locations.append({
                "name": element.get("tags", {}).get("name", "Unknown"),
                "latitude": element["lat"],
                "longitude": element["lon"],
                "group": group_name
            })
        elif "center" in element:  # For ways and relations, use the center
            locations.append({
                "name": element.get("tags", {}).get("name", "Unknown"),
                "latitude": element["center"]["lat"],
                "longitude": element["center"]["lon"],
                "group": group_name
            })
    return locations

def main():
    area_name = input("Bitte geben Sie den Namen der Gebietskörperschaft ein: ")

    # Abfrage der Daten
    hospitals_data = overpass_query(area_name, "hospital")
    nursing_homes_data = overpass_query(area_name, "nursing_home")
    fire_stations_data = overpass_query(area_name, "fire_station")

    # Extrahieren der relevanten Informationen
    locations = []
    locations.extend(extract_locations(hospitals_data, "Hospitals"))
    locations.extend(extract_locations(nursing_homes_data, "Nursing"))
    locations.extend(extract_locations(fire_stations_data, "Rescue"))

    # Speichern der Daten in einer JSON-Datei
    with open("locations.json", "w", encoding="utf-8") as f:
        json.dump(locations, f, ensure_ascii=False, indent=4)

    print("Die Daten wurden erfolgreich in 'locations.json' gespeichert.")

if __name__ == "__main__":
    main()
