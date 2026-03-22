#!/usr/bin/env bash
# Apply SSH access relaxation to all CloudDX VMs at once.
# - Allow SSH from 192.168.0.0/24 in UFW
# - Relax fail2ban sshd jail to reduce lockout risk
#
# Prereq:
# - SSH key access to each VM
# - Remote user can run sudo without password (or configure beforehand)
#
# Usage:
#   bash scripts/relax-ssh-security-all.sh
#   SSH_USER=clouddx SSH_KEY=~/.ssh/id_claude_auto bash scripts/relax-ssh-security-all.sh

set -euo pipefail

SSH_USER="${SSH_USER:-clouddx}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_claude_auto}"
SSH_OPTS=(
  -i "$SSH_KEY"
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=accept-new
  -o ConnectTimeout=8
  -o BatchMode=yes
)

NODES=(
  "192.168.0.220" # cp-1
  "192.168.0.221" # cp-2
  "192.168.0.222" # cp-3
  "192.168.0.223" # worker1
  "192.168.0.224" # worker2
  "192.168.0.225" # worker3
  "192.168.0.230" # monitoring
  "192.168.0.231" # mongodb
)

if [[ ! -f "$SSH_KEY" ]]; then
  echo "[ERROR] SSH key not found: $SSH_KEY"
  exit 1
fi

fail_count=0

for host in "${NODES[@]}"; do
  echo ""
  echo "=== [$host] applying ==="

  if ! ssh "${SSH_OPTS[@]}" "${SSH_USER}@${host}" 'bash -s' <<'REMOTE'
set -euo pipefail

if ! sudo -n true 2>/dev/null; then
  echo "[ERROR] sudo requires password on this host. Configure sudo first."
  exit 12
fi

sudo ufw allow from 192.168.0.0/24 to any port 22 proto tcp >/dev/null
sudo ufw reload >/dev/null

sudo tee /etc/fail2ban/jail.local > /dev/null <<'EOF'
[DEFAULT]
bantime           = 10m
findtime          = 10m
maxretry          = 10
ignoreip          = 127.0.0.1/8 ::1 192.168.0.0/24
backend           = systemd
bantime.increment = true
bantime.rndtime   = 2m
bantime.maxtime   = 1h

[sshd]
enabled  = true
port     = ssh
logpath  = /var/log/auth.log
maxretry = 10
bantime  = 10m
EOF

sudo systemctl restart fail2ban

# Best-effort unban for local segment if previously blocked.
for ip in 192.168.0.3 192.168.0.13 192.168.0.14 192.168.0.28 192.168.0.98; do
  sudo fail2ban-client set sshd unbanip "$ip" >/dev/null 2>&1 || true
done

echo "[OK] $(hostname)"
sudo fail2ban-client status sshd | sed -n '1,12p'
sudo ufw status | sed -n '1,8p'
REMOTE
  then
    echo "[FAIL] $host"
    fail_count=$((fail_count + 1))
  else
    echo "[DONE] $host"
  fi
done

echo ""
echo "=== Summary ==="
if [[ "$fail_count" -eq 0 ]]; then
  echo "All hosts updated successfully."
else
  echo "Failed hosts: $fail_count"
  exit 2
fi

