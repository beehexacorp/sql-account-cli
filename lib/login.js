const axios = require("axios");
const { log } = require("./logger");
const {CONFIGURATION_FILE_PATH, ReadJsonFile} = require("../data/constants");

async function login(username, password) {
  let configurationData = await ReadJsonFile(CONFIGURATION_FILE_PATH);
  log(`Attempting login with username: ${username}`);
  try {
    const response = await axios.post(
      `http://localhost:${configurationData['PORT']}/api/app/login`,
      {
        username,
        password,
      }
    );
    log("Login successful.");
    console.log("Login successful:", response.data);
  } catch (error) {
    log(`Login failed: ${error.message}`);
    console.error("Login failed:", error.message);
  }
}

module.exports = { login };
