# -----------------------------------------
# Build Stage
# -----------------------------------------
FROM art.pmideep.com/dockerhub/node:20-alpine AS build

WORKDIR /app

ENV VITE_API_BASE_URL=https://dimp-dev.dimp-dev.aws.private-pmideep.biz
ENV BACKEND_URL=https://dimp-dev.dimp-dev.aws.private-pmideep.biz
ENV VITE_ONBOARDING_API_URL=https://dimp-dev.dimp-dev.aws.private-pmideep.biz
ENV VITE_INTERVIEW_AGENT_URL=https://dimp-dev.dimp-dev.aws.private-pmideep.biz

COPY dimp-frontend-dev-ui/package*.json ./

# Configure npm for private registry (Artifactory)
ARG ARTIFACTORY_PASSWORD
ARG ARTIFACTORY_EMAIL

RUN if [ -n "$ARTIFACTORY_EMAIL" ] && [ -n "$ARTIFACTORY_PASSWORD" ]; then \
      PW_B64=$(printf "%s" "$ARTIFACTORY_PASSWORD" | base64 -w 0); \
      echo "registry=https://art.pmideep.com/artifactory/api/npm/pmi-npm-artifacts/" > .npmrc && \
      echo "//art.pmideep.com/artifactory/api/npm/pmi-npm-artifacts/:username=$ARTIFACTORY_EMAIL" >> .npmrc && \
      echo "//art.pmideep.com/artifactory/api/npm/pmi-npm-artifacts/:_password=$PW_B64" >> .npmrc && \
      echo "always-auth=true" >> .npmrc && \
      echo "strict-ssl=true" >> .npmrc; \
    fi \
    && npm ci --legacy-peer-deps --no-audit --no-fund \
    && rm -f .npmrc

COPY dimp-frontend-dev-ui/. .

RUN npm run build

# -----------------------------------------
# Production Stage (Nginx)
# -----------------------------------------
FROM art.pmideep.com/dockerhub/nginx:alpine AS production

# Copy custom Nginx config
COPY dimp-frontend-dev-ui/docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY dimp-frontend-dev-ui/docker/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod -R 755 /usr/share/nginx/html && chown -R nginx:nginx /usr/share/nginx/html

COPY dimp-frontend-dev-ui/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 6000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:6000/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
