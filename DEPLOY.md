# EmailOqui — Guide de déploiement production sur VPS

## ⚠️ Si d'autres apps tournent déjà sur le serveur

Ce guide est conçu pour coexister avec d'autres applications :
- EmailOqui utilise le port **3001** par défaut (changez-le si nécessaire)
- Le bloc Caddy s'**ajoute** à votre Caddyfile existant (ne le remplace pas)
- Le service systemd est nommé `emailoqui` (n'entre pas en conflit)

---

## 1. Prérequis

- VPS Ubuntu 22.04+ ou Debian 12+ avec accès root/sudo
- Node.js 20+, Bun, et Caddy déjà installés (ou installez-les ci-dessous)
- Un nom de domaine `email.oquitogo.online` pointant vers le VPS
- Ports 80 et 443 ouverts

### Si Node.js / Bun / Caddy ne sont pas encore installés

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Caddy (si pas déjà installé)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

---

## 2. Cloner le projet

```bash
sudo mkdir -p /opt/emailoqui
sudo chown $USER:$USER /opt/emailoqui
cd /opt/emailoqui
git clone https://github.com/blunagraphisme-cell/email.git .
bun install
```

## 3. Configurer .env (avec vos vraies clés)

```bash
cd /opt/emailoqui
cp .env.production .env
nano .env
```

Remplissez avec vos valeurs réelles :
```
PORT=3001                          # ← changez si 3001 est déjà pris
DATABASE_URL="file:/opt/emailoqui/db/custom.db"
GOOGLE_CLIENT_ID="VOTRE_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="VOTRE_GOOGLE_CLIENT_SECRET"
APP_URL="https://email.oquitogo.online"
RESEND_API_KEY="VOTRE_RESEND_API_KEY"
RESEND_FROM_EMAIL="newsletter@email.oquitogo.online"
```

## 4. Base de données + Build

```bash
cd /opt/emailoqui
mkdir -p db
bun run db:push
bun run db:generate
bun run build
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
```

## 5. Test rapide (avant systemd)

```bash
cd /opt/emailoqui
PORT=3001 NODE_ENV=production bun .next/standalone/server.js
```

Dans un autre terminal :
```bash
curl http://localhost:3001/    # ← doit répondre 200
```
Puis `Ctrl+C` pour arrêter.

## 6. Service systemd (lancement automatique)

```bash
# Donner les droits à www-data
sudo chown -R www-data:www-data /opt/emailoqui

# Installer le service
sudo cp /opt/emailoqui/emailoqui.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable emailoqui
sudo systemctl start emailoqui

# Vérifier
sudo systemctl status emailoqui
# Logs: sudo journalctl -u emailoqui -f
```

## 7. Caddy — AJOUTER le bloc à votre Caddyfile existant

```bash
# Éditez votre Caddyfile existant
sudo nano /etc/caddy/Caddyfile
```

Ajoutez à la fin du fichier le contenu de `Caddyfile.prod` (le bloc `email.oquitogo.online { ... }`).
**Vérifiez que le port correspond** à celui dans `.env` (défaut 3001).

```bash
# Recharger Caddy
sudo systemctl reload caddy
```

Caddy obtient automatiquement le certificat SSL pour `email.oquitogo.online`.

## 8. Vérification finale

```bash
# L'app tourne
sudo systemctl status emailoqui

# Le domaine répond en HTTPS
curl https://email.oquitogo.online/

# Initialiser les plans + admin
curl -X POST https://email.oquitogo.online/api/seed/init
```

---

## Pour les mises à jour futures

```bash
cd /opt/emailoqui
sudo ./deploy.sh
```

Le script fait : `git pull` → `bun install` → `db:push` → `build` → `restart`.

## Dépannage

| Problème | Solution |
|---|---|
| Port déjà utilisé | Changez `PORT=` dans `.env` + le port dans le bloc Caddy + `sudo systemctl restart emailoqui && sudo systemctl reload caddy` |
| L'app ne démarre pas | `sudo journalctl -u emailoqui -n 50` |
| SSL ne fonctionne pas | Vérifiez DNS + ports 80/443 ouverts |
| Google OAuth redirect mismatch | URI autorisée: `https://email.oquitogo.online/api/auth/google/callback` |
| Conflit avec une autre app | Utilisez un port différent (ex: 3002) dans `.env` + Caddyfile |
