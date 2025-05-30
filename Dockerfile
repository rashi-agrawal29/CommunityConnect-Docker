# Use a stable Node image
FROM node:18

# Set environment variable for Docker networking
ENV MONGODB_URI=mongodb://host.docker.internal:27017/CTB

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install deps inside Docker
COPY package*.json ./
RUN npm install

# Copy everything else (ignores node_modules because of .dockerignore)
COPY . .

# Expose app port
EXPOSE 3000

# Start app
CMD ["node", "server.js"]
