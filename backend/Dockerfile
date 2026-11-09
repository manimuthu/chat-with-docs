# Use Node base image
FROM node:18

# Set work directory
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source
COPY . .

# Build and expose
RUN npm run build
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]
