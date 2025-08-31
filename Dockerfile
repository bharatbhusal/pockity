# Use official Node.js 18 image as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Install OpenSSL
RUN apk update && apk add openssl

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install all the dependencies defined in package.json
RUN npm install

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Expose the port that your server will run on (e.g., 8080)
EXPOSE 8080

# Command to run the bot
CMD ["npm", "start"]