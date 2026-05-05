const repo = "rockbeatspaper-coder/Forge-Executor";
const latestReleaseUrl = `https://api.github.com/repos/${repo}/releases/latest`;
const fallbackReleaseUrl = `https://github.com/${repo}/releases/latest`;

const releaseTargets = {
  downloadButton: document.getElementById("downloadButton"),
  downloadMeta: document.getElementById("downloadMeta"),
  releaseName: document.getElementById("releaseName"),
  releaseDate: document.getElementById("releaseDate"),
  releaseCardName: document.getElementById("releaseCardName"),
  releaseCardVersion: document.getElementById("releaseCardVersion"),
  releaseCardText: document.getElementById("releaseCardText"),
  releaseCardLink: document.getElementById("releaseCardLink"),
  currentChannelName: document.getElementById("currentChannelName"),
  currentChannelMeta: document.getElementById("currentChannelMeta"),
  heroChannelName: document.getElementById("heroChannelName"),
  assetName: document.getElementById("assetName"),
  assetSize: document.getElementById("assetSize"),
  updateLane: document.getElementById("updateLane")
};

const pages = Array.from(document.querySelectorAll("[data-page]"));
const routes = new Set(pages.map((page) => page.dataset.page));

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab));
  });
});

document.querySelectorAll("[data-scroll-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.scrollTarget);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function initRouter() {
  syncRoute();
  window.addEventListener("hashchange", syncRoute);
}

function syncRoute() {
  const route = currentRoute();

  pages.forEach((page) => {
    page.classList.toggle("active", page.dataset.page === route);
  });

  document.querySelectorAll("[data-route]").forEach((link) => {
    link.classList.toggle("active", routeFromHash(link.getAttribute("href")) === route);
  });

  document.body.dataset.route = route;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function currentRoute() {
  return routeFromHash(window.location.hash);
}

function routeFromHash(value) {
  const raw = String(value || "")
    .replace(/^#\/?/, "")
    .trim();

  return routes.has(raw) ? raw : "home";
}

async function loadLatestRelease() {
  try {
    const response = await fetch(latestReleaseUrl, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`);
    }

    const release = await response.json();
    const asset = selectDownloadAsset(release);

    if (!asset?.browser_download_url) {
      throw new Error("Latest release has no downloadable Forge asset yet");
    }

    applyReleaseState(release, asset);
  } catch (error) {
    applyFallbackState(error);
  }
}

function applyReleaseState(release, asset) {
  const label = releaseLabel(release);
  const published = release.published_at ? `Published ${formatDate(release.published_at)}` : "GitHub latest";
  const assetLabel = cleanAssetName(asset.name);
  const meta = `${assetLabel} - ${formatBytes(asset.size)}`;
  const assetType = /\.zip$/i.test(asset.name) ? "zip package" : "setup installer";

  setTextByKey("releaseName", label);
  setTextByKey("releaseDate", published);
  setTextByKey("currentChannelName", label);
  setTextByKey("currentChannelMeta", release.prerelease ? "prerelease channel" : "stable release channel");
  setTextByKey("heroChannelName", label);
  setTextByKey("assetName", assetLabel);
  setTextByKey("assetSize", `${formatBytes(asset.size)} ${assetType}`);
  setTextByKey("updateLane", release.prerelease ? "GitHub prerelease" : "GitHub latest");
  setTextByKey("downloadMeta", `${label} - ${meta}`);
  setTextByKey("releaseCardName", label);
  setTextByKey("releaseCardVersion", assetLabel);
  setTextByKey("releaseCardText", `The download is currently using the ${assetType} attached to ${label}.`);

  setHrefByKey("downloadButton", asset.browser_download_url);
  setHrefByKey("releaseCardLink", asset.browser_download_url);
}

function applyFallbackState(error) {
  setHrefByKey("downloadButton", fallbackReleaseUrl);
  setHrefByKey("releaseCardLink", fallbackReleaseUrl);
  setTextByKey("downloadMeta", "Open latest GitHub release");
  setTextByKey("releaseName", "Latest release");
  setTextByKey("releaseDate", "GitHub releases");
  setTextByKey("currentChannelName", "Latest release");
  setTextByKey("currentChannelMeta", "GitHub release feed");
  setTextByKey("heroChannelName", "Forge Client");
  setTextByKey("assetName", "Forge setup");
  setTextByKey("assetSize", "Open GitHub releases");
  setTextByKey("updateLane", "GitHub latest");
  setTextByKey("releaseCardName", "Latest GitHub release");
  setTextByKey("releaseCardVersion", "Forge zip");
  setTextByKey("releaseCardText", "Could not read the GitHub API from this browser session, so this opens the latest release page.");
  console.warn("Could not load latest Forge release", error);
}

function selectDownloadAsset(release) {
  if (!Array.isArray(release.assets)) return null;

  const assets = release.assets.filter((asset) => asset?.browser_download_url);
  return assets.find((asset) => /\.zip$/i.test(asset.name) && /forge/i.test(asset.name))
    || assets.find((asset) => /^Forge-Executor-Setup-.+\.exe$/i.test(asset.name))
    || assets.find((asset) => /\.zip$/i.test(asset.name))
    || assets.find((asset) => /\.exe$/i.test(asset.name))
    || assets[0]
    || null;
}

function releaseLabel(release) {
  return release.name || release.tag_name || "Latest release";
}

function cleanAssetName(name = "") {
  return String(name)
    .replace(/^Forge-Executor-/, "Forge ")
    .replace(/^Forge-/, "Forge ")
    .replace(/-/g, " ")
    .trim() || "Forge setup";
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "download";
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function setTextByKey(key, value) {
  setText(releaseTargets[key], value);
  document.querySelectorAll(`[data-release="${key}"]`).forEach((element) => setText(element, value));
}

function setHrefByKey(key, value) {
  setHref(releaseTargets[key], value);
  document.querySelectorAll(`[data-release-href="${key}"]`).forEach((element) => setHref(element, value));
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function setHref(element, value) {
  if (element) element.href = value;
}

initRouter();
loadLatestRelease();
