from flask import Blueprint, jsonify, request
from database import get_db
import json
from bson import json_util
from flask_cors import CORS

api = Blueprint('api', __name__)
CORS(api)

@api.route('/data', methods=['GET'])
def get_data():
    db = get_db()
    collection = db.blackcoffer
    
    # Get filter parameters
    filters = {}
    for key, value in request.args.items():
        if value:
            filters[key] = value
    
    # Apply filters
    if filters:
        cursor = collection.find(filters)
    else:
        cursor = collection.find()
    
    # Convert to list and parse MongoDB BSON to JSON
    data = json.loads(json_util.dumps(list(cursor)))
    
    return jsonify(data)

@api.route('/metrics', methods=['GET'])
def get_metrics():
    db = get_db()
    collection = db.blackcoffer
    
    # Get filter parameters
    filters = {}
    for key, value in request.args.items():
        if value:
            filters[key] = value
    
    # Apply filters for the aggregation
    if filters:
        cursor = collection.find(filters)
    else:
        cursor = collection.find()
    
    # Calculate metrics
    data = list(cursor)
    total_records = len(data)
    
    if total_records > 0:
        avg_intensity = sum(item.get('intensity', 0) for item in data) / total_records
        avg_likelihood = sum(item.get('likelihood', 0) for item in data) / total_records
        avg_relevance = sum(item.get('relevance', 0) for item in data) / total_records
    else:
        avg_intensity = 0
        avg_likelihood = 0
        avg_relevance = 0
    
    metrics = {
        'total_records': total_records,
        'avg_intensity': round(avg_intensity, 2),
        'avg_likelihood': round(avg_likelihood, 2),
        'avg_relevance': round(avg_relevance, 2)
    }
    
    return jsonify(metrics)

@api.route('/filters', methods=['GET'])
def get_filters():
    db = get_db()
    collection = db.blackcoffer
    
    # Get distinct values for each filter field
    end_years = collection.distinct('end_year')
    topics = collection.distinct('topic')
    sectors = collection.distinct('sector')
    regions = collection.distinct('region')
    pests = collection.distinct('pestle')
    sources = collection.distinct('source')
    countries = collection.distinct('country')
    cities = collection.distinct('city')
    
    # Remove empty values
    end_years = [year for year in end_years if year]
    topics = [topic for topic in topics if topic]
    sectors = [sector for sector in sectors if sector]
    regions = [region for region in regions if region]
    pests = [pest for pest in pests if pest]
    sources = [source for source in sources if source]
    countries = [country for country in countries if country]
    cities = [city for city in cities if city]
    
    # Sort values
    end_years.sort(reverse=True)
    topics.sort()
    sectors.sort()
    regions.sort()
    pests.sort()
    sources.sort()
    countries.sort()
    cities.sort()
    
    filters = {
        'end_years': end_years,
        'topics': topics,
        'sectors': sectors,
        'regions': regions,
        'pests': pests,
        'sources': sources,
        'countries': countries,
        'cities': cities
    }
    
    return jsonify(filters)

@api.route('/network', methods=['GET'])
def get_network_data():
    db = get_db()
    collection = db.blackcoffer
    
    # Get filter parameters
    filters = {}
    for key, value in request.args.items():
        if value:
            filters[key] = value
    
    # Apply filters
    if filters:
        cursor = collection.find(filters)
    else:
        cursor = collection.find()
    
    data = list(cursor)
    
    # Create nodes for topics, sectors, and regions
    topics = {}
    sectors = {}
    regions = {}
    
    for item in data:
        topic = item.get('topic', 'Unknown')
        sector = item.get('sector', 'Unknown')
        region = item.get('region', 'Unknown')
        
        if topic != 'Unknown' and topic:
            if topic in topics:
                topics[topic] += 1
            else:
                topics[topic] = 1
                
        if sector != 'Unknown' and sector:
            if sector in sectors:
                sectors[sector] += 1
            else:
                sectors[sector] = 1
                
        if region != 'Unknown' and region:
            if region in regions:
                regions[region] += 1
            else:
                regions[region] = 1
    
    # Create nodes and links
    nodes = []
    links = []
    
    # Add topic nodes
    node_id = 0
    topic_ids = {}
    for topic, count in topics.items():
        if count > 1:  # Only include topics with more than one occurrence
            nodes.append({
                'id': node_id,
                'name': topic,
                'type': 'topic',
                'value': count
            })
            topic_ids[topic] = node_id
            node_id += 1
    
    # Add sector nodes
    sector_ids = {}
    for sector, count in sectors.items():
        if count > 1:  # Only include sectors with more than one occurrence
            nodes.append({
                'id': node_id,
                'name': sector,
                'type': 'sector',
                'value': count
            })
            sector_ids[sector] = node_id
            node_id += 1
    
    # Add region nodes
    region_ids = {}
    for region, count in regions.items():
        if count > 1:  # Only include regions with more than one occurrence
            nodes.append({
                'id': node_id,
                'name': region,
                'type': 'region',
                'value': count
            })
            region_ids[region] = node_id
            node_id += 1
    
    # Create links between topics and sectors
    topic_sector_links = {}
    topic_region_links = {}
    sector_region_links = {}
    
    for item in data:
        topic = item.get('topic', 'Unknown')
        sector = item.get('sector', 'Unknown')
        region = item.get('region', 'Unknown')
        
        if topic in topic_ids and sector in sector_ids:
            link_key = f"{topic_ids[topic]}-{sector_ids[sector]}"
            if link_key in topic_sector_links:
                topic_sector_links[link_key] += 1
            else:
                topic_sector_links[link_key] = 1
        
        if topic in topic_ids and region in region_ids:
            link_key = f"{topic_ids[topic]}-{region_ids[region]}"
            if link_key in topic_region_links:
                topic_region_links[link_key] += 1
            else:
                topic_region_links[link_key] = 1
        
        if sector in sector_ids and region in region_ids:
            link_key = f"{sector_ids[sector]}-{region_ids[region]}"
            if link_key in sector_region_links:
                sector_region_links[link_key] += 1
            else:
                sector_region_links[link_key] = 1
    
    # Add links to the result
    for link_key, value in topic_sector_links.items():
        source, target = map(int, link_key.split('-'))
        links.append({
            'source': source,
            'target': target,
            'value': value
        })
    
    for link_key, value in topic_region_links.items():
        source, target = map(int, link_key.split('-'))
        links.append({
            'source': source,
            'target': target,
            'value': value
        })
    
    for link_key, value in sector_region_links.items():
        source, target = map(int, link_key.split('-'))
        links.append({
            'source': source,
            'target': target,
            'value': value
        })
    
    network_data = {
        'nodes': nodes,
        'links': links
    }
    
    return jsonify(network_data)

@api.route('/topics', methods=['GET'])
def get_topic_distribution():
    db = get_db()
    collection = db.blackcoffer
    
    # Get filter parameters
    filters = {}
    for key, value in request.args.items():
        if value:
            filters[key] = value
    
    # Apply filters
    if filters:
        cursor = collection.find(filters)
    else:
        cursor = collection.find()
    
    data = list(cursor)
    
    # Create hierarchical structure for topics
    sectors = {}
    
    for item in data:
        sector = item.get('sector', 'Unknown')
        topic = item.get('topic', 'Unknown')
        pestle = item.get('pestle', 'Unknown')
        
        if (sector == 'Unknown' or not sector) or (topic == 'Unknown' or not topic):
            continue
        
        if pestle == 'Unknown' or not pestle:
            pestle = 'Other'
        
        if sector not in sectors:
            sectors[sector] = {'topics': {}}
        
        if topic not in sectors[sector]['topics']:
            sectors[sector]['topics'][topic] = {'pestles': {}}
        
        if pestle not in sectors[sector]['topics'][topic]['pestles']:
            sectors[sector]['topics'][topic]['pestles'][pestle] = 0
        
        sectors[sector]['topics'][topic]['pestles'][pestle] += 1
    
    # Convert to hierarchical structure
    root = {
        'name': 'All Sectors',
        'children': []
    }
    
    for sector, sector_data in sectors.items():
        sector_node = {
            'name': sector,
            'children': []
        }
        
        for topic, topic_data in sector_data['topics'].items():
            topic_node = {
                'name': topic,
                'children': []
            }
            
            for pestle, count in topic_data['pestles'].items():
                topic_node['children'].append({
                    'name': pestle,
                    'value': count
                })
            
            sector_node['children'].append(topic_node)
        
        root['children'].append(sector_node)
    
    return jsonify(root)

@api.route('/timeseries', methods=['GET'])
def get_time_series():
    db = get_db()
    collection = db.blackcoffer
    
    # Get filter parameters
    filters = {}
    for key, value in request.args.items():
        if value:
            filters[key] = value
    
    # Apply filters
    if filters:
        cursor = collection.find(filters)
    else:
        cursor = collection.find()
    
    data = list(cursor)
    
    # Group by year
    years = {}
    
    for item in data:
        year = item.get('end_year', 'Unknown')
        
        if year == '' or year == 'Unknown' or not year:
            continue
        
        if year not in years:
            years[year] = {
                'intensity': 0,
                'likelihood': 0,
                'relevance': 0,
                'count': 0
            }
        
        years[year]['intensity'] += item.get('intensity', 0)
        years[year]['likelihood'] += item.get('likelihood', 0)
        years[year]['relevance'] += item.get('relevance', 0)
        years[year]['count'] += 1
    
    # Calculate averages
    time_series = []
    
    for year, metrics in years.items():
        count = metrics['count']
        if count > 0:
            time_series.append({
                'date': year,
                'value': round(metrics['intensity'] / count, 2),
                'likelihood': round(metrics['likelihood'] / count, 2),
                'relevance': round(metrics['relevance'] / count, 2),
                'count': count
            })
    
    # Sort by year
    time_series.sort(key=lambda x: x['date'])
    
    return jsonify({
        'points': time_series,
        'yAxisLabel': 'Average Intensity'
    })

@api.route('/geo', methods=['GET'])
def get_geo_data():
    db = get_db()
    collection = db.blackcoffer
    
    # Get filter parameters
    filters = {}
    for key, value in request.args.items():
        if value:
            filters[key] = value
    
    # Apply filters
    if filters:
        cursor = collection.find(filters)
    else:
        cursor = collection.find()
    
    data = list(cursor)
    
    # Group by country
    countries = {}
    
    for item in data:
        country = item.get('country', 'Unknown')
        
        if country == '' or country == 'Unknown' or not country:
            continue
        
        if country not in countries:
            countries[country] = {
                'intensity': 0,
                'likelihood': 0,
                'relevance': 0,
                'count': 0
            }
        
        countries[country]['intensity'] += item.get('intensity', 0)
        countries[country]['likelihood'] += item.get('likelihood', 0)
        countries[country]['relevance'] += item.get('relevance', 0)
        countries[country]['count'] += 1
    
    # Create GeoJSON structure
    features = []
    
    for country, metrics in countries.items():
        count = metrics['count']
        if count > 0:
            features.append({
                'type': 'Feature',
                'properties': {
                    'name': country,
                    'value': round(metrics['intensity'] / count, 2),
                    'likelihood': round(metrics['likelihood'] / count, 2),
                    'relevance': round(metrics['relevance'] / count, 2),
                    'count': count
                },
                'geometry': {
                    'type': 'Point',
                    'coordinates': [0, 0]  # Placeholder, would need a geocoding service for real coordinates
                }
            })
    
    geo_data = {
        'type': 'FeatureCollection',
        'features': features
    }
    
    return jsonify(geo_data) 