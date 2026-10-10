# Forge & Fracture — Security Field Manual

This repository contains two connected websites:

1. **Trainer** — a field guide covering networking, Nmap, Zenmap, Wireshark, Linux commands, and four web vulnerability topics.
2. **DVWB** — a separate FastAPI application using SQLAlchemy and SQLite. Participants enter through its login page and explore fictional event workflows. Its intentionally vulnerable exercises cover SQL injection, IDOR, path traversal, and broken access control. The President portal contains fictional confidential documents and double-octal encoded `AXA {…}` markers.

The DVWB is deliberately vulnerable. Use it only on a private, authorized workshop network. Do not expose it to the public internet or a production network. The quick Kali installer below runs two user-level systemd services on ports 8001 and 8002. Restrict access with the VM firewall and the Proxmox/network firewall to the workshop subnet. An alternative Nginx deployment with loopback-bound app services and a participant-subnet allowlist follows later in this README.

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

The DVWB creates its local SQLite database at `dvwb/dvwb.sqlite3` on first launch in the manual local-development mode. Do not commit that runtime database. The Kali installer uses `instance/dvwb.sqlite3` by default.

## B. Quick Kali deployment (user services, direct HTTP)

Use this when you want the same simple operational model as the main Forge & Fracture portal. The trainer and intentionally vulnerable DVWB run as two `systemd --user` services, so you do not need to keep a terminal open. With lingering disabled, keep the Kali user session logged in during the workshop. This mode binds both ports to the VM's network interfaces; firewall them to the isolated participant subnet and never forward them from the public internet.

### 1. Install prerequisites and open the repository

On Kali:

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip git
cd ~/forge-fracture-training-site
bash setup.sh
```

Run `setup.sh` as your normal user, **not with sudo**. It creates `.venv`, installs dependencies, creates `.env` only if absent, sets up both user services, and starts them. It preserves an existing `.env`.

### 2. Set the participant-reachable URL

Find the Kali VM's address with `ip -br addr`, then edit `.env`:

```bash
nano .env
```

Set `DVWB_PUBLIC_URL` to `http://YOUR-KALI-IP:8002/`, save, then restart both services so the trainer link and DVWB config are loaded:

```bash
systemctl --user restart forge-fracture-training-trainer forge-fracture-training-dvwb
systemctl --user --no-pager --full status forge-fracture-training-trainer forge-fracture-training-dvwb
```

Participant URLs are `http://YOUR-KALI-IP:8001/` for the field guide and `http://YOUR-KALI-IP:8002/` for the DVWB. Permit TCP 8001 and 8002 only from the workshop subnet. The application is intentionally vulnerable and contains fictional records; do not use real credentials or data.

Built-in demo accounts are recreated when the DVWB starts: `participant.asha`, `participant.rohan`, `participant.kabir`, `participant.nila`, and `participant.dev` use password `utsav-learn`; `organizer.team` uses `portal-coach`. These are public training credentials, not secure user accounts.

### 3. Reset the DVWB database before a workshop

Stop both services, then run the reset utility from the repository root:

```bash
systemctl --user stop forge-fracture-training-dvwb forge-fracture-training-trainer
./.venv/bin/python scripts/reset_database.py
```

The first run is a **dry run** and prints row counts without changing anything. If the database path and counts are correct, run the confirmed reset:

```bash
./.venv/bin/python scripts/reset_database.py --confirm
```

The script makes a private SQLite backup under `instance/backups/`, verifies its integrity, then clears all rows. On service restart the app seeds its built-in fictional demo accounts, catalogue, records, dashboard views, and settings again. It does not delete files in `dvwb/training_files/` or source code. The backup can contain previous database state and credentials-related training records; protect it.

Start the services again:

```bash
systemctl --user start forge-fracture-training-dvwb forge-fracture-training-trainer
systemctl --user status forge-fracture-training-dvwb forge-fracture-training-trainer
```

To stop them at the end of the event, run `systemctl --user stop forge-fracture-training-dvwb forge-fracture-training-trainer`. For logs, use `journalctl --user -u forge-fracture-training-dvwb -n 100 --no-pager` or the trainer service name.

### 4. Run tests locally

```bash
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
```

The exploit tests use FastAPI's in-process test client and a disposable SQLite database. They verify the intentionally vulnerable SQL injection, IDOR, path traversal, and broken-access-control exercises; they do not attack a remote host.

## C. Alternative Kali deployment (Nginx hostname-based, loopback services)

This alternative guide installs the trainer and DVWB on one Kali server. Nginx routes two hostnames to two separate FastAPI services. The trainer's **Open the DVWB** button points participants to the DVWB hostname on that server.

### Before installation: choose your network values

Set these values before copying the commands:

- `TRAINER_HOST`: the trainer DNS name, for example `trainer.workshop.example`.
- `DVWB_HOST`: the DVWB DNS name, for example `dvwb.workshop.example`.
- `PARTICIPANT_SUBNET`: the participant network in CIDR notation, for example `192.168.10.0/24`.
- `KALI_IP`: the Kali server's static address on the isolated workshop network.

Configure internal DNS so both hostnames resolve to `KALI_IP` on every participant device. The example hostnames are placeholders; `example.test` will not resolve unless you configure it yourself. For a one-device trial, you can add both names and the server address to that device's hosts file.

The included Nginx setup is HTTP-only. Keep this environment on an isolated, authorized training network. Do not expose the DVWB to the public internet or a production network.

### 1. Install packages and clone the repository

Run on Kali from an account with `sudo` access:

```bash
sudo apt update
sudo apt install -y git nginx python3 python3-venv python3-pip
sudo systemctl enable --now nginx
sudo git clone https://github.com/MahendraKumar1202/forge-fracture-training-site.git /opt/forge-fracture-training-site
sudo chown -R root:root /opt/forge-fracture-training-site
sudo chmod -R a+rX /opt/forge-fracture-training-site
```

If `/opt/forge-fracture-training-site` already exists, do not clone over it; use the update instructions below.

### 2. Install Python dependencies and create persistent storage

```bash
sudo python3 -m venv /opt/forge-fracture-venv
sudo /opt/forge-fracture-venv/bin/pip install --upgrade pip
sudo /opt/forge-fracture-venv/bin/pip install -r /opt/forge-fracture-training-site/dvwb/requirements.txt
sudo install -d -o www-data -g www-data -m 0750 /var/lib/forge-fracture
```

The database will be `/var/lib/forge-fracture/dvwb.sqlite3`, outside the Git checkout. The sample public and confidential text files are served from `dvwb/training_files/` in the project.

### 3. Create the trainer service and set its DVWB destination

Create the systemd service file directly on Kali. Replace `dvwb.workshop.example` with your actual `DVWB_HOST`. Use HTTPS only if you separately configure TLS in Step 5.

```bash
sudo tee /etc/systemd/system/forge-fracture-trainer.service >/dev/null <<'EOF'
[Unit]
Description=Forge & Fracture security field guide
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/forge-fracture-training-site
Environment=PYTHONDONTWRITEBYTECODE=1
Environment=DVWB_PUBLIC_URL=http://dvwb.workshop.example/
ExecStart=/opt/forge-fracture-venv/bin/uvicorn dvwb.trainer:app --host 127.0.0.1 --port 8001
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF
```

The `DVWB_PUBLIC_URL` setting is the destination used by the trainer button. It must be reachable by participant browsers; do not set it to `127.0.0.1` for a server deployment.

### 4. Create the DVWB service

```bash
sudo tee /etc/systemd/system/forge-fracture-dvwb.service >/dev/null <<'EOF'
[Unit]
Description=Forge & Fracture deliberately vulnerable training portal
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/forge-fracture-training-site
Environment=PYTHONDONTWRITEBYTECODE=1
Environment=DVWB_DATABASE_URL=sqlite:////var/lib/forge-fracture/dvwb.sqlite3
ExecStart=/opt/forge-fracture-venv/bin/uvicorn dvwb.app:app --host 127.0.0.1 --port 8002
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/forge-fracture

[Install]
WantedBy=multi-user.target
EOF
```

This service uses the separate SQLite database path created in Step 2 and listens only on the Kali server's loopback address.

### 5. Configure Nginx for both hostnames

Create one Nginx site file. Replace `trainer.workshop.example`, `dvwb.workshop.example`, and `192.168.10.0/24` with your actual `TRAINER_HOST`, `DVWB_HOST`, and `PARTICIPANT_SUBNET` values.

```bash
sudo tee /etc/nginx/sites-available/forge-fracture >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name trainer.workshop.example;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name dvwb.workshop.example;

    allow 127.0.0.1;
    allow ::1;
    allow 192.168.10.0/24;
    deny all;

    client_max_body_size 2m;
    location / {
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

Enable the site and check Nginx syntax:

```bash
sudo ln -sfn /etc/nginx/sites-available/forge-fracture /etc/nginx/sites-enabled/forge-fracture
sudo nginx -t
```

Do not remove the `deny all` rule or the loopback binding on either application. Keep other Nginx sites as they are.

### 6. Enable the services and reload Nginx

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now forge-fracture-trainer.service forge-fracture-dvwb.service
sudo systemctl reload nginx
```

Both FastAPI services run as `www-data` on loopback only: trainer port `8001`, DVWB port `8002`. Nginx accepts participant requests on port `80` and sends them to the appropriate service by hostname.

### 7. Limit network access and verify the participant flow

On the Kali firewall and any upstream router, allow the participant subnet to reach TCP port `80` (and `443` only if TLS is configured). Do not open ports `8001` or `8002` to the network. Keep the server on the isolated workshop network and keep the DVWB allowlist limited to the participants' subnet.

On Kali, verify the services and Nginx. Replace the example hostnames in the `curl` commands with the values from Step 5:

```bash
sudo systemctl --no-pager --full status forge-fracture-trainer forge-fracture-dvwb nginx
curl -sS -o /dev/null -w '%{http_code}\n' -H 'Host: trainer.workshop.example' http://127.0.0.1/
curl -sS -o /dev/null -w '%{http_code}\n' -H 'Host: dvwb.workshop.example' http://127.0.0.1/
```

From a participant device on the allowed network:

1. Open `http://TRAINER_HOST/` in a browser, replacing `TRAINER_HOST` with the configured trainer name.
2. Select **Open the DVWB**.
3. Confirm the browser navigates to `http://DVWB_HOST/` and displays the DVWB login page.

Both hostnames must resolve to `KALI_IP` from participant devices. If the DNS names are not set up, configure internal DNS or add hosts-file entries on each test device. A `403` response from outside the configured participant subnet is expected.

### 8. Optional HTTPS

The Nginx configuration above is HTTP-only. To use HTTPS, configure certificates and TLS listeners for both names, keep the participant subnet restriction in the DVWB TLS server block, and change the trainer service's `DVWB_PUBLIC_URL` to `https://DVWB_HOST/`. Do not make the deliberately vulnerable site publicly reachable for certificate issuance.

## Update an existing Kali installation

After changes are pushed to GitHub, update the project and restart both applications:

```bash
sudo git -C /opt/forge-fracture-training-site pull --ff-only
sudo /opt/forge-fracture-venv/bin/pip install -r /opt/forge-fracture-training-site/dvwb/requirements.txt
sudo systemctl restart forge-fracture-trainer forge-fracture-dvwb
sudo nginx -t
sudo systemctl reload nginx
```

The trainer and DVWB service files in `/etc/systemd/system/`, the Nginx configuration in `/etc/nginx/sites-available/forge-fracture`, and SQLite data in `/var/lib/forge-fracture/` are outside the Git checkout and are not replaced by `git pull`. If you edit a service file, run `sudo systemctl daemon-reload` and restart the affected service. If the DVWB hostname changes, update both `DVWB_PUBLIC_URL` and the Nginx `server_name` together.

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
