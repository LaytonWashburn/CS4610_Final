#!/bin/bash

# Function to install node modules in a container
install_node_modules() {
  container_name=$1
  echo "Installing node modules in container: $container_name"
  docker-compose -f ./docker-compose.dev.yml exec $container_name yarn install
}

# Get the list of services from the docker-compose file
services=$(docker-compose -f ./docker-compose.dev.yml config --services)

# Loop through each service and install node modules
for service in $services; do
  install_node_modules $service
done

echo "Node modules installation complete for all containers."