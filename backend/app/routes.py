from flask import Blueprint, jsonify, request
from database.db import (
    get_all_data, 
    get_filtered_data, 
    get_distinct_values,
    get_base_metrics,
    calculate_base_metrics
)
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
    
    try:
        if filters:
            data = get_filtered_data(filters)
        else:
            data = get_all_data()
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error fetching data: {str(e)}")
        return jsonify({"error": "Failed to fetch data"}), 500

@api.route('/filters', methods=['GET'])
def get_filters():
    try:
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
    except Exception as e:
        logger.error(f"Error fetching filters: {str(e)}")
        return jsonify({"error": "Failed to fetch filters"}), 500

@api.route('/metrics', methods=['GET'])
def get_metrics():
    try:
        # Always get the base metrics first for total records
        base_metrics = get_base_metrics()
        if not base_metrics:
            # Fallback: calculate base metrics if cache is empty
            data = get_all_data()
            base_metrics = calculate_base_metrics(data)
        
        # Check if there are any filters applied
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
        
        if not filters:
            # Return base metrics if no filters are applied
            return jsonify(base_metrics)
        else:
            # Get filtered data and calculate averages
            filtered_data = get_filtered_data(filters)
            filtered_count = len(filtered_data)
            
            if filtered_count == 0:
                # Return zero averages if no data matches the filters
                return jsonify({
                    'total_records': base_metrics['total_records'],  # Keep total records from base
                    'avg_intensity': 0,
                    'avg_likelihood': 0,
                    'avg_relevance': 0
                })
            
            # Helper function to safely convert values to float
            def safe_float(value):
                try:
                    return float(value) if value not in [None, '', 'null'] else 0.0
                except (ValueError, TypeError):
                    return 0.0
            
            # Calculate averages for filtered data only
            intensity_values = [safe_float(d.get('intensity')) for d in filtered_data]
            likelihood_values = [safe_float(d.get('likelihood')) for d in filtered_data]
            relevance_values = [safe_float(d.get('relevance')) for d in filtered_data]
            
            filtered_metrics = {
                'total_records': base_metrics['total_records'],  # Keep total records from base
                'avg_intensity': round(sum(intensity_values) / filtered_count, 2),
                'avg_likelihood': round(sum(likelihood_values) / filtered_count, 2),
                'avg_relevance': round(sum(relevance_values) / filtered_count, 2)
            }
            
            return jsonify(filtered_metrics)
            
    except Exception as e:
        logger.error(f"Error calculating metrics: {str(e)}")
        return jsonify({"error": "Failed to calculate metrics"}), 500 