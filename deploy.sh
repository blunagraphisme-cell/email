#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# EmailOqui — Script de déploiement production
# Usage: sudo ./deploy.sh
# ============================================================

APP_DIR="/opt/emailoqui"
SERVICE_NAME="emailoqui"
BRANCH="main"

echo "========================================"
echo " EmailOqui — Déploiement production"
echo "========================================"
echo ""

# 1. Aller dans le dossier de l'app
cd "$APP_DIR" || { echo "❌ Dossier $APP_DIR introuvable"; exit 1; }

# 2. Pull le dernier code
echo "📥 Récupération du code depuis GitHub ($BRANCH)..."
sudo -u $SUDO_USER git fetch origin $BRANCH
sudo -u $SUDO_USER git reset --hard origin/$BRANCH
echo "✅ Code à jour"
echo ""

# 3. Installer les dépendances
echo "📦 Installation des dépendances..."
sudo -u $SUDO_USER bun install --frozen-lockfile
echo "✅ Dépendances installées"
echo ""

# 4. Push du schéma de base de données
echo "🗄️ Synchronisation du schéma de base de données..."
sudo -u $SUDO_USER bun run db:push
sudo -u $SUDO_USER bun run db:generate
echo "✅ Base de données à jour"
echo ""

# 5. Build de production
echo "🔨 Build de production..."
sudo -u $SUDO_USER bun run build
echo "✅ Build terminé"
echo ""

# 6. Copier les assets statiques dans standalone
echo "📂 Copie des assets..."
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
echo "✅ Assets copiés"
echo ""

# 7. Initialiser les plans + admin (idempotent)
echo "🔑 Initialisation des plans + admin..."
curl -s -X POST http://localhost:3000/api/seed/init || true
echo ""

# 8. Redémarrer le service
echo "🔄 Redémarrage du service..."
systemctl restart $SERVICE_NAME
sleep 2

# 9. Vérifier que l'app tourne
echo "🔍 Vérification..."
if systemctl is-active --quiet $SERVICE_NAME; then
  echo "✅ Service $SERVICE_NAME actif"
else
  echo "❌ Service $SERVICE_NAME en échec — vérifiez: journalctl -u $SERVICE_NAME -n 50"
  exit 1
fi

# 10. Test HTTP
echo ""
echo "🌐 Test de l'application..."
sleep 2
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q "200"; then
  echo "✅ Application accessible sur localhost:3000"
else
  echo "⚠️  L'application ne répond pas encore — patientez 10s"
fi

echo ""
echo "========================================"
echo " ✅ Déploiement terminé !"
echo "========================================"
echo ""
echo "📊 Statut du service:  sudo systemctl status $SERVICE_NAME"
echo "📜 Logs en temps réel: sudo journalctl -u $SERVICE_NAME -f"
echo "🌐 URL:               https://email.oquitogo.online"
echo ""
