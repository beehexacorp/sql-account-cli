# SQL Account CLI

The **SQL Account CLI** is a command-line tool designed to streamline the deployment, management, and exposure of the [SQL Account Rest API](https://github.com/beehexacorp/sqlaccountapi) application on Windows IIS. This tool automates common tasks such as deploying the application, setting up Cloudflare tunnels, and authenticating with SQL Account via REST API.

---

## Table of Contents

- [SQL Account CLI](#sql-account-cli)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Usage](#usage)
    - [Installation Steps](#installation-steps)
    - [PowerShell Note](#powershell-note)
    - [Key Commands](#key-commands)
  - [Development \& Contribution](#development--contribution)
  - [License](#license)

---

## Features

- **Install**: Deploy the [SQL Account Rest API](https://github.com/beehexacorp/sqlaccountapi) application to IIS effortlessly.
- **Expose**: Set up Cloudflare tunnels for secure remote access.
- **Manage**: Control SQL Account integration services through a simple interface.
- **Automate**: Simplify routine tasks such as authentication and application updates.

---

## Prerequisites

Before using this project, ensure the following are installed on your system:

1. **Node.js (v18+)**  
   - [Download Node.js](https://nodejs.org/)
   - Follow the installation wizard for your operating system.

2. **.NET 8 Hosting Bundle**  
   - [Download .NET 8 Hosting Bundle](https://dotnet.microsoft.com/download/dotnet/8.0)  
   - Choose the "Hosting Bundle" option to run .NET applications on IIS.

3. **SQL Account**  
   - [Download SQL Account](https://www.sql.com.my/products/)  
   - SQL Account must be installed and running on your system.

4. **IIS (Internet Information Services)**  
   - To enable IIS on Windows:
     1. Open **Control Panel** > **Programs** > **Programs and Features**.
     2. Click **Turn Windows features on or off**.
     3. Check the box for **Internet Information Services** and click **OK**.

---

## Usage

### Installation Steps

For usage, install the CLI globally using npm:

```bash
npm install -g sql-account
```

### PowerShell Note

> ⚠️ **Note**: Ensure you run PowerShell as Administrator for the following installation steps.

This is essential to ensure the CLI has sufficient permissions to configure IIS and other system settings.

### Key Commands

Below are the key commands available in the `sql-account` CLI:

1. **Install**  
   Deploy the SQL Account Rest API to IIS:
   ```bash
   sql-account install --app-dir <path-to-app-directory> --app-name <application-name>
   ```
   - `--app-dir`: Directory containing the application to deploy.
   - `--app-name`: Name of the application to set up in IIS.

2. **Expose**  
   Create a secure Cloudflare tunnel for exposing the application:
   ```bash
   sql-account expose --provider <hostname> --secret <cloudflare-key>
   ```
   - `--provider`: Hostname to use for the Cloudflare tunnel.
   - `--secret`: API key for authenticating with Cloudflare.

3. **Login**  
   Authenticate with SQL Account:
   ```bash
   sql-account login --username <your-username> --password <your-password>
   ```
   - `--username`: SQL Account username.
   - `--password`: SQL Account password.

4. **Help**  
   View all available commands and options:
   ```bash
   sql-account --help
   ```

---

## Development & Contribution

For local development:

1. Clone or download the project.
2. Navigate to the project directory using a terminal.
3. Install the required dependencies:
   ```bash
   npm install
   ```
4. Build and link the package for local usage:
   ```bash
   npm run build
   npm link
   ```

This project is implemented and maintained by the **HexaSync Team**.

- **Fork and Contribute**: You are welcome to fork the repository, implement your features, and submit a pull request for review.
- **File a Ticket**: If you encounter any issues, please file a ticket on the [GitHub repository](https://github.com/beehexacorp/sql-accounting-cli).
- **Contact Support**: Reach out to our team at [support@hexasync.com](mailto:support@hexasync.com).

---

## License

This project is open-source. Contributions are highly encouraged!
