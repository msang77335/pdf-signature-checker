# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production && npm install typescript

# Copy all source code
COPY . .

# Build Next.js app
RUN npm run build

# Expose default Next.js port
EXPOSE 3000

# Start Next.js app
CMD ["npm", "start"]
