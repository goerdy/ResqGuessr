let map;
let settings;
let locations;
let currentLocation;
let timerInterval = null;
let timeLeft;
let markerGroup = null;  // Initialisierung von markerGroup
let polyline;  // Variable zum Speichern der Linie
let currentGeoJSONStreet = null; // Aktuelle GeoJSON-Straße
let streetLayer = null;  // Variable zum Speichern der Straßen-Layer

// Funktion zum Initialisieren der Karte mit den Einstellungen aus settings.json
function initMap() {
    const mapCenter = [settings.map.center.latitude, settings.map.center.longitude];
    const mapZoom = settings.map.zoom;

    map = L.map('map').setView(mapCenter, mapZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap-Mitwirkende'
    }).addTo(map);

    // Initialisierung der markerGroup, um alle Marker zu verwalten
    markerGroup = L.layerGroup().addTo(map);
}

// Funktion zum Laden von GeoJSON-Dateien für Straßen
function loadStreetGeoJSON(callback) {
    // Hole die Liste aller GeoJSON-Dateien aus 'streets.json'
    fetch('streets/streets.json')
        .then(response => response.json())
        .then(files => {
            // Eine zufällige Datei aus der Liste auswählen
            const randomIndex = Math.floor(Math.random() * files.length);
            const randomStreetFile = files[randomIndex];

            // GeoJSON-Datei der Straße abrufen und speichern
            fetch(`streets/${randomStreetFile}`)
                .then(response => response.json())
                .then(data => {
                    currentGeoJSONStreet = data;
                    if (callback) callback();
                })
                .catch(error => {
                    console.error('Fehler beim Laden der GeoJSON-Datei:', error);
                });
        })
        .catch(error => {
            console.error('Fehler beim Abrufen der GeoJSON-Dateien:', error);
        });
}

// Funktion zum Laden der Projektinformationen
function loadProjectInfo() {
    document.getElementById('project-title').innerText = settings.title;
    document.getElementById('modal-description').innerText = settings.description;
    document.getElementById('modal-maintainer').innerText = "Maintainer: " + settings.maintainer.name + ", " + settings.maintainer.organization;
    document.getElementById('modal-email').innerText = "E-Mail: " + settings.maintainer.email;
}

// Timer-Funktion
function startTimer(duration, callback) {
    timeLeft = duration;
    document.getElementById('time-left').innerText = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('time-left').innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            callback();
        }
    }, 1000);
}

// Funktion zum Starten des Spiels
function startGame() {
    // Vorherigen Timer stoppen
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Start-Button deaktivieren
    document.getElementById('start-button').disabled = true;

    // Vorherige Marker, Linie und Straßen-Layer entfernen
    markerGroup.clearLayers();
    if (polyline) {
        map.removeLayer(polyline);
    }
    if (streetLayer) {
        map.removeLayer(streetLayer);
        streetLayer = null;
    }

    // Feedback zurücksetzen
    document.getElementById('feedback').innerText = '';
    document.getElementById('feedback').className = '';

    // Karte zurücksetzen
    map.setView([settings.map.center.latitude, settings.map.center.longitude], settings.map.zoom);

    // Überprüfen, welche Gruppen ausgewählt sind
    const selectedGroups = Array.from(document.querySelectorAll('#group-select input[type=checkbox]:checked')).map(checkbox => checkbox.value);
    const filteredLocations = locations.filter(loc => selectedGroups.includes(loc.group));
    const includeStreets = selectedGroups.includes('Streets');

    // Überprüfen, ob Orte oder Straßen vorhanden sind
    if (filteredLocations.length === 0 && !includeStreets) {
        document.getElementById('feedback').innerText = 'Keine Orte in dieser Gruppe gefunden.';
        document.getElementById('feedback').className = 'feedback-negative';
        document.getElementById('start-button').disabled = false;
        return;
    }

    // Zufällig entscheiden, ob ein POI oder eine Straße ausgewählt wird
    if (includeStreets && (filteredLocations.length === 0 || Math.random() < 0.5)) {
        loadStreetGeoJSON(() => {
            // Name der Straße anzeigen (Dateiname ohne Erweiterung)
            const streetName = currentGeoJSONStreet.features[0].properties.name || 'Unbekannte Straße';
            document.getElementById('location-name').innerText = streetName;
            // Timer starten
            startTimer(settings.timeLimit, handleTimeout);
            // Klick-Event hinzufügen
            map.on('click', onMapClick);
        });
    } else {
        const randomIndex = Math.floor(Math.random() * filteredLocations.length);
        currentLocation = filteredLocations[randomIndex];
        currentGeoJSONStreet = null;
        // Ort anzeigen
        document.getElementById('location-name').innerText = currentLocation.name;
        // Timer starten
        startTimer(settings.timeLimit, handleTimeout);
        // Klick-Event hinzufügen
        map.on('click', onMapClick);
    }
}

// Timer-Callback bei Ablauf der Zeit
function handleTimeout() {
    document.getElementById('feedback').innerText = '⏰ Zeit abgelaufen!';
    document.getElementById('feedback').className = 'feedback-negative';
    map.off('click', onMapClick);
    document.getElementById('start-button').disabled = false;

    // Wenn es sich um eine Straße handelt, zeigen wir die Straße an
    if (currentGeoJSONStreet) {
        streetLayer = L.geoJSON(currentGeoJSONStreet).addTo(map);
    }
}

// Verarbeitung des Kartenklicks
function onMapClick(e) {
    clearInterval(timerInterval);
    timerInterval = null;
    map.off('click', onMapClick);

    const userLatLng = e.latlng;
    let actualLatLng;

    if (currentGeoJSONStreet) {
        // Für Straßen: Berechne den nächstgelegenen Punkt auf allen Features der Straße zur Benutzerauswahl
        let minDistance = Infinity;
        currentGeoJSONStreet.features.forEach(feature => {
            const coordinates = feature.geometry.coordinates;
            coordinates.forEach(coord => {
                const latLng = L.latLng(coord[1], coord[0]);
                const distance = userLatLng.distanceTo(latLng);
                if (distance < minDistance) {
                    minDistance = distance;
                    actualLatLng = latLng;
                }
            });
        });
    } else {
        actualLatLng = L.latLng(currentLocation.latitude, currentLocation.longitude);
    }

    const distance = userLatLng.distanceTo(actualLatLng); // Berechnung der Entfernung in Metern

    // Überprüfung, ob der Abstand innerhalb der zulässigen Distanz liegt
    let feedbackMessage;
    if (distance <= settings.maxDistance) {
        feedbackMessage = `✔️ Richtig! Entfernung: ${Math.round(distance)} Meter`;
        document.getElementById('feedback').className = 'feedback-positive';
    } else {
        feedbackMessage = `❌ Falsch! Entfernung: ${Math.round(distance)} Meter`;
        document.getElementById('feedback').className = 'feedback-negative';
    }
    document.getElementById('feedback').innerText = feedbackMessage;

    // Lokales blaues Icon für den Benutzer
    const userIcon = L.icon({
        iconUrl: 'assets/marker-icon-blue.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Lokales grünes Icon für die richtige Position
    const correctLocationIcon = L.icon({
        iconUrl: 'assets/marker-icon-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Benutzerklick und korrekte Position hinzufügen
    L.marker(userLatLng, { icon: userIcon, title: 'Ihre Auswahl' }).addTo(markerGroup);
    L.marker(actualLatLng, { icon: correctLocationIcon, title: 'Richtiger Ort' }).addTo(markerGroup);

    // Linie zwischen den beiden Punkten zeichnen
    const latlngs = [userLatLng, actualLatLng];
    polyline = L.polyline(latlngs, { color: 'red' }).addTo(map);

    // Karte zoomen, um beide Punkte zu zeigen
    const bounds = L.latLngBounds([userLatLng, actualLatLng]);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Start-Button wieder aktivieren
    document.getElementById('start-button').disabled = false;

    // Wenn es sich um eine Straße handelt, Straße auf der Karte anzeigen
    if (currentGeoJSONStreet) {
        streetLayer = L.geoJSON(currentGeoJSONStreet).addTo(map);
    }
}

// Einstellungen und Orte laden
function loadSettingsAndLocations() {
    return fetch('settings.json')
        .then(response => response.json())
        .then(data => {
            settings = data;
            loadProjectInfo();
            initMap();
        })
        .catch(error => console.error('Fehler beim Laden der Einstellungen:', error));
}

function loadLocations() {
    return fetch('locations.json')
        .then(response => response.json())
        .then(data => {
            locations = data;
        });
}

// Modal-Interaktionen
function setupHelpModal() {
    const modal = document.getElementById('help-modal');
    const btn = document.getElementById('help-button');
    const span = document.getElementsByClassName('close')[0];

    // Öffnet das Modal
    btn.onclick = function () {
        modal.style.display = 'block';
    }

    // Schließt das Modal, wenn der Nutzer auf das "x" klickt
    span.onclick = function () {
        modal.style.display = 'none';
    }

    // Schließt das Modal, wenn der Nutzer außerhalb des Modals klickt
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    Promise.all([loadSettingsAndLocations(), loadLocations()])
        .then(() => {
            document.getElementById('start-button').addEventListener('click', startGame);
            setupHelpModal();
        });
});
