from flask import Blueprint, jsonify, request
from database.db import (
    get_all_data, 
    get_filtered_data, 
    get_distinct_values,
    get_base_metrics,
    calculate_base_metrics
)
import logging
from collections import defaultdict

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

# New endpoints for D3.js visualizations

@api.route('/timeseries', methods=['GET'])
def get_timeseries_data():
    """
    Get time series data for D3.js visualizations.
    Returns intensity, likelihood, and relevance over time.
    """
    try:
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
        
        # Helper function to safely convert values to float
        def safe_float(value):
            try:
                return float(value) if value not in [None, '', 'null'] else 0.0
            except (ValueError, TypeError):
                return 0.0
        
        # Group data by year
        time_data = defaultdict(lambda: {'intensity': [], 'likelihood': [], 'relevance': []})
        
        for item in data:
            year = item.get('end_year')
            if year and year != 'Unknown':
                time_data[year]['intensity'].append(safe_float(item.get('intensity')))
                time_data[year]['likelihood'].append(safe_float(item.get('likelihood')))
                time_data[year]['relevance'].append(safe_float(item.get('relevance')))
        
        # Calculate averages for each year
        result = []
        for year, values in time_data.items():
            intensity_avg = sum(values['intensity']) / len(values['intensity']) if values['intensity'] else 0
            likelihood_avg = sum(values['likelihood']) / len(values['likelihood']) if values['likelihood'] else 0
            relevance_avg = sum(values['relevance']) / len(values['relevance']) if values['relevance'] else 0
            
            result.append({
                'year': year,
                'intensity': round(intensity_avg, 2),
                'likelihood': round(likelihood_avg, 2),
                'relevance': round(relevance_avg, 2),
                'count': len(values['intensity'])
            })
        
        # Sort by year
        result.sort(key=lambda x: x['year'])
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error fetching time series data: {str(e)}")
        return jsonify({"error": "Failed to fetch time series data"}), 500

@api.route('/network', methods=['GET'])
def get_network_data():
    """
    Get network data for D3.js force-directed graph visualization.
    Returns relationships between topics, sectors, and regions.
    """
    try:
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
        
        # Create nodes and links for network visualization
        nodes = []
        links = []
        
        # Track unique nodes and their indices
        node_map = {}
        node_index = 0
        
        # Track connections between nodes
        connections = defaultdict(int)
        
        for item in data:
            topic = item.get('topic')
            sector = item.get('sector')
            region = item.get('region')
            
            # Skip items with missing data
            if not topic or topic == 'Unknown' or not sector or sector == 'Unknown':
                continue
            
            # Add topic node if not exists
            if topic not in node_map:
                node_map[topic] = node_index
                nodes.append({
                    'id': node_index,
                    'name': topic,
                    'type': 'topic',
                    'value': 1
                })
                node_index += 1
            else:
                # Increment existing node value
                nodes[node_map[topic]]['value'] += 1
            
            # Add sector node if not exists
            if sector not in node_map:
                node_map[sector] = node_index
                nodes.append({
                    'id': node_index,
                    'name': sector,
                    'type': 'sector',
                    'value': 1
                })
                node_index += 1
            else:
                # Increment existing node value
                nodes[node_map[sector]]['value'] += 1
            
            # Add region node if not exists and not Unknown
            if region and region != 'Unknown':
                if region not in node_map:
                    node_map[region] = node_index
                    nodes.append({
                        'id': node_index,
                        'name': region,
                        'type': 'region',
                        'value': 1
                    })
                    node_index += 1
                else:
                    # Increment existing node value
                    nodes[node_map[region]]['value'] += 1
                
                # Create links between topic, sector, and region
                topic_sector_key = f"{node_map[topic]}-{node_map[sector]}"
                connections[topic_sector_key] += 1
                
                sector_region_key = f"{node_map[sector]}-{node_map[region]}"
                connections[sector_region_key] += 1
            else:
                # Create link between topic and sector only
                topic_sector_key = f"{node_map[topic]}-{node_map[sector]}"
                connections[topic_sector_key] += 1
        
        # Create links from connections
        for connection, weight in connections.items():
            source, target = map(int, connection.split('-'))
            links.append({
                'source': source,
                'target': target,
                'value': weight
            })
        
        return jsonify({
            'nodes': nodes,
            'links': links
        })
    
    except Exception as e:
        logger.error(f"Error fetching network data: {str(e)}")
        return jsonify({"error": "Failed to fetch network data"}), 500

@api.route('/geo', methods=['GET'])
def get_geo_data():
    """
    Get geographic data for D3.js map visualizations.
    Returns country-level data for choropleth maps.
    """
    try:
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
        
        # Helper function to safely convert values to float
        def safe_float(value):
            try:
                return float(value) if value not in [None, '', 'null'] else 0.0
            except (ValueError, TypeError):
                return 0.0
        
        # Group data by country
        country_data = defaultdict(lambda: {
            'intensity': [], 
            'likelihood': [], 
            'relevance': [],
            'count': 0
        })
        
        for item in data:
            country = item.get('country')
            if country and country != 'Unknown':
                country_data[country]['intensity'].append(safe_float(item.get('intensity')))
                country_data[country]['likelihood'].append(safe_float(item.get('likelihood')))
                country_data[country]['relevance'].append(safe_float(item.get('relevance')))
                country_data[country]['count'] += 1
        
        # Calculate averages for each country
        result = []
        for country, values in country_data.items():
            intensity_avg = sum(values['intensity']) / len(values['intensity']) if values['intensity'] else 0
            likelihood_avg = sum(values['likelihood']) / len(values['likelihood']) if values['likelihood'] else 0
            relevance_avg = sum(values['relevance']) / len(values['relevance']) if values['relevance'] else 0
            
            result.append({
                'country': country,
                'intensity': round(intensity_avg, 2),
                'likelihood': round(likelihood_avg, 2),
                'relevance': round(relevance_avg, 2),
                'count': values['count']
            })
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error fetching geographic data: {str(e)}")
        return jsonify({"error": "Failed to fetch geographic data"}), 500

@api.route('/topic-distribution', methods=['GET'])
def get_topic_distribution():
    """
    Get topic distribution data for D3.js visualizations.
    Returns hierarchical data for treemap or sunburst charts.
    """
    try:
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
        
        # Create hierarchical structure: sector -> topic -> pestle
        hierarchy = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
        
        for item in data:
            sector = item.get('sector') or 'Unknown'
            topic = item.get('topic') or 'Unknown'
            pestle = item.get('pestle') or 'Unknown'
            
            # Skip items with all unknown values
            if sector == 'Unknown' and topic == 'Unknown' and pestle == 'Unknown':
                continue
            
            # Increment count for this combination
            hierarchy[sector][topic][pestle] += 1
        
        # Convert to hierarchical format for D3.js
        result = {
            'name': 'Topics',
            'children': []
        }
        
        for sector, topics in hierarchy.items():
            sector_node = {
                'name': sector,
                'children': []
            }
            
            for topic, pestles in topics.items():
                topic_node = {
                    'name': topic,
                    'children': []
                }
                
                for pestle, count in pestles.items():
                    topic_node['children'].append({
                        'name': pestle,
                        'value': count
                    })
                
                sector_node['children'].append(topic_node)
            
            result['children'].append(sector_node)
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error fetching topic distribution data: {str(e)}")
        return jsonify({"error": "Failed to fetch topic distribution data"}), 500 