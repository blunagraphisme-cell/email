# EmailOqui — Guide de déploiement production sur VPS

## Prérequis

- VPS Ubuntu 22.04+ ou Debian 12+ avec accès root/sudo
- Node.js 20+ et Bun installés
- Un nom de domaine pointant vers le VPS (ex: `email.oquitogo.online`)
- Ports 80 et 443 ouverts

## 1. Installation des dépendances système

```bash
# Mise à jour
sudo apt update && sudo apt upgrade -y

# Node.js 20+ (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Caddy (reverse proxy + SSL automatique)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# Git
sudo apt install -y git
```

## 2. Cloner le projet

```bash
sudo mkdir -p /opt/emailoqui
sudo chown $USER:$USER /opt/emailoqui
cd /opt/emailoqui
git clone https://github.com/blunagraphisme-cell/email.git .
```

## 3. Installer les dépendances

```bash
cd /opt/emailoqui
bun install
```

## 4. Configuration .env

```bash
cp .env.production .env
nano .env
```

Remplissez les valeurs :
- `DATABASE_URL` → chemin vers le fichier SQLite (ex: `file:/opt/emailoqui/db/custom.db`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` → depuis Google Cloud Console
- `RESEND_API_KEY` → depuis Resend dashboard
- Les autres valeurs sont pré-configurées

## 5. Initialiser la base de données

```bash
# Créer le dossier db
mkdir -p db

# Pousser le schéma Prisma
bun run db:push

# Générer le client Prisma
bun run db:generate

# Initialiser les plans + l'admin
curl -X POST http://localhost:3000/api/seed/init
```

## 6. Build de production

```bash
bun run build
```

Cela crée un serveur standalone dans `.next/standalone/`.

## 7. Configurer Caddy (reverse proxy + SSL)

```bash
sudo cp /opt/emailoqui/Caddyfile.prod /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile
# Vérifiez que le domaine est bien email.oquitogo.online
sudo systemctl restart caddy
```

Caddy obtient automatiquement un certificat SSL Let's Encrypt.

## 8. Configurer le service systemd

```bash
sudo cp /opt/emailoqui/emailoqui.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable emailoqui
sudo systemctl start emailoqui

# Vérifier le statut
sudo systemctl status emailoqui

# Voir les logs
sudo journalctl -u emailoqui -f
```

## 9. Vérification

```bash
# L'app tourne sur localhost:3000
curl http://localhost:3000/

# Le domaine répond en HTTPS
curl https://email.oquitogo.online/
```

## Maintenance

### Mettre à jour le code
```bash
cd /opt/emailoqui
git pull
bun install
bun run db:push
bun run build
sudo systemctl restart emailoqui
```

### Script automatisé
```bash
cd /opt/emailoqui
sudo ./deploy.sh
```

### Voir les logs
```bash
# Logs de l'app
sudo journalctl -u emailoqui -f

# Logs Caddy
sudo journalctl -u caddy -f
```

### Sauvegarde de la base de données
```bash
# Sauvegarde manuelle
cp /opt/emailoqui/db/custom.db /opt/emailoqui/db/backup-$(date +%Y%m%d).db

# Sauvegarde automatique (crontab)
# 0 3 * * * cp /opt/emailoqui/db/custom.db /opt/emailoqui/db/backup-$(date +\%Y\%m\%d).db
```

## Dépannage

| Problème | Solution |
|---|---|
| L'app ne démarre pas | `sudo journalctl -u emailoqui -n 50` |
| SSL ne fonctionne pas | Vérifier que les ports 80/443 sont ouverts + le DNS pointe vers le VPS |
| Erreur Prisma | `bun run db:push` + `bun run db:generate` + restart |
| Google OAuth redirect mismatch | Vérifier les URIs autorisées dans Google Cloud Console |
| E-mails non envoyés | Vérifier le domaine dans Resend dashboard (SPF/DKIM/DMARC) |
