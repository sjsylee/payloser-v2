#!/bin/sh
set -u

export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

resolve_bin() {
  if command -v "$1" >/dev/null 2>&1; then
    command -v "$1"
  elif [ -x "/usr/local/bin/$1" ]; then
    echo "/usr/local/bin/$1"
  else
    return 1
  fi
}

section() {
  printf "\n== %s ==\n" "$1"
}

CURRENT_USER="${USER:-$(id -un 2>/dev/null || echo deploy-user)}"
DOCKER_BIN="$(resolve_bin docker || true)"
COMPOSE_BIN="$(resolve_bin docker-compose || true)"

section "Payloser NAS Docker access check"
echo "user: $CURRENT_USER"
echo "id: $(id 2>/dev/null || echo unavailable)"

if [ -S /var/run/docker.sock ]; then
  echo "socket: $(ls -l /var/run/docker.sock)"
  SOCKET_GROUP="$(stat -c '%G' /var/run/docker.sock 2>/dev/null || echo unknown)"
  echo "socket group: $SOCKET_GROUP"
else
  echo "socket: /var/run/docker.sock was not found"
fi

if [ -z "$DOCKER_BIN" ]; then
  echo "docker: not found in PATH=$PATH"
  exit 1
fi

echo "docker: $DOCKER_BIN"

if "$DOCKER_BIN" info >/dev/null 2>&1; then
  echo "docker daemon: OK, direct access works without sudo"
else
  section "Action required"
  echo "Docker is installed, but this user cannot access the Docker daemon without sudo."
  echo "Configure the NAS deploy user to read/write the Docker socket, then reconnect SSH."
  echo
  echo "Recommended one-time setup as a DSM admin:"
  echo "  1. Check the Docker socket owner group:"
  echo "     ls -l /var/run/docker.sock"
  echo "  2. Add $CURRENT_USER to that group when it is a DSM group such as administrators:"
  echo "     sudo synogroup --memberadd <socket-group> $CURRENT_USER"
  echo "  3. If the socket group is not suitable, create a dedicated group and bind the socket to it:"
  echo "     sudo synogroup --add payloser-docker"
  echo "     sudo synogroup --memberadd payloser-docker $CURRENT_USER"
  echo "     sudo chgrp payloser-docker /var/run/docker.sock"
  echo "     sudo chmod 660 /var/run/docker.sock"
  echo "  4. Log out and reconnect SSH, then run this check again."
  echo
  echo "Note: Docker socket access is root-equivalent. Use a dedicated deploy account and SSH key."
  exit 1
fi

section "Compose check"
if "$DOCKER_BIN" compose version >/dev/null 2>&1; then
  echo "compose: docker compose plugin OK"
elif [ -n "$COMPOSE_BIN" ] && "$COMPOSE_BIN" version >/dev/null 2>&1; then
  echo "compose: $COMPOSE_BIN OK"
else
  echo "compose: unavailable. Install Docker Compose v2 plugin or legacy docker-compose."
  exit 1
fi

section "Result"
echo "NAS deploy user can run Docker commands without sudo."
