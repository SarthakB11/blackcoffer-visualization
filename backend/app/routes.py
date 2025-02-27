from flask import Blueprint, jsonify
from database.db import get_collection
import logging

logger = logging.getLogger(__name__)
main = Blueprint('main', __name__)

@main.route('/api/data', methods=['GET'])
def get_all_data():
    try:
        collection = get_collection()
        data = list(collection.find({}, {'_id': 0}))
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error fetching data: {str(e)}")
        return jsonify({"error": "Failed to fetch data"}), 500

@main.route('/api/filters', methods=['GET'])
def get_filters():
    try:
        collection = get_collection()
        
        # Get unique values for each filter
        filters = {
            'end_year': sorted(list(set(str(d['end_year']) for d in collection.find({}, {'end_year': 1}) if d['end_year']))),
            'topics': sorted(list(set(d['topic'] for d in collection.find({}, {'topic': 1}) if d.get('topic')))),
            'sector': sorted(list(set(d['sector'] for d in collection.find({}, {'sector': 1}) if d.get('sector')))),
            'region': sorted(list(set(d['region'] for d in collection.find({}, {'region': 1}) if d.get('region')))),
            'pestle': sorted(list(set(d['pestle'] for d in collection.find({}, {'pestle': 1}) if d.get('pestle')))),
            'source': sorted(list(set(d['source'] for d in collection.find({}, {'source': 1}) if d.get('source')))),
            'country': sorted(list(set(d['country'] for d in collection.find({}, {'country': 1}) if d.get('country')))),
            'city': sorted(list(set(d['city'] for d in collection.find({}, {'city': 1}) if d.get('city'))))
        }
        
        return jsonify(filters)
    except Exception as e:
        logger.error(f"Error fetching filters: {str(e)}")
        return jsonify({"error": "Failed to fetch filters"}), 500

@main.route('/api/metrics', methods=['GET'])
def get_metrics():
    try:
        collection = get_collection()
        
        # Calculate average metrics with error handling
        metrics = {
            'intensity': collection.aggregate([
                {'$match': {'intensity': {'$type': 'number'}}},
                {'$group': {'_id': None, 'avg': {'$avg': '$intensity'}}}
            ]).next()['avg'],
            'likelihood': collection.aggregate([
                {'$match': {'likelihood': {'$type': 'number'}}},
                {'$group': {'_id': None, 'avg': {'$avg': '$likelihood'}}}
            ]).next()['avg'],
            'relevance': collection.aggregate([
                {'$match': {'relevance': {'$type': 'number'}}},
                {'$group': {'_id': None, 'avg': {'$avg': '$relevance'}}}
            ]).next()['avg']
        }
        
        return jsonify(metrics)
    except Exception as e:
        logger.error(f"Error calculating metrics: {str(e)}")
        return jsonify({"error": "Failed to calculate metrics"}), 500 