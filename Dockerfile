# Utiliser l'image officielle Node.js basée sur Alpine Linux (plus légère)
FROM node:18-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json (si disponible)
COPY package*.json ./

# Installer les dépendances
RUN npm install --production && npm cache clean --force

# Copier le reste des fichiers de l'application
COPY . .

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Changer la propriété des fichiers vers l'utilisateur appuser
RUN chown -R appuser:appgroup /app
USER appuser

# Exposer le port sur lequel l'application s'exécute
EXPOSE 3000

# Définir les variables d'environnement
ENV NODE_ENV=production

# Commande pour démarrer l'application
CMD ["node", "server.js"]