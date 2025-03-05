import React, { useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Paper, useTheme } from '@mui/material';
import * as d3 from 'd3';
import { GeoData } from '../types';
import { motion } from 'framer-motion';

// Define a type for the data format returned by the API
interface GeoDataFromAPI {
  country: string;
  count: number;
  intensity: number;
  likelihood: number;
  relevance: number;
}

// Country coordinates mapping (simplified for common countries)
const countryCoordinates: Record<string, [number, number]> = {
  'United States of America': [-95.7129, 37.0902],
  'United States': [-95.7129, 37.0902],
  'USA': [-95.7129, 37.0902],
  'China': [104.1954, 35.8617],
  'India': [78.9629, 20.5937],
  'Russia': [105.3188, 61.5240],
  'Brazil': [-51.9253, -14.2350],
  'Japan': [138.2529, 36.2048],
  'Germany': [10.4515, 51.1657],
  'United Kingdom': [-3.4359, 55.3781],
  'UK': [-3.4359, 55.3781],
  'France': [2.2137, 46.2276],
  'Italy': [12.5674, 41.8719],
  'Canada': [-106.3468, 56.1304],
  'Australia': [133.7751, -25.2744],
  'South Korea': [127.7669, 35.9078],
  'Mexico': [-102.5528, 23.6345],
  'Indonesia': [113.9213, -0.7893],
  'Turkey': [35.2433, 38.9637],
  'Saudi Arabia': [45.0792, 23.8859],
  'Switzerland': [8.2275, 46.8182],
  'Nigeria': [8.6753, 9.0820],
  'South Africa': [22.9375, -30.5595],
  'Egypt': [30.8025, 26.8206],
  'Pakistan': [69.3451, 30.3753],
  'Malaysia': [101.9758, 4.2105],
  'Singapore': [103.8198, 1.3521],
  'Thailand': [100.9925, 15.8700],
  'Vietnam': [108.2772, 14.0583],
  'Spain': [-3.7492, 40.4637],
  'Netherlands': [5.2913, 52.1326],
  'Sweden': [18.6435, 60.1282],
  'Norway': [8.4689, 60.4720],
  'Denmark': [9.5018, 56.2639],
  'Finland': [25.7482, 61.9241],
  'Poland': [19.1451, 51.9194],
  'Belgium': [4.4699, 50.5039],
  'Austria': [14.5501, 47.5162],
  'Greece': [21.8243, 39.0742],
  'Portugal': [-8.2245, 39.3999],
  'Ireland': [-8.2439, 53.4129],
  'New Zealand': [174.8860, -40.9006],
  'Argentina': [-63.6167, -38.4161],
  'Chile': [-71.5430, -35.6751],
  'Colombia': [-74.2973, 4.5709],
  'Peru': [-75.0152, -9.1900],
  'Venezuela': [-66.5897, 6.4238],
  'Global': [0, 0]
};

interface GeoMapChartProps {
  data: GeoData | null;
  loading: boolean;
  width: number;
  height: number;
  title: string;
}

const GeoMapChart: React.FC<GeoMapChartProps> = ({ 
  data, 
  loading, 
  width, 
  height, 
  title 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (loading || !data || !svgRef.current) {
      return;
    }

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Set margins
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Transform data if it's from the API
    const transformedData = Array.isArray(data) ? data.map(item => {
      // Check if the data is from the API (has 'country' property but no 'latitude')
      if ('country' in item && !('latitude' in item)) {
        const apiData = item as unknown as GeoDataFromAPI;
        const coordinates = countryCoordinates[apiData.country] || [0, 0];
        
        return {
          id: apiData.country,
          name: apiData.country,
          latitude: coordinates[1],
          longitude: coordinates[0],
          value: apiData.intensity,
          country: apiData.country,
          region: '',
          count: apiData.count,
          likelihood: apiData.likelihood,
          relevance: apiData.relevance
        };
      }
      return item;
    }) : [];

    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create a color scale for the points
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, d3.max(transformedData, d => d.value) || 1]);

    // Create a size scale for the points
    const sizeScale = d3.scaleLinear()
      .domain([0, d3.max(transformedData, d => d.value) || 1])
      .range([4, 20]);

    // Create a simple map background
    svg.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', theme.palette.grey[100])
      .attr('stroke', theme.palette.grey[300])
      .attr('stroke-width', 1);

    // Add points for each location
    // We'll use a simplified approach with relative positioning
    const xScale = d3.scaleLinear()
      .domain([-180, 180]) // longitude range
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([90, -90]) // latitude range (inverted for y-axis)
      .range([0, innerHeight]);

    svg.selectAll('circle')
      .data(transformedData)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.longitude))
      .attr('cy', d => yScale(d.latitude))
      .attr('r', d => sizeScale(d.value))
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.7)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(300)
          .attr('opacity', 1)
          .attr('r', sizeScale(d.value) * 1.5);
        
        if (tooltipRef.current) {
          const tooltip = d3.select(tooltipRef.current);
          tooltip.style('opacity', 0.9);
          
          // Create tooltip content based on available properties
          let tooltipContent = `
            <strong>${d.name}</strong><br/>
            <strong>Country:</strong> ${d.country}<br/>
          `;
          
          if (d.region) {
            tooltipContent += `<strong>Region:</strong> ${d.region}<br/>`;
          }
          
          tooltipContent += `<strong>Intensity:</strong> ${d.value.toFixed(2)}<br/>`;
          
          if ('count' in d) {
            tooltipContent += `<strong>Count:</strong> ${d.count}<br/>`;
          }
          
          if ('likelihood' in d) {
            tooltipContent += `<strong>Likelihood:</strong> ${d.likelihood.toFixed(2)}<br/>`;
          }
          
          if ('relevance' in d) {
            tooltipContent += `<strong>Relevance:</strong> ${d.relevance.toFixed(2)}`;
          }
          
          tooltip.html(tooltipContent);
          
          const tooltipWidth = tooltipRef.current.offsetWidth;
          const tooltipHeight = tooltipRef.current.offsetHeight;
          const xPosition = event.pageX > window.innerWidth - tooltipWidth ? 
            event.pageX - tooltipWidth - 10 : event.pageX + 10;
          const yPosition = event.pageY > window.innerHeight - tooltipHeight ? 
            event.pageY - tooltipHeight - 10 : event.pageY + 10;
            
          tooltip
            .style('left', `${xPosition}px`)
            .style('top', `${yPosition}px`);
        }
      })
      .on('mouseout', function() {
        const element = d3.select(this);
        const dataItem = element.datum() as any;
        
        element
          .transition()
          .duration(300)
          .attr('opacity', 0.7)
          .attr('r', sizeScale(dataItem.value));
        
        if (tooltipRef.current) {
          d3.select(tooltipRef.current).style('opacity', 0);
        }
      });

    // Add a legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendPosition = {
      x: innerWidth - legendWidth - 10,
      y: innerHeight - 50
    };

    // Create a gradient for the legend
    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
      .attr('id', 'linear-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    // Set the color for the gradient
    linearGradient.selectAll('stop')
      .data([
        { offset: '0%', color: colorScale(0) },
        { offset: '100%', color: colorScale(d3.max(transformedData, d => d.value) || 1) }
      ])
      .enter()
      .append('stop')
      .attr('offset', d => d.offset)
      .attr('stop-color', d => d.color);

    // Draw the rectangle and fill with gradient
    svg.append('g')
      .attr('transform', `translate(${legendPosition.x}, ${legendPosition.y})`)
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#linear-gradient)');

    // Add legend axis
    const legendScale = d3.scaleLinear()
      .domain([0, d3.max(transformedData, d => d.value) || 1])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => d.toString());

    svg.append('g')
      .attr('transform', `translate(${legendPosition.x}, ${legendPosition.y + legendHeight})`)
      .call(legendAxis);

    // Add legend title
    svg.append('text')
      .attr('x', legendPosition.x)
      .attr('y', legendPosition.y - 5)
      .style('font-size', '12px')
      .text('Intensity');

    // Add grid lines
    const gridLines = svg.append('g')
      .attr('class', 'grid-lines')
      .attr('opacity', 0.2);

    // Longitude lines (vertical)
    for (let lon = -180; lon <= 180; lon += 30) {
      gridLines.append('line')
        .attr('x1', xScale(lon))
        .attr('y1', 0)
        .attr('x2', xScale(lon))
        .attr('y2', innerHeight)
        .attr('stroke', theme.palette.grey[500])
        .attr('stroke-width', 0.5);
    }

    // Latitude lines (horizontal)
    for (let lat = -90; lat <= 90; lat += 30) {
      gridLines.append('line')
        .attr('x1', 0)
        .attr('y1', yScale(lat))
        .attr('x2', innerWidth)
        .attr('y2', yScale(lat))
        .attr('stroke', theme.palette.grey[500])
        .attr('stroke-width', 0.5);
    }

    // Add zoom capability
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        svg.selectAll('g, rect, circle')
          .attr('transform', event.transform);
        
        // Adjust circle radius based on zoom level
        svg.selectAll('circle').attr('r', function() {
          const element = d3.select(this);
          const dataItem = element.datum() as any;
          return sizeScale(dataItem.value) / event.transform.k;
        });
      });

    svg.call(zoom as any);

  }, [data, loading, width, height, theme]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || !data.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height }}>
        <Typography variant="body1" color="text.secondary">
          No geographic data available
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ position: 'relative' }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderRadius: 2, 
          overflow: 'hidden',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          height: height
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Box sx={{ position: 'relative' }}>
          <svg ref={svgRef} />
          <div 
            ref={tooltipRef} 
            style={{
              position: 'absolute',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #ddd',
              borderRadius: '4px',
              pointerEvents: 'none',
              opacity: 0,
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
        </Box>
      </Paper>
    </motion.div>
  );
};

export default GeoMapChart; 