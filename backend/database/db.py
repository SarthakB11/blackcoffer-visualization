from pymongo import MongoClient
import json
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def clean_data(data):
    """Clean the data before inserting into MongoDB"""
    for item in data:
        # Convert empty strings to None for numeric fields
        for field in ['intensity', 'likelihood', 'relevance', 'year']:
            if field in item and (item[field] == '' or item[field] is None):
                item[field] = 0
        
        # Ensure string fields are not None
        for field in ['sector', 'topic', 'region', 'country', 'city']:
            if field in item and (item[field] is None or item[field] == ''):
                item[field] = 'Unknown'
    return data

def init_db():
    try:
        # Get MongoDB Atlas connection string from environment variable
        mongodb_uri = os.getenv('MONGODB_URI')
        if not mongodb_uri:
            raise ValueError("MongoDB Atlas connection string not found in environment variables")

        client = MongoClient(mongodb_uri)
        db = client['visualization_db']
        collection = db['data']
        
        # Test connection
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB Atlas")
        
        # Check if collection is empty
        if collection.count_documents({}) == 0:
            logger.info("Collection is empty, loading data from JSON file")
            try:
                # Get the absolute path to jsondata.json
                current_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                json_path = os.path.join(current_dir, 'jsondata.json')
                logger.info(f"Looking for JSON file at: {json_path}")
                
                # Load and clean data from JSON file
                with open(json_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                    cleaned_data = clean_data(data)
                    collection.insert_many(cleaned_data)
                logger.info("Successfully loaded data into MongoDB Atlas")
            except Exception as e:
                logger.error(f"Error loading data: {str(e)}")
                raise
        
        return db
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise

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