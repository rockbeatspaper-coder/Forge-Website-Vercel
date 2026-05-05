const repo = "rockbeatspaper-coder/Forge-Executor";
const latestReleaseUrl = `https://api.github.com/repos/${repo}/releases/latest`;
const fallbackReleaseUrl = `https://github.com/${repo}/releases/latest`;

const downloadButton = document.getElementById("downloadButton");
const downloadMeta = document.getElementById("downloadMeta");
const releaseName = document.getElementById("releaseName");
const releaseDate = document.getElementById("releaseDate");

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
    const setup = Array.isArray(release.assets)
      ? release.assets.find((asset) => /^Forge-Executor-Setup-.+\.exe$/i.test(asset.name))
      : null;

    if (!setup?.browser_download_url) {
      throw new Error("Latest release has no setup asset yet");
    }

    const version = versionFromRelease(release, setup);
    downloadButton.href = setup.browser_download_url;
    downloadMeta.textContent = `${version} - ${formatBytes(setup.size)}`;
    releaseName.textContent = release.name || version;
    releaseDate.textContent = release.published_at ? `Published ${formatDate(release.published_at)}` : "GitHub latest";
  } catch (error) {
    downloadButton.href = fallbackReleaseUrl;
    downloadMeta.textContent = "Open latest GitHub release";
    releaseName.textContent = "Latest release";
    releaseDate.textContent = "GitHub releases";
    console.warn("Could not load latest Forge release", error);
  }
}

function versionFromRelease(release, asset) {
  const text = `${release.name || ""} ${release.tag_name || ""} ${asset.name || ""}`;
  const match = text.match(/v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/);
  return match ? `v${match[1]}` : "Latest";
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
