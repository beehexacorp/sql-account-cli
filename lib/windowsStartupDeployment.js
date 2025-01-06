const fs = require("fs");
const path = require("path");
const os = require("os");
const { log } = require("./logger");
const {
  STARTUP_PATH,
} = require("../data/constants");
const { runPowerShellScript, sleep } = require("../helpers/systemHelper");

async function configureWindowsStartup(exePath) {
  const desktopPath = path.join(os.homedir(), "Desktop");
  const appName = path.basename(exePath);
  const shortcutPath = path.join(desktopPath, `${appName}.lnk`);
  createShortcut(exePath, shortcutPath);
  await sleep(1000);
  addToStartup(shortcutPath);
}
function createShortcut(targetPath, shortcutPath) {
  const workingDirectory = path.dirname(targetPath);

  // PowerShell commands to create a shortcut
  const commands = `
      $WshShell = New-Object -ComObject WScript.Shell
      $Shortcut = $WshShell.CreateShortcut("${shortcutPath}")
      $Shortcut.TargetPath = "${targetPath}"
      $Shortcut.WorkingDirectory = "${workingDirectory}"
      $Shortcut.Save()
    `;

  try {
    runPowerShellScript(commands, "createShortcut.ps1");
    log("Shortcut created successfully.");
  } catch (err) {
    log("Error creating shortcut:", err);
  }
}
function addToStartup(shortcutPath) {
  const startupShortcutPath = path.join(
    STARTUP_PATH,
    path.basename(shortcutPath)
  );

  fs.copyFile(shortcutPath, startupShortcutPath, (err) => {
    if (err) {
      log("Error adding to startup:", err);
      return;
    }
    log("Shortcut added to startup.");
  });
}
module.exports = { configureWindowsStartup };
