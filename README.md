# Shopping List Application

A full-stack shopping list management application with Node.js Express backend, MongoDB database, and a modern web client served via Nginx. Users can register, login, create multiple shopping lists, and manage products within those lists.

## Features

- User registration and authentication (JWT)
- MongoDB database in Docker (custom port 27018)
- Mongo Express for database management
- Nginx reverse proxy serving the client and proxying API requests
- Docker Compose setup for easy deployment
- Create multiple shopping lists per user
- Add products to lists with optional images
- Update and delete products
- Delete entire shopping lists
- Image upload support for products

## Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- npm or yarn

## Installation

### Using Docker Compose (Recommended)

1. Clone the repository and navigate to the project directory

2. Create a `.env` file from the example:

```bash
cp server/env_example.txt .env
```

3. Update the `.env` file with your configuration (especially JWT_SECRET)

4. Start all services with Docker Compose:

```bash
docker-compose up --build
```

This will start:
- **Nginx** (port 80) - serves the client and proxies API requests
- **API Server** (port 3000) - Node.js Express backend
- **MongoDB** (port 27018) - database
- **Mongo Express** (port 8081) - database management UI

5. Access the application:
   - **Client**: http://localhost (port 80)
   - **API**: http://localhost/api (proxied through nginx)
   - **Mongo Express**: http://localhost:8081

### Development Mode (Local)

1. Install dependencies:

```bash
cd server
npm install
```

2. Create a `.env` file from the example:

```bash
cp env_example.txt .env
```

3. Start MongoDB and Mongo Express with Docker Compose:

```bash
docker-compose up -d mongodb mongo-express
```

4. Start the Express server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

**Note:** In development mode, the server also serves the client files from the `../client` directory.

## Environment Variables

The `.env` file contains the following variables:

- `PORT` - Server port (default: 3000)
- `MONGO_URI` - MongoDB connection string
- `MONGO_ROOT_USERNAME` - MongoDB root username
- `MONGO_ROOT_PASSWORD` - MongoDB root password
- `MONGO_EXPRESS_USERNAME` - Mongo Express username
- `MONGO_EXPRESS_PASSWORD` - Mongo Express password
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT token expiration time
- `UPLOAD_PATH` - Directory for uploaded images
- `MAX_FILE_SIZE` - Maximum file size for uploads (in bytes)

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Shopping Lists

- `GET /api/shopping-lists` - Get all shopping lists (protected)
- `GET /api/shopping-lists/:id` - Get single shopping list (protected)
- `POST /api/shopping-lists` - Create new shopping list (protected)
- `DELETE /api/shopping-lists/:id` - Delete shopping list (protected)

### Products

- `POST /api/shopping-lists/:listId/products` - Add product to list (protected)
- `PUT /api/shopping-lists/:listId/products/:productId` - Update product (protected)
- `DELETE /api/shopping-lists/:listId/products/:productId` - Delete product (protected)

## Testing

Use the `request.rest` file with REST Client extension in VS Code, or import it into Postman/Insomnia.

1. First, register a user or login to get a JWT token
2. Copy the token and replace `{{token}}` in the request.rest file
3. Use the list and product IDs from responses to test other endpoints

## Architecture

The application uses a microservices architecture with Docker Compose:

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ http://localhost (port 80)
       │
┌──────▼──────────────────┐
│   nginx Container        │
│   - Serves client files  │
│   - Proxies /api → api   │
└──────┬───────────────────┘
       │ http://api:3000 (internal)
       │
┌──────▼──────────────┐
│   api Container     │
│   Node.js/Express   │
└──────┬──────────────┘
       │ mongodb://mongodb:27017
       │
┌──────▼──────────────┐
│  mongodb Container  │
└─────────────────────┘
```

All containers are connected via the `shopping-list-network` Docker network, allowing them to communicate using service names.

## Service Access

- **Client Application**: http://localhost (port 80) - served by Nginx
- **API Endpoints**: http://localhost/api/* - proxied through Nginx to the API service
- **MongoDB**: `localhost:27018` (custom port to avoid conflict with local MongoDB)
- **Mongo Express**: http://localhost:8081 (web interface for viewing data)

## Project Structure

```
.
├── client/                   # Frontend client application
│   ├── css/
│   │   └── style.css        # Styles
│   ├── js/
│   │   ├── api.js           # API client (uses /api relative path)
│   │   ├── app.js           # Main application logic
│   │   ├── auth.js          # Authentication logic
│   │   └── calendar.js      # Calendar functionality
│   ├── index.html           # Main HTML file
│   ├── Dockerfile           # Nginx Docker image
│   └── nginx.conf           # Nginx configuration
├── server/                   # Backend API server
│   ├── config/
│   │   └── database.js      # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   └── shoppingListController.js  # Shopping list logic
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication middleware
│   │   └── upload.js        # File upload middleware
│   ├── models/
│   │   ├── User.js          # User model
│   │   └── ShoppingList.js  # Shopping list model
│   ├── routes/
│   │   ├── authRoutes.js    # Authentication routes
│   │   └── shoppingListRoutes.js # Shopping list routes
│   ├── uploads/             # Uploaded images (created automatically)
│   ├── Dockerfile           # Node.js Docker image
│   ├── env_example.txt      # Environment variables template
│   ├── package.json         # Dependencies
│   ├── request.rest         # API testing file
│   └── server.js            # Main server file
├── docker-compose.yml        # Docker Compose configuration
└── README.md                 # This file
```

## Docker Services

The `docker-compose.yml` file defines the following services:

- **nginx**: Serves the client application and acts as a reverse proxy for API requests
  - Port: 80
  - Build: `./client` (uses `client/Dockerfile`)
  - Network: `shopping-list-network`

- **api**: Node.js Express backend server
  - Port: 3000 (internal, proxied through nginx)
  - Build: `./server` (uses `server/Dockerfile`)
  - Network: `shopping-list-network`

- **mongodb**: MongoDB database
  - Port: 27018 (host) → 27017 (container)
  - Network: `shopping-list-network`

- **mongo-express**: Web-based MongoDB admin interface
  - Port: 8081
  - Network: `shopping-list-network`

## Notes

- The MongoDB container uses port 27018 on the host to avoid conflicts with a local MongoDB installation
- Images are stored in the `server/uploads/` directory (mounted as volume)
- JWT tokens are used for authentication
- All shopping list and product routes require authentication
- The client uses relative API paths (`/api`) which are proxied by Nginx to the API service
- All services communicate via Docker's internal network using service names (e.g., `api:3000`, `mongodb:27017`)
