#!/bin/bash

# Navigate to the root directory of your Node.js project
cd "$(dirname "$0")"

# Check if API_SERVER_URL is set in the environment
if [ -z "$API_SERVER_URL" ]; then
  echo "Error: API_SERVER_URL is not set in the environment."
  exit 1
fi

# Check if INFRA_TOKEN is set in the environment
if [ -z "$INFRA_TOKEN" ]; then
  echo "Error: INFRA_TOKEN is not set in the environment."
  exit 1
fi

# Create or overwrite the .env file
cat <<EOL > .env
# Environment variables
API_SERVER_URL=$API_SERVER_URL
INFRA_TOKEN=$INFRA_TOKEN
EOL

echo ".env file has been created with the environment variables."

# Run npm start
echo "Running npm run start..."
npm run dev
