#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# EC2 Setup Script — Amazon Linux 2023
# Run this ONCE after SSH-ing into your fresh EC2 instance:
#   chmod +x ec2-setup.sh && ./ec2-setup.sh
# ─────────────────────────────────────────────────────────────────

set -e  # Exit immediately if any command fails

echo "🔧 Updating system packages..."
sudo dnf update -y

echo "🐙 Installing Git..."
sudo dnf install -y git

echo "🐳 Installing Docker..."
sudo dnf install -y docker

echo "▶️  Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker  # Auto-start on reboot

echo "👤 Adding ec2-user to docker group (no sudo needed)..."
sudo usermod -aG docker ec2-user

echo "✅ Docker installed:"
docker --version

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup complete! Log out and back in, then run:"
echo ""
echo "  git clone https://github.com/YOUR_USERNAME/todo-api.git"
echo "  cd todo-api"
echo "  docker build -t todo-api ."
echo "  docker run -d -p 80:8080 --name todo-api todo-api"
echo "  docker logs todo-api"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
