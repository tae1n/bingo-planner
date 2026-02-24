#!/bin/bash
set -euo pipefail

echo "=== Bingo Planner Deploy ==="

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    case "$ID" in
      amzn)
        sudo yum install -y docker
        sudo systemctl enable docker && sudo systemctl start docker
        ;;
      *)
        curl -fsSL https://get.docker.com | sh
        ;;
    esac
  else
    curl -fsSL https://get.docker.com | sh
  fi
  sudo usermod -aG docker "$USER"
  echo "Docker installed. Please log out and back in, then re-run this script."
  exit 1
fi

# Check Docker Compose (v2 plugin)
if ! docker compose version &> /dev/null; then
  echo "Installing Docker Compose plugin..."
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    case "$ID" in
      amzn)
        sudo mkdir -p /usr/local/lib/docker/cli-plugins
        sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
          -o /usr/local/lib/docker/cli-plugins/docker-compose
        sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
        ;;
      *)
        sudo apt-get update && sudo apt-get install -y docker-compose-plugin
        ;;
    esac
  else
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
  fi
fi

# Check .env file
if [ ! -f .env ]; then
  if [ -f .env.production ]; then
    echo "WARNING: .env not found. Copying from .env.production template."
    echo "Please edit .env and replace placeholder values before continuing."
    cp .env.production .env
    exit 1
  else
    echo "ERROR: .env file not found. Create one from .env.production template."
    exit 1
  fi
fi

# Load env
set -a; source .env; set +a

# Validate required vars
for var in DOMAIN DUCKDNS_TOKEN; do
  if [ -z "${!var:-}" ] || [[ "${!var}" == *"<"* ]]; then
    echo "ERROR: $var is not set or still has placeholder value. Edit .env first."
    exit 1
  fi
done

# Update DuckDNS to point to this server's IP
echo "Updating DuckDNS record..."
SUBDOMAIN="${DOMAIN%.duckdns.org}"
RESULT=$(curl -s "https://www.duckdns.org/update?domains=${SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip=")
if [ "$RESULT" != "OK" ]; then
  echo "ERROR: DuckDNS update failed. Check your token and subdomain."
  exit 1
fi
echo "DuckDNS updated: ${DOMAIN} → $(curl -s ifconfig.me)"

# Issue SSL certificate if not already present
if [ ! -d "certbot_conf" ] || ! docker volume inspect bingo-planner_certbot_conf &> /dev/null 2>&1; then
  echo "Issuing SSL certificate for ${DOMAIN}..."

  # Start nginx temporarily for ACME challenge (need a dummy cert first)
  mkdir -p ./nginx/dummy
  openssl req -x509 -nodes -newkey rsa:1024 -days 1 \
    -keyout ./nginx/dummy/privkey.pem -out ./nginx/dummy/fullchain.pem \
    -subj "/CN=localhost" 2>/dev/null

  # Create cert volume with dummy cert so nginx can start
  docker compose up -d nginx
  sleep 2

  # Copy dummy cert into the volume
  docker compose cp ./nginx/dummy/fullchain.pem nginx:/etc/letsencrypt/live/${DOMAIN}/fullchain.pem 2>/dev/null || true
  docker compose cp ./nginx/dummy/privkey.pem nginx:/etc/letsencrypt/live/${DOMAIN}/privkey.pem 2>/dev/null || true

  # Actually, let's do it properly: stop nginx, get cert via standalone, then start everything
  docker compose down

  # Get real certificate
  docker run --rm -p 80:80 \
    -v bingo-planner_certbot_conf:/etc/letsencrypt \
    -v bingo-planner_certbot_www:/var/www/certbot \
    certbot/certbot certonly \
      --standalone \
      --non-interactive \
      --agree-tos \
      --email "admin@${DOMAIN}" \
      --domain "${DOMAIN}" \
      -v

  rm -rf ./nginx/dummy
  echo "SSL certificate issued successfully."
fi

echo "Building and starting all services..."
docker compose up -d --build

echo "Waiting for API to be ready..."
sleep 5

echo "Running Prisma migrations..."
docker compose exec api npx prisma migrate deploy

echo ""
echo "=== Deploy complete ==="
echo "Frontend: https://${DOMAIN}"
echo "Swagger:  https://${DOMAIN}/api/docs"
