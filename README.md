# Forge & Fracture — Security Field Manual

A cybersecurity field guide and a separate FastAPI + SQLAlchemy + SQLite deliberately vulnerable web application (DVWB). The guide teaches networking, Linux tools, and the four web vulnerability topics practiced in the DVWB: SQL injection, IDOR, path traversal, and broken access control.

The DVWB uses fictional training records and intentionally contains those four weaknesses. It is designed for a private, authorized workshop network. Do not expose it to the public internet or a production network.

## Run locally on Windows

From the repository folder, install the Python dependencies once:

```cmd
py -m pip install -r dvwb\requirements.txt
```

Open two Command Prompt windows in the repository folder. In the first, start the trainer:

```cmd
py -m uvicorn dvwb.trainer:app --host 127.0.0.1 --port 8001
```

In the second, start the DVWB:

```cmd
py -m uvicorn dvwb.app:app --host 127.0.0.1 --port 8002
```

Visit [http://127.0.0.1:8001/](http://127.0.0.1:8001/) for the field guide. Its **Open the DVWB** button opens [http://127.0.0.1:8002/](http://127.0.0.1:8002/). The DVWB SQLite database is created on first start; its default location is `dvwb/dvwb.sqlite3`.

## Deploy both websites on Kali Linux

This deployment runs both applications on the Kali server. Nginx serves the trainer and forwards the DVWB hostname to the DVWB service. The trainer's button is configured to open the DVWB hostname. Both Python services listen only on the server's loopback interface; participants connect through Nginx. Use hostnames that resolve to the Kali server on the isolated workshop network.

### Before you begin

You need:

- A Kali Linux server with administrator access and a static address on the workshop network.
- Two DNS records (or equivalent internal DNS entries) pointing to that server: one for the trainer and one for the DVWB. The examples below use `trainer.example.test` and `dvwb.example.test`; replace them with names that resolve for every participant device.
- An isolated workshop network. Do not forward the DVWB to the public internet.

### 1. Install Kali packages and fetch the project

Run these commands on the Kali server:

```bash
sudo apt update
sudo apt install -y git nginx python3 python3-venv python3-pip
sudo systemctl enable --now nginx
sudo git clone https://github.com/MahendraKumar1202/forge-fracture-training-site.git /opt/forge-fracture-training-site
sudo chown -R root:root /opt/forge-fracture-training-site
sudo chmod -R a+rX /opt/forge-fracture-training-site
```

Create an isolated Python environment and install the DVWB requirements:

```bash
sudo python3 -m venv /opt/forge-fracture-venv
sudo /opt/forge-fracture-venv/bin/pip install --upgrade pip
sudo /opt/forge-fracture-venv/bin/pip install -r /opt/forge-fracture-training-site/dvwb/requirements.txt
```

Create a persistent, service-owned location for the SQLite database:

```bash
sudo install -d -o www-data -g www-data -m 0750 /var/lib/forge-fracture
```

### 2. Configure both Python services

Set the DVWB hostname used by participants in the trainer service configuration. If the example name differs from your DNS entry, update it before installation; use `https://` if you configure TLS:

```bash
sudo nano /opt/forge-fracture-training-site/deploy/kali/forge-fracture-trainer.service
```

Edit the `Environment=DVWB_PUBLIC_URL=...` line. The trainer reads this setting when it serves the page, so its **Open the DVWB** button will point to the Kali server's DVWB hostname rather than to localhost.

Install the included systemd service definitions:

```bash
sudo install -o root -g root -m 0644 /opt/forge-fracture-training-site/deploy/kali/forge-fracture-trainer.service /etc/systemd/system/
sudo install -o root -g root -m 0644 /opt/forge-fracture-training-site/deploy/kali/forge-fracture-dvwb.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now forge-fracture-trainer.service forge-fracture-dvwb.service
```

The services run as `www-data`, listen only on `127.0.0.1` ports 8001 and 8002, and restart after a failure. The trainer service reads its configured DVWB URL, and the DVWB database persists in `/var/lib/forge-fracture/dvwb.sqlite3`.

### 4. Configure Nginx for both hostnames

Copy the example Nginx configuration, then replace both example hostnames and the example participant subnet with your workshop's actual DNS names and private network range. The `allow` line must match the participants' source subnet; the following `deny all` prevents other clients from reaching the intentionally vulnerable DVWB.

```bash
sudo install -o root -g root -m 0644 /opt/forge-fracture-training-site/deploy/kali/forge-fracture.nginx /etc/nginx/sites-available/forge-fracture
sudo nano /etc/nginx/sites-available/forge-fracture
```

Enable the site and validate the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/forge-fracture /etc/nginx/sites-enabled/forge-fracture
sudo nginx -t
sudo systemctl reload nginx
```

Keep any existing Nginx sites; do not remove their configuration. Do not expose ports 8001 or 8002 to the network. Only Nginx should accept participant traffic, with the DVWB hostname restricted to the workshop subnet.

### 5. Check the two sites

On the Kali server, check both services and Nginx:

```bash
sudo systemctl --no-pager --full status forge-fracture-trainer forge-fracture-dvwb nginx
curl -sS -o /dev/null -w '%{http_code}\n' -H 'Host: trainer.example.test' http://127.0.0.1/
curl -sS -o /dev/null -w '%{http_code}\n' -H 'Host: dvwb.example.test' http://127.0.0.1/
```

From a participant device on the workshop network, open `http://trainer.example.test/`, then select **Open the DVWB**. It should open `http://dvwb.example.test/` and display the DVWB login page. If the sites use HTTPS, use the HTTPS URLs and set the trainer's DVWB URL to HTTPS as described above.

### 6. Optional HTTPS

For names with valid public DNS and certificate validation, install Certbot and obtain certificates for both hostnames. Use the current Kali/Debian Certbot package instructions and verify that the DVWB subnet restriction remains in the Nginx TLS server block. For an internal-only workshop, use the organization's internal certificate authority. Do not make the vulnerable DVWB publicly reachable just to obtain a certificate.

## Update the Kali installation

Run on the Kali server after changes are pushed to the repository:

```bash
sudo git -C /opt/forge-fracture-training-site pull --ff-only
sudo /opt/forge-fracture-venv/bin/pip install -r /opt/forge-fracture-training-site/dvwb/requirements.txt
sudo systemctl restart forge-fracture-trainer forge-fracture-dvwb
sudo nginx -t && sudo systemctl reload nginx
```

The DVWB URL remains configured in `/etc/systemd/system/forge-fracture-trainer.service`; the local SQLite database and Nginx configuration are outside the Git checkout and remain in place during updates. If the hostname changes, edit that service's `DVWB_PUBLIC_URL`, then run `sudo systemctl daemon-reload && sudo systemctl restart forge-fracture-trainer`.

## Troubleshooting

- View service logs with `sudo journalctl -u forge-fracture-trainer -u forge-fracture-dvwb -n 100 --no-pager`.
- Check the Nginx error log with `sudo tail -n 50 /var/log/nginx/error.log`.
- If the trainer opens but its DVWB button points to localhost, correct `DVWB_PUBLIC_URL` in `/etc/systemd/system/forge-fracture-trainer.service`, then run `sudo systemctl daemon-reload && sudo systemctl restart forge-fracture-trainer` and refresh the browser.
- If Nginx returns `502 Bad Gateway`, check that both systemd services are active and listening locally on ports 8001 and 8002.
- If only the trainer hostname works, check DNS for the DVWB hostname, the Nginx `server_name`, and the workshop subnet allowlist.

## Repository layout

- `index.html`, `style.css`, `app.js`, and `forgeLogo.png` — trainer website
- `dvwb/trainer.py` — FastAPI host for the trainer website
- `dvwb/app.py` — FastAPI DVWB backed by SQLAlchemy and SQLite
- `dvwb/training_files/` — fictional public and confidential text files
- `deploy/kali/` — Kali systemd and Nginx configuration examples

Use active testing only on systems for which the relevant rules or written authorization permit it.
