# Use official Node.js 18 image as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Install OpenSSL (needed for Prisma on Alpine)
RUN apk update && apk add --no-cache openssl

# Copy package.json and package-lock.json first (for caching)
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Generate Prisma client (using your script)
RUN npm run prisma:generate

# Build the app
RUN npm run build

# Expose the port that your server will run on (e.g., 8080)
EXPOSE 8080

# Run migrations on startup, then start the app
CMD npm run prisma:migrate:deploy && npm start