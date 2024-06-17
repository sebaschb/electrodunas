import React, { useEffect, useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserDetail from "../components/userDetail";
import proj4 from "proj4";
import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Style, Icon } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

async function fetchUsers() {
  try {
    const res = await fetch(`http://localhost:5000/api/users`);
    if (!res.ok) {
      throw new Error("Error al cargar los marcadores");
    }
    const data = await res.json();
    return data;
  } catch (error) {
    toast.error(error.message);
    return [];
  }
}

async function fetchLatestAlertsColors() {
  try {
    const res = await fetch(
      `http://localhost:5000/api/alerts-summary-latest-color`
    );
    if (!res.ok) {
      throw new Error("Error al cargar el tipo de alerta del marcador");
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
    toast.error("Error al cargar el tipo de alerta del marcador");
    return {};
  }
}

proj4.defs(
  "UTM",
  "+proj=utm +zone=18 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs"
);
proj4.defs("WGS84", "+proj=longlat +datum=WGS84 +no_defs");

const convertCoordinates = (x, y) => {
  const utmProjection = proj4("UTM");
  const wgs84Projection = proj4("WGS84");
  const olProjection = proj4("EPSG:3857");

  const xFloat = parseFloat(x);
  const yFloat = parseFloat(y);

  if (Number.isFinite(xFloat) && Number.isFinite(yFloat)) {
    const [lon, lat] = proj4(utmProjection, wgs84Projection, [xFloat, yFloat]);

    const [convertedLon, convertedLat] = proj4(wgs84Projection, olProjection, [
      lon,
      lat,
    ]);

    return { lat: convertedLat, lng: convertedLon };
  } else {
    return { lat: 0, lng: 0 };
  }
};

const MapComponent = () => {
  const peruCenter = proj4("EPSG:4326", "EPSG:3857", [-75.254692, -14.154816]);

  const [markersLoaded, setMarkersLoaded] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [alertColors, setAlertColors] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAlertColor, setSelectedAlertColor] = useState("all");
  const [key, setKey] = useState(0);

  useEffect(() => {
    fetchUsers()
      .then((users) => {
        setMarkers(users);
      })
      .catch((error) => {
        console.error(error);
      });

    fetchLatestAlertsColors()
      .then((colors) => {
        setAlertColors(colors);
        setMarkersLoaded(true);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    if (markersLoaded && markers.length > 0) {
      const markerFeatures = markers
        .map((marker) => {
          const { lat, lng } = convertCoordinates(
            marker.sed_x_coordinate,
            marker.sed_y_coordinate
          );

          const alertType = alertColors[marker.id] || "normal";

          let markerColor;

          switch (alertType) {
            case "low":
              markerColor = "yellow";
              break;
            case "medium":
              markerColor = "orange";
              break;
            case "high":
              markerColor = "red";
              break;
            default:
              markerColor = "blue";
              break;
          }

          return new Feature({
            geometry: new Point([lng, lat]),
            markerInfo: marker,
            markerColor,
          });
        })
        .filter((feature) => {
          const geometry = feature.getGeometry();
          return (
            geometry instanceof Point &&
            geometry.getCoordinates().every(Number.isFinite)
          );
        });

      const markerSource = new VectorSource({
        features: markerFeatures,
      });

      const markerLayerMedium = new VectorLayer({
        source: markerSource,
        style: function (feature) {
          const markerColor = feature.get("markerColor");
          if (markerColor === "orange") {
            return new Style({
              image: new Icon({
                anchor: [1, 1],
                src: `http://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`,
                scale: 1,
              }),
            });
          }
        },
      });

      const markerLayerLow = new VectorLayer({
        source: markerSource,
        style: function (feature) {
          const markerColor = feature.get("markerColor");
          if (markerColor === "yellow") {
            return new Style({
              image: new Icon({
                anchor: [1, 1],
                src: `http://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`,
                scale: 1,
              }),
            });
          }
        },
      });

      const markerLayerHigh = new VectorLayer({
        source: markerSource,
        style: function (feature) {
          const markerColor = feature.get("markerColor");
          if (markerColor === "red") {
            return new Style({
              image: new Icon({
                anchor: [1, 1],
                src: `http://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`,
                scale: 1,
              }),
            });
          }
        },
      });

      const markerLayerAll = new VectorLayer({
        source: markerSource,
        style: function (feature) {
          const markerColor = feature.get("markerColor");
          return new Style({
            image: new Icon({
              anchor: [1, 1],
              src: `http://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`,
              scale: 1,
            }),
          });
        },
      });

      const map = new Map({
        target: "map",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: peruCenter,
          zoom: 8.7,
        }),
      });

      console.log(map.getLayers());

      switch (selectedAlertColor) {
        case "all":
          map.addLayer(markerLayerAll);
          break;

        case "high":
          map.addLayer(markerLayerHigh);
          break;

        case "low":
          map.addLayer(markerLayerLow);
          break;

        case "medium":
          map.addLayer(markerLayerMedium);
          break;

        default:
          break;
      }

      map.on("click", function (e) {
        map.forEachFeatureAtPixel(e.pixel, function (feature) {
          const markerInfo = feature.get("markerInfo");
          setSelectedMarker(markerInfo);
          setShowModal(true);
        });
      });
    }
  }, [markersLoaded, markers, alertColors, peruCenter, selectedAlertColor]);

  return (
    <div className="map-container" style={{ overflow: "hidden" }}>
      <div className="d-flex justify-content-end mb-3">
        <label htmlFor="filter-select" className="my-auto">
          Seleccione los marcadores que desea visualizar:
        </label>
        <select
          id="filter-select"
          value={selectedAlertColor}
          onChange={(e) => {
            setSelectedAlertColor(e.target.value);
            setKey((prevKey) => prevKey + 1);
          }}
          className="filter-select"
        >
          <option value="all">Mostrar Todos</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>

      {loading && (
        <div className="loading-message">
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <div className="loading-text">Cargando marcadores...</div>
        </div>
      )}
      <div key={key} id="map" className="map"></div>
      <UserDetail
        show={showModal}
        handleClose={() => setShowModal(false)}
        user={selectedMarker}
      />
      <ToastContainer />
    </div>
  );
};

export default MapComponent;
