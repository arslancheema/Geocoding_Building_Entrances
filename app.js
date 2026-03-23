const TOKYO_CENTER = { lat: 35.6762, lng: 139.6503 };
const TOKYO_BOUNDS = {
  north: 35.817,
  south: 35.55,
  east: 139.93,
  west: 139.55,
};

const els = {
  queryInput: document.querySelector("#queryInput"),
  runButton: document.querySelector("#runButton"),
  resetButton: document.querySelector("#resetButton"),
  languageSelect: document.querySelector("#languageSelect"),
  basicSummary: document.querySelector("#basicSummary"),
  enhancedSummary: document.querySelector("#enhancedSummary"),
  statusMessage: document.querySelector("#statusMessage"),
  presetButtons: [...document.querySelectorAll(".preset-button")],
  basicMap: document.querySelector("#basicMap"),
  enhancedMap: document.querySelector("#enhancedMap"),
  i18nNodes: [...document.querySelectorAll("[data-i18n]")],
  i18nPlaceholders: [...document.querySelectorAll("[data-i18n-placeholder]")],
};

const state = {
  maps: null,
  basicMap: null,
  enhancedMap: null,
  basicMarker: null,
  enhancedMarker: null,
  enhancedOutlineLayer: null,
  enhancedEntranceMarkers: [],
  sharedInfoWindow: null,
  locale: window.localStorage.getItem("gmp-demo-locale") || "en",
  lastBasicData: null,
  lastEnhancedData: null,
};

const translations = {
  en: {
    heroEyebrow: "Tokyo Comparison Demo",
    languageLabel: "Language",
    heroTitle: "Geocoding API: Building outlines and entrances",
    heroText:
      "Side-by-side view of standard geocoding versus the enhanced destination result for Tokyo places.",
    queryLabel: "Tokyo place or address",
    queryPlaceholder: "Example: Tokyo Skytree, Tokyo, Japan",
    runButton: "Run comparison",
    resetButton: "Reset map",
    presetLabel: "Tokyo presets",
    basicPanelKicker: "Without building outlines",
    basicPanelTitle: "Standard geocode result",
    basicBadge: "Marker + viewport",
    enhancedPanelKicker: "With building outlines and entrances",
    enhancedPanelTitle: "Enhanced geocode result",
    enhancedBadge: "Polygon + entrances",
    howToReadTitle: "How to read the comparison",
    howToReadText:
      "The left side only shows the normal result location. The right side adds the building footprint and entrance points so you can see where a place sits within the structure and which entrances may be best.",
    legendTitle: "Legend",
    legendMarker: "Standard geocode marker",
    legendPreferred: "Preferred entrance",
    legendOther: "Other entrance",
    legendPolygon: "Building outline polygon",
    coverageTitle: "Coverage note",
    coverageText:
      "Google notes that coverage varies by region and place type. If one Tokyo preset returns no entrances, try another preset or a street-level address.",
    statusReady: "Local server ready. Run a Tokyo place search.",
    statusReset: "Ready for another Tokyo comparison.",
    statusSearching: 'Looking up "{query}" in Tokyo and drawing both versions...',
    statusEmptyQuery: "Enter a Tokyo place or address to compare.",
    statusNoEnhanced:
      "The enhanced request completed, but this place returned no building outlines or entrances. Try another Tokyo preset or a street-level address.",
    statusEnhanced:
      "Enhanced request returned {buildings} building outline set(s), {entrances} entrance(s), and {preferred} preferred entrance(s).",
    overlayBasicTitle: "Map loads after you run a query",
    overlayBasicText:
      "This pane will show the standard geocode marker and viewport for the Tokyo search.",
    overlayEnhancedTitle: "Enhanced map loads after you run a query",
    overlayEnhancedText:
      "This pane will show the building footprint and entrance points returned by the server-side Google API call.",
    overlayErrorTitle: "Request error",
    summaryBaselineTitle: "Baseline view",
    summaryBaselineText:
      "Run a Tokyo query to show the standard geocoding result here.",
    summaryEnhancedTitle: "Enhanced view",
    summaryEnhancedText:
      "Run the same query with building attributes enabled to draw outlines and entrances here.",
    summaryAddress: "Formatted address",
    summaryStandardTitle: "What standard geocoding gives you",
    summaryStandardText:
      "One result point and a viewport. Good for locating the place, but not for understanding the footprint or entrance choices.",
    summaryGeometry: "Geometry",
    summaryEnhancedResponse: "Enhanced response",
    summaryEnhancedWhy: "Why it matters",
    summaryEnhancedWhyText:
      "You can see the actual building footprint and likely access points instead of guessing from one map pin.",
    summaryRequestIssue: "Request issue",
    summaryEnhancedCounts:
      "{buildings} building outline set(s), {entrances} entrance marker(s), {preferred} preferred entrance(s).",
    infoPreferred: "Preferred entrance",
    infoEntrance: "Building entrance",
    infoBuildingId: "Building ID",
    unavailable: "Unavailable",
  },
  ja: {
    heroEyebrow: "東京比較デモ",
    languageLabel: "言語",
    heroTitle: "Geocoding API: 建物外形と入口",
    heroText:
      "東京の場所について、標準ジオコーディングと拡張された目的地結果を左右で比較できます。",
    queryLabel: "東京の場所または住所",
    queryPlaceholder: "例: Tokyo Skytree, Tokyo, Japan",
    runButton: "比較を実行",
    resetButton: "地図をリセット",
    presetLabel: "東京プリセット",
    basicPanelKicker: "建物外形なし",
    basicPanelTitle: "標準ジオコード結果",
    basicBadge: "マーカー + ビューポート",
    enhancedPanelKicker: "建物外形と入口あり",
    enhancedPanelTitle: "拡張ジオコード結果",
    enhancedBadge: "ポリゴン + 入口",
    howToReadTitle: "見方",
    howToReadText:
      "左側は通常の結果位置だけを表示します。右側は建物外形と入口ポイントを追加し、建物内の位置関係や入りやすい入口を把握できます。",
    legendTitle: "凡例",
    legendMarker: "標準ジオコードのマーカー",
    legendPreferred: "推奨入口",
    legendOther: "その他の入口",
    legendPolygon: "建物外形ポリゴン",
    coverageTitle: "カバレッジ",
    coverageText:
      "Google によると、建物外形と入口の対応状況は地域や場所タイプによって異なります。入口が出ない場合は別の東京プリセットや詳細な住所を試してください。",
    statusReady: "ローカルサーバーの準備ができました。東京の場所を検索してください。",
    statusReset: "次の東京比較の準備ができました。",
    statusSearching: "東京で「{query}」を検索し、両方の結果を描画しています...",
    statusEmptyQuery: "比較する東京の場所または住所を入力してください。",
    statusNoEnhanced:
      "拡張リクエストは完了しましたが、この場所では建物外形または入口が返されませんでした。別の東京プリセットや詳細な住所を試してください。",
    statusEnhanced:
      "拡張リクエストの結果: 建物外形 {buildings} 件、入口 {entrances} 件、推奨入口 {preferred} 件。",
    overlayBasicTitle: "検索後に地図を表示します",
    overlayBasicText:
      "このペインには、東京検索の標準ジオコードのマーカーとビューポートが表示されます。",
    overlayEnhancedTitle: "検索後に拡張地図を表示します",
    overlayEnhancedText:
      "このペインには、サーバー経由の Google API が返した建物外形と入口ポイントが表示されます。",
    overlayErrorTitle: "リクエストエラー",
    summaryBaselineTitle: "ベースライン表示",
    summaryBaselineText:
      "東京の検索を実行すると、ここに標準ジオコーディング結果が表示されます。",
    summaryEnhancedTitle: "拡張表示",
    summaryEnhancedText:
      "同じ検索を拡張属性付きで実行し、建物外形と入口をここに表示します。",
    summaryAddress: "整形済み住所",
    summaryStandardTitle: "標準ジオコーディングで分かること",
    summaryStandardText:
      "結果ポイントとビューポートのみです。場所の特定には便利ですが、建物外形や入口の把握には向きません。",
    summaryGeometry: "座標",
    summaryEnhancedResponse: "拡張レスポンス",
    summaryEnhancedWhy: "価値",
    summaryEnhancedWhyText:
      "1つのピンだけで推測するのではなく、実際の建物外形とアクセスしやすい入口候補を確認できます。",
    summaryRequestIssue: "リクエストの問題",
    summaryEnhancedCounts:
      "建物外形 {buildings} 件、入口マーカー {entrances} 件、推奨入口 {preferred} 件。",
    infoPreferred: "推奨入口",
    infoEntrance: "建物入口",
    infoBuildingId: "建物 ID",
    unavailable: "未取得",
  },
};

els.presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    els.queryInput.value = button.dataset.query || "";
  });
});

els.runButton.addEventListener("click", () => {
  void runComparison();
});

els.resetButton.addEventListener("click", () => {
  resetMaps();
  renderIdleState();
  setStatus(t("statusReset"));
});

els.languageSelect.addEventListener("change", () => {
  state.locale = els.languageSelect.value;
  window.localStorage.setItem("gmp-demo-locale", state.locale);
  applyTranslations();
  renderIdleState();
  if (state.lastBasicData) {
    renderBasicResult(state.lastBasicData);
  }
  if (state.lastEnhancedData) {
    renderEnhancedResult(state.lastEnhancedData);
    setStatus(buildStatusMessage(state.lastEnhancedData));
  } else {
    setStatus(t("statusReady"));
  }
});

els.languageSelect.value = state.locale;
applyTranslations();
renderIdleState();

async function runComparison() {
  const query = els.queryInput.value.trim();

  if (!query) {
    setStatus(t("statusEmptyQuery"));
    els.queryInput.focus();
    return;
  }

  lockUi(true);
  setStatus(formatMessage(t("statusSearching"), { query }));

  try {
    await ensureMapsLoaded();
    initializeMapsIfNeeded();
    clearRenderedData();

    const [basicResult, enhancedResult] = await Promise.all([
      fetchJson("/api/geocode/basic", { query }),
      fetchJson("/api/geocode/enhanced", { query }),
    ]);

    state.lastBasicData = basicResult;
    state.lastEnhancedData = enhancedResult;
    renderBasicResult(basicResult);
    renderEnhancedResult(enhancedResult);
    setStatus(buildStatusMessage(enhancedResult));
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Something went wrong while loading the comparison.");
    renderErrorState(error.message || "Request failed");
  } finally {
    lockUi(false);
  }
}

async function ensureMapsLoaded() {
  if (state.maps) {
    return;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const callbackName = `initGmpDemo_${Date.now()}`;

    window[callbackName] = () => {
      delete window[callbackName];
      state.maps = window.google.maps;
      resolve();
    };

    script.src = `/api/maps-js?callback=${encodeURIComponent(callbackName)}`;
    script.async = true;
    script.onerror = () => reject(new Error("Maps JavaScript API failed to load."));
    document.head.append(script);
  });
}

function initializeMapsIfNeeded() {
  if (state.basicMap && state.enhancedMap) {
    return;
  }

  state.basicMap = new state.maps.Map(els.basicMap, {
    center: TOKYO_CENTER,
    zoom: 15,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    restriction: {
      latLngBounds: TOKYO_BOUNDS,
      strictBounds: false,
    },
  });

  state.enhancedMap = new state.maps.Map(els.enhancedMap, {
    center: TOKYO_CENTER,
    zoom: 18,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    restriction: {
      latLngBounds: TOKYO_BOUNDS,
      strictBounds: false,
    },
  });

  state.sharedInfoWindow = new state.maps.InfoWindow();
}

async function fetchJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with HTTP ${response.status}.`);
  }

  return data;
}

function renderBasicResult(data) {
  const location = data.location;

  state.basicMarker = new state.maps.Marker({
    map: state.basicMap,
    position: location,
    title: data.formattedAddress,
    animation: state.maps.Animation.DROP,
  });

  fitMapToResult(state.basicMap, data);
  clearMapOverlay(els.basicMap);

  els.basicSummary.innerHTML = `
    <div class="summary-card">
      <strong>${t("summaryAddress")}</strong>
      <p>${escapeHtml(data.formattedAddress)}</p>
    </div>
    <div class="summary-card">
      <strong>${t("summaryStandardTitle")}</strong>
      <p>${t("summaryStandardText")}</p>
    </div>
    <div class="summary-card">
      <strong>${t("summaryGeometry")}</strong>
      <p>Lat ${formatCoordinate(location.lat)}, Lng ${formatCoordinate(location.lng)}</p>
    </div>
  `;
}

function renderEnhancedResult(data) {
  const location = data.location;
  const buildings = data.buildings || [];
  const entrances = data.entrances || [];

  state.enhancedMarker = new state.maps.Marker({
    map: state.enhancedMap,
    position: location,
    title: data.formattedAddress,
    animation: state.maps.Animation.DROP,
    icon: {
      path: state.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: "#e4602f",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
    },
  });

  if (buildings.length > 0) {
    const features = buildings.flatMap((building) =>
      (building.building_outlines || []).map((outline) => ({
        type: "Feature",
        properties: {
          buildingPlaceId: building.place_id || "unknown",
        },
        geometry: outline.display_polygon || outline.displayPolygon,
      })),
    );

    state.enhancedOutlineLayer = new state.maps.Data({
      map: state.enhancedMap,
      style: {
        fillColor: "#e4602f",
        fillOpacity: 0.18,
        strokeColor: "#d14a1d",
        strokeOpacity: 0.9,
        strokeWeight: 2,
      },
    });

    state.enhancedOutlineLayer.addGeoJson({
      type: "FeatureCollection",
      features,
    });
  }

  state.enhancedEntranceMarkers = entrances.map((entrance) => {
    const isPreferred = (entrance.entrance_tags || []).includes("PREFERRED");
    const marker = new state.maps.Marker({
      map: state.enhancedMap,
      position: entrance.location,
      title: isPreferred ? "Preferred entrance" : "Entrance",
      icon: {
        path: state.maps.SymbolPath.CIRCLE,
        scale: isPreferred ? 9 : 6,
        fillColor: isPreferred ? "#0f8c83" : "#3651d6",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      zIndex: isPreferred ? 3 : 2,
    });

    marker.addListener("click", () => {
      state.sharedInfoWindow.setContent(`
        <div style="padding: 6px 8px; max-width: 220px;">
          <strong>${isPreferred ? t("infoPreferred") : t("infoEntrance")}</strong>
          <div style="margin-top: 6px;">${t("infoBuildingId")}: ${escapeHtml(
            entrance.building_place_id || t("unavailable"),
          )}</div>
        </div>
      `);
      state.sharedInfoWindow.open({
        anchor: marker,
        map: state.enhancedMap,
      });
    });

    return marker;
  });

  fitMapToEnhancedResult(data, buildings, entrances);

  const preferredCount = entrances.filter((entrance) =>
    (entrance.entrance_tags || []).includes("PREFERRED"),
  ).length;

  els.enhancedSummary.innerHTML = `
    <div class="summary-card">
      <strong>${t("summaryAddress")}</strong>
      <p>${escapeHtml(data.formattedAddress)}</p>
    </div>
    <div class="summary-card">
      <strong>${t("summaryEnhancedResponse")}</strong>
      <p>${formatMessage(t("summaryEnhancedCounts"), {
        buildings: buildings.length,
        entrances: entrances.length,
        preferred: preferredCount,
      })}</p>
    </div>
    <div class="summary-card">
      <strong>${t("summaryEnhancedWhy")}</strong>
      <p>${t("summaryEnhancedWhyText")}</p>
    </div>
  `;
  clearMapOverlay(els.enhancedMap);
}

function fitMapToResult(map, result) {
  const viewport = result.viewport;
  if (viewport) {
    const bounds = new state.maps.LatLngBounds(
      { lat: viewport.southwest.lat, lng: viewport.southwest.lng },
      { lat: viewport.northeast.lat, lng: viewport.northeast.lng },
    );
    map.fitBounds(bounds, 50);
    return;
  }

  map.setCenter(result.location);
  map.setZoom(18);
}

function fitMapToEnhancedResult(result, buildings, entrances) {
  const bounds = new state.maps.LatLngBounds();
  let hasPoints = false;

  const addPoint = (point) => {
    if (!point) {
      return;
    }
    bounds.extend(point);
    hasPoints = true;
  };

  addPoint(result.location);

  entrances.forEach((entrance) => addPoint(entrance.location));

  buildings.forEach((building) => {
    (building.building_outlines || []).forEach((outline) => {
      collectCoordinates(outline.display_polygon || outline.displayPolygon).forEach(([lng, lat]) =>
        addPoint({ lat, lng }),
      );
    });
  });

  if (hasPoints) {
    state.enhancedMap.fitBounds(bounds, 70);
  } else {
    fitMapToResult(state.enhancedMap, result);
  }
}

function collectCoordinates(geometry) {
  if (!geometry) {
    return [];
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat();
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(2);
  }

  return [];
}

function clearRenderedData() {
  if (state.basicMarker) {
    state.basicMarker.setMap(null);
    state.basicMarker = null;
  }

  if (state.enhancedMarker) {
    state.enhancedMarker.setMap(null);
    state.enhancedMarker = null;
  }

  if (state.enhancedOutlineLayer) {
    state.enhancedOutlineLayer.setMap(null);
    state.enhancedOutlineLayer = null;
  }

  state.enhancedEntranceMarkers.forEach((marker) => marker.setMap(null));
  state.enhancedEntranceMarkers = [];
}

function resetMaps() {
  clearRenderedData();
  if (state.basicMap) {
    state.basicMap.setCenter(TOKYO_CENTER);
    state.basicMap.setZoom(15);
  }
  if (state.enhancedMap) {
    state.enhancedMap.setCenter(TOKYO_CENTER);
    state.enhancedMap.setZoom(15);
  }
}

function renderIdleState() {
  setMapOverlay(
    els.basicMap,
    t("overlayBasicTitle"),
    t("overlayBasicText"),
  );
  setMapOverlay(
    els.enhancedMap,
    t("overlayEnhancedTitle"),
    t("overlayEnhancedText"),
  );
  els.basicSummary.innerHTML = `
    <div class="summary-card">
      <strong>${t("summaryBaselineTitle")}</strong>
      <p>${t("summaryBaselineText")}</p>
    </div>
  `;

  els.enhancedSummary.innerHTML = `
    <div class="summary-card">
      <strong>${t("summaryEnhancedTitle")}</strong>
      <p>${t("summaryEnhancedText")}</p>
    </div>
  `;
}

function renderErrorState(message) {
  setMapOverlay(els.basicMap, t("overlayErrorTitle"), message);
  setMapOverlay(els.enhancedMap, t("overlayErrorTitle"), message);
  els.enhancedSummary.innerHTML = `
    <div class="summary-card">
      <strong>${t("summaryRequestIssue")}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function buildStatusMessage(enhancedData) {
  const buildings = enhancedData.buildings || [];
  const entrances = enhancedData.entrances || [];
  const preferredCount = entrances.filter((entry) =>
    (entry.entrance_tags || []).includes("PREFERRED"),
  ).length;

  if (!buildings.length && !entrances.length) {
    return t("statusNoEnhanced");
  }

  return formatMessage(t("statusEnhanced"), {
    buildings: buildings.length,
    entrances: entrances.length,
    preferred: preferredCount,
  });
}

function setStatus(message) {
  els.statusMessage.textContent = message;
}

function lockUi(locked) {
  els.runButton.disabled = locked;
  els.resetButton.disabled = locked;
}

function formatCoordinate(value) {
  return Number(value).toFixed(6);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyTranslations() {
  els.i18nNodes.forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  els.i18nPlaceholders.forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
  });
}

function t(key) {
  return translations[state.locale]?.[key] || translations.en[key] || key;
}

function formatMessage(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

function setMapOverlay(container, title, message) {
  clearMapOverlay(container);
  const overlay = document.createElement("div");
  overlay.className = "map-overlay";
  overlay.innerHTML = `
    <div class="map-overlay-card">
      <strong>${escapeHtml(title)}</strong>
      <div>${escapeHtml(message)}</div>
    </div>
  `;
  container.append(overlay);
}

function clearMapOverlay(container) {
  container.querySelector(".map-overlay")?.remove();
}
