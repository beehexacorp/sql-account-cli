# SQL Accounting CLI

SQL Accounting CLI is a command-line tool designed to streamline the deployment, management, and exposure of the SQL Accounting application on Windows IIS. It allows developers and administrators to automate common tasks such as deploying the application, setting up Cloudflare tunnels, and logging into the application.

## Features

- **Install**: Deploy the SQL Accounting application to IIS.
- **Expose**: Set up Cloudflare tunnels for remote access.
- **Login**: Authenticate with the SQL Accounting application via REST API.

## Table of Contents

- [SQL Accounting CLI](#sql-accounting-cli)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
    - [Run Locally](#run-locally)
    - [Install from NPM](#install-from-npm)
  - [Usage](#usage)
    - [Commands](#commands)
      - [`install`](#install)
      - [`expose`](#expose)
      - [`login`](#login)
  - [Development](#development)
    - [Folder Structure](#folder-structure)
    - [Logging](#logging)
  - [Contributing](#contributing)
  - [License](#license)

---

## Installation

### Run Locally

To run the CLI locally during development:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sql-accounting.git
   cd sql-accounting
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Link the CLI globally (optional for testing commands):
   ```bash
   npm link
   ```

4. Run the commands:
   ```bash
   node bin/sql-accounting.js <command> [options]
   ```
   Or, if linked:
   ```bash
   sql-accounting <command> [options]
   ```

### Install from NPM

To use the CLI after publishing to npm:

1. Install the package globally:
   ```bash
   npm install -g sql-accounting
   ```

2. Run the commands:
   ```bash
   sql-accounting <command> [options]
   ```

---

## Usage

### Commands

#### `install`
Deploy the SQL Accounting application to IIS.

**Example**:
```bash
sql-accounting install --app-name SQLAccounting --port 5001
```

**Options**:
- `--app-name`: Name of the IIS application (required).
- `--port`: Port number for the application (required).

---

#### `expose`
Set up a Cloudflare tunnel for SQL Accounting.

**Example**:
```bash
sql-accounting expose --provider Cloudflared --secret your-secret
```

**Options**:
- `--provider`: Tunnel provider (e.g., `Cloudflared`) (required).
- `--secret`: Authentication secret for the tunnel (required).

---

#### `login`
Authenticate with the SQL Accounting application.

**Example**:
```bash
sql-accounting login --username admin --password password
```

**Options**:
- `--username`: SQL Accounting username (required).
- `--password`: SQL Accounting password (required).

---

## Development

### Folder Structure

```
sql-accounting/
├── bin/
│   └── sql-accounting.js    # CLI entry point
├── lib/
│   ├── deploy.js            # Deployment logic
│   ├── expose.js            # Cloudflare tunnel logic
│   └── login.js             # Login logic
├── logs/
│   └── deployment.log       # Log file (auto-generated in AppData)
├── package.json             # Project metadata
├── README.md                # Project documentation
```

### Logging

Logs are stored in the `AppData/Local/SqlAccounting` folder for each user on Windows. Check `deployment.log` for details about executed commands.

---

## Contributing

We welcome contributions from the community! To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request with a detailed description of your changes.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.