from pymongo import MongoClient
import json
import os
from dotenv import load_dotenv
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def clean_data(data):
    """Clean the data before inserting into MongoDB"""
    cleaned = []
    for item in data:
        # Convert empty strings and invalid values to 0 for numeric fields
        for field in ['intensity', 'likelihood', 'relevance']:
            try:
                value = item.get(field, '')
                item[field] = float(value) if value not in ['', None, 'null'] else 0.0
            except (ValueError, TypeError):
                item[field] = 0.0
        
        # Clean end_year field
        try:
            end_year = item.get('end_year', '')
            if end_year and end_year != 'null':
                # Try to convert to integer first
                year = int(float(end_year))
                item['end_year'] = str(year)
            else:
                item['end_year'] = 'Unknown'
        except (ValueError, TypeError):
            item['end_year'] = 'Unknown'
        
        # Ensure string fields are not None or empty
        for field in ['sector', 'topic', 'region', 'country', 'city', 'pestle', 'source']:
            value = item.get(field, '')
            item[field] = str(value) if value not in [None, '', 'null'] else 'Unknown'
        
        cleaned.append(item)
    return cleaned

def get_database():
    """Get MongoDB database connection"""
    try:
        MONGODB_URI = os.getenv('MONGODB_URI')
        if not MONGODB_URI:
            raise ValueError("MongoDB Atlas connection string not found in environment variables")
        
        client = MongoClient(MONGODB_URI)
        # Test connection
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB Atlas")
        
        return client['visualization_db']
    except Exception as e:
        logger.error(f"Error connecting to MongoDB Atlas: {str(e)}")
        raise

def calculate_base_metrics(data):
    """Calculate base metrics for the entire dataset"""
    total_records = len(data)
    
    # Helper function to safely convert values to float
    def safe_float(value):
        try:
            return float(value) if value not in [None, '', 'null'] else 0.0
        except (ValueError, TypeError):
            return 0.0
    
    # Calculate metrics with proper type conversion
    intensity_values = [safe_float(d.get('intensity')) for d in data]
    likelihood_values = [safe_float(d.get('likelihood')) for d in data]
    relevance_values = [safe_float(d.get('relevance')) for d in data]
    
    return {
        'total_records': total_records,
        'avg_intensity': round(sum(intensity_values) / total_records, 2) if total_records > 0 else 0,
        'avg_likelihood': round(sum(likelihood_values) / total_records, 2) if total_records > 0 else 0,
        'avg_relevance': round(sum(relevance_values) / total_records, 2) if total_records > 0 else 0
    }

def init_db():
    """Initialize database and load data if needed"""
    try:
        db = get_database()
        collection = db['visualizations']
        metrics_collection = db['base_metrics']
        
        # Check if data already exists
        if collection.count_documents({}) == 0:
            logger.info("No data found in database. Loading from JSON file...")
            
            # Get the absolute path to jsondata.json
            json_path = Path(__file__).parent.parent.parent / 'jsondata.json'
            
            if not json_path.exists():
                raise FileNotFoundError(f"JSON file not found at {json_path}")
            
            # Load and clean data from JSON file
            with open(json_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                cleaned_data = clean_data(data)
                
                # Insert data into MongoDB
                result = collection.insert_many(cleaned_data)
                logger.info(f"Successfully loaded {len(result.inserted_ids)} records into MongoDB Atlas")
                
                # Calculate and store base metrics
                base_metrics = calculate_base_metrics(cleaned_data)
                metrics_collection.delete_many({})  # Clear existing metrics
                metrics_collection.insert_one(base_metrics)
                logger.info("Successfully stored base metrics")
        else:
            logger.info(f"Data already exists in database ({collection.count_documents({})} records)")
            
            # Ensure base metrics exist
            if metrics_collection.count_documents({}) == 0:
                data = list(collection.find({}, {'_id': 0}))
                base_metrics = calculate_base_metrics(data)
                metrics_collection.insert_one(base_metrics)
                logger.info("Successfully stored base metrics")
            
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

def get_all_data():
    """Get all data from database"""
    try:
        db = get_database()
        return list(db.visualizations.find({}, {'_id': 0}))
    except Exception as e:
        logger.error(f"Error fetching data: {str(e)}")
        return []

def get_filtered_data(filters):
    """Get filtered data from database"""
    try:
        db = get_database()
        query = {k: v for k, v in filters.items() if v is not None and v != ''}
        return list(db.visualizations.find(query, {'_id': 0}))
    except Exception as e:
        logger.error(f"Error fetching filtered data: {str(e)}")
        return []

def get_distinct_values(field):
    """Get distinct values for a field"""
    try:
        db = get_database()
        values = db.visualizations.distinct(field)
        # Filter out None and empty values, and sort
        return sorted([str(v) for v in values if v not in [None, '']], key=lambda x: x.lower())
    except Exception as e:
        logger.error(f"Error fetching distinct values: {str(e)}")
        return []

def get_collection():
    try:
        mongodb_uri = os.getenv('MONGODB_URI')
        if not mongodb_uri:
            raise ValueError("MongoDB Atlas connection string not found in environment variables")
            
        client = MongoClient(mongodb_uri)
        db = client['visualization_db']
        
        # Test connection
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB Atlas")
        
        return db['data']
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise

def get_base_metrics():
    """Get the base metrics for the entire dataset"""
    try:
        db = get_database()
        metrics = db['base_metrics'].find_one({}, {'_id': 0})
        return metrics if metrics else {}
    except Exception as e:
        logger.error(f"Error fetching base metrics: {str(e)}")
        return {} 