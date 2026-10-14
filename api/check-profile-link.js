const dns = require("node:dns").promises;
const http = require("node:http");
const https = require("node:https");
const net = require("node:net");

function isPublicIpv4(address) {
  if (net.isIP(address) !== 4) return false;
  const octets = address.split(".").map(Number);
  const value = (((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3]) >>> 0;
  const blocked = [
    [0x00000000, 8], [0x0a000000, 8], [0x64400000, 10],
    [0x7f000000, 8], [0xa9fe0000, 16], [0xac100000, 12],
    [0xc0000000, 24], [0xc0000200, 24], [0xc0586300, 24],
    [0xc0a80000, 16], [0xc6120000, 15], [0xc6336400, 24],
    [0xcb007100, 24], [0xe0000000, 4], [0xf0000000, 4]
  ];
  return !blocked.some(([network, bits]) => (value >>> (32 - bits)) === (network >>> (32 - bits)));
}

function parseAndValidate(raw, type) {
  const url = new URL(raw);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("invalid_url");
  if ((url.protocol === "https:" && url.port && url.port !== "443") || (url.protocol === "http:" && url.port && url.port !== "80")) throw new Error("invalid_url");
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || net.isIP(host) || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || !host.includes(".")) throw new Error("invalid_url");
  if (type === "instagram") {
    if (!["instagram.com", "www.instagram.com"].includes(host)) throw new Error("invalid_url");
    const firstPathPart = url.pathname.split("/").filter(Boolean)[0];
    if (!firstPathPart || ["p", "reel", "reels", "stories", "explore", "accounts"].includes(firstPathPart.toLowerCase())) throw new Error("invalid_url");
  }
  url.hostname = host;
  url.hash = "";
  return url;
}

async function publicIpv4For(host) {
  const records = await dns.lookup(host, { all: true, verbatim: true });
  const ipv4 = records.filter((record) => record.family === 4);
  if (!ipv4.length || ipv4.some((record) => !isPublicIpv4(record.address))) throw new Error("unsafe_host");
  return ipv4[0].address;
}

function requestHead(url, address) {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.request(url, {
      method: "HEAD",
      timeout: 4500,
      headers: { "User-Agent": "WedConnect-LinkCheck/1.0", "Accept": "text/html,application/xhtml+xml,*/*" },
      lookup: (_hostname, _options, callback) => callback(null, address, 4)
    }, (response) => {
      response.resume();
      resolve({ statusCode: response.statusCode || 0, location: response.headers.location || "" });
    });
    request.on("timeout", () => request.destroy(new Error("timeout")));
    request.on("error", reject);
    request.end();
  });
}

async function checkUrl(raw, type) {
  let url = parseAndValidate(raw, type);
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const address = await publicIpv4For(url.hostname);
    const response = await requestHead(url, address);
    if (response.statusCode >= 300 && response.statusCode < 400 && response.location) {
      if (redirects === 4) return { status: type === "instagram" ? "unknown" : "response", message: "Zu viele Weiterleitungen für eine eindeutige Prüfung." };
      url = parseAndValidate(new URL(response.location, url).toString(), type);
      continue;
    }
    if (type === "instagram") {
      if (response.statusCode >= 200 && response.statusCode < 300) return { status: "responded", message: "Instagram antwortet. Das Profil selbst ist damit nicht verifiziert." };
      return { status: "unknown", message: "Instagram lässt sich nicht zuverlässig automatisch prüfen." };
    }
    if (response.statusCode >= 200 && response.statusCode < 400) return { status: "reachable", message: "Website erreichbar." };
    if (response.statusCode >= 400 && response.statusCode < 500) return { status: "response", message: "Server antwortet mit HTTP " + response.statusCode + "." };
    return { status: "unavailable", message: "Website derzeit nicht erreichbar (HTTP " + response.statusCode + ")." };
  }
  return { status: "unknown", message: "Prüfung nicht eindeutig möglich." };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  if (origin) {
    try {
      if (new URL(origin).host !== host) return res.status(403).json({ error: "origin_not_allowed" });
    } catch (_) {
      return res.status(403).json({ error: "origin_not_allowed" });
    }
  }
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { body = null; }
  }
  const type = body && body.type;
  const raw = body && body.url;
  if (!["website", "instagram"].includes(type) || typeof raw !== "string" || raw.length > 1200) return res.status(400).json({ error: "invalid_request" });
  try {
    return res.status(200).json(await checkUrl(raw, type));
  } catch (_) {
    const message = type === "instagram" ? "Instagram lässt sich nicht zuverlässig automatisch prüfen." : "Prüfung derzeit nicht möglich.";
    return res.status(200).json({ status: "unknown", message });
  }
};
