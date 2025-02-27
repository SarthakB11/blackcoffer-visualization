from flask import Blueprint, jsonify, request
from database.db import get_all_data, get_filtered_data, get_distinct_values
import logging

logger = logging.getLogger(__name__)
api = Blueprint('api', __name__)

@api.route('/data', methods=['GET'])
def get_data():
    filters = {
        'end_year': request.args.get('end_year'),
        'topic': request.args.get('topic'),
        'sector': request.args.get('sector'),
        'region': request.args.get('region'),
        'pest': request.args.get('pest'),
        'source': request.args.get('source'),
        'country': request.args.get('country'),
        'city': request.args.get('city')
    }
    
    # Remove None values from filters
    filters = {k: v for k, v in filters.items() if v is not None}
    
    if filters:
        data = get_filtered_data(filters)
    else:
        data = get_all_data()
    
    return jsonify(data)

@api.route('/filters', methods=['GET'])
def get_filters():
    filters = {
        'end_years': get_distinct_values('end_year'),
        'topics': get_distinct_values('topic'),
        'sectors': get_distinct_values('sector'),
        'regions': get_distinct_values('region'),
        'pests': get_distinct_values('pestle'),
        'sources': get_distinct_values('source'),
        'countries': get_distinct_values('country'),
        'cities': get_distinct_values('city')
    }
    return jsonify(filters)

@api.route('/metrics', methods=['GET'])
def get_metrics():
    data = get_all_data()
    
    # Calculate average intensity, likelihood, and relevance
    total_records = len(data)
    avg_intensity = sum(d.get('intensity', 0) for d in data) / total_records if total_records > 0 else 0
    avg_likelihood = sum(d.get('likelihood', 0) for d in data) / total_records if total_records > 0 else 0
    avg_relevance = sum(d.get('relevance', 0) for d in data) / total_records if total_records > 0 else 0
    
    metrics = {
        'total_records': total_records,
        'avg_intensity': round(avg_intensity, 2),
        'avg_likelihood': round(avg_likelihood, 2),
        'avg_relevance': round(avg_relevance, 2)
    }
    
    return jsonify(metrics) 