const axios = require("axios");
const { log } = require("./logger");
const {CONFIGURATION_FILE_PATH, readJsonFile} = require("../data/constants");

async function login(username, password) {
  let configurationData = await readJsonFile(CONFIGURATION_FILE_PATH);
  log(`Attempting login with username: ${username}`);
  try {
    const response = await axios.post(
      `http://localhost:${configurationData['PORT']}/api/app/login`,
      {
        username,
        password,
      }
    );
    log("Login successful:", response.data);
  } catch (error) {
    log(`Login failed: ${error.message}`);
  }
}

module.exports = { login };
