# Forge & Fracture — Security Field Manual

A self-contained cybersecurity learning site built with plain HTML, CSS, and JavaScript. It needs no framework, package manager, database, or build step.

## What is included

- Networking chapters for addressing and subnets, routing and gateways, DNS/ports/protocols, and troubleshooting
- Foundation lessons for Nmap, Zenmap, Wireshark, and Linux essentials
- Six web vulnerability lessons with definitions, review guidance, defenses, and small embedded practice websites
- A Practice Bench with synthetic vulnerable-versus-defended application models
- Competition preparation notes focused on scope, methodical checks, and evidence; no event-specific targets or secrets

The practice pages run entirely in the browser. They do not send requests to a target, use a database, execute entered scripts, access server files, or run operating-system commands. They are learning simulations, not live vulnerable services.

## Open locally

Open `index.html` in a current browser. For the most reliable local behavior, serve the folder over HTTP instead of opening the file directly. For example, if Python 3 is already installed:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` on that same computer.

## Install on a Linux server with Nginx

These steps use a Debian- or Ubuntu-based server and assume this Nginx instance is dedicated to this site. If Nginx already hosts other sites, keep their configuration and adapt the server block and site name instead of replacing the default site.

### 1. Connect to the server

Open an SSH session using an account with `sudo` access. Update the package list and install Nginx and Git:

```bash
sudo apt update
sudo apt install -y nginx git
sudo systemctl enable --now nginx
```

Confirm Nginx is running:

```bash
sudo systemctl status nginx --no-pager
```

### 2. Download the repository

After the project is published, replace the placeholders with your GitHub username and repository name:

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
```

Run the next commands from the folder containing `index.html`, `style.css`, and `app.js`.

### 3. Copy the site files into the web directory

```bash
sudo install -d -m 0755 /var/www/forge-fracture
sudo install -m 0644 index.html style.css app.js /var/www/forge-fracture/
```

The files are owned by the administrator and readable by Nginx. No executable permission is needed for the site files.

### 4. Configure the Nginx site

Create a site configuration:

```bash
sudo tee /etc/nginx/sites-available/forge-fracture >/dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/forge-fracture;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ /\. {
        deny all;
    }
}
EOF
```

Enable this site as the default for a dedicated Nginx instance, replacing the packaged welcome-site link if it exists:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/forge-fracture /etc/nginx/sites-enabled/forge-fracture
```

### 5. Check and reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I http://127.0.0.1
```

The response should show a successful HTTP status. From another device that can reach the server, open `http://SERVER-IP` in a browser. Replace `SERVER-IP` with the server's address. If a firewall is enabled, allow inbound TCP port 80 only on the network where you intend to provide access.

### 6. Optional: use a domain and HTTPS

For access beyond a trusted local network, point a domain you control to the server, allow the required web traffic through the firewall, and configure HTTPS with a certificate. Follow the current [Ubuntu Server TLS certificate guide](https://ubuntu.com/server/docs/how-to/security/obtain-tls-certificates/) and [Nginx configuration guide](https://ubuntu.com/server/docs/how-to/web-services/configure-nginx/). Do not expose a management interface or unrelated services as part of this site setup.

## Update the installation

In the cloned repository, retrieve the latest version and copy the static files again:

```bash
git pull --ff-only
sudo install -m 0644 index.html style.css app.js /var/www/forge-fracture/
sudo nginx -t
sudo systemctl reload nginx
```

## Troubleshooting

- `sudo nginx -t` reports configuration errors: review the site file in `/etc/nginx/sites-available/forge-fracture` and correct the reported line.
- The Nginx welcome page still appears: check that the `forge-fracture` link exists in `/etc/nginx/sites-enabled/`, then run `sudo nginx -t` and reload Nginx.
- The page loads without styling or behavior: confirm `index.html`, `style.css`, and `app.js` are all present in `/var/www/forge-fracture/` and that their names match exactly.
- To inspect recent Nginx errors, run `sudo tail -n 50 /var/log/nginx/error.log`.

## Edit the site

- `index.html` contains the page shell and navigation landmarks.
- `style.css` contains the visual system and responsive layout.
- `app.js` contains the lessons, practice simulations, navigation, search, and interactions.

## References

- [Ubuntu Server: install Nginx](https://ubuntu.com/server/docs/how-to-install-nginx/)
- [Ubuntu Server: configure Nginx](https://ubuntu.com/server/docs/how-to/web-services/configure-nginx/)
- [Nginx Beginner’s Guide](https://nginx.org/en/docs/beginners_guide.html)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security/all-labs)
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/)
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)

Use active testing only on systems explicitly permitted by the relevant rules or by written authorization.
