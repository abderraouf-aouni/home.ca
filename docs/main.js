document.addEventListener("DOMContentLoaded", () => {
  if (window.agCharts) {
    if (
      window.agCharts &&
      agCharts.LicenseManager &&
      typeof agCharts.LicenseManager.setLicenseKey === "function"
    ) {
      agCharts.LicenseManager.setLicenseKey(
        "Using_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-089230}_in_excess_of_the_licence_granted_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_changing_this_key_please_contact_info@ag-grid.com___{Home.ca_AI_Inc.}_is_granted_a_{Single_Application}_Developer_License_for_the_application_{Home.ca}_only_for_{1}_Front-End_JavaScript_developer___All_Front-End_JavaScript_developers_working_on_{Home.ca}_need_to_be_licensed___{Home.ca}_has_not_been_granted_a_Deployment_License_Add-on___This_key_works_with_{AG_Charts_and_AG_Grid}_Enterprise_versions_released_before_{29_May_2026}____[v3]_[0102]_MTc4MDAwOTIwMDAwMA==f316b4bbbe0fac41ee1975fb1ccd13c3"
      );
    }
  }

  switchViews();
  initMiniMap("mini-map");
  initBaseLayersSidebarToggle();
  loadMoreLayerMapToggles();
  toggleSideBar();
  toggleNavbigationItems();
  initCookieDialog();
  initNavigationHoverZindex()
  initChatBox();
  homeSearch();
  otherPagesSearch();
  initSwipers();
  initRoomFilters();
  initIntroTabs();
  initIntroAvailabilityToast((state = "unavailable"), (ms = 4000));
  initIntroVideo();
  flipCards();
  initTotalMonthlyCostsChart();
  initEstimateChart();
  initForecastChart();
  initComprarablePropertiesGrid();
  initTransactionRecordsGrid();
  initNeighborhoodComparisonGrid();
  inithomeAvailabilityGrid();
  initrankingCityGrid();
  initMonthlyCostsOverviewGridChart();
  initInsuranceComparisonGrid();
  initUtilityCosts();
  flipCards();
  recentTransactionsGrid();
  topHomeExpertCardClicks();
  initTriggerZoningUsage();
  initSeeMoreTables();
  initReadMoreToggles();
  // initScrollSpy();
  aiChatCodeCopy();
  generateComponentAnimation();
  initAiChatSliderInput();
});

// Cache POIs once (Option A) + a tiny "big-map ready" promise
let poisGeoJSON = null;

let mapReadyResolve;
const mapReady = new Promise((r) => (mapReadyResolve = r));

let poisPromise = null;

function loadPoisOnce() {
  if (!poisPromise) {
    const url = poiLayersConfig.poiData.url;
    poisPromise = fetch(url)
      .then((r) => r.json())
      .then((d) => {
        poisGeoJSON = d;
        return d;
      });
  }
  return poisPromise;
}

function switchViews() {
  const switcher = document.getElementById("view-switch");
  const container = document.getElementById("split");
  const pane2 = document.getElementById("pane-2");
  const buttons = [...(switcher?.querySelectorAll(".switch-btn-view") ?? [])];
  const closeBtns = document.querySelectorAll(".close-canvas");
  const openCanvasBtns = document.querySelectorAll(".open-canvas");

  if (!switcher || !container || !pane2 || !buttons.length || !closeBtns.length)
    return;

  // All canvas panes inside #pane-2: <div data-canvas="map|gallery|forms|...">
  const canvasPanes = Array.from(pane2.querySelectorAll("[data-canvas]"));
  const validCanvasTypes = new Set(canvasPanes.map((p) => p.dataset.canvas));

  let splitter = null;
  let currentCanvas = null; // "map" | "gallery" | "forms" | ...
  let map = null;

  // ——————————————————————————————————
  // Canvas routing
  // ——————————————————————————————————
  function showCanvas(type) {
    // fallback to 'map' if missing/typo
    const target = validCanvasTypes.has(type)
      ? type
      : validCanvasTypes.has("map")
      ? "map"
      : canvasPanes[0]?.dataset.canvas;
    canvasPanes.forEach((p) =>
      p.classList.toggle("hidden", p.dataset.canvas !== target)
    );
    currentCanvas = target;
    if (target === "map") {
      // let the pane become visible & sized first
      requestAnimationFrame(() => {
        if (!map) initMapbox(); // create after layout
        requestAnimationFrame(() => {
          // then let Mapbox recalc size
          try {
            map && map.resize();
          } catch (_) {}
        });
      });
    }
    // if (target === "gallery") generateGalleryImagesFromImg(target);
  }

  function initSplit() {
    if (splitter) return;
    pane2.classList.remove("hidden");
    container.classList.add("flex");
    splitter = Split(["#pane-1", "#pane-2"], {
      sizes: [50, 50],
      minSize: [375, 460],
      gutterSize: 16,
      onDrag: () => {
        try {
          map?.resize();
          miniMap?.resize();
        } catch (_) {}
      },
      onDragEnd: () => {
        try {
          map?.resize();
          miniMap?.resize();
        } catch (_) {}
      },
    });
    // ← ensure initial
    switcher.classList.add("hidden");

    requestAnimationFrame(() => {
      try {
        map?.resize();
        miniMap?.resize();
      } catch (_) {}
    });
  }

  function destroySplit() {
    if (!splitter) return;
    splitter.destroy();
    splitter = null;
    container.classList.remove("flex");
    pane2.classList.add("hidden");
    switcher.classList.remove("hidden");
  }

  function setActive(view, canvasType) {
    const isCanvas = view === "canvas";

    buttons.forEach((btn) => {
      const active = btn.dataset.view === view;
      btn.classList.toggle("active-tab", active);
      btn.classList.toggle("inactive-tab", !active);
    });

    if (isCanvas) {
      initSplit();
      // resetSplitSizes();
      if (canvasType) {
        showCanvas(canvasType);
      } else if (currentCanvas) {
        showCanvas(currentCanvas);
      } else {
        showCanvas("map"); // default first time
      }
    } else {
      destroySplit();
    }
  }

  // ——————————————————————————————————
  // Mapbox (lazy)
  // ——————————————————————————————————
  function initMapbox() {
    if (map) return;

    const config = poiLayersConfig;
    mapboxgl.accessToken = config.mapbox.accessToken;

    map = new mapboxgl.Map({
      container: "map",
      style: config.mapbox.style,
      center: config.mapbox.center,
      zoom: config.mapbox.zoom,
    });

    loadPoisOnce().then((data) => {
      const icons = new Set();
      const customPhotos = new Set();

      data.features.forEach((f) => {
        const p = f.properties;
        icons.add(p[config.poiData.iconField]);
        if (p[config.poiData.customPhotoField]) {
          customPhotos.add(p[config.poiData.customPhotoField]);
        }
      });

      customPhotos.forEach((url) =>
        map.loadImage(url, (err, img) => {
          if (err) return;
          if (!map.hasImage(url)) map.addImage(url, img);
        })
      );

      icons.forEach((iconId) => {
        const path = `images/map-pins/${iconId}.png`;
        map.loadImage(path, (err, img) => {
          if (err) return;
          if (!map.hasImage(iconId)) map.addImage(iconId, img);
        });
      });
    });

    map.on("load", () => {
      // Base sources
      map.addSource(config.baseData.sourceId, {
        type: "geojson",
        data: config.baseData.url,
      });

      map.addSource(config.poiData.sourceId, {
        type: "geojson",
        data: config.poiData.url,
      });

      // Base layers
      map.addLayer({
        id: config.baseLayers.fill.id,
        type: "fill",
        source: config.baseData.sourceId,
        paint: config.baseLayers.fill.paint,
      });

      map.addLayer({
        id: config.baseLayers.outline.id,
        type: "line",
        source: config.baseData.sourceId,
        paint: config.baseLayers.outline.paint,
      });

      // POI symbols
      map.addLayer({
        id: "poi-symbols",
        type: "symbol",
        source: config.poiData.sourceId,
        layout: {
          "icon-image": [
            "coalesce",
            ["get", config.poiData.customPhotoField],
            ["get", config.poiData.iconField],
          ],
          "icon-size": ["get", config.poiData.sizeField],
          "icon-allow-overlap": false,
          "icon-ignore-placement": false,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "text-optional": true,
          "text-field": ["coalesce", ["get", config.poiData.textField], ""],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-size": 16,
          "text-anchor": "center",
          "text-offset": [0, -0.15],
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#000",
          "text-halo-width": 2,
        },
      });

      // Popups
      map.on("mouseenter", "poi-symbols", (e) => {
        map.getCanvas().style.cursor = "pointer";
        new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
          .setLngLat(e.lngLat)
          .setHTML(`<strong>${e.features[0].properties.display_name}</strong>`)
          .addTo(map);
      });
      map.on("mouseleave", "poi-symbols", () => {
        map.getCanvas().style.cursor = "";
        document.querySelectorAll(".mapboxgl-popup").forEach((p) => p.remove());
      });

      // Layer controls / counter / Clear All
      const checkboxes = Array.from(
        document.querySelectorAll("[data-poi-type]")
      );
      const layersCountEl = document.getElementById("layers-count");
      const clearBtn = document.getElementById("layers-clear");

      function applyFilterFromChecked() {
        const active = checkboxes
          .filter((c) => c.checked)
          .map((c) => c.dataset.poiType);
        let filter;
        if (active.length === 0) {
          filter = ["==", config.poiData.typeField, "__NONE__"];
        } else if (active.length === 1) {
          filter = ["==", config.poiData.typeField, active[0]];
        } else {
          filter = ["in", config.poiData.typeField, ...active];
        }
        map.setFilter("poi-symbols", filter);
      }

      function updateLayerCount() {
        if (layersCountEl) {
          layersCountEl.textContent = checkboxes.filter(
            (cb) => cb.checked
          ).length;
        }
      }

      checkboxes.forEach((cb) => {
        cb.addEventListener("change", () => {
          applyFilterFromChecked();
          updateLayerCount();
        });
      });

      if (clearBtn) {
        clearBtn.addEventListener("click", (e) => {
          e.preventDefault();
          checkboxes.forEach((cb) => (cb.checked = false));
          applyFilterFromChecked();
          updateLayerCount();
        });
      }

      applyFilterFromChecked();
      updateLayerCount();

      if (mapReadyResolve) mapReadyResolve();
    });
  }

  // ——————————————————————————————————
  // Event wiring
  // ——————————————————————————————————
  // Top pill switcher (e.g., data-view="insights" | "canvas")
  buttons.forEach((btn) =>
    btn.addEventListener("click", () => setActive(btn.dataset.view))
  );

  // Open specific canvas from any trigger
  openCanvasBtns.forEach((btn) =>
    btn.addEventListener("click", async () => {
      const target = btn.dataset.canvasTarget;
      const list = (btn.dataset.layers || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (target === "gallery") {
        if (btn.dataset.galleryType === "generate-from-img") {
          console.log("worked");
          const img = btn.querySelector("img");
          if (img?.dataset?.index)
            generateGalleryImagesFromImg(img.dataset.index);
        }
        if (btn.dataset.galleryType === "show-more-35-photos") {
          show35MoreImages();

          // const img = btn.querySelector("img");
          // if (img?.dataset?.index) generateGalleryImagesFromImg(img.dataset.index);
        }
      }

      setActive("canvas", target);

      // If this opens the big map and the button specified layers → apply them
      if (target === "map" && list.length) {
        await mapReady; // ensure the BIG map (style/layers) is loaded
        applyPresetLayersToMap(list, { fit: true });
      }
    })
  );

  // Close canvas → back to insights
  closeBtns.forEach((btn) =>
    btn.addEventListener("click", () => setActive("insights"))
  );

  function applyPresetLayersToMap(selectedTypes, { fit = true } = {}) {
    if (!map) return;
    const cfg = poiLayersConfig;
    const list = (selectedTypes || []).map((s) => s.trim()).filter(Boolean);

    // reflect state in the existing checkboxes UI
    const checkboxes = Array.from(document.querySelectorAll("[data-poi-type]"));
    const wanted = new Set(list);
    checkboxes.forEach((cb) => (cb.checked = wanted.has(cb.dataset.poiType)));

    // build the filter (same shape you already use)
    let filter;
    if (list.length === 0) {
      filter = ["==", cfg.poiData.typeField, "__NONE__"];
    } else if (list.length === 1) {
      filter = ["==", cfg.poiData.typeField, list[0]];
    } else {
      filter = ["in", cfg.poiData.typeField, ...list];
    }
    try {
      map.setFilter("poi-symbols", filter);
    } catch (e) {}

    // update the counter if present
    const layersCountEl = document.getElementById("layers-count");
    if (layersCountEl) layersCountEl.textContent = String(list.length);

    // optional: fit bounds to the selected types using the cached POIs
    if (fit && poisGeoJSON && list.length) {
      const feats = poisGeoJSON.features.filter((f) =>
        wanted.has(f.properties?.[cfg.poiData.typeField])
      );
      if (feats.length) {
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const f of feats) {
          const [x, y] = f.geometry.coordinates;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
        if (
          isFinite(minX) &&
          isFinite(minY) &&
          isFinite(maxX) &&
          isFinite(maxY)
        ) {
          map.fitBounds(
            [
              [minX, minY],
              [maxX, maxY],
            ],
            { padding: 40, duration: 600 }
          );
        }
      }
    }
  }
}

let miniMap = null;

function subsetByTypes(geojson, typeField, types) {
  const set = new Set((types || []).map((s) => s.trim()).filter(Boolean));
  return {
    type: "FeatureCollection",
    features: geojson.features.filter((f) =>
      set.has(f.properties?.[typeField])
    ),
  };
}

function initMiniMap(containerId) {
  if (miniMap) return miniMap;

  const initialTypesBtn = document.getElementById("open-big-map-from-mini");

  if (!initialTypesBtn) return;

  const initialTypes = initialTypesBtn.dataset.layers.split(",");

  const cfg = poiLayersConfig;
  mapboxgl.accessToken = cfg.mapbox.accessToken;

  miniMap = new mapboxgl.Map({
    container: containerId,
    style: cfg.mapbox.style,
    center: cfg.mapbox.center,
    zoom: Math.max(8, (cfg.mapbox.zoom || 10) - 1),
  });

  // const el = document.getElementById(containerId);
  // if (el) {
  //   const ro = new ResizeObserver(() => {
  //     try {
  //       miniMap && miniMap.resize();
  //     } catch (_) {}
  //   });
  //   ro.observe(el);

  //   // one initial tick (helps right after layout changes)
  //   requestAnimationFrame(() => {
  //     try {
  //       miniMap && miniMap.resize();
  //     } catch (_) {}
  //   });
  // }

  miniMap.on("load", async () => {
    // ensure the big map (or its fetch) has cached the data
    await loadPoisOnce();

    const subset = subsetByTypes(
      poisGeoJSON,
      cfg.poiData.typeField,
      initialTypes
    );

    // make sure needed icons exist in the mini map
    const keys = new Set(
      subset.features
        .map(
          (f) =>
            f.properties?.[cfg.poiData.customPhotoField] ||
            f.properties?.[cfg.poiData.iconField]
        )
        .filter(Boolean)
    );
    for (const key of keys) {
      const isURL = /^(https?:)?\/\//.test(key) || key.includes("/");
      const src = isURL ? key : `images/map-pins/${key}.png`;
      if (!miniMap.hasImage(key)) {
        await new Promise((res) =>
          miniMap.loadImage(src, (err, img) => {
            if (!err && !miniMap.hasImage(key)) miniMap.addImage(key, img);
            res();
          })
        );
      }
    }

    miniMap.addSource("mini-pois", { type: "geojson", data: subset });
    miniMap.addLayer({
      id: "poi-symbols-mini",
      type: "symbol",
      source: "mini-pois",
      layout: {
        "icon-image": [
          "coalesce",
          ["get", cfg.poiData.customPhotoField],
          ["get", cfg.poiData.iconField],
        ],
        "icon-size": ["get", cfg.poiData.sizeField],
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": true,
        "text-field": ["coalesce", ["get", cfg.poiData.textField], ""],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-size": 11,
        "text-anchor": "center",
        "text-offset": [0, 0], // place label above pin (tweak if needed)
        "text-optional": true,
      },
      paint: {
        "text-color": "#000",
        "text-halo-width": 1.2,
      },
    });

    // optional: fit to that subset
    if (subset.features.length) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const f of subset.features) {
        const [x, y] = f.geometry.coordinates;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
      if (isFinite(minX)) {
        miniMap.fitBounds(
          [
            [minX, minY],
            [maxX, maxY],
          ],
          { padding: 30, duration: 300 }
        );
      }
    }
  });

  return miniMap;
}

function initBaseLayersSidebarToggle() {
  const layersToggle = document.getElementById("layers-toggle");
  const sidebar = document.getElementById("base-layers-sidebar");
  const closeSidebarBtns = document.querySelectorAll(".base-layers-close");

  if (!layersToggle || !sidebar || closeSidebarBtns.length < 0 ) return;

  layersToggle.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
  });

  closeSidebarBtns.forEach(btn => {
btn.addEventListener("click", () => {
    sidebar.classList.add("hidden");
  });
  })

  // always hide when you click the X
  
}

function loadMoreLayerMapToggles() {
  const loadMorebuttons = document.querySelectorAll(".load-more-layer-toggles");

  if (loadMorebuttons.length === 0) return;

  loadMorebuttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const ul = btn.closest("ul");
      // grab next 4 still-hidden items
      const next4 = Array.from(
        ul.querySelectorAll(".extra-layer-toggle.hidden")
      ).slice(0, 4);
      next4.forEach((li) => li.classList.remove("hidden"));

      // if no more hidden items, hide the Load‐More button
      if (!ul.querySelector(".extra-layer-toggle.hidden")) {
        btn.classList.add("hidden");
      }
    });
  });
}

function toggleSideBar() {
  const sidebarWrapper = document.getElementById("sidebar-wrapper");
  const hamburger = document.getElementById("hamburger");
  const closeBtn = document.getElementById("close-sidebar");

  if (!sidebarWrapper || !hamburger || !closeBtn) return;

  function openSidebar() {
    sidebarWrapper.classList.remove("hidden");
  }
  function closeSidebar() {
    sidebarWrapper.classList.add("hidden");
  }

  hamburger.addEventListener("click", openSidebar);
  sidebarWrapper.addEventListener("click", (e) => {
    if (e.target === sidebarWrapper) {
      closeSidebar();
    }
  });
  closeBtn.addEventListener("click", closeSidebar);

  /* ESC key closes, too (optional) */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSidebar();
  });
}

function toggleNavbigationItems() {
  // const mutedBg = document.getElementById("muted-bg");
  // const navigationItems = document.querySelectorAll(".main-nav-item");
  // navigationItems.forEach(item => item.addEventListener('mousemove', () => {
  //   activeModal(item)
  //   // activeMutedBg()
  // }))
  //  function activeModal(item) {
  //   const navModal = item.querySelector(".nav-modal")
  //   console.log(item);
  //   navModal.classList.remove("hidden");
  //   navModal.classList.add("opacity-100");
  // }
  //  function activeMutedBg() {
  //   mutedBg.classList.remove("hidden");
  // }
}

function initCookieDialog() {
  const cookieDialog = document.getElementById("cookieDialog");
  const closeBtn = document.getElementById("closeCookieDialog");

  if (!cookieDialog || !closeBtn) return;

  closeBtn.addEventListener("click", (e) => {
    e.preventDefault(); // stop form from submitting
    cookieDialog.classList.add("hidden");
  });
}

function initNavigationHoverZindex() {
const navItems = document.querySelectorAll('.main-nav-item');
  const section = document.querySelector('.section-wrapper');

  if (!navItems || !section) return;
  
  navItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
      section.classList.add('@min-[1024px]:pb-100', '@min-[1024px]:-mb-100');
    });
    
    item.addEventListener('mouseleave', function() {
      section.classList.remove('@min-[1024px]:pb-100', '@min-[1024px]:-mb-100');
    });
  });
}

function initChatBox() {
  const openBtn = document.getElementById("openChatBoxBtn");
  const bar = document.getElementById("chatBar");
  if (!openBtn || !bar) return;

  openBtn.onclick = () => {
    bar.classList.add("open-chat-box");
  };
}

function homeSearch() {
  const form = document.getElementById("home-search-form");
  const input = document.getElementById("home-search-input");

  if (!form || !input) return;

  /* run the same media query Tailwind uses for md: */
  const mq = window.matchMedia("(max-width: 767.98px)");

  /* classes you want while the bar is “open” */
  const openClasses = [
    "!absolute",
    "top-0",
    "pt-3",
    "left-0",
    "px-5",
    "!mt-0",
    "bg-white",
  ];

  /* helper */
  const addIfMobile = () => mq.matches && form.classList.add(...openClasses);
  const removeIfMobile = () =>
    mq.matches && form.classList.remove(...openClasses);

  /* put the classes on when the input gains focus (mobile only) */
  input.addEventListener("focus", addIfMobile);

  /* remove them when focus leaves the entire form */
  form.addEventListener("focusout", () => {
    setTimeout(() => {
      if (!form.contains(document.activeElement)) removeIfMobile();
    }, 0);
  });

  /* if the user resizes/rotates while the bar is open, tidy up */
  mq.addEventListener("change", (e) => {
    if (!e.matches) form.classList.remove(...openClasses); // we just jumped ≥ 768 px
  });
}

function otherPagesSearch() {
  const headerInput = document.getElementById("header-search");
  const modal = document.getElementById("search-modal");
  const modalInput = document.getElementById("search-modal-input");
  const modalCloseBtn = document.getElementById("search-modal-close");

  if (!headerInput || !modal || !modalInput || !modalCloseBtn) return;

  /* helpers ----------------------------------------------------------- */
  const openModal = () => {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden"); // stop bg scroll
    modalInput.focus(); //
  };

  const closeModal = () => {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overflow-hidden");
    headerInput.blur(); // collapse any header styles
  };

  /* open when header search gets focus or click ---------------------- */
  ["focus", "click"].forEach((evt) =>
    headerInput.addEventListener(evt, openModal)
  );

  /* close on ✕ -------------------------------------------------------- */
  modalCloseBtn.addEventListener("click", closeModal);

  /* close when backdrop itself is clicked ---------------------------- */
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(); // only the translucent layer
  });

  /* close on Esc ------------------------------------------------------ */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  /* optional: keep things tidy when window gets wide/small ----------- */
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) closeModal(); // you can drop this line
  });
}

function initSwipers() {
  if (typeof Swiper === "undefined") return;

  const configs = [
    {
      selector: ".swiper-nav",
      options: {
        mousewheel: false,

        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 15,
      },
    },
    {
      selector: ".swiper-statistics",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,

        spaceBetween: 10,
      },
    },
    {
      selector: ".swiper-manage-finances",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        // slidesOffsetBefore: 98,
        mousewheel: { forceToAxis: true },
        pagination: { el: ".swiper-pagination" },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-intro-photos-sale",
      options: {
        mousewheel: false,

        spaceBetween: 10,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-intro-photo",
      options: {
        mousewheel: false,

        spaceBetween: 10,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-intro-video",
      options: {
        mousewheel: false,

        spaceBetween: 10,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-map-places",
      options: {
        mousewheel: false,

        spaceBetween: 10,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-calendar",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,

        spaceBetween: 4,
        slidesOffsetBefore: 16,
        slidesOffsetAfter: 16,
      },
    },
    {
      selector: ".swiper-calendar-2",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,

        spaceBetween: 4,
        slidesOffsetBefore: 16,
        slidesOffsetAfter: 16,
      },
    },
    {
      selector: ".swiper-gallery-mobile",
      options: {
        mousewheel: false,

        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-gallery",
      options: {
        mousewheel: false,

        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-rooms",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,
        pagination: { el: ".swiper-pagination" },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-your-documents",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,
        pagination: { el: ".swiper-pagination" },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-home-tiles ",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,
        pagination: { el: ".swiper-pagination" },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-estimate",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        // pagination: {
        //   el: ".swiper-pagination",
        //   clickable: true,
        //   renderBullet: function (index, className) {
        //     const labels = [
        //       "Estimate",
        //       "Forecast",
        //       "Risk of Decline",
        //       "Value Factors",
        //       "Order Appraisal Report",
        //     ];
        //     return `<span class="${className}">${labels[index]}</span>`;
        //   },
        // },
        navigation: {
          nextEl: ".swiper-button-estimate-next",
          prevEl: ".swiper-button-estimate-prev",
        },
      },
    },
    {
      selector: ".swiper-value-factors",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        direction: "vertical",
        spaceBetween: 10,
        // slidesOffsetBefore: 20,
        // slidesOffsetAfter: 20,
        navigation: {
          nextEl: ".swiper-button-value-factors-next",
          prevEl: ".swiper-button-value-factors-prev",
        },
      },
    },
    {
      selector: ".swiper-renovation-history",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,

        spaceBetween: 10,
        pagination: { el: ".swiper-pagination" },
      },
    },
    {
      selector: ".swiper-kitchen-remodel",
      options: {
        mousewheel: false,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-bathroom-upgrade",
      options: {
        mousewheel: false,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-zoning-usage",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,

        spaceBetween: 10,
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
          renderBullet: function (index, className) {
            // your labels in an array, matching slide order
            const labels = [
              "Overview",
              "Permitted Uses",
              "With Conditions",
              "Not Permitted",
              "Requirements",
              "Order Zoning Report",
            ];
            return `<span class="${className}">${labels[index]}</span>`;
          },
        },
      },
    },

    {
      selector: ".swiper-currently-listed-sale",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,

        spaceBetween: 10,
      },
    },
    {
      selector: ".swiper-service-areas",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        pagination: { el: ".swiper-pagination" },
        spaceBetween: 10,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },

    {
      selector: ".swiper-market-trends",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,
        pagination: { el: ".swiper-pagination" },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-maintenance-and-upkeep",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,
                pagination: { el: ".swiper-pagination" },

        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-banners",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,
        pagination: { el: ".swiper-pagination" },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-ai-chat-experts-examples-option-1",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,

        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-reward-active",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,

        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-opportunities-risks-incentives-rebates",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,
        pagination: { el: ".swiper-pagination" },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-plan-for-emergencies",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,
        pagination: { el: ".swiper-pagination" },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-monthly-costs-overview",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,

        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-contact-info",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,
        pagination: { el: ".swiper-pagination" },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-top-home-experts",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,
        pagination: { el: ".swiper-pagination" },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-places-examples",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,

        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-client-reviews",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        spaceBetween: 10,
                pagination: { el: ".swiper-pagination" },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-home-improvement-ideas-tabs",
      options: {
        mousewheel: false,
        slidesPerView: "auto",

        freeMode: true,
        spaceBetween: 10,
      },
    },
    {
      selector: ".swiper-home-improvement-ideas",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,

        spaceBetween: 10,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-social-media-posts",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
                pagination: { el: ".swiper-pagination" },
        spaceBetween: 10,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      },
    },
    {
      selector: ".swiper-main-nav",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,

        spaceBetween: 10,
      },
    },
    {
      selector: ".swiper-read-more",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,

        spaceBetween: 10,
      },
    },
    {
      selector: ".swiper-calculator-m",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        pagination: { el: ".swiper-pagination" },
         navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        spaceBetween: 10,
      },
    },
    {
      selector: ".swiper-calculator-s",
      options: {
        mousewheel: false,
        slidesPerView: "auto",
        freeMode: true,
        pagination: { el: ".swiper-pagination" },
         navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        spaceBetween: 10,
      },
    },
  ];

  configs.forEach(({ selector, options }) => {
    const container = document.querySelector(selector);
    if (!container) return;

    // 🔸 SPECIAL: container-based enable/disable for Renovation History
    if (selector === ".swiper-renovation-history") {
      const section =
        container.closest(".section-wrapper") || container.parentElement;
      if (!section) return;

      let instance = null; // current Swiper instance (if any)

      const enableSwiper = () => {
        if (instance) return;
        instance = new Swiper(container, options);
      };

      const disableSwiper = () => {
        if (!instance) return;
        // destroy and clean styles/events so native layout & scrolling work
        instance.destroy(true, true);
        instance = null;
      };

      // decide by container width (like @container)
      const ensureMode = (width) => {
        if (width >= 1024) {
          // wide: NO slider — stack cards vertically (your CSS handles flex/transform)
          disableSwiper();
        } else {
          // narrow: slider enabled
          enableSwiper();
        }
      };

      // initial
      ensureMode(section.clientWidth);

      // observe the container for live switches
      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        const width = entry?.contentBoxSize
          ? Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0].inlineSize
            : entry.contentBoxSize.inlineSize
          : section.clientWidth;
        ensureMode(width);
      });
      ro.observe(section);

      // optional: keep a handle so you can disconnect later if you re-init the page
      // container._renovation_observer = ro;

      // IMPORTANT: stop here so we don't also run the generic new Swiper() below
      return;
    }

    // 🔹 Default path for all other swipers
    const swiper = new Swiper(container, options);

    // (your existing container-based direction logic for .swiper-value-factors can remain here)
    if (selector === ".swiper-value-factors") {
      const section =
        container.closest(".section-wrapper") || container.parentElement;
      if (!section) return;

      const applyDirectionFor = (width) => {
        const shouldBe = width >= 768 ? "horizontal" : "vertical";
        if (swiper.params.direction !== shouldBe) {
          swiper.changeDirection(shouldBe);
          swiper.update();
        }
      };

      applyDirectionFor(section.clientWidth);

      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        const width = entry?.contentBoxSize
          ? Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0].inlineSize
            : entry.contentBoxSize.inlineSize
          : section.clientWidth;
        applyDirectionFor(width);
      });
      ro.observe(section);
      // container._vf_dir_observer = ro; // optional
    }

    if (selector === ".swiper-estimate" || selector === ".swiper-zoning-usage") {
      const section = container.closest("section") || container.parentElement;
      if (!section) return;

      const desktopEl = container.querySelector(".swiper-pagination-desk");
      const mobileEl = container.querySelector(".swiper-pagination-mobile");

      const LABELS = [
        "Estimate",
        "Forecast",
        "Risk of Decline",
        "Value Factors",
        "Order Appraisal Report",
      ];

      let instance = null; // current Swiper
      let mode = null; // 'desktop' | 'mobile'

      const build = (nextMode) => {
        if (instance) {
          instance.destroy(true, true); // full cleanup to avoid ghost handlers/styles
          instance = null;
        }

        // shallow clone of base options so we can override pagination cleanly
        const base = { ...options };
        delete base.pagination;

        if (nextMode === "desktop") {
          base.pagination = {
            el: desktopEl, // pass the element, not a selector string (avoids picking wrong one)
            clickable: true,
            renderBullet: (index, className) =>
              `<span class="${className}">${LABELS[index]}</span>`,
          };
          mode = "desktop";
        } else {
          base.pagination = {
            el: mobileEl,
            clickable: true, // default dot bullets
          };
          mode = "mobile";
        }

        instance = new Swiper(container, base);
      };

      const ensureMode = (width) => {
        const isDesktop = width >= 1024; // match your @[1024px] container query
        const want = isDesktop ? "desktop" : "mobile";
        if (want !== mode) build(want);
      };

      // init
      ensureMode(section.clientWidth);

      // watch the <section> width (container-query friendly)
      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        const width = entry?.contentBoxSize
          ? Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0].inlineSize
            : entry.contentBoxSize.inlineSize
          : section.clientWidth;
        ensureMode(width);
      });
      ro.observe(section);

      // IMPORTANT: stop here so this swiper isn't also initialized below
      return;
    }
  });
}

function initRoomFilters() {
  const roomsEl = document.querySelector(".swiper-rooms");
  // Bail out if there's no .swiper-rooms or no Swiper instance attached
  if (!roomsEl || !roomsEl.swiper) return;

  // Grab the real Swiper instance that Swiper.js attaches automatically
  const swiper = roomsEl.swiper;
  // console.log(" initRoomFilters running, found swiper:", swiper);

  // Find all filter tabs
  const tabs = document.querySelectorAll(".filter-room-tab");
  if (tabs.length === 0) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // 1) Toggle active state & aria-selected
      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle("active", isActive);
        t.setAttribute("aria-selected", isActive);
      });

      // 2) Determine which floor to show
      const filterKey = tab.id.replace("tab-", ""); // e.g. "all", "main", etc.

      // 3) Show/hide slides based on data-floor
      roomsEl.querySelectorAll(".swiper-slide").forEach((slide) => {
        const floor = slide.getAttribute("data-floor") || "all";
        slide.style.display =
          filterKey === "all" || floor === filterKey ? "" : "none";
      });

      // 4) Update Swiper layout and reset to the first visible slide
      swiper.update();
      swiper.slideTo(0);
    });
  });
}

function initIntroTabs() {
  const tabs = document.querySelectorAll(".intro-photos-sale-tab");
  if (tabs.length === 0) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // 1) Toggle active state & aria-selected
      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle("active", isActive);
        t.setAttribute("aria-selected", isActive);

        const panelId = t.getAttribute("aria-controls");
        if (!panelId) return;

        const panel = document.getElementById(panelId);
        if (!panel) return;

        // show/hide panel (semantic + Tailwind)
        panel.hidden = !isActive;
        panel.classList.toggle("hidden", !isActive);
      });
    });
  });
}

function initIntroAvailabilityToast(state, ms) {
  const a = document.getElementById("toast-available");
  const u = document.getElementById("toast-unavailable");
  if (!a || !u) {
    return;
  }
  [a, u].forEach((el) => {
    if (el) {
      el.hidden = true;
    }
  });
  const el = state === "available" ? a : u;
  if (!el) return;
  el.hidden = false;
  el.focus(); // announce via role="status"
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.hidden = true;
  }, ms);
}

function initIntroVideo() {
  const playBtns = document.querySelectorAll(".custom-play-video-btn");
  playBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      let video = btn.closest(".video-wrapper").querySelector("video");
      let tags = btn
        .closest(".videos-container")
        .querySelectorAll(".video-tag");
      video.setAttribute("controls", "controls");
      video.play();
      btn.classList.add("hidden");
      tags.forEach((tag) => tag.classList.add("!hidden"));
    })
  );
}

function flipCards() {
  let cards = document.querySelectorAll(".flip-card");
  if (cards.length === 0) return;

  cards.forEach((el) => {
    el.addEventListener("click", () => {
      const inner = el.querySelector(".peer");
      inner?.classList.toggle("rotate-y-180");
    });
  });
}

function initTotalMonthlyCostsChart() {
  if (!window.agCharts?.AgCharts) return;

  const container = document.getElementById("manageFinancesChart");
  if (!container) return;

  const containerSection = container.closest(".section-wrapper");

  // helper: read current container-controlled font sizes
  const getFontSizes = () => {
    const s = getComputedStyle(container);
    return {
      sector: +s.getPropertyValue("--chart-sector-fs") || 14,
    };
  };

  // const mobileData = [
  //   { category: "Mortgage", value: 3500, color: "#FF603F" },
  //   { category: "Taxes & Other Fees", value: 1800, color: "#C94629" },
  //   { category: "Insurance", value: 520, color: "#FFDFD2" },
  // ];

  const data = [
    { category: "Mortgage", value: 3500, color: "#FF603F" },
    { category: "Insurance", value: 520, color: "#FF836A" },
    { category: "Property Taxes", value: 1000, color: "#9F2A12" },
    { category: "Maintenance", value: 450, color: "#C94629" },
    { category: "Another tax", value: 350, color: "#FFDFD2" },
  ];

  let chart;

  function render() {
    // choose dataset by *container* width instead of viewport
    // const isWide = containerSection.clientWidth >= 768;
    // const data = isWide ? desktopData : mobileData;

    const num = new Intl.NumberFormat("en-US");
    const total = data.reduce((s, d) => s + d.value, 0);

    const fs = getFontSizes();

    const options = {
      container,
      data,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      legend: { enabled: false },
      tooltip: { enabled: false },
      series: [
        {
          type: "donut",
          angleKey: "value",
          rotation: -175,
          sectorLabelKey: "value",
          sectorLabel: {
            formatter: ({ datum }) =>
              `${Math.round((datum.value / total) * 100)}%`,
            fontFamily: "Alber Sans",
            fontSize: fs.sector, // from container query
            fontWeight: "bold",
            color: "#fff",
          },
          innerRadiusRatio: 0.525,
          innerLabels: [
            {
              text: "Total",
              fontFamily: "Alber Sans",
              fontSize: 14, // from container query
              fontWeight: 600,
              color: "#7C7C7C",
            },
            {
              text: `$${num.format(total)}`,
              fontFamily: "Alber Sans",
              fontSize: 16, // from container query
              fontWeight: 600,
              color: "#1F1F1F",
            },
          ],
          fills: data.map((d) => d.color),
        },
      ],
    };

    chart ? chart.update(options) : (chart = agCharts.AgCharts.create(options));
  }

  // initial draw
  render();

  // re-render whenever the container’s size changes (matches @container)
  const ro = new ResizeObserver(render);
  ro.observe(container);
}

function initEstimateChart() {
  if (typeof agCharts === "undefined" || !agCharts.AgCharts) {
    return;
  }
  const container = document.getElementById("gaugeChart");
  if (!container) {
    return;
  }

  const { AgCharts } = agCharts;

  let saleData = {
    minValue: 2220000,
    cValue: 2450000,
    maxValue: 2520000,
  };
  let rentData = {
    minValue: 5000,
    cValue: 7000,
    maxValue: 10000,
  };

  data = saleData;

  const options = {
    container,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    type: "radial-gauge",
    value: data.cValue,

    innerRadiusRatio: 0.8,
    scale: {
      min: data.minValue,
      max: data.maxValue,

      fill: "#f5f6fa",
      label: {
        formatter: ({ value }) => {
          return "";
        },
        fontSize: 10,
        spacing: 0,
      },
    },
    bar: {
      fill: "#FF603F",
    },
    label: {
      enabled: false,
    },
  };

  let gauge = AgCharts.createGauge(options);

  const fmtUSD = (v) => "$" + Number(v).toLocaleString("en-US");
  let lowEstimateValue = document.querySelector("#low-estimate-value");
  let cEstimateValue = document.querySelector("#gaugeLabel");
  let highEstimateValue = document.querySelector("#high-estimate-value");

  lowEstimateValue.textContent = fmtUSD(data.minValue);
  cEstimateValue.textContent = fmtUSD(data.cValue);
  highEstimateValue.textContent = fmtUSD(data.maxValue);

  let gaugeTabRent = document.querySelector("#gauge-tab-rent");
  let gaugeTabSale = document.querySelector("#gauge-tab-sale");
  gaugeTabRent.addEventListener("click", () => {
    gaugeTabRent.classList.add("active");
    gaugeTabSale.classList.remove("active");
    data = rentData;
    options.scale.min = data.minValue;
    options.value = data.cValue;
    options.scale.max = data.maxValue;
    gauge.update(options);
    lowEstimateValue.textContent = fmtUSD(data.minValue);
    cEstimateValue.textContent = fmtUSD(data.cValue);
    highEstimateValue.textContent = fmtUSD(data.maxValue);
  });

  gaugeTabSale.addEventListener("click", () => {
    gaugeTabSale.classList.add("active");
    gaugeTabRent.classList.remove("active");
    data = saleData;
    options.scale.min = data.minValue;
    options.value = data.cValue;
    options.scale.max = data.maxValue;
    gauge.update(options);
    lowEstimateValue.textContent = fmtUSD(data.minValue);
    cEstimateValue.textContent = fmtUSD(data.cValue);
    highEstimateValue.textContent = fmtUSD(data.maxValue);
  });
}

function initForecastChart() {
  if (typeof agCharts === "undefined" || !agCharts.AgCharts) return;

  const container = document.getElementById("lineChart");
  if (!container) return;

  const { AgCharts } = agCharts;

  const getSizes = () => {
    const s = getComputedStyle(container);
    return {
      markerSize: +s.getPropertyValue("--chart-marker-size") || 6,
      axisLabelFs: +s.getPropertyValue("--chart-axis-label-fs") || 10,
      labelFs: (+s.getPropertyValue("--chart-axis-label-fs") || 10) + 2,
    };
  };

  const fmtCompactUSD = (v) =>
    "$" +
    new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 0,
    })
      .format(v)
      .toLowerCase();

  const fullData = [
    { year: 2019, revenue: 200000 },
    { year: 2021, revenue: 420000 },
    { year: 2023, revenue: 750000 },
    { year: 2025, revenue: 1050000 },
    { year: 2027, revenue: 1200000 },
    { year: 2029, revenue: 2100000 },
  ];

  const actualData = fullData.filter((d) => d.year <= 2025);
  const forecastData = fullData.filter((d) => d.year >= 2025);

  let chart;
  function render() {
    const sizes = getSizes();

    const baseSeries = {
      type: "line",
      xKey: "year",
      yKey: "revenue",
      showInLegend: false,
      nodeClickRange: "nearest",
      marker: {
        enabled: true,
        size: sizes.markerSize,
        stroke: "white",
        strokeWidth: 1,
      },
      label: {
        enabled: true,
        fontFamily: "Alber Sans",
        fontSize: sizes.labelFs,
        fontWeight: 600,
        padding: 6,
        formatter: ({ datum, yKey }) => fmtCompactUSD(datum[yKey]),
      },
      // No tooltip & no renderer => nothing updates on hover
      tooltip: { enabled: false },
    };

    const options = {
      container,
      data: fullData,
      padding: { top: 8, right: 18, bottom: 0, left: 18 },
      tooltip: { enabled: false },
      series: [
        {
          ...baseSeries,
          data: actualData,
          stroke: "#FF603F",
          marker: { ...baseSeries.marker, fill: "#FF603F" },
          label: { ...baseSeries.label, color: "#9E9E9E", fontSize: 12 },
        },
        {
          ...baseSeries,
          data: forecastData,
          stroke: "#D9D9D9",
          lineDash: [6, 4],
          marker: { ...baseSeries.marker, fill: "#949494" },
          label: { ...baseSeries.label, color: "#9E9E9E", fontSize: 12 },
          itemStyler: ({ datumIndex }) =>
            datumIndex === 0
              ? { marker: { enabled: false }, label: { enabled: false } }
              : null,
        },
      ],
      axes: [
        {
          type: "category",
          position: "bottom",
          gridLine: { enabled: false },
          label: {
            fontWeight: 500,
            fontSize: sizes.axisLabelFs,
            fontFamily: "Alber Sans",
            color: "#B6B6B6",
          },
        },
        {
          type: "number",
          position: "left",
          label: { enabled: false },
          gridLine: { enabled: false },
        },
      ],
    };

    chart ? chart.update(options) : (chart = AgCharts.create(options));
  }

  render();
  new ResizeObserver(render).observe(container);
}

function initComprarablePropertiesGrid() {
  if (typeof agGrid === "undefined") return;

  const eGridDiv = document.querySelector("#comprarablePropertiesGrid");
  if (!eGridDiv) return;

  // 1) Add a URL for each row
  const rowData = [
    {
      url: "/listings/264-wise-crossing-milton-on-l5t-6yb",
      property: "264 Wise Crossing Milton, ON L5T 6YB",
      imageUrl: "images/c-p-264.webp",
      date: "2025-05-01",
      price: "$1,200,000",
      bed: 3,
      bath: 2,
      size: "1,800",
      distance: "1.2",
      status: "Recently Sold",
    },
    {
      url: "/listings/64b-snider-terrace-milton-on-l5t-6y8",
      property: "64B Snider Terrace Milton, ON L5T 6Y8",
      imageUrl: "images/c-p-64B.webp",
      date: "2025-04-15",
      price: "$980,000",
      bed: 2,
      bath: 1,
      size: "1,200",
      distance: "0.8",
      status: "Recently Rented",
    },
    {
      url: "/listings/582-holly-avenue-milton-on-l5t-6yb",
      property: "582 Holly Avenue Milton, ON L5T 6YB",
      imageUrl: "images/c-p-582.webp",
      date: "2025-03-20",
      price: "$1,350,000",
      bed: 4,
      bath: 3,
      size: "2,100",
      distance: "2.5",
      status: "Currently For Sale",
    },
    {
      url: "/listings/315-maboeuf-court-milton-on-l5t-6yb",
      imageUrl: "images/c-p-315.webp",
      property: "315 Maboeuf Court Milton, ON L5T 6YB",
      date: "2025-03-20",
      price: "$1,350,000",
      bed: 4,
      bath: 3,
      size: "2,100",
      distance: "2.5",
      status: "Currently For Rent",
    },
  ];

  // 2) Helper to wrap any node in a link
  function makeLink(href, node, aria) {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "ag-link-cell";
    if (aria) a.setAttribute("aria-label", aria);
    a.appendChild(node);
    return a;
  }

  // 3) Simple value → link renderer (for bed/bath/size/distance)
  function valueLinkRenderer(params) {
    const span = document.createElement("span");
    span.textContent = params.value ?? "";
    return makeLink(
      params.data.url,
      span,
      `Open ${params.data.property} details`
    );
  }

  const columnDefs = [
    {
      field: "property",
      autoHeight: true,
      wrapText: true,
      minWidth: 275,
      flex: 2.5,
      cellClassRules: {
        "currently-status property-cell-root": (p) =>
          p.data.status === "Currently For Rent" ||
          p.data.status === "Currently For Sale",
        "recently-status property-cell-root": (p) =>
          p.data.status === "Recently Rented" ||
          p.data.status === "Recently Sold",
      },
      cellRenderer: (params) => {
        const { imageUrl, status, url, property } = params.data;

        // container
        const wrapper = document.createElement("div");
        wrapper.classList.add("ag-grid-main-cell");

        // thumbnail
        const img = document.createElement("img");
        img.classList.add("ag-grid-propery-cell__img");
        img.src = imageUrl;
        img.alt = ""; // decorative
        wrapper.appendChild(img);

        // status + address
        const statusAdress = document.createElement("div");

        const badge = document.createElement("div");
        badge.classList.add("ag-grid-propery-cell__badge");
        badge.textContent = status;

        const dot = document.createElement("span");
        dot.classList.add("ag-grid-propery-cell__badge-dot");
        badge.appendChild(dot);

        statusAdress.appendChild(badge);

        const textBlock = document.createElement("div");
        textBlock.textContent = params.value;
        textBlock.classList.add(
          "mt-1",
          "@min-[768px]:mt-1.25",
          "text-xs",
          "@min-[768px]:text-sm",
          "@min-[1024px]:text-base",
          "leading-[1.1]"
        );
        statusAdress.appendChild(textBlock);

        wrapper.appendChild(statusAdress);

        // Wrap whole cell content in <a>
        return makeLink(url, wrapper, `Open ${property} details`);
      },
    },
    {
      field: "date",
      headerName: "Date & Price",
      minWidth: 125,
      cellRenderer: (params) => {
        const { price, url, property } = params.data;
        const wrap = document.createElement("div");

        const priceblock = document.createElement("span");
        priceblock.classList.add("ag-grid-date-price-cell__price-block");
        priceblock.textContent = price;

        const dateblock = document.createElement("span");
        dateblock.classList.add("ag-grid-sub-text");
        dateblock.textContent = params.value;

        wrap.appendChild(priceblock);
        wrap.appendChild(dateblock);

        return makeLink(url, wrap, `Open ${property} details`);
      },
    },
    { field: "bed", cellRenderer: valueLinkRenderer, minWidth: 80 },
    { field: "bath", cellRenderer: valueLinkRenderer, minWidth: 80 },
    { field: "size", cellRenderer: valueLinkRenderer, minWidth: 90 },
    { field: "distance", cellRenderer: valueLinkRenderer, minWidth: 95 },
  ];

  let currentFilter = "all";
  const gridOptions = {
    columnDefs,
    rowData,
    domLayout: "autoHeight",
    defaultColDef: {
      headerClass: "header-cell-text",
      suppressMovable: true,
      resizable: false,
      sortable: true,
      filter: false,
      minWidth: 80,
      flex: 1,
    },
    isExternalFilterPresent: () => currentFilter !== "all",
    doesExternalFilterPass: (rowNode) =>
      currentFilter === "all" ? true : rowNode.data.status === currentFilter,
    onGridReady: (params) => {
      const tabs = document.querySelectorAll(".filter-property-tab");
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          tabs.forEach((t) => {
            const isActive = t === tab;
            t.classList.toggle("active", isActive);
            t.setAttribute("aria-selected", isActive);
          });
          currentFilter = tab.getAttribute("data-filter");
          params.api.onFilterChanged();
        });
      });
    },
  };

  agGrid.createGrid(eGridDiv, gridOptions);
}

function initTransactionRecordsGrid() {
  if (typeof agGrid === "undefined") return;

  const eGridDiv = document.querySelector("#transactionRecordsGrid");
  if (!eGridDiv) return;

  // 1) Each row needs a canonical URL (adjust to your real routes)
  const rowData = [
    {
      url: ((id) => `/transactions/${id}`)("W1196203"),
      listingID: "W1196203",
      listDate: "2025-05-01",
      endDate: "2026-05-01",
      listprice: "$1,200,000",
      endPrice: "$1,300,000",
      dom: 3,
      ListvsEndPrice: "1.2",
      status: "For Sale",
    },
    {
      url: ((id) => `/transactions/${id}`)("W9266620"),
      listingID: "W9266620",
      listDate: "2025-05-01",
      endDate: "2026-05-01",
      listprice: "$1,900,000",
      endPrice: "-",
      dom: 2,
      ListvsEndPrice: "",
      status: "Expired",
    },
    {
      url: ((id) => `/transactions/${id}`)("W6703752"),
      listingID: "W6703752",
      listDate: "2024-05-01",
      endDate: "2026-05-01",
      listprice: "$1,300,000",
      endPrice: "$1,300,000",
      dom: 4,
      ListvsEndPrice: "",
      status: "Leased",
    },
    {
      url: ((id) => `/transactions/${id}`)("W6703752"),
      listingID: "W6703752",
      listDate: "2025-05-01",
      endDate: "2026-05-01",
      listprice: "$1,300,000",
      endPrice: "$1,300,000",
      dom: 4,
      ListvsEndPrice: "2.5",
      status: "Leased",
    },
  ];

  // 2) Wrap any node in an <a>
  function makeLink(href, node, aria) {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank"; // use "_self" if you prefer same-tab
    a.rel = "noopener noreferrer";
    a.className = "ag-link-cell";
    if (aria) a.setAttribute("aria-label", aria);
    a.appendChild(node);
    return a;
  }

  // 3) Reusable renderer for simple text cells
  function valueLinkRenderer(params) {
    const span = document.createElement("span");
    // prefer formatted value if provided
    span.textContent = (params.valueFormatted ?? params.value ?? "").toString();
    return makeLink(
      params.data.url,
      span,
      `Open transaction ${params.data.listingID}`
    );
  }

  const columnDefs = [
    // Listing ID + status badge
    {
      field: "listingID",
      cellClass: "link-cell", // (optional) to make whole cell clickable via CSS we discussed
      cellClassRules: {
        "for-sale": (p) => p.data.status === "For Sale",
        "expired-st": (p) => p.data.status === "Expired",
        "leased-st": (p) => p.data.status === "Leased",
      },
      autoHeight: true,
      wrapText: true,
      minWidth: 120,
      cellRenderer: (params) => {
        const { status, url, listingID } = params.data;

        const wrapper = document.createElement("div");
        wrapper.classList.add("ag-grid-main-cell");

        const statusBlock = document.createElement("div");

        const badge = document.createElement("div");
        badge.classList.add("ag-grid-propery-cell__badge");
        badge.textContent = status;

        const dot = document.createElement("span");
        dot.classList.add("ag-grid-propery-cell__badge-dot");
        badge.appendChild(dot);

        statusBlock.appendChild(badge);

        const textBlock = document.createElement("div");
        textBlock.textContent = params.value; // listingID text
        textBlock.classList.add(
          "mt-1",
          "@min-[768px]:mt-1.25",
          "text-xs",
          "@min-[768px]:text-sm",
          "@min-[1024px]:text-base",
          "leading-[1.1]"
        );

        statusBlock.appendChild(textBlock);
        wrapper.appendChild(statusBlock);

        return makeLink(url, wrapper, `Open transaction ${listingID}`);
      },
    },

    // List Date & Price (two-line block)
    {
      field: "listDate",
      headerName: "List Date & Price",
      minWidth: 140,
      cellClass: "link-cell",
      cellRenderer: (params) => {
        const { listprice, url, listingID } = params.data;
        const wrap = document.createElement("div");

        const price = document.createElement("span");
        price.classList.add("ag-grid-date-price-cell__price-block");
        price.textContent = listprice;

        const date = document.createElement("span");
        date.classList.add("ag-grid-sub-text");
        date.textContent = params.value;

        wrap.appendChild(price);
        wrap.appendChild(date);

        return makeLink(url, wrap, `Open transaction ${listingID}`);
      },
    },

    // End Date & Price (two-line block)
    {
      field: "endDate",
      headerName: "End Date & Price",
      minWidth: 150,
      cellClass: "link-cell",
      cellRenderer: (params) => {
        const { endPrice, url, listingID } = params.data;
        const wrap = document.createElement("div");

        const price = document.createElement("span");
        price.classList.add("ag-grid-date-price-cell__price-block");
        price.textContent = endPrice;

        const date = document.createElement("span");
        date.classList.add("ag-grid-sub-text");
        date.textContent = params.value;

        wrap.appendChild(price);
        wrap.appendChild(date);

        return makeLink(url, wrap, `Open transaction ${listingID}`);
      },
    },

    // Simple numeric columns → link renderer
    {
      field: "dom",
      minWidth: 90,
      cellClass: "link-cell",
      cellRenderer: valueLinkRenderer,
    },
    {
      field: "ListvsEndPrice",
      headerName: "List vs End Price",
      minWidth: 150,
      cellClass: "link-cell",
      valueFormatter: (p) =>
        p.value ? `$${Number(p.value).toLocaleString()}` : "-",
      cellRenderer: valueLinkRenderer, // uses valueFormatted when present
    },
  ];

  const gridOptions = {
    columnDefs,
    rowData,
    domLayout: "autoHeight",
    defaultColDef: {
      headerClass: "header-cell-text",
      suppressMovable: true,
      sortable: true,
      resizable: false,
      minWidth: 80,
      flex: 1,
    },
  };

  agGrid.createGrid(eGridDiv, gridOptions);
}

function initNeighborhoodComparisonGrid() {
  if (typeof agGrid === "undefined") return;

  const eGridDiv = document.querySelector("#NeighborhoodComparisonGrid");
  if (!eGridDiv) return;

  // Routes (adjust to your real URLs)
  const springFieldUrl = "/listing/7-spring-field-road";
  const uplandsUrl = "/neighborhood/uplands";

  const rowData = [
    {
      metric: "# Beds",
      springField: "4",
      uplandsAvg: "4",
      status: "",
      desc: "",
      percentage: "",
      springFieldUrl,
      uplandsUrl,
    },
    {
      metric: "# Baths",
      springField: "3",
      uplandsAvg: "3",
      status: "",
      desc: "",
      percentage: "",
      springFieldUrl,
      uplandsUrl,
    },
    {
      metric: "Property Type",
      springField: "Residential",
      uplandsAvg: "Residential",
      status: "",
      desc: "",
      percentage: "",
      springFieldUrl,
      uplandsUrl,
    },
    {
      metric: "Estimated Value",
      springField: "$520,000",
      uplandsAvg: "$450,000",
      status: "bottom",
      desc: "",
      percentage: "-7%",
      springFieldUrl,
      uplandsUrl,
    },
    {
      metric: "Estimated Rent",
      springField: "$5,200",
      uplandsAvg: "$2,500",
      status: "bottom",
      desc: "",
      percentage: "-9%",
      springFieldUrl,
      uplandsUrl,
    },
    {
      metric: "For Sale Price /Sqft",
      springField: "$520",
      uplandsAvg: "$320",
      status: "bottom",
      desc: "9% more expensive /sqft compared to similar homes",
      percentage: "-5%",
      springFieldUrl,
      uplandsUrl,
    },
    {
      metric: "For Rent Price /Sqft",
      springField: "$52",
      uplandsAvg: "$2.5",
      status: "bottom",
      desc: "",
      percentage: "-5%",
      springFieldUrl,
      uplandsUrl,
    },
  ];

  // ---- link helpers (same pattern as other grids)
  function makeLink(href, node, aria) {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank"; // use "_self" if you want same-tab
    a.rel = "noopener noreferrer";
    a.className = "ag-link-cell";
    if (aria) a.setAttribute("aria-label", aria);
    a.appendChild(node);
    return a;
  }

  function springValueLinkRenderer(params) {
    const span = document.createElement("span");
    span.textContent = params.value ?? "";
    return makeLink(
      params.data.springFieldUrl,
      span,
      `Open ${params.data.metric} for 7 Spring Field Road`
    );
  }

  // (Uplands column has custom layout; we’ll wrap the built node in <a>)
  function uplandsCellRenderer(params) {
    const { percentage, desc, status } = params.data;

    const wrapper = document.createElement("div");
    wrapper.classList.add("uplandsAvgCell");

    const left = document.createElement("div");
    const value = document.createElement("span");
    value.textContent = params.value;
    const descBlock = document.createElement("div");
    descBlock.textContent = desc;
    descBlock.classList.add("uplandsAvgCell__desc");
    left.appendChild(value);
    left.appendChild(descBlock);

    const right = document.createElement("div");
    right.classList.add("uplandsAvgCell__right");
    const pct = document.createElement("span");
    pct.textContent = percentage || "";
    const statusBlock = document.createElement("span");
    statusBlock.classList.add("uplandsAvgCell__status");
    if (status === "bottom") statusBlock.classList.add("is-bottom");
    right.appendChild(pct);
    right.appendChild(statusBlock);

    wrapper.appendChild(left);
    wrapper.appendChild(right);

    return makeLink(
      params.data.uplandsUrl,
      wrapper,
      `Open ${params.data.metric} for Uplands neighborhood`
    );
  }

  const columnDefs = [
    {
      headerName: "Metric",
      field: "metric",
      cellClass: "neighborhood-comparison-metric-col",
      autoHeight: true,
      wrapText: true,
      minWidth: 100,
    },
    {
      headerName: "7 Spring Field Road",
      field: "springField",
      minWidth: 160,
      cellClass: "link-cell",
      cellRenderer: springValueLinkRenderer,
    },
    {
      headerName: "Uplands (Neighborhood Average)",
      field: "uplandsAvg",
      autoHeight: true,
      wrapText: true,
      minWidth: 220,
      cellClass: "col-has-borders link-cell",
      cellClassRules: {
        "uplandsAvg__status-bottom": (p) => p.data.status === "bottom",
      },
      cellRenderer: uplandsCellRenderer,
    },
  ];

  const gridOptions = {
    columnDefs,
    rowData,
    domLayout: "autoHeight",
    defaultColDef: {
      headerClass: "header-cell-text",
      suppressMovable: true,
      flex: 1,
      sortable: true,
      filter: false,
      resizable: false,
    },
  };

  agGrid.createGrid(eGridDiv, gridOptions);
}

function inithomeAvailabilityGrid() {
  if (typeof agGrid === "undefined") return;

  const eGridDiv = document.querySelector("#homeAvailabilityGrid");
  if (!eGridDiv) return;

  // --- link helpers ---
  function makeLink(href, node, aria) {
    const a = document.createElement("a");
    a.href = href || "#";
    a.target = "_blank"; // change to "_self" if you want same-tab
    a.rel = "noopener noreferrer";
    a.className = "ag-link-cell";
    if (aria) a.setAttribute("aria-label", aria);
    a.appendChild(node);
    return a;
  }
  function valueLinkRenderer(params) {
    const span = document.createElement("span");
    span.textContent = (params.valueFormatted ?? params.value ?? "").toString();
    const url = params.data?.url || "#";
    return makeLink(url, span, `Open ${params.data?.name ?? ""}`);
  }

  // --- DATA (your data, unchanged) ---
  const rowData = [
    {
      name: "Royal Orchard",
      totalHomes: 83,
      price: 1550,
      forSale: 74,
      forSalePercentage: 90,
      forRent: 9,
      forRentPercentage: 10,
      avgPrice: "$1.23 M",
      avgPriceSqft: "$4123",
      avgDom: "43 day",
      children: [
        {
          name: "1 Bedroom",
          totalHomes: 25,
          price: 1550,
          forSale: 18,
          forSalePercentage: 90,
          forRent: 7,
          forRentPercentage: 10,
          avgPrice: "$820 K",
          avgPriceSqft: "$3 520",
          avgDom: "41 day",
        },
        {
          name: "2 Bedroom",
          totalHomes: 30,
          price: 1550,
          forSale: 22,
          forSalePercentage: 90,
          forRent: 8,
          forRentPercentage: 10,
          avgPrice: "$955 K",
          avgPriceSqft: "$3 810",
          avgDom: "39 day",
        },
        {
          name: "3 Bedroom",
          totalHomes: 20,
          price: 1550,
          forSale: 15,
          forSalePercentage: 90,
          forRent: 5,
          forRentPercentage: 10,
          avgPrice: "$1.30 M",
          avgPriceSqft: "$4170",
          avgDom: "45 day",
        },
        {
          name: "4 Bedroom & Up",
          totalHomes: 8,
          price: 1550,
          forSale: 6,
          forSalePercentage: 90,
          forRent: 2,
          forRentPercentage: 10,
          avgPrice: "$1.75 M",
          avgPriceSqft: "$4430",
          avgDom: "48 day",
        },
      ],
    },
    {
      name: "Uplands",
      totalHomes: 79,
      price: 1550,
      forSale: 55,
      forSalePercentage: 90,
      forRent: 24,
      forRentPercentage: 10,
      avgPrice: "$1.28 M",
      avgPriceSqft: "$4070",
      avgDom: "44 day",
      children: [
        {
          name: "1 Bedroom",
          totalHomes: 18,
          price: 1550,
          forSale: 12,
          forSalePercentage: 90,
          forRent: 6,
          forRentPercentage: 10,
          avgPrice: "$790 K",
          avgPriceSqft: "$3480",
          avgDom: "38 day",
        },
        {
          name: "2 Bedroom",
          totalHomes: 27,
          price: 1550,
          forSale: 19,
          forSalePercentage: 90,
          forRent: 8,
          forRentPercentage: 10,
          avgPrice: "$980 K",
          avgPriceSqft: "$3850",
          avgDom: "40 day",
        },
        {
          name: "3 Bedroom",
          totalHomes: 22,
          price: 1550,
          forSale: 16,
          forSalePercentage: 90,
          forRent: 6,
          forRentPercentage: 10,
          avgPrice: "$1.18 M",
          avgPriceSqft: "$4060",
          avgDom: "43 day",
        },
        {
          name: "4 Bedroom & Up",
          totalHomes: 12,
          price: 1550,
          forSale: 8,
          forSalePercentage: 90,
          forRent: 4,
          forRentPercentage: 10,
          avgPrice: "$1.62 M",
          avgPriceSqft: "$4390",
          avgDom: "47 day",
        },
      ],
    },
    {
      name: "Thornhill",
      totalHomes: 91,
      price: 1550,
      forSale: 70,
      forSalePercentage: 90,
      forRent: 21,
      forRentPercentage: 10,
      avgPrice: "$1.30 M",
      avgPriceSqft: "$4180",
      avgDom: "42 day",
      children: [
        {
          name: "1 Bedroom",
          totalHomes: 23,
          price: 1550,
          forSale: 17,
          forSalePercentage: 90,
          forRent: 6,
          forRentPercentage: 10,
          avgPrice: "$830 K",
          avgPriceSqft: "$3560",
          avgDom: "39 day",
        },
        {
          name: "2 Bedroom",
          totalHomes: 28,
          price: 1550,
          forSale: 21,
          forSalePercentage: 90,
          forRent: 7,
          forRentPercentage: 10,
          avgPrice: "$1.01 M",
          avgPriceSqft: "$3870",
          avgDom: "40 day",
        },
        {
          name: "3 Bedroom",
          totalHomes: 28,
          price: 1550,
          forSale: 22,
          forSalePercentage: 90,
          forRent: 6,
          forRentPercentage: 10,
          avgPrice: "$1.22 M",
          avgPriceSqft: "$4110",
          avgDom: "42 day",
        },
        {
          name: "4 Bedroom & Up",
          totalHomes: 12,
          price: 1550,
          forSale: 10,
          forSalePercentage: 90,
          forRent: 2,
          forRentPercentage: 10,
          avgPrice: "$1.68 M",
          avgPriceSqft: "$4420",
          avgDom: "46 day",
        },
      ],
    },
    {
      name: "German Mills",
      totalHomes: 67,
      price: 1550,
      forSale: 48,
      forSalePercentage: 90,
      forRent: 19,
      forRentPercentage: 10,
      avgPrice: "$1.18 M",
      avgPriceSqft: "$3 990",
      avgDom: "45 day",
      children: [
        {
          name: "1 Bedroom",
          totalHomes: 15,
          price: 1550,
          forSale: 11,
          forSalePercentage: 90,
          forRent: 4,
          forRentPercentage: 10,
          avgPrice: "$760 K",
          avgPriceSqft: "$3 420",
          avgDom: "40 day",
        },
        {
          name: "2 Bedroom",
          totalHomes: 20,
          price: 1550,
          forSale: 14,
          forSalePercentage: 90,
          forRent: 6,
          forRentPercentage: 10,
          avgPrice: "$905 K",
          avgPriceSqft: "$3 740",
          avgDom: "41 day",
        },
        {
          name: "3 Bedroom",
          totalHomes: 22,
          price: 1550,
          forSale: 16,
          forSalePercentage: 90,
          forRent: 6,
          forRentPercentage: 10,
          avgPrice: "$1.15 M",
          avgPriceSqft: "$4 020",
          avgDom: "44 day",
        },
        {
          name: "4 Bedroom & Up",
          totalHomes: 10,
          price: 1550,
          forSale: 7,
          forSalePercentage: 90,
          forRent: 3,
          forRentPercentage: 10,
          avgPrice: "$1.48 M",
          avgPriceSqft: "$4 310",
          avgDom: "49 day",
        },
      ],
    },
    {
      name: "Newtonbrook",
      totalHomes: 85,
      price: 1550,
      forSale: 64,
      forSalePercentage: 90,
      forRent: 21,
      forRentPercentage: 10,
      avgPrice: "$1.25 M",
      avgPriceSqft: "$4 050",
      avgDom: "41 day",
      children: [
        {
          name: "1 Bedroom",
          totalHomes: 20,
          price: 1550,
          forSale: 14,
          forSalePercentage: 90,
          forRent: 6,
          forRentPercentage: 10,
          avgPrice: "$800 K",
          avgPriceSqft: "$3 500",
          avgDom: "37 day",
        },
        {
          name: "2 Bedroom",
          totalHomes: 29,
          price: 1550,
          forSale: 21,
          forSalePercentage: 90,
          forRent: 8,
          forRentPercentage: 10,
          avgPrice: "$930 K",
          avgPriceSqft: "$3 820",
          avgDom: "39 day",
        },
        {
          name: "3 Bedroom",
          totalHomes: 24,
          price: 1550,
          forSale: 18,
          forSalePercentage: 90,
          forRent: 6,
          forRentPercentage: 10,
          avgPrice: "$1.20 M",
          avgPriceSqft: "$4 090",
          avgDom: "42 day",
        },
        {
          name: "4 Bedroom & Up",
          totalHomes: 12,
          price: 1550,
          forSale: 11,
          forSalePercentage: 90,
          forRent: 1,
          forRentPercentage: 10,
          avgPrice: "$1.58 M",
          avgPriceSqft: "$4 360",
          avgDom: "45 day",
        },
      ],
    },
  ];

  // Build URLs for parent + child rows
  const slug = (s) =>
    (s || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  rowData.forEach((n) => {
    const base = `/neighborhood/${slug(n.name)}`;
    n.url = base;
    (n.children || []).forEach((c) => {
      c.url = `${base}?type=${encodeURIComponent(c.name)}`;
    });
  });

  // --- COLUMNS ---
  const columnDefs = [
    // (Do NOT add { field:'name' } here — autoGroupColumn below will render it)
    {
      field: "totalHomes",
      headerName: "Total Homes",
      minWidth: 120,
      flex: 1,
      cellClass: "link-cell",
      cellRenderer: (p) => {
        const wrap = document.createElement("div");
        const main = document.createElement("span");
        main.textContent = p.value ?? "";
        const sub = document.createElement("span");
        sub.classList.add("ag-grid-sub-text");
        sub.textContent = `$${p.data?.price ?? ""}k`;
        wrap.appendChild(main);
        wrap.appendChild(sub);
        return makeLink(p.data?.url, wrap, `Open ${p.data?.name ?? ""}`);
      },
    },
    {
      field: "forSale",
      headerName: "For Sale",
      minWidth: 110,
      flex: 1,
      cellClass: "link-cell",
      cellRenderer: (p) => {
        const wrap = document.createElement("div");
        const main = document.createElement("span");
        main.textContent = p.value ?? "";
        const sub = document.createElement("span");
        sub.classList.add("ag-grid-sub-text");
        sub.textContent = `$${p.data?.forSalePercentage ?? ""}k`;
        wrap.appendChild(main);
        wrap.appendChild(sub);
        return makeLink(p.data?.url, wrap, `Open ${p.data?.name ?? ""}`);
      },
    },
    {
      field: "forRent",
      headerName: "For Rent",
      minWidth: 110,
      flex: 1,
      cellClass: "link-cell",
      cellRenderer: (p) => {
        const wrap = document.createElement("div");
        const main = document.createElement("span");
        main.textContent = p.value ?? "";
        const sub = document.createElement("span");
        sub.classList.add("ag-grid-sub-text");
        sub.textContent = `$${p.data?.forRentPercentage ?? ""}k`;
        wrap.appendChild(main);
        wrap.appendChild(sub);
        return makeLink(p.data?.url, wrap, `Open ${p.data?.name ?? ""}`);
      },
    },
    {
      field: "avgPrice",
      headerName: "Average Price",
      minWidth: 140,
      flex: 1,
      cellClass: "link-cell",
      cellRenderer: valueLinkRenderer,
    },
    {
      field: "avgPriceSqft",
      headerName: "Average Price/sqft",
      minWidth: 160,
      flex: 1,
      cellClass: "link-cell",
      cellRenderer: valueLinkRenderer,
    },
    {
      field: "avgDom",
      headerName: "Average DOM",
      minWidth: 140,
      flex: 1,
      cellClass: "link-cell",
      cellRenderer: valueLinkRenderer,
    },
  ];

  // --- GRID ---
  const gridOptions = {
    columnDefs,
    rowData,
    domLayout: "autoHeight",
    defaultColDef: {
      headerClass: "header-cell-text",
      autoHeight: true,
      wrapText: true,
      suppressMovable: true,
      resizable: false,
      minWidth: 110,
      flex: 1,
    },

    // Tree Data
    treeData: true,
    treeDataChildrenField: "children",
    groupDefaultExpanded: 0,
    animateRows: true,
    getRowClass: (p) => (p.node.level === 1 ? "sub-row" : ""),

    // Use auto-group column for the Name (chevron + text). Ensure it always has a value.
    autoGroupColumnDef: {
      headerName: "Neighborhood Name",
      minWidth: 220,
      cellClass: "link-cell",
      valueGetter: (p) => p.data?.name ?? p.node?.key ?? "",
      cellRendererParams: {
        suppressCount: true,
        innerRenderer: (p) => {
          const text = (p.value ?? "").toString();
          const span = document.createElement("span");
          span.textContent = text;
          return makeLink(p.data?.url || "#", span, `Open ${text}`);
        },
      },
    },

    onFirstDataRendered: (params) => {
      const row = params.api.getDisplayedRowAtIndex(1);
      if (row) row.setExpanded(true);
    },
  };

  agGrid.createGrid(eGridDiv, gridOptions);
}

function initrankingCityGrid() {
  if (typeof agGrid === "undefined") return;
  const eGridDiv = document.querySelector("#rankingCityGrid");
  if (!eGridDiv) return;

  // ---------------- helpers ----------------
  const slug = (s) =>
    (s || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  function makeLink(href, node, aria) {
    const a = document.createElement("a");
    a.href = href || "#";
    a.target = "_blank"; // change to "_self" for same-tab
    a.rel = "noopener noreferrer";
    a.className = "ag-link-cell";
    if (aria) a.setAttribute("aria-label", aria);
    a.appendChild(node);
    return a;
  }

  function valueLinkRenderer(params) {
    const span = document.createElement("span");
    span.textContent = (params.valueFormatted ?? params.value ?? "").toString();
    const url = params.data?.categoryUrl || params.data?.placeUrl || "#";
    return makeLink(url, span, "Open");
  }

  // ---------------- data (yours) ----------------
  const rowData = [
    {
      category: "Best Places to Raise a Family",
      placeCount: 83,
      avgScore: 98,
      topPics: [
        "https://picsum.photos/seed/BestPlacestoRaiseaFamily1/40",
        "https://picsum.photos/seed/BestPlacestoRaiseaFamily2/40",
        "https://picsum.photos/seed/BestPlacestoRaiseaFamily3/40",
      ],
      places: [
        {
          name: "Greenwood Estates",
          avatar: "https://picsum.photos/seed/GreenwoodEstates/24",
          rating: 4.7,
          reviewCount: 198,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 20,
          totalScore: 97,
          trend: 1,
          tags: ["Low crime", "Good schools"],
        },
        {
          name: "Lincoln Park",
          avatar: "https://picsum.photos/seed/LincolnPark/24",
          rating: 4.5,
          reviewCount: 134,
          sentiment: "Mixed",
          popularity: "High",
          access: "Partial",
          amenities: 18,
          totalScore: 92,
          trend: -1,
        },
        {
          name: "Highland Creek",
          avatar: "https://picsum.photos/seed/HighlandCreek/24",
          rating: 4.6,
          reviewCount: 156,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 19,
          totalScore: 94,
          trend: -1,
        },
        {
          name: "Willowdale Village",
          avatar: "https://picsum.photos/seed/WillowdaleVillage/24",
          rating: 4.8,
          reviewCount: 210,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 22,
          totalScore: 98,
          trend: 2,
        },
        {
          name: "Sunnybrook Gardens",
          avatar: "https://picsum.photos/seed/SunnybrookGardens/24",
          rating: 4.4,
          reviewCount: 97,
          sentiment: "Mixed",
          popularity: "High",
          access: "Partial",
          amenities: 16,
          totalScore: 90,
          trend: -2,
        },
        {
          name: "Grandview Heights",
          avatar: "https://picsum.photos/seed/GrandviewHeights/24",
          rating: 4.9,
          reviewCount: 245,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 25,
          totalScore: 99,
          trend: 1,
        },
      ],
    },
    {
      category: "Best Places to Buy a House",
      placeCount: 128,
      avgScore: 98,
      topPics: [
        "https://picsum.photos/seed/BestPlacestoBuyaHouse1/40",
        "https://picsum.photos/seed/BestPlacestoBuyaHouse2/40",
        "https://picsum.photos/seed/BestPlacestoBuyaHouse3/40",
      ],
      places: [
        {
          name: "Sunnyvale Estates",
          avatar: "https://picsum.photos/seed/SunnyvaleEstates/24",
          rating: 4.8,
          reviewCount: 215,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 21,
          totalScore: 98,
          trend: 2,
          tags: ["Strong EQAO", "Diverse Student"],
        },
        {
          name: "Oakwood Meadows",
          avatar: "https://picsum.photos/seed/OakwoodMeadows/24",
          rating: 5.0,
          reviewCount: 64,
          sentiment: "Mixed",
          popularity: "High",
          access: "Partial",
          amenities: 14,
          totalScore: 88,
          trend: -1,
          tags: ["Family friendly", "Dog friendly", "Great local center"],
        },
        {
          name: "Willow Creek Heights",
          avatar: "https://picsum.photos/seed/WillowCreekHeights/24",
          rating: 5.0,
          reviewCount: 64,
          sentiment: "Low",
          popularity: "High",
          access: "Partial",
          amenities: 14,
          totalScore: 86,
          trend: -1,
          tags: ["Family friendly", "Dog friendly", "Great local center"],
        },
        {
          name: "Riverbend Gardens",
          avatar: "https://picsum.photos/seed/RiverbendGardens/24",
          rating: 5.0,
          reviewCount: 64,
          sentiment: "Mixed",
          popularity: "High",
          access: "Partial",
          amenities: 14,
          totalScore: 84,
          trend: -1,
          tags: ["Family friendly", "Dog friendly", "Great local center"],
        },
        {
          name: "Maple Glen",
          avatar: "https://picsum.photos/seed/MapleGlen/24",
          rating: 4.7,
          reviewCount: 89,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 18,
          totalScore: 90,
          trend: 0,
        },
        {
          name: "Eagle Heights",
          avatar: "https://picsum.photos/seed/EagleHeights/24",
          rating: 4.6,
          reviewCount: 112,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 17,
          totalScore: 92,
          trend: 1,
        },
      ],
    },
    {
      category: "Most Diverse Places",
      placeCount: 128,
      avgScore: 98,
      topPics: [
        "https://picsum.photos/seed/MostDiversePlaces1/40",
        "https://picsum.photos/seed/MostDiversePlaces2/40",
        "https://picsum.photos/seed/MostDiversePlaces3/40",
      ],
      places: [
        {
          name: "Place A",
          avatar: "https://picsum.photos/seed/PlaceA/24",
          rating: 4.0,
          reviewCount: 50,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 10,
          totalScore: 95,
          trend: 1,
          // tag: ["Strong EQAO"],
        },
        {
          name: "Place B",
          avatar: "https://picsum.photos/seed/PlaceB/24",
          rating: 4.2,
          reviewCount: 75,
          sentiment: "Mixed",
          popularity: "High",
          access: "Partial",
          amenities: 12,
          totalScore: 90,
          trend: -1,
        },
        {
          name: "Place C",
          avatar: "https://picsum.photos/seed/PlaceC/24",
          rating: 4.1,
          reviewCount: 60,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 11,
          totalScore: 88,
          trend: -1,
        },
        {
          name: "Place D",
          avatar: "httpsum.photos/seed/PlaceD/24",
          rating: 4.3,
          reviewCount: 80,
          sentiment: "Mixed",
          popularity: "High",
          access: "Partial",
          amenities: 13,
          totalScore: 92,
          trend: 1,
        },
        {
          name: "Place E",
          avatar: "https://picsum.photos/seed/PlaceE/24",
          rating: 4.4,
          reviewCount: 90,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 15,
          totalScore: 96,
          trend: 2,
        },
        {
          name: "Place F",
          avatar: "https://picsum.photos/seed/PlaceF/24",
          rating: 4.0,
          reviewCount: 55,
          sentiment: "Low",
          popularity: "High",
          access: "Partial",
          amenities: 9,
          totalScore: 85,
          trend: -2,
        },
      ],
    },
    {
      category: "Places with the Best Public Schools",
      placeCount: 128,
      avgScore: 98,
      topPics: [
        "https://picsum.photos/seed/PlaceswiththeBestPublicSchools1/40",
        "https://picsum.photos/seed/PlaceswiththeBestPublicSchools2/40",
        "https://picsum.photos/seed/PlaceswiththeBestPublicSchools3/40",
      ],
      places: [
        {
          name: "Place A",
          avatar: "https://picsum.photos/seed/PlaceApub/24",
          rating: 4.0,
          reviewCount: 50,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 10,
          totalScore: 95,
          trend: 1,
        },
        {
          name: "Place B",
          avatar: "https://picsum.photos/seed/PlaceBpub/24",
          rating: 4.2,
          reviewCount: 75,
          sentiment: "Mixed",
          popularity: "High",
          access: "Partial",
          amenities: 12,
          totalScore: 90,
          trend: -1,
        },
        {
          name: "Place C",
          avatar: "https://picsum.photos/seed/PlaceCpub/24",
          rating: 4.1,
          reviewCount: 60,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 11,
          totalScore: 88,
          trend: -1,
        },
        {
          name: "Place D",
          avatar: "https://picsum.photos/seed/PlaceDpub/24",
          rating: 4.3,
          reviewCount: 80,
          sentiment: "Mixed",
          popularity: "High",
          access: "Partial",
          amenities: 13,
          totalScore: 92,
          trend: 1,
        },
        {
          name: "Place E",
          avatar: "https://picsum.photos/seed/PlaceEpub/24",
          rating: 4.4,
          reviewCount: 90,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 15,
          totalScore: 96,
          trend: 2,
        },
        {
          name: "Place F",
          avatar: "https://picsum.photos/seed/PlaceFpub/24",
          rating: 4.0,
          reviewCount: 55,
          sentiment: "Low",
          popularity: "High",
          access: "Partial",
          amenities: 9,
          totalScore: 85,
          trend: -2,
        },
      ],
    },
    {
      category: "Places with the Best Night Life",
      placeCount: 128,
      avgScore: 98,
      topPics: [
        "https://picsum.photos/seed/PlaceswiththeBestNightLife1/40",
        "https://picsum.photos/seed/PlaceswiththeBestNightLife2/40",
        "https://picsum.photos/seed/PlaceswiththeBestNightLife3/40",
      ],
      places: [
        {
          name: "Place A",
          avatar: "https://picsum.photos/seed/PlaceAnight/24",
          rating: 4.0,
          reviewCount: 50,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 10,
          totalScore: 95,
          trend: 1,
        },
        {
          name: "Place B",
          avatar: "https://picsum.photos/seed/PlaceBnight/24",
          rating: 4.2,
          reviewCount: 75,
          sentiment: "Mixed",
          popularity: "High",
          access: "Partial",
          amenities: 12,
          totalScore: 90,
          trend: -1,
        },
        {
          name: "Place C",
          avatar: "https://picsum.photos/seed/PlaceCnight/24",
          rating: 4.1,
          reviewCount: 60,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 11,
          totalScore: 88,
          trend: -1,
        },
        {
          name: "Place D",
          avatar: "https://picsum.photos/seed/PlaceDnight/24",
          rating: 4.3,
          reviewCount: 80,
          sentiment: "Mixed",
          popularity: "High",
          access: "Partial",
          amenities: 13,
          totalScore: 92,
          trend: 1,
        },
        {
          name: "Place E",
          avatar: "https://picsum.photos/seed/PlaceEnight/24",
          rating: 4.4,
          reviewCount: 90,
          sentiment: "High",
          popularity: "High",
          access: "Full",
          amenities: 15,
          totalScore: 96,
          trend: 2,
        },
        {
          name: "Place F",
          avatar: "https://picsum.photos/seed/PlaceFnight/24",
          rating: 4.0,
          reviewCount: 55,
          sentiment: "Low",
          popularity: "High",
          access: "Partial",
          amenities: 9,
          totalScore: 85,
          trend: -2,
        },
      ],
    },
  ];

  // add URLs per category and place (non-breaking)
  rowData.forEach((cat) => {
    cat.categoryUrl = `/rankings/${slug(cat.category)}`;
    (cat.places || []).forEach(
      (p) => (p.placeUrl = `${cat.categoryUrl}/${slug(p.name)}`)
    );
  });

  // ---------------- master columns ----------------
  const masterColumnDefs = [
    {
      field: "category",
      headerName: "Category",
      cellRenderer: "agGroupCellRenderer",
      cellRendererParams: {
        suppressCount: true,
        // keep the expand icon, just wrap the label in a link
        innerRenderer: (p) => {
          const span = document.createElement("span");
          span.textContent = p.value ?? "";
          return makeLink(p.data?.categoryUrl, span, `Open ${p.value}`);
        },
      },
      autoHeight: true,
      wrapText: true,
      flex: 2,
      minWidth: 250,
      cellClass: "link-cell",
    },
    {
      headerName: "Top Ranked",
      field: "topPics",
      minWidth: 160,
      cellClass: "link-cell",
      cellRenderer: (params) => {
        if (!params.value) return "";
        const wrap = document.createElement("div");
        wrap.classList.add("flex", "gap-1.5");
        params.value.forEach((src) => {
          const img = document.createElement("img");
          img.src = src;
          img.alt = "";
          img.classList.add("grid-ranking-city__top-ranked-img");
          wrap.appendChild(img);
        });
        return makeLink(
          params.data?.categoryUrl,
          wrap,
          `Open ${params.data?.category}`
        );
      },
    },
    {
      field: "placeCount",
      headerName: "# of Places",
      minWidth: 120,
      cellClass: "link-cell",
      cellRenderer: valueLinkRenderer,
    },
    {
      field: "avgScore",
      headerName: "Average Score",
      minWidth: 130,
      cellClass: "link-cell",
      cellRenderer: valueLinkRenderer,
    },
  ];

  // ---------------- detail columns ----------------
  const detailColumnDefs = [
    {
      field: "name",
      headerName: "Place Name",
      minWidth: 380,
      flex: 3,
      autoHeight: true,
      wrapText: true,
      colSpan: (p) => (p.data && p.data.seeMore ? 7 : 1),
      cellClass: "link-cell",
      cellRenderer: (params) => {
        // special "See more" row
        if (params.data && params.data.seeMore) {
          const a = document.createElement("a");
          a.href = params.data.categoryUrl || "#";
          a.className = "grid-ranking-city__see-more-link ag-link-cell";
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = "See more";
          return a;
        }

        const wrap = document.createElement("div");
        wrap.classList.add("grid-ranking-city__place-name-cell");

        const img = document.createElement("img");
        img.src = params.data.avatar;
        img.alt = "";
        img.classList.add("grid-ranking-city__place-name-img");

        const right = document.createElement("div");
        const name = document.createElement("span");
        name.textContent = params.data.name;

        const tags = document.createElement("div");
        tags.classList.add("grid-ranking-city__place-name-tags");
        (params.data.tags || []).forEach((t) => {
          const tag = document.createElement("span");
          tag.classList.add("grid-ranking-city__place-name-tag");
          tag.textContent = t;
          tags.appendChild(tag);
        });

        right.appendChild(name);
        right.appendChild(tags);
        wrap.appendChild(img);
        wrap.appendChild(right);

        return makeLink(params.data.placeUrl, wrap, `Open ${params.data.name}`);
      },
    },
    {
      field: "rating",
      headerName: "Reviews",
      cellClass: "link-cell",
      cellRenderer: (params) => {
        const wrap = document.createElement("div");
        wrap.classList.add("grid-ranking-city__iconed-block-s");
        const icon = document.createElement("img");
        icon.src = "images/v-r-reviews-icon.svg";
        const num = document.createElement("span");
        num.textContent = `${params.value} (${params.data.reviewCount})`;
        wrap.appendChild(icon);
        wrap.appendChild(num);
        return makeLink(
          params.data.placeUrl,
          wrap,
          `Open ${params.data.name} reviews`
        );
      },
    },
    {
      field: "sentiment",
      headerName: "Sentiment",
      cellClass: "link-cell",
      cellRenderer: (params) => {
        const wrap = document.createElement("div");
        wrap.classList.add("grid-ranking-city__iconed-block-s");
        const emoji = document.createElement("img");
        emoji.alt = "";
        if (params.value === "High") emoji.src = "images/v-r-high-icon.svg";
        else if (params.value === "Mixed")
          emoji.src = "images/v-r-mixed-icon.svg";
        else if (params.value === "Low") emoji.src = "images/v-r-low-icon.svg";
        const txt = document.createElement("span");
        txt.textContent = params.value;
        wrap.appendChild(emoji);
        wrap.appendChild(txt);
        return makeLink(params.data.placeUrl, wrap, `Open ${params.data.name}`);
      },
    },
    {
      field: "popularity",
      headerName: "Popularity",
      cellClass: "link-cell",
      cellRenderer: (params) => {
        const span = document.createElement("span");
        span.classList.add("grid-ranking-city__popularity");
        if (params.value === "High") span.classList.add("high");
        span.textContent = params.value;
        return makeLink(params.data.placeUrl, span, `Open ${params.data.name}`);
      },
    },
    {
      field: "access",
      headerName: "Accessibility",
      cellClass: "link-cell",
      cellRenderer: (params) => {
        const wrap = document.createElement("div");
        wrap.classList.add("grid-ranking-city__iconed-block-s");
        const icon = document.createElement("img");
        icon.src = "images/v-r-accessibility-icon.svg";
        const txt = document.createElement("span");
        txt.textContent = params.value;
        wrap.appendChild(icon);
        wrap.appendChild(txt);
        return makeLink(params.data.placeUrl, wrap, `Open ${params.data.name}`);
      },
    },
    {
      field: "amenities",
      headerName: "Amenities",
      cellClass: "link-cell",
      cellRenderer: (params) => {
        const wrap = document.createElement("div");
        wrap.classList.add("grid-ranking-city__iconed-block-s");
        const icon = document.createElement("img");
        icon.src = "images/v-r-amenities-icon.svg";
        const txt = document.createElement("span");
        txt.textContent = params.value;
        wrap.appendChild(icon);
        wrap.appendChild(txt);
        return makeLink(params.data.placeUrl, wrap, `Open ${params.data.name}`);
      },
    },
    {
      field: "totalScore",
      headerName: "Total Score",
      minWidth: 180,
      cellClass: "link-cell",
      cellRenderer: (params) => {
        const wrap = document.createElement("div");
        wrap.classList.add("grid-ranking-city__total-score");
        const icon = document.createElement("img");
        icon.src = "images/v-r-total-scrore-icon.svg";
        icon.classList.add("w-11.5", "lg:w-13.75");
        const txt = document.createElement("span");
        txt.textContent = params.value;
        txt.classList.add("text-[1.7rem]", "lg:text-[2rem]");
        const sup = document.createElement("sup");
        sup.classList.add("grid-ranking-city__total-score-trend");
        const supText = document.createElement("span");
        const tri = document.createElement("span");
        tri.classList.add("grid-ranking-city__total-score-triangle");
        if (params.data.trend && params.data.trend > 0) {
          supText.textContent = params.data.trend;
          tri.textContent = "▲";
          tri.classList.add("top");
        } else if (params.data.trend && params.data.trend < 0) {
          supText.textContent = Math.abs(params.data.trend);
          tri.textContent = "▼";
          tri.classList.add("bottom");
        }
        sup.appendChild(supText);
        sup.appendChild(tri);
        wrap.appendChild(icon);
        wrap.appendChild(txt);
        wrap.appendChild(sup);
        return makeLink(params.data.placeUrl, wrap, `Open ${params.data.name}`);
      },
    },
  ];

  // ---------------- grid options (master/detail) ----------------
  const gridOptions = {
    columnDefs: masterColumnDefs,
    rowData,
    domLayout: "autoHeight",
    defaultColDef: {
      headerClass: "header-cell-text",
      suppressMovable: true,
      resizable: false,
      sortable: true,
      filter: false,
      flex: 1,
      minWidth: 130,
    },

    masterDetail: true,
    detailRowAutoHeight: true,

    // tell AG Grid which rows have a detail grid
    isRowMaster: (dataItem) =>
      !!dataItem &&
      Array.isArray(dataItem.places) &&
      dataItem.places.length > 0,

    onFirstDataRendered: (params) => {
      const row = params.api.getDisplayedRowAtIndex(0);
      if (row) row.setExpanded(true);
    },

    detailCellRendererParams: {
      detailGridOptions: {
        defaultColDef: {
          headerClass: "header-cell-text",
          suppressMovable: true,
          resizable: false,
          sortable: true,
          filter: false,
          flex: 1,
          minWidth: 130,
        },
        columnDefs: detailColumnDefs,
        getRowClass: (p) =>
          p.data && p.data.seeMore
            ? "see-more-row"
            : p.node.rowIndex % 2 === 0
            ? "detail-row-alt"
            : "",
      },

      // supply the child rows; also attach URLs for links & "See more"
      getDetailRowData: (params) => {
        const all = params.data.places || [];
        const catUrl = params.data.categoryUrl;

        const copy = (p) => ({
          ...p,
          placeUrl: p.placeUrl || `${catUrl}/${slug(p.name)}`,
          categoryUrl: catUrl,
        });

        if (all.length > 4) {
          const showing = all.slice(0, 4).map(copy);
          showing.push({ seeMore: true, categoryUrl: catUrl });
          params.successCallback(showing);
        } else {
          params.successCallback(all.map(copy));
        }
      },
    },
  };

  agGrid.createGrid(eGridDiv, gridOptions);
}
function initMonthlyCostsOverviewGridChart() {
  if (typeof agCharts === "undefined" || !agCharts.AgCharts) return;

  const container = document.getElementById("monthlyCostsOverviewChart");
  const containerGrid = document.getElementById("monthlyCostsOverviewGrid");
  if (!container || !containerGrid) return;

  const data = [
    { category: "Repairs & General Meintenance", value: 168, color: "#FF603F" },
    { category: "Home Insurance", value: 79, color: "#C94629" },
    { category: "Private Mortgage Insurance", value: 158, color: "#FF785C" },
    { category: "Snow Removal & Lawn Care", value: 158, color: "#FFDFD2" },
    { category: "Property Taxes", value: 130, color: "#5F190B" },
    { category: "Untility Bills", value: 218, color: "#E5EBFF" },
    { category: "Internet & TV", value: 201, color: "#293464" },
    { category: "Home Security", value: 105, color: "#466EFF" },
    { category: "Pest Control Subscription", value: 200, color: "#98AEFF" },
    { category: "Homeowners Association Fees", value: 50, color: "#334FCC" },
  ];

  const numFormatter = new Intl.NumberFormat("en-US");
  const total = data.reduce((s, d) => s + d.value, 0);

  const isLight = (hex) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.slice(0, 2), 16) / 255;
    const g = parseInt(c.slice(2, 4), 16) / 255;
    const b = parseInt(c.slice(4, 6), 16) / 255;
    const lin = (u) =>
      u <= 0.03928 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.6; // tweak if needed
  };

  const getFontSizes = () => {
    const s = getComputedStyle(container);
    const num = (v) => parseFloat(String(v).trim()) || 0;
    return {
      sector:
        num(s.getPropertyValue("--monthly-costs-overview-chart-sector-fs")) ||
        12,
      innerLabel:
        num(
          s.getPropertyValue("--monthly-costs-overview-chart-inner-label-fs")
        ) || 14,
      innerValue:
        num(
          s.getPropertyValue("--monthly-costs-overview-chart-inner-value-fs")
        ) || 16,
    };
  };

  const transparent = "rgba(0,0,0,0)";
  let chart;

  function render() {
    const fs = getFontSizes();

    const base = {
      type: "donut",
      data, // full data in both series
      angleKey: "value",
      sectorLabelKey: "value",
      rotation: -175,
      innerRadiusRatio: 0.525,
      tooltip: { enabled: false },

      // 🚫 remove borders/gaps/hover stroke
      strokeWidth: 0,
      stroke: "transparent",
      highlightStyle: { item: { strokeWidth: 0 } },
      fillOpacity: 1,
      // sectorSpacing: 0, // default is 0

      sectorLabel: {
        formatter: ({ datum }) => `${datum.value}$`,
        fontFamily: "Alber Sans, system-ui, sans-serif",
        fontSize: fs.sector,
        fontWeight: "bold",
      },
    };

    const seriesDark = {
      ...base,
      fills: data.map((d) => (isLight(d.color) ? transparent : d.color)),
      sectorLabel: {
        ...base.sectorLabel,
        color: "#ffffff",
        formatter: ({ datum }) =>
          isLight(datum.color) ? "" : `${datum.value}$`,
      },
      innerLabels: [
        {
          text: "Total",
          fontFamily: "Alber Sans, system-ui, sans-serif",
          fontSize: fs.innerLabel,
          fontWeight: 600,
          color: "#7C7C7C",
        },
        {
          text: `$${numFormatter.format(total)}`,
          fontFamily: "Alber Sans, system-ui, sans-serif",
          fontSize: fs.innerValue,
          fontWeight: 600,
          color: "#1F1F1F",
        },
      ],
    };

    const seriesLight = {
      ...base,
      fills: data.map((d) => (isLight(d.color) ? d.color : transparent)),
      sectorLabel: {
        ...base.sectorLabel,
        color: "#1F1F1F",
        formatter: ({ datum }) =>
          isLight(datum.color) ? `${datum.value}$` : "",
      },
      innerLabels: [],
    };

    const options = {
      container,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      legend: { enabled: false },
      series: [seriesDark, seriesLight],
    };

    chart ? chart.update(options) : (chart = agCharts.AgCharts.create(options));
  }

  render();

  // Grid (unchanged)
  const gridOptions = {
    columnDefs: [
      {
        headerName: "Type",
        field: "category",
        flex: 3.5,
        cellRenderer: (p) =>
          `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;
           background:${p.data.color};margin-right:6px;margin-bottom:2px"></span>${p.value}`,
      },
      {
        headerName: "Costs",
        field: "value",
        valueFormatter: (p) => `$${p.value}`,
        flex: 1,
      },
    ],
    rowData: data,
    domLayout: "autoHeight",
    defaultColDef: { resizable: false, headerClass: "header-cell-text" },
    headerHeight: 34,
  };

  agGrid.createGrid(containerGrid, gridOptions);

  const ro = new ResizeObserver(render);
  ro.observe(container.closest(".section-wrapper") || container);
}

function initInsuranceComparisonGrid() {
  if (typeof agGrid === "undefined") return;
  const eGridDiv = document.querySelector("#insuranceComparisonGrid");
  if (!eGridDiv) return;

  // ---------------- helpers ----------------
  const slug = (s) =>
    (s || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  function makeLink(href, node, aria) {
    const a = document.createElement("a");
    a.href = href || "#";
    a.target = "_blank"; // change to "_self" if you want same-tab nav
    a.rel = "noopener noreferrer";
    a.className = "ag-link-cell";
    if (aria) a.setAttribute("aria-label", aria);
    a.appendChild(node);
    return a;
  }

  const fmtMoney = (n) => {
    const num = typeof n === "number" ? n : Number(String(n).replace(/,/g, ""));
    if (!isFinite(num)) return String(n);
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 2,
    }).format(num);
  };

  // ---------------- data ----------------
  const rowData = [
    {
      company: "Manulife",
      imageUrl: "images/m-c-scotiabank.png",
      companyDesc: "",
      amountMonthly: "1648.19",
      amountYearly: "12,800",
      coverage: [
        "Fire, theft, and disaster protection",
        "Structural damage coverage",
        "Personal belongings protection",
      ],
      inquire: "",
      date: "Dec 07, 2025",
      interactive: true,
      active: false,
    },
    {
      company: "Avia",
      imageUrl: "images/m-c-rbc.png",
      companyDesc: "This is your insurance",
      amountMonthly: "1948.99",
      amountYearly: "12,800",
      coverage: [
        "Fire, theft, and disaster protection",
        "Structural damage coverage",
        "Personal belongings protection",
      ],
      inquire: "",
      date: "Dec 07, 2025",
      interactive: false,
      active: true,
    },
    {
      company: "Sonnet",
      imageUrl: "images/m-c-meridian.png",
      companyDesc: "",
      amountMonthly: "2,368.99",
      amountYearly: "12,800",
      coverage: [
        "Fire, theft, and disaster protection",
        "Structural damage coverage",
        "",
      ],
      inquire: "",
      date: "Dec 07, 2025",
      interactive: true,
      active: false,
    },
    {
      company: "RBC",
      imageUrl: "images/m-c-nesto.png",
      companyDesc: "",
      amountMonthly: "1648.19",
      amountYearly: "12,800",
      coverage: [
        "Fire, theft, and disaster protection",
        "Structural damage coverage",
        "",
      ],
      inquire: "",
      date: "Dec 07, 2025",
      interactive: true,
      active: false,
    },
  ];

  // add URLs for linking (adjust base path as needed)
  rowData.forEach((r) => (r.url = `/insurance/${slug(r.company)}`));

  // ---------------- column defs ----------------
  const columnDefs = [
    {
      field: "company",
      minWidth: 220,
      autoHeight: true,
      wrapText: true,
      cellRenderer: (params) => {
        const { imageUrl, companyDesc, url, company } = params.data;

        const wrapper = document.createElement("div");
        wrapper.classList.add("ag-grid-main-cell");

        const img = document.createElement("img");
        img.classList.add("w-15");
        img.src = imageUrl;
        img.alt = "";
        wrapper.appendChild(img);

        const textBlock = document.createElement("div");
        const name = document.createElement("span");
        name.textContent = params.value;
        textBlock.appendChild(name);

        if (companyDesc) {
          const companyDescBlock = document.createElement("span");
          companyDescBlock.textContent = companyDesc;
          companyDescBlock.classList.add("ag-grid-sub-text");
          textBlock.appendChild(companyDescBlock);
        }

        wrapper.appendChild(textBlock);
        return makeLink(url, wrapper, `Open ${company}`);
      },
    },
    {
      field: "amountMonthly",
      headerName: "Amount",
      minWidth: 160,
      cellRenderer: (params) => {
        const { amountYearly, url, company } = params.data;

        const wrapper = document.createElement("div");

        const m = document.createElement("span");
        m.textContent = `${fmtMoney(params.value)}/m`;

        const y = document.createElement("span");
        y.classList.add("ag-grid-sub-text");
        y.textContent = `${fmtMoney(amountYearly)}/y`;

        wrapper.appendChild(m);
        wrapper.appendChild(y);

        return makeLink(url, wrapper, `Open ${company} quote`);
      },
    },
    {
      field: "coverage",
      headerName: "Coverage",
      minWidth: 280,
      autoHeight: true,
      wrapText: true,
      cellRenderer: (params) => {
        const { url, company } = params.data;

        const wrapper = document.createElement("div");
        wrapper.classList.add("insurance-comparison-grid-coverage-wrapper");

        const tagsBlock = document.createElement("div");
        tagsBlock.classList.add("insurance-comparison-grid-coverage-tags");

        (params.value || []).filter(Boolean).forEach((tag) => {
          const tagBlock = document.createElement("span");
          tagBlock.classList.add("insurance-comparison-grid-coverage-tag");
          tagBlock.textContent = tag;
          tagsBlock.appendChild(tagBlock);
        });

        const icon = document.createElement("img");
        icon.src = "images/i-icon-gray.png";
        icon.classList.add("w-5");
        icon.alt = "";

        wrapper.appendChild(tagsBlock);
        wrapper.appendChild(icon);

        return makeLink(url, wrapper, `Open ${company} coverage details`);
      },
    },
    {
      field: "inquire",
      headerName: "Inquire",
      minWidth: 170,
      cellRenderer: (params) => {
        const { interactive, date, url, company } = params.data;

        if (interactive) {
          // Use an anchor styled like your button so it naturally navigates
          const a = document.createElement("a");
          a.href = url + "?deal=1";
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.className = "insurance-comparison-grid-get-deal-btn ag-link-cell";
          a.textContent = "Get this Deal";
          return a;
        } else {
          const el = document.createElement("div");
          el.classList.add("insurance-comparison-date");
          el.textContent = date;
          return makeLink(url, el, `Open ${company} details`);
        }
      },
    },
  ];

  // ---------------- grid ----------------
  const gridOptions = {
    columnDefs,
    rowData,
    domLayout: "autoHeight",
    defaultColDef: {
      headerClass: "header-cell-text",
      suppressMovable: true,
      resizable: false,
      sortable: true,
      filter: true,
      minWidth: 130,
      flex: 1,
    },
    getRowClass: (p) => (p.data.active === true ? "grid-active-row" : ""),
  };

  agGrid.createGrid(eGridDiv, gridOptions);
}

function topHomeExpertCardClicks() {
  let topHomeExpertCards = document.querySelectorAll(".top-home-expert");

  topHomeExpertCards.forEach((card) => {
    card.addEventListener("click", () => {
      let content = card.querySelector(".top-home-expert__content");
      let modal = card.querySelector(".top-home-expert__modal");
      let closeModalBtn = modal.querySelector(
        ".home-expert-modal__modal-close"
      );

      card.classList.add("hidden");
      modal.classList.remove("hidden");
      content.classList.add("hidden");
      closeModalBtn.addEventListener("click", () => {
        setTimeout(() => {
          card.classList.add("hidden");
          modal.classList.add("hidden");
          content.classList.remove("hidden");
        }, 100);
      });
    });
  });
}

function recentTransactionsGrid() {
  if (typeof agGrid === "undefined") {
    return;
  }
  const eGridDiv = document.querySelector("#recentTransactionsGrid");
  if (!eGridDiv) {
    return;
  }

  var columnDefs = [
    {
      field: "invoice",
      headerName: "Invoice #",
      flex: 1,
      cellRenderer: (params) => {
        return `#${params.value}`;
      },
      minWidth: 80,
    },
    {
      field: "service",
      minWidth: 170,
      headerName: "Service",
      flex: 2,
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 1,
      minWidth: 90,
      cellRenderer: (params) => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("flex", "items-center", "gap-2");

        const icon = document.createElement("img");
        icon.src = "images/amount-icon-account.svg";
        icon.classList.add("w-4.5", "h-4.5");

        const text = document.createElement("span");
        text.textContent = `$${params.value}`;

        wrapper.appendChild(icon);
        wrapper.appendChild(text);
        return wrapper;
      },
    },
    {
      field: "date",
      headerName: "Date",
      flex: 2,
      colId: "date",
      cellRenderer: (params) => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("flex", "items-center", "gap-2");

        const icon = document.createElement("img");
        icon.src = "images/date-icon-account.svg";
        icon.classList.add("w-6", "h-6");

        const text = document.createElement("span");
        text.textContent = params.value;

        wrapper.appendChild(icon);
        wrapper.appendChild(text);
        return wrapper;
      },
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      colId: "status",
      cellRenderer: (params) => {
        const badge = document.createElement("span");
        badge.textContent = params.value;
        badge.classList.add(
          "w-16",
          "text-xs",
          "heading",
          "text-center",
          "py-0.75",
          "rounded"
        );

        switch (params.value) {
          case "Overdue":
            badge.classList.add("bg-third", "text-white");
            break;
          case "Due":
            badge.classList.add("bg-fourth", "text-third");
            break;
          case "Paid":
            badge.classList.add("bg-tenth", "text-eighth");
            break;
          default:
            badge.classList.add("bg-muted-1");
        }
        return badge;
      },
    },
  ];

  var rowData = [
    {
      invoice: "1139",
      service: "Annual Lawn Service",
      amount: "1,200",
      date: "Jan 15, 2023",
      status: "Overdue",
    },
    {
      invoice: "1139",
      service: "Bedroom Painting",
      amount: "300",
      date: "Feb 20, 2023",
      status: "Paid",
    },
    {
      invoice: "1139",
      service: "Kitchen Plumbing Issue",
      amount: "800",
      date: "Mar 10, 2023",
      status: "Due",
    },
    {
      invoice: "1139",
      service: "Request for product sample",
      amount: "150",
      date: "Mar 05, 2023",
      status: "Paid",
    },
    {
      invoice: "1139",
      service: "Annual Lawn Service",
      amount: "400",
      date: "Mar 28, 2023",
      status: "Due",
    },
    {
      invoice: "1139",
      service: "Twin Bed",
      amount: "2,350",
      date: "Apr 02, 2023",
      status: "Overdue",
    },
    {
      invoice: "1139",
      service: "Tree Removal Service",
      amount: "250",
      date: "Apr 17, 2023",
      status: "Paid",
    },
    {
      invoice: "1139",
      service: "UI/UX Design",
      amount: "950",
      date: "Apr 30, 2023",
      status: "Due",
    },
  ];

  var gridOptions = {
    columnDefs: columnDefs,
    rowData: rowData,
    domLayout: "autoHeight",
    defaultColDef: {
      headerClass: "header-cell-text",
      suppressMovable: true,
      sortable: true,
      resizable: false,
      filter: false,
    },
    onGridReady: (params) => {
      // 2) Responsive column visibility at 640px
      const hideCols = ["date", "status"];
      const mql = window.matchMedia("(min-width: 640px)");

      function updateCols(e) {
        const showExtras = e.matches; // true if ≥ 640px
        params.api.setColumnsVisible(hideCols, showExtras);
      }

      // initial and on-change
      updateCols(mql);
      mql.addEventListener("change", updateCols);
    },
  };

  agGrid.createGrid(eGridDiv, gridOptions);
}

/* ------------ Shared store & helpers ------------ */
const UtilityCosts = (() => {
  const months = [
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
  ];
  const dataByType = {
    Electricity: [12, 18, 22, 24, 26, 27, 25, 30, 32, 34, 36, 40],
    "Internet & Cable": [30, 30, 31, 31, 32, 32, 32, 33, 33, 34, 35, 36],
    Water: [18, 20, 21, 21, 22, 22, 21, 22, 23, 24, 25, 26],
    Parking: [40, 45, 48, 50, 50, 50, 45, 48, 50, 54, 58, 62],
    "Total Selected": [20, 40, 55, 60, 60, 60, 51, 70, 77, 88, 99, 121],
  };

  const makeSeries = (vals) =>
    months.map((m, i) => ({ month: m, value: vals[i], date: `${m} 01` }));

  const getSeriesFor = (type) =>
    makeSeries(dataByType[type] ?? dataByType["Electricity"]);

  let chart = null;

  function createChart(initialType = "Electricity") {
    if (typeof agCharts === "undefined" || !agCharts.AgCharts) return;
    const { AgCharts } = agCharts;
    const container = document.getElementById("utilityCostsLineChart");
    if (!container) return;

    const data = getSeriesFor(initialType);

    chart = AgCharts.create({
      container,
      data,
      padding: { top: 30, bottom: 0 },
      series: [
        {
          type: "line",
          xKey: "month",
          yKey: "value",
          stroke: "#FF603F",
          strokeWidth: 2,
          marker: {
            enabled: true,
            size: 8,
            fill: "#FF603F",
            stroke: "white",
            strokeWidth: 1,
          },
          label: {
            enabled: true,
            color: "#9E9E9E",
            fontSize: 12,
            fontWeight: 500,
            fontFamily: "Alber Sans",

            formatter: ({ datum }) => `$${datum.value}`,
          },
          showInLegend: false,
          nodeClickRange: "nearest",
          tooltip: { enabled: false },
        },
      ],
      axes: [
        {
          type: "category",
          position: "bottom",
          gridLine: { enabled: false },
          label: {
            fontWeight: 500,
            fontSize: 12,
            fontFamily: "Alber Sans",
            color: "#B6B6B6",
          },
        },
        {
          type: "number",
          position: "left",
          label: { enabled: false },
          gridLine: { enabled: false },
        },
      ],
    });
  }

  function setType(type) {
    if (!chart || !agCharts?.AgCharts) return; // if chart isn't ready, do nothing

    const data = getSeriesFor(type).map((d) => ({ ...d })); // fresh objects

    // Update the series' own data so labels refresh
    const s = chart.series?.[0];
    if (s) s.data = data;

    // Keep chart.data in sync and force a redraw
    chart.data = data;
    chart.update();
  }
  function setType(type) {
    const lib = agCharts?.AgCharts;
    if (!chart || !lib) return;

    const data = getSeriesFor(type).map((d) => ({ ...d })); // fresh objects

    // 1) Try a deep update so labels + data refresh reliably
    try {
      lib.update(chart, {
        data,
        series: [
          {
            type: "line",
            xKey: "month",
            yKey: "value",
            stroke: "#FF603F",
            strokeWidth: 2,
            marker: {
              enabled: true,
              size: 8,
              fill: "#FF603F",
              stroke: "white",
              strokeWidth: 1,
            },
            label: {
              enabled: true,
              color: "#9E9E9E",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "Alber Sans",
              padding: 4,
              formatter: ({ datum }) => `$${datum.value}`,
            },
            showInLegend: false,
            nodeClickRange: "nearest",
            tooltip: {
              range: Infinity,
              delay: 0,
              renderer: ({ datum }) => (
                (lastHovered = datum), setBanner(datum), ""
              ),
            },
          },
        ],
      });
      return;
    } catch (e) {
      // fall through to recreate
    }

    // 2) Fallback: destroy & recreate with the new dataset
    try {
      chart.destroy?.();
    } catch {}
    UtilityCosts.createChart(type);
  }

  return { createChart, setType };
})();

/* ------------ GRID + CHART INIT in correct order ------------ */
function initUtilityCosts() {
  // 1) create the chart first (with default dataset)
  UtilityCosts.createChart("Electricity");

  // 2) then create the grid and wire clicks
  if (typeof agGrid === "undefined" || !agGrid.createGrid) return;
  const container = document.getElementById("utilityCostsGrid");
  if (!container) return;

  const rowData = [
    { type: "Electricity", cost: 168 },
    { type: "Internet & Cable", cost: 158 },
    { type: "Water", cost: 130 },
    { type: "Parking", cost: 218 },
    { type: "Total Selected", cost: 674, active: true },
  ];

  const gridOptions = {
    columnDefs: [
      { headerName: "Type", field: "type", flex: 1 },
      {
        headerName: "Avg. Costs",
        field: "cost",
        width: 120,
        valueFormatter: (p) => `$${p.value}`,
        cellClass: "main-ag-cell",
      },
    ],
     defaultColDef: {
      headerClass: "header-cell-text",
        autoHeight: true,

     },
    rowData,
    rowSelection: "single",
    suppressRowClickSelection: false,
    domLayout: "autoHeight",


    // select initially active row
    onGridReady: (params) => {
      params.api.forEachNode((n) => {
        if (n.data?.active) n.setSelected(true);
      });
    },

    // clicking a row selects it (gives us the orange bg) and updates the chart
    onRowClicked: (e) => {
      e.node.setSelected(true);
      UtilityCosts.setType(e.data.type);
    },
  };

  agGrid.createGrid(container, gridOptions);
}

function flipCards() {
  // Detect if device is touch-enabled
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const flipCards = document.querySelectorAll(".flip-card");

  flipCards.forEach((flipCard) => {
    const cardInner = flipCard.querySelector(".card");
    let isFlipped = false;

    if (isTouchDevice) {
      // Mobile: Click to flip
      flipCard.addEventListener("click", (e) => {
        e.preventDefault();

        // If clicking on "Learn More" link, don't flip - let it navigate
        if (e.target.closest(".more")) {
          return;
        }

        // Close all other flipped cards first
        flipCards.forEach((otherCard) => {
          if (otherCard !== flipCard) {
            const otherCardInner = otherCard.querySelector(".card");
            otherCardInner.style.transform = "rotateY(0deg)";
            otherCard.dataset.flipped = "false";
          }
        });

        // Toggle current card
        isFlipped = flipCard.dataset.flipped === "true";

        if (isFlipped) {
          cardInner.style.transform = "rotateY(0deg)";
          flipCard.dataset.flipped = "false";
        } else {
          cardInner.style.transform = "rotateY(180deg)";
          flipCard.dataset.flipped = "true";
        }
      });

      // Optional: Close card when clicking outside
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".flip-card")) {
          flipCards.forEach((card) => {
            const cardInner = card.querySelector(".card");
            cardInner.style.transform = "rotateY(0deg)";
            card.dataset.flipped = "false";
          });
        }
      });
    } else {
      // Desktop: Keep hover behavior (CSS handles this)
      // No JavaScript needed for desktop
    }
  });
}

function initTriggerZoningUsage() {
  const modal = document.getElementById("itemModal");
  if (!modal) return;
  const closeBtn = document.getElementById("modalClose");
  const modalBody = document.getElementById("modalContent");

  function openModal(html) {
    modalBody.innerHTML = html;
    modal.classList.remove("hidden");
  }
  function closeModal() {
    modal.classList.add("hidden");
  }

  // Close handlers
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Attach click on each LI
  document.querySelectorAll("li .modal-content").forEach((detailDiv) => {
    const li = detailDiv.closest("li");
    li.addEventListener("click", () => {
      // Grab the innerHTML of the hidden .modal-content div
      openModal(detailDiv.innerHTML);
    });
  });
}

function initSeeMoreTables() {
  const btn = document.getElementById("see-more-monthly-costs-btn");
  const table = document.querySelector(".manage-finance-table");
  if (!btn || !table) return;
  btn.addEventListener("click", () => {
    btn.classList.add("hidden");
    table.classList.add("show-more");
  });
}

function initReadMoreToggles() {
  document.querySelectorAll("[data-readmore]").forEach((container) => {
    const moreText = container.querySelector("[data-readmore-text]");
    const btn = container.querySelector("[data-readmore-btn]");
    if (!moreText || !btn) return;
    btn.addEventListener("click", () => {
      const hidden = moreText.classList.toggle("hidden");
      btn.textContent = hidden ? "Read more" : "Read less";
    });
  });
}

// function initScrollSpy() {
//   const tabs = document.querySelectorAll(".nav-item");
//   if (tabs.length === 0 || !("IntersectionObserver" in window)) return;

//   // grab the nav swiper instance from its container
//   const navEl = document.querySelector(".swiper-nav");
//   const navSwiper = navEl?.swiper; // Swiper.js attaches `.swiper` to the container
//   if (!navSwiper) return;

//   const sections = Array.from(tabs).map((t) =>
//     document.querySelector(t.getAttribute("href"))
//   );

//   const observer = new IntersectionObserver(
//     (entries) => {
//       entries.forEach((entry) => {
//         if (!entry.isIntersecting) return;
//         const id = entry.target.id;

//         // 1) Highlight the matching tab
//         tabs.forEach((t) =>
//           t.classList.toggle("active", t.getAttribute("href") === `#${id}`)
//         );

//         // 2) Find its index
//         const activeIndex = Array.from(tabs).findIndex(
//           (t) => t.getAttribute("href") === `#${id}`
//         );

//         // 3) Slide the nav swiper
//         if (activeIndex >= 0) {
//           navSwiper.slideTo(activeIndex);
//         }
//       });
//     },
//     {
//       rootMargin: "-50% 0px -50% 0px",
//       threshold: 0,
//     }
//   );

//   sections.forEach((sec) => sec && observer.observe(sec));
// }

function generateGalleryImagesFromImg(index) {
  let clickecImageIndex = parseInt(index, 10);
  const galleryContainer = document.getElementById("gallery-container");
  const thumbs = Array.from(document.querySelectorAll(".gallery-img"));
  const more35Images = document.getElementById("more-35-images");
  const modalGrid = document.getElementById("gallery-modal-grid");

  const ordered = thumbs
    .slice(clickecImageIndex)
    .concat(thumbs.slice(0, clickecImageIndex));
  modalGrid.innerHTML = ""; // clear
  more35Images?.classList.add("hidden");
  ordered.forEach((img) => {
    const clone = document.createElement("img");
    clone.src = img.src;
    clone.alt = img.alt;
    modalGrid.appendChild(clone);
  });

  galleryContainer.scrollTo(0, 0);
}
function show35MoreImages() {
  const more35Images = document.getElementById("more-35-images");
  const galleryContainer = document.getElementById("gallery-container");
  const modalGrid = document.getElementById("gallery-modal-grid");
  modalGrid.innerHTML = ""; // clear
  more35Images.classList.remove("hidden");
  galleryContainer.scrollTo(0, 0);
}

function aiChatCodeCopy() {
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const btnText = btn.querySelector(".txt");

    const target = document.querySelector(btn.dataset.copy);
    if (!target) return;

    try {
      await navigator.clipboard.writeText(target.textContent);
      const old = btnText.textContent;
      btnText.textContent = "Copied!";
      setTimeout(() => (btnText.textContent = old), 1200);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  });
}

function generateComponentAnimation() {
  let nextStepsElements = document.querySelectorAll("#next-steps [data-query]");

  if (!nextStepsElements) return;

  nextStepsElements.forEach((btn) => {
    btn.addEventListener("click", () => {
      let chatBlock = document.querySelector("#chat-block");
      chatBlock.classList.remove("hidden");
      let chatBlockTxt = document.querySelector("#chat-block #chat-block-txt");
      chatBlockTxt.textContent = btn.dataset.query;
      reveal(btn.dataset.target);
    });
  });

  function typeWriter(el, speed = 5) {
    const txt = el.dataset.text || "";
    el.textContent = "";
    el.classList.add("typing-caret");

    let i = 0;
    const timer = setInterval(() => {
      el.textContent += txt.charAt(i);
      i++;
      if (i >= txt.length) {
        clearInterval(timer);
        el.classList.remove("typing-caret");
      }
    }, speed);
  }

  function animateTypewriters(sec) {
    sec.querySelectorAll(".typewriter").forEach((el) => typeWriter(el));
  }

  function reveal(selector) {
    let fold = document.querySelector(".animation-fold");
    let dynamiSections = document.querySelectorAll(".dynamic-section");
    dynamiSections.forEach((sec) => sec.classList.add("hidden"));

    const sec = document.querySelector(selector);
    if (!sec) return;

    fold.classList.add("min-h-screen");
    sec.classList.remove("hidden");
    sec.classList.add("animate-section");

    setTimeout(() => {
      animateTypewriters(sec);
    }, 500);
  }
}

function initAiChatSliderInput() {}
