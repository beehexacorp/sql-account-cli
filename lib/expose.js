const { execSync } = require("child_process");
const { CLOUDFLARED_WIN_64_URL } = require("../data/constants");
const { downloadFile } = require("./deploy")
const { log } = require("./logger");

async function expose(provider, secret) {
  log(`Starting Cloudflare tunnel setup for provider: ${provider}`);
  if (provider.toLowerCase() !== "cloudflared") {
    const error = `Unsupported provider: ${provider}`;
    log(error);
    console.error(error);
    process.exit(1);
  }
  await ensureCloudflared();
    try {
      try {
        execSync("cloudflared service uninstall");
        log("Uninstalling existing Cloudflare tunnel...");
      } catch (error) {
        log("No existing Cloudflare tunnel found.");
      }
      log("Registering Cloudflare tunnel...");
      execSync(`cloudflared service install ${secret}`);
      log("Cloudflare tunnel registered successfully.");
      console.log("Tunnel registered successfully.");
    } catch (error) {
      log(`Failed to register tunnel: ${error.message}`);
      console.error(`Failed to register tunnel: ${error.message}`);
      process.exit(1);
    }
}
async function ensureCloudflared() {
  try {
    // Cloudflared check
    execSync("cloudflared -v", { stdio: "ignore" });
    log("Cloudflared is already installed");
    return true;
  } catch (err) {
    // Install cloudflared
    log("Cloudflared is not installed. Installing now...");
    downloadFile(CLOUDFLARED_WIN_64_URL, "cloudflared.msi").then(() => {
        const command = `msiexec /i "cloudflared.msi" /quiet /norestart`;
        execSync(command, { stdio: "inherit" });
    })
    return false;
  }
}

module.exports = { expose };
