const repo = "rockbeatspaper-coder/Forge-Executor";
const latestReleaseUrl = `https://api.github.com/repos/${repo}/releases/latest`;
const fallbackReleaseUrl = `https://github.com/${repo}/releases/latest`;

const downloadButton = document.getElementById("downloadButton");
const downloadMeta = document.getElementById("downloadMeta");
const releaseName = document.getElementById("releaseName");
const releaseDate = document.getElementById("releaseDate");
const releaseCardName = document.getElementById("releaseCardName");
const releaseCardVersion = document.getElementById("releaseCardVersion");
const releaseCardLink = document.getElementById("releaseCardLink");

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === tab));
  });
});

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
      throw new Error("Latest release has no downloadable zip asset yet");
    }

    const version = releaseLabel(release);
    downloadButton.href = asset.browser_download_url;
    downloadMeta.textContent = `${version} - ${asset.name} - ${formatBytes(asset.size)}`;
    releaseName.textContent = version;
    releaseDate.textContent = release.published_at ? `Published ${formatDate(release.published_at)}` : "GitHub latest";
    if (releaseCardName) releaseCardName.textContent = version;
    if (releaseCardVersion) releaseCardVersion.textContent = asset.name;
    if (releaseCardLink) releaseCardLink.href = asset.browser_download_url;
  } catch (error) {
    downloadButton.href = fallbackReleaseUrl;
    downloadMeta.textContent = "Open latest GitHub release";
    releaseName.textContent = "Latest release";
    releaseDate.textContent = "GitHub releases";
    if (releaseCardName) releaseCardName.textContent = "Latest GitHub release";
    if (releaseCardVersion) releaseCardVersion.textContent = "Forge zip";
    if (releaseCardLink) releaseCardLink.href = fallbackReleaseUrl;
    console.warn("Could not load latest Forge release", error);
  }
}

function selectDownloadAsset(release) {
  if (!Array.isArray(release.assets)) return null;

  return release.assets.find((asset) => /\.zip$/i.test(asset.name))
    || release.assets.find((asset) => /^Forge-Executor-Setup-.+\.exe$/i.test(asset.name))
    || release.assets[0]
    || null;
}

function releaseLabel(release) {
  return release.name || release.tag_name || "Latest release";
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

loadLatestRelease();
