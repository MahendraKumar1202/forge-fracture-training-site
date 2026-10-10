# Forge & Fracture — Security Field Manual

This repository contains two connected websites:

1. **Trainer** — a field guide covering networking, Nmap, Zenmap, Wireshark, Linux commands, and four web vulnerability topics.
2. **DVWB** — a separate FastAPI application using SQLAlchemy and SQLite. Participants enter through its login page and explore fictional event workflows. Its intentionally vulnerable exercises cover SQL injection, IDOR, path traversal, and broken access control. The President portal contains fictional confidential documents and double-octal encoded `AXA {…}` markers.

The DVWB is deliberately vulnerable. Use it only on a private, authorized workshop network. Do not expose it to the public internet or a production network. The Kali guide below keeps both application services on loopback and places Nginx in front of them; it also restricts the DVWB hostname to the participant subnet.

## A. Run both sites locally on Windows

### 1. Get the project

If the project is not already on the computer, open **Command Prompt** and run:

```cmd
git clone https://github.com/MahendraKumar1202/forge-fracture-training-site.git
cd forge-fracture-training-site
```

If you already have the project, open Command Prompt and change to its folder instead:

```cmd
cd /d C:\path\to\forge-fracture-training-site
```

Replace `C:\path\to\forge-fracture-training-site` with the folder where you saved the repository.

### 2. Install Python dependencies

Python 3.10 or later is required. From the repository folder, install the DVWB dependencies:

```cmd
py -m pip install -r dvwb\requirements.txt
```

### 3. Start the trainer and DVWB

Keep two Command Prompt windows open. Run each command from the repository folder.

In **window 1**, start the trainer:

```cmd
py -m uvicorn dvwb.trainer:app --host 127.0.0.1 --port 8001
```

In **window 2**, start the DVWB:

```cmd
py -m uvicorn dvwb.app:app --host 127.0.0.1 --port 8002
```

Open [http://127.0.0.1:8001/](http://127.0.0.1:8001/) for the trainer. Select **Open the DVWB** to open [http://127.0.0.1:8002/](http://127.0.0.1:8002/). Keep both server windows running while using the sites. Stop a server with **Ctrl+C** in its own window.

The DVWB creates its local SQLite database at `dvwb/dvwb.sqlite3` on first launch. Do not commit that runtime database.

## B. Deploy both sites on Kali Linux

The instructions in this section install **both** sites on one Kali server. Nginx routes the trainer hostname to the trainer service and the DVWB hostname to the DVWB service. The trainer's DVWB button is configured with the participant-facing DVWB URL; it does not send participants to their own `localhost`.

### Before installation: choose real network values

The names below are examples only. A name ending in `.example.test` is a placeholder and will not automatically resolve. Before continuing, decide:

- The Kali server's static address on the isolated workshop network.
- A trainer hostname and a DVWB hostname. Configure internal DNS so both resolve to the Kali server for every participant device. For a quick single-device trial, entries in that device's hosts file can be used instead.
- The participant devices' source subnet in CIDR notation, such as `192.168.10.0/24`.

Use these values consistently in the trainer service and Nginx configuration below. If your workshop uses HTTPS, use the final `https://` DVWB address in the trainer service. The included Nginx example is HTTP-only and does not create certificates.

### 1. Install Kali packages and clone the repository

Run on the Kali server from an administrator account with `sudo` access:

```bash
sudo apt update
sudo apt install -y git nginx python3 python3-venv python3-pip
sudo systemctl enable --now nginx
sudo git clone https://github.com/MahendraKumar1202/forge-fracture-training-site.git /opt/forge-fracture-training-site
sudo chown -R root:root /opt/forge-fracture-training-site
sudo chmod -R a+rX /opt/forge-fracture-training-site
```

If `/opt/forge-fracture-training-site` already exists, do not clone over it. Use the update steps near the end of this guide.

### 2. Create the Python environment and persistent database location

```bash
sudo python3 -m venv /opt/forge-fracture-venv
sudo /opt/forge-fracture-venv/bin/pip install --upgrade pip
sudo /opt/forge-fracture-venv/bin/pip install -r /opt/forge-fracture-training-site/dvwb/requirements.txt
sudo install -d -o www-data -g www-data -m 0750 /var/lib/forge-fracture
```

The production service stores SQLite data in `/var/lib/forge-fracture/dvwb.sqlite3`, outside the Git checkout. The fictional text files remain in the repository under `dvwb/training_files/` and are readable by the service.

### 3. Set the trainer's link to the DVWB hostname

Edit the included trainer service file:

```bash
sudo nano /opt/forge-fracture-training-site/deploy/kali/forge-fracture-trainer.service
```

Change the `DVWB_PUBLIC_URL` value to the real address participants will use. For example:

```ini
Environment=DVWB_PUBLIC_URL=http://dvwb.workshop.example/
```

Use `https://` instead if you will configure HTTPS. In Nano, save with **Ctrl+O**, press **Enter**, and exit with **Ctrl+X**. The trainer reads this value when it serves the page, so its **Open the DVWB** button points to the Kali server's DVWB hostname.

### 4. Configure Nginx hostnames and participant subnet

Copy the provided Nginx configuration and edit it:

```bash
sudo install -o root -g root -m 0644 /opt/forge-fracture-training-site/deploy/kali/forge-fracture.nginx /etc/nginx/sites-available/forge-fracture
sudo nano /etc/nginx/sites-available/forge-fracture
```

In the first server block, replace `trainer.example.test` with the trainer hostname. In the second block, replace `dvwb.example.test` with the DVWB hostname and replace `192.168.10.0/24` with the actual participant subnet. The loopback allowances let the server itself run the checks in Step 7; `deny all` rejects other clients. Do not remove the deny rule or expose the DVWB service ports directly.

Enable the Nginx site without removing any other configured sites:

```bash
sudo ln -sfn /etc/nginx/sites-available/forge-fracture /etc/nginx/sites-enabled/forge-fracture
sudo nginx -t
```

The command creates or refreshes only this site's Nginx link. Fix any reported configuration errors before proceeding.

### 5. Install and start both systemd services

```bash
sudo install -o root -g root -m 0644 /opt/forge-fracture-training-site/deploy/kali/forge-fracture-trainer.service /etc/systemd/system/
sudo install -o root -g root -m 0644 /opt/forge-fracture-training-site/deploy/kali/forge-fracture-dvwb.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now forge-fracture-trainer.service forge-fracture-dvwb.service
sudo systemctl reload nginx
```

Both services run as `www-data` and listen only on `127.0.0.1`: trainer on port `8001`, DVWB on port `8002`. Nginx is the participant-facing entry point on port `80` (and `443` only if you separately configure TLS).

### 6. Restrict network access

Keep the Kali server on the isolated workshop network. Configure the server firewall and any upstream router to allow the participant subnet to reach Nginx on TCP port `80` (and `443` only when HTTPS is configured). Do **not** open TCP ports `8001` or `8002` to participants or the internet; those services must remain bound to loopback. Keep the Nginx DVWB `allow` list limited to the actual workshop subnet.

### 7. Verify the server and participant flow

On Kali, check that the services are running and that Nginx returns a successful response for both hostnames. Replace the example hostnames in these commands with the values configured in Step 4:

```bash
sudo systemctl --no-pager --full status forge-fracture-trainer forge-fracture-dvwb nginx
curl -sS -o /dev/null -w '%{http_code}\n' -H 'Host: trainer.example.test' http://127.0.0.1/
curl -sS -o /dev/null -w '%{http_code}\n' -H 'Host: dvwb.example.test' http://127.0.0.1/
```

From a participant device on the allowed network:

1. Open the trainer hostname in a browser.
2. Select **Open the DVWB**.
3. Confirm the browser opens the DVWB hostname and displays its login page.

If the hostnames are not configured in internal DNS, the participant device will not resolve them. Configure DNS or use a hosts-file entry for testing. An HTTP `403` from a client outside the configured subnet is expected.

### 8. Optional HTTPS

The included Nginx file is HTTP-only. For HTTPS, use hostnames and certificates valid for the workshop network, add TLS configuration to both Nginx server blocks, preserve the DVWB subnet restrictions in the TLS block, and set `DVWB_PUBLIC_URL` to the HTTPS address. Do not make the DVWB publicly accessible for certificate issuance.

## Update an existing Kali installation

After the changes are pushed to GitHub, run on Kali:

```bash
sudo git -C /opt/forge-fracture-training-site pull --ff-only
sudo /opt/forge-fracture-venv/bin/pip install -r /opt/forge-fracture-training-site/dvwb/requirements.txt
sudo systemctl restart forge-fracture-trainer forge-fracture-dvwb
sudo nginx -t
sudo systemctl reload nginx
```

The custom DVWB URL in `/etc/systemd/system/forge-fracture-trainer.service`, the Nginx configuration, and the database in `/var/lib/forge-fracture/` are outside the Git checkout and are not replaced by this update. If you change a service file, install the updated unit, run `sudo systemctl daemon-reload`, and restart that service. If you change the DVWB hostname, update `DVWB_PUBLIC_URL` and the corresponding Nginx `server_name` together.

## Troubleshooting

- **Nginx returns 502:** check the systemd services and logs. The applications should listen locally on ports 8001 and 8002.
- **Trainer opens but its button points to localhost or the wrong host:** check `DVWB_PUBLIC_URL` in `/etc/systemd/system/forge-fracture-trainer.service`, then run `sudo systemctl daemon-reload` and `sudo systemctl restart forge-fracture-trainer`.
- **Trainer works but DVWB does not:** check internal DNS, the DVWB `server_name`, the participant subnet allowlist, and the browser URL.
- **A service fails to start:** view its logs with `sudo journalctl -u forge-fracture-trainer -u forge-fracture-dvwb -n 100 --no-pager`.
- **Nginx reports a configuration error:** inspect `/etc/nginx/sites-available/forge-fracture`, run `sudo nginx -t`, and correct the reported line before reloading.

## Main project files

- `index.html`, `style.css`, `app.js`, `forgeLogo.png` — trainer website and lessons.
- `dvwb/trainer.py` — FastAPI host for the trainer; reads `DVWB_PUBLIC_URL` to set its DVWB link.
- `dvwb/app.py` — FastAPI DVWB using SQLAlchemy and SQLite.
- `dvwb/training_files/public/` and `dvwb/training_files/private/` — fictional text documents used by the file viewers.
- `deploy/kali/` — systemd service units and an Nginx example for the Kali deployment.

All exercises are for authorized training environments only.
