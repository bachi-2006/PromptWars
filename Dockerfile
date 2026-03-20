# Use the official Nginx image as a base
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY dist /usr/share/nginx/html

# Copy the custom Nginx configuration to route all requests to index.html (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Google Cloud Run requires 8080 by default)
EXPOSE 8080

# Start Nginx when the container has provisioned
CMD ["nginx", "-g", "daemon off;"]
