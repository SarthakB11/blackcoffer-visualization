# Data Visualization Dashboard

A full-stack data visualization dashboard built with Flask (Backend) and React (Frontend), featuring interactive charts and filtering capabilities.

Frontend deployed at https://sarthakb11.github.io/blackcoffer-visualization/

Backend has to be deployed at Railway/Render etc. [To be done]

## Features

- Interactive data visualization using Chart.js
- Real-time filtering capabilities
- MongoDB integration for data storage
- RESTful API endpoints
- Responsive Material-UI design

## Tech Stack

### Backend
- Flask
- MongoDB
- Python 3.12
- pymongo

### Frontend
- React
- TypeScript
- Material-UI
- Chart.js
- react-chartjs-2

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── database/
│   │   └── db.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
   ```bash
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the backend directory with your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```

4. Run the Flask server:
   ```bash
   python run.py
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /api/data`: Get all or filtered data
- `GET /api/filters`: Get available filter options
- `GET /api/metrics`: Get data metrics (total records, averages)

## Features

1. **Data Visualization**
   - Bar charts for sector analysis
   - Pie charts for regional distribution
   - Line charts for time trends

2. **Filtering Capabilities**
   - End Year
   - Topic
   - Sector
   - Region
   - PEST
   - Source
   - Country
   - City

3. **Metrics Display**
   - Total Records
   - Average Intensity
   - Average Likelihood
   - Average Relevance

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request 
