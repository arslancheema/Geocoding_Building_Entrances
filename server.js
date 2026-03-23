const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const TOKYO_BOUNDS = "35.55,139.55|35.817,139.93";

const apiKey = resolveApiKey();

if (!apiKey) {
  throw new Error("Missing Google Maps API key. Set GOOGLE_MAPS_API_KEY or add server-config.json.");
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/maps-js") {
      const callback = url.searchParams.get("callback");
      const mapsUrl = new URL("https://maps.googleapis.com/maps/api/js");
      mapsUrl.searchParams.set("key", apiKey);
      mapsUrl.searchParams.set("v", "weekly");
      mapsUrl.searchParams.set("callback", callback || "initMap");
      return proxyText(res, mapsUrl.toString(), "application/javascript; charset=utf-8");
    }

    if (req.method === "POST" && url.pathname === "/api/geocode/basic") {
      const body = await readJson(req);
      const query = String(body.query || "").trim();
      assertQuery(query);

      const geocodeUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      geocodeUrl.searchParams.set("address", query);
      geocodeUrl.searchParams.set("region", "jp");
      geocodeUrl.searchParams.set("bounds", TOKYO_BOUNDS);
      geocodeUrl.searchParams.set("language", "en");
      geocodeUrl.searchParams.set("key", apiKey);

      const upstream = await requestJson(geocodeUrl.toString());
      const payload = upstream.data;
      if (upstream.statusCode < 200 || upstream.statusCode >= 300 || payload.status !== "OK" || !payload.results?.length) {
        return sendJson(res, 400, {
          error:
            payload.error_message ||
            `Basic geocoding returned ${payload.status || upstream.statusCode}.`,
        });
      }

      const result = payload.results[0];
      return sendJson(res, 200, {
        formattedAddress: result.formatted_address,
        location: result.geometry.location,
        viewport: result.geometry.viewport || null,
      });
    }

    if (req.method === "POST" && url.pathname === "/api/geocode/enhanced") {
      const body = await readJson(req);
      const query = String(body.query || "").trim();
      assertQuery(query);

      const upstream = await requestJson("https://geocode.googleapis.com/v4beta/geocode/destinations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "destinations.primary.formattedAddress," +
            "destinations.primary.location," +
            "destinations.primary.displayPolygon," +
            "destinations.primary.place," +
            "destinations.entrances",
        },
        body: {
          addressQuery: {
            addressQuery: query,
          },
          languageCode: "en",
          regionCode: "JP",
        },
      });

      const payload = upstream.data;
      if (upstream.statusCode < 200 || upstream.statusCode >= 300 || !payload.destinations?.length) {
        return sendJson(res, 400, {
          error:
            payload.error?.message ||
            `Enhanced geocoding returned ${upstream.statusCode}. Check that Geocoding API v4 SearchDestinations is enabled for this project.`,
        });
      }

      const destination = payload.destinations[0];
      const primary = destination.primary || {};
      return sendJson(res, 200, {
        formattedAddress: primary.formattedAddress || query,
        location: normalizeLocation(primary.location),
        viewport: null,
        buildings: primary.displayPolygon
          ? [
              {
                place_id: primary.place || "unknown",
                building_outlines: [
                  {
                    displayPolygon: primary.displayPolygon,
                  },
                ],
              },
            ]
          : [],
        entrances: (destination.entrances || []).map((entrance) => ({
          building_place_id: entrance.place || primary.place || "unknown",
          location: normalizeLocation(entrance.location),
          entrance_tags: entrance.tags || [],
        })),
      });
    }

    if (req.method !== "GET") {
      return sendJson(res, 405, { error: "Method not allowed." });
    }

    serveStatic(req, res, url.pathname);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Server error." });
  }
});

server.listen(PORT, () => {
  console.log(`Tokyo demo server running at http://localhost:${PORT}`);
});

function assertQuery(query) {
  if (!query) {
    throw new Error("Missing query.");
  }
}

async function proxyText(res, url, contentType) {
  const upstream = await requestText(url);
  res.writeHead(upstream.statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  res.end(upstream.data);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function normalizeLocation(location) {
  return {
    lat: location?.latitude ?? location?.lat ?? 0,
    lng: location?.longitude ?? location?.lng ?? 0,
  };
}

function serveStatic(req, res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(ROOT, path.normalize(safePath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentTypeFor(filePath),
    });
    res.end(data);
  });
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath);
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  return "text/plain; charset=utf-8";
}

function requestText(url, options = {}) {
  return request(url, options, false);
}

function requestJson(url, options = {}) {
  return request(url, options, true);
}

function request(url, options = {}, parseJson = false) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const bodyString =
      options.body === undefined
        ? null
        : typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body);

    const requestOptions = {
      method: options.method || "GET",
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      headers: {
        ...(options.headers || {}),
      },
    };

    if (bodyString) {
      requestOptions.headers["Content-Length"] = Buffer.byteLength(bodyString);
    }

    const req = https.request(requestOptions, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        try {
          resolve({
            statusCode: res.statusCode || 500,
            data: parseJson ? JSON.parse(raw || "{}") : raw,
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", reject);

    if (bodyString) {
      req.write(bodyString);
    }

    req.end();
  });
}

function resolveApiKey() {
  if (process.env.GOOGLE_MAPS_API_KEY) {
    return process.env.GOOGLE_MAPS_API_KEY.trim();
  }

  const configPath = path.join(ROOT, "server-config.json");
  if (!fs.existsSync(configPath)) {
    return "";
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return String(config.apiKey || "").trim();
  } catch (error) {
    throw new Error(`Unable to read server-config.json: ${error.message}`);
  }
}
