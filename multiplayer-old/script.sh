#!/bin/bash

# Navigate to the root directory of your Node.js project
cd "$(dirname "$0")"

# Check if JWT_SECRET is set in the environment
if [ -z "$JWT_SECRET" ]; then
  echo "Warning: JWT_SECRET is not set. Using default for development."
  JWT_SECRET="your_super_secure_jwt_secret_key_change_this_in_production"
fi

# Create directories if they don't exist
mkdir -p rooms uploads

# Create or overwrite the .env file
cat <<EOL > .env
# JWT Authentication Configuration
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=${PORT:-5959}
NODE_ENV=${NODE_ENV:-production}
EOL

echo ".env file has been created with the environment variables."
echo "JWT_SECRET: ${JWT_SECRET:0:10}..."
echo "PORT: ${PORT:-5959}"

# Run the application
echo "Starting whiteboard backend..."
npm run start
