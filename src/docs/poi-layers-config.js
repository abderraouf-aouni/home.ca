/**
 * POI Layers Map Configuration
 */
const poiLayersConfig = {
  mapbox: {
    accessToken:
      "pk.eyJ1Ijoia3dhbGtlcnRjdSIsImEiOiJMRk9JSmRvIn0.l1y2jHZ6IARHM_rA1-X45A",
    style: "mapbox://styles/mapbox/standard",
    center: [-79.536863734531423, 43.998797226393421],
    zoom: 11,
  },

  baseData: {
    sourceId: "york-region-base",
    url: "york_region_ada_data.geojson",
    idField: "ada_id",
    valueField: "homeownership_rate",
    labelField: "ada_id",
  },

  poiData: {
    sourceId: "york-region-pois",
    url: "york_region_pois.geojson",
    typeField: "poi_type", // for filtering
    iconField: "icon", // must match your icon filenames
    sizeField: "size", // controls icon-size per feature
    textField: "price_text", // only sale/rent/pre features have this
    customPhotoField: "custom_photo_url",
  },

  baseLayers: {
    fill: {
      id: "york-region-fill",
      paint: {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["get", "homeownership_rate"],
          40,
          "#440154",
          55,
          "#3e4989",
          70,
          "#26828e",
          80,
          "#35b779",
          90,
          "#6ece58",
          100,
          "#fde725",
        ],
        "fill-opacity": 0.6,
      },
    },
    outline: {
      id: "york-region-outline",
      paint: {
        "line-color": "#fff",
        "line-width": 1,
        "line-opacity": 0.8,
      },
    },
  },
};

if (typeof module !== "undefined") module.exports = { poiLayersConfig };
