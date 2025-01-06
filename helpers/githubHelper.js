const { log } = require("../lib/logger");
const {
  CONFIGURATION_FILE_PATH,
  GITHUB_SQL_ACCOUNT_REST_API_RELEASE_URL,
} = require("../data/constants");
const { writeJsonFile } = require("../helpers/jsonHelper");
const axios = require("axios");

async function getLatestReleaseUrl() {
    try {
      const url = `https://api.github.com/repos/${GITHUB_SQL_ACCOUNT_REST_API_RELEASE_URL}latest`;
  
      const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
  
      const release = response.data;
      const assets = release.assets;
      await writeJsonFile(CONFIGURATION_FILE_PATH, {
        API_VERSION: release.tag_name,
      });
      const zipAsset = assets.find((asset) => asset.name.endsWith("win-x64.zip"));
  
      if (zipAsset) {
        return (downloadUrl = zipAsset.browser_download_url);
      } else {
        return null;
      }
    } catch (error) {
      log("Error fetching release:", error);
    }
  }
  module.exports = {
    getLatestReleaseUrl
  }