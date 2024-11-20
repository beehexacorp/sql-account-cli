const axios = require("axios");
const { log } = require("./logger");

async function login(username, password) {
  log(`Attempting login with username: ${username}`);
  try {
    const response = await axios.post(
      "http://localhost:5001/api/app/login",
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
