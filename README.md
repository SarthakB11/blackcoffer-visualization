# Data Visualization Dashboard

This project is a data visualization dashboard that displays various metrics and insights from the provided JSON data. It uses MongoDB Atlas for the database, Flask for the backend API, and React with Chart.js for the frontend visualization.

## Prerequisites

- Python 3.7+
- Node.js 14+
- MongoDB Atlas account

## Setup

1. Clone the repository

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (the free tier is sufficient)
3. In the Security section:
   - Create a database user with read/write permissions
   - Add your IP address to the IP Access List
4. Click "Connect" on your cluster and select "Connect your application"
5. Copy the connection string
6. Create a `.env` file in the backend directory and add:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string_here
   ```
   Replace `your_mongodb_atlas_connection_string_here` with your actual connection string

### Backend Setup

1. Create a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Flask backend:
```bash
cd backend
python run.py
```

The backend will run on http://localhost:5000

### Frontend Setup

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Start the React development server:
```bash
npm start
```

The frontend will run on http://localhost:3000

## Features

- Interactive data visualization with Chart.js
- Multiple chart types (Line, Bar, Pie)
- Filtering capabilities:
  - End Year
  - Topics
  - Sector
  - Region
  - PEST
  - Source
  - SWOT
  - Country
  - City
- Real-time data updates
- Responsive design
- Cloud-hosted database with MongoDB Atlas

## API Endpoints

- GET `/api/data` - Get all visualization data
- GET `/api/filters` - Get all available filter options
- GET `/api/metrics` - Get aggregated metrics

## Technologies Used

- Backend:
  - Flask
  - MongoDB Atlas
  - Python
- Frontend:
  - React
  - TypeScript
  - Material-UI
  - Chart.js
  - Axios 