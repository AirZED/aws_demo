#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# EC2 Setup Script — Amazon Ubuntu 2023
# Run this ONCE after SSH-ing into your fresh EC2 instance:
#   chmod +x ec2-setup.sh && ./ec2-setup.sh
# ─────────────────────────────────────────────────────────────────

set -e

echo "Updating system packages..."
sudo apt update -y && sudo apt upgrade -y

echo "Installing Git..."
sudo apt install -y git

echo "Installing Docker..."
sudo apt install -y docker.io

echo "Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

echo "Adding ubuntu user to docker group..."
sudo usermod -aG docker ubuntu

echo "Docker installed:"
docker --version


echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup complete! Log out and back in, then run:"
echo ""
echo "  git clone https://github.com/AirZED/aws_demo.git"
echo "  cd todo-api"
echo "  docker build -t todo-api ."
echo "  docker run -d -p 80:8080 --name todo-api todo-api"
echo "  docker logs todo-api"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
