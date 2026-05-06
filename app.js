const repo = "rockbeatspaper-coder/Forge-Executor";
const releasesApiUrl = `https://api.github.com/repos/${repo}/releases?per_page=12`;
const releasesPageUrl = `https://github.com/${repo}/releases`;
const latestPageUrl = `https://github.com/${repo}/releases/latest`;

const downloadLinks = Array.from(document.querySelectorAll("[data-download-link]"));
const githubLinks = Array.from(document.querySelectorAll("[data-github-link]"));

const releaseState = {
  channelName: "Checking GitHub...",
  releaseKind: "Live feed",
  publishedDate: "Waiting for release data",
  assetName: "Forge setup",
  assetSize: "Checking",
  downloadSource: "GitHub releases",
  downloadMeta: "Fetching latest release...",
  releaseNote: "Forge will choose the newest attached Forge zip or setup installer automatically.",
  fallbackText: "If the newest channel has no package attached yet, the button opens the best available Forge release."
};

initNavigation();
loadReleaseFeed();

async function loadReleaseFeed() {
  try {
    const response = await fetch(releasesApiUrl, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`);
    }

    const releases = (await response.json())
      .filter((release) => release && !release.draft);

    if (!releases.length) {
      throw new Error("No public Forge releases were found");
    }

    const channelRelease = releases[0];
    const downloadable = findDownloadableRelease(releases);

    if (!downloadable) {
      applyReleaseState(channelRelease, null, null);
      return;
    }

    applyReleaseState(channelRelease, downloadable.release, downloadable.asset);
  } catch (error) {
    applyFallbackState(error);
  }
}

function findDownloadableRelease(releases) {
  for (const release of releases) {
    const asset = selectDownloadAsset(release);
    if (asset) {
      return { release, asset };
    }
  }

  return null;
}

function selectDownloadAsset(release) {
  if (!Array.isArray(release.assets)) return null;

  const assets = release.assets
    .filter((asset) => asset?.browser_download_url)
    .filter((asset) => !/latest\.ya?ml|\.blockmap$/i.test(asset.name || ""));

  return assets.find((asset) => /\.zip$/i.test(asset.name) && /forge/i.test(asset.name))
    || assets.find((asset) => /^Forge-Executor-Setup-.+\.exe$/i.test(asset.name))
    || assets.find((asset) => /\.zip$/i.test(asset.name))
    || assets.find((asset) => /\.exe$/i.test(asset.name))
    || null;
}

function applyReleaseState(channelRelease, downloadRelease, asset) {
  const channelName = releaseLabel(channelRelease);
  const channelKind = releaseKindLabel(channelRelease);
  const publishedDate = channelRelease.published_at
    ? `Published ${formatDate(channelRelease.published_at)}`
    : "Published on GitHub";

  if (!asset || !downloadRelease) {
    setReleaseValues({
      channelName,
      releaseKind: channelKind,
      publishedDate,
      assetName: "No package attached yet",
      assetSize: "Open GitHub release",
      downloadSource: "Release page",
      downloadMeta: `${channelName} - no download asset yet`,
      releaseNote: "This channel exists on GitHub, but it does not have a Forge zip or setup installer attached yet.",
      fallbackText: "Attach a Forge zip or setup installer to this release and the button will switch to that asset automatically."
    });
    setDownloadTarget(channelRelease.html_url || releasesPageUrl);
    setGitHubTarget(channelRelease.html_url || releasesPageUrl);
    return;
  }

  const downloadName = releaseLabel(downloadRelease);
  const assetName = cleanAssetName(asset.name);
  const assetSize = formatBytes(asset.size);
  const sameRelease = channelRelease.id === downloadRelease.id;
  const assetType = /\.zip$/i.test(asset.name) ? "zip package" : "setup installer";

  setReleaseValues({
    channelName,
    releaseKind: channelKind,
    publishedDate,
    assetName,
    assetSize,
    downloadSource: sameRelease ? "Current channel" : downloadName,
    downloadMeta: sameRelease
      ? `${channelName} - ${assetSize} ${assetType}`
      : `${downloadName} - ${assetSize} ${assetType}`,
    releaseNote: sameRelease
      ? `Downloading the ${assetType} attached to ${channelName}.`
      : `${channelName} is the newest channel, but the download is using the newest attached package from ${downloadName}.`,
    fallbackText: sameRelease
      ? "The newest channel has a downloadable Forge package attached."
      : "The newest channel has no Forge package attached yet, so the site uses the newest available package."
  });

  setDownloadTarget(asset.browser_download_url);
  setGitHubTarget(downloadRelease.html_url || latestPageUrl);
}

function applyFallbackState(error) {
  setReleaseValues({
    channelName: "GitHub releases",
    releaseKind: "Offline fallback",
    publishedDate: "Could not read the release feed",
    assetName: "Forge release page",
    assetSize: "Open GitHub",
    downloadSource: "GitHub releases",
    downloadMeta: "Open Forge releases on GitHub",
    releaseNote: "The browser could not read GitHub right now, so the button opens the releases page.",
    fallbackText: "If the live feed is rate limited or blocked, GitHub releases still has the current downloads."
  });

  setDownloadTarget(releasesPageUrl);
  setGitHubTarget(releasesPageUrl);
  console.warn("Could not load Forge releases", error);
}

function releaseLabel(release) {
  return release?.name || release?.tag_name || "Latest release";
}

function releaseKindLabel(release) {
  const label = releaseLabel(release);
  if (release?.prerelease || /alpha/i.test(label)) return "Alpha channel";
  if (/beta/i.test(label)) return "Beta channel";
  if (/(?:^|[-.])rc(?:[-.]|\d|$)/i.test(label)) return "Release candidate";
  if (/snapshot/i.test(label)) return "Snapshot channel";
  return "Stable channel";
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

function setReleaseValues(values) {
  Object.assign(releaseState, values);

  for (const [key, value] of Object.entries(releaseState)) {
    document.querySelectorAll(`[data-release="${key}"]`).forEach((element) => {
      element.textContent = value;
    });
  }
}

function setDownloadTarget(url) {
  downloadLinks.forEach((link) => {
    link.href = url;
  });
}

function setGitHubTarget(url) {
  githubLinks.forEach((link) => {
    link.href = url;
  });
}

function initNavigation() {
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((item) => item.classList.toggle("active", item === link));
    });
  });

  if (!("IntersectionObserver" in window) || !sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    const activeEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!activeEntry) return;

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${activeEntry.target.id}`);
    });
  }, {
    rootMargin: "-35% 0px -55% 0px",
    threshold: [0.1, 0.25, 0.5]
  });

  sections.forEach((section) => observer.observe(section));
}
