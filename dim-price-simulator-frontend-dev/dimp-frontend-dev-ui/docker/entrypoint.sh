#!/bin/sh

# Default backend URL if not provided
BACKEND_URL=${BACKEND_URL:-${VITE_API_BASE_URL}}
INTERVIEW_AGENT_URL=${INTERVIEW_AGENT_URL:-${VITE_INTERVIEW_AGENT_URL:-http://localhost:8001}}

echo "Starting nginx with BACKEND_URL=${BACKEND_URL}"
echo "Interview Agent URL: ${INTERVIEW_AGENT_URL}"

# Replace placeholders safely
sed -i "s|__BACKEND_URL__|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf
sed -i "s|__INTERVIEW_AGENT_URL__|${INTERVIEW_AGENT_URL}|g" /etc/nginx/conf.d/default.conf

# Debug: print final config (very useful)
echo "----- Final Nginx Config -----"
cat /etc/nginx/conf.d/default.conf
echo "--------------------------------"

# Start nginx
exec nginx -g 'daemon off;'
