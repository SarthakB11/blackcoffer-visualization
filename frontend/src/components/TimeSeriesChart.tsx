import React, { useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Paper, useTheme } from '@mui/material';
import * as d3 from 'd3';
import { TimeSeriesData } from '../types';
import { motion } from 'framer-motion';

// Define a type for the data format returned by the API
interface TimeSeriesDataFromAPI {
  year: string;
  intensity: number;
  likelihood: number;
  relevance: number;
  count: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesData | null;
  loading: boolean;
  width: number;
  height: number;
  title: string;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ 
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
    if (loading || !data || !data.length || !svgRef.current) {
      return;
    }

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Set margins
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Transform data to the expected format if it's from the API
    const transformedData = data.map(d => {
      // Check if the data is from the API (has 'year' property)
      if ('year' in d) {
        const apiData = d as unknown as TimeSeriesDataFromAPI;
        return {
          date: apiData.year,
          value: apiData.intensity,
          likelihood: apiData.likelihood,
          relevance: apiData.relevance,
          count: apiData.count
        };
      }
      return d;
    });

    // Parse dates and sort data chronologically
    const parsedData = transformedData.map(d => ({
      ...d,
      parsedDate: new Date(d.date)
    })).sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.parsedDate) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => d.value) || 0])
      .nice()
      .range([innerHeight, 0]);

    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add the x-axis
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%Y') as any))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    // Add the y-axis
    svg.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + margin.bottom - 5)
      .style('text-anchor', 'middle')
      .text('Year');

    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -innerHeight / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Intensity');

    // Create a line generator
    const line = d3.line<any>()
      .x(d => xScale(d.parsedDate))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add the line path
    const path = svg.append('path')
      .datum(parsedData)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', theme.palette.primary.main)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Animate the line
    const pathLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', pathLength)
      .attr('stroke-dashoffset', pathLength)
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', 0);

    // Add a group for the dots
    const dots = svg.selectAll('.dot')
      .data(parsedData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.parsedDate))
      .attr('cy', d => yScale(d.value))
      .attr('r', 0)
      .attr('fill', theme.palette.primary.main)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(300)
          .attr('r', 8);
        
        if (tooltipRef.current) {
          const tooltip = d3.select(tooltipRef.current);
          tooltip.style('opacity', 0.9);
          
          // Create tooltip content based on available properties
          let tooltipContent = `
            <strong>Year:</strong> ${d.date}<br/>
            <strong>Intensity:</strong> ${d.value.toFixed(2)}<br/>
          `;
          
          // Check if properties exist before adding them to tooltip
          if ('likelihood' in d) {
            tooltipContent += `<strong>Likelihood:</strong> ${d.likelihood.toFixed(2)}<br/>`;
          }
          
          if ('relevance' in d) {
            tooltipContent += `<strong>Relevance:</strong> ${d.relevance.toFixed(2)}<br/>`;
          }
          
          if ('count' in d) {
            tooltipContent += `<strong>Count:</strong> ${d.count}`;
          } else if ('topic' in d && d.topic) {
            tooltipContent += `<strong>Topic:</strong> ${d.topic}`;
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
        d3.select(this)
          .transition()
          .duration(300)
          .attr('r', 4);
        
        if (tooltipRef.current) {
          d3.select(tooltipRef.current).style('opacity', 0);
        }
      });

    // Animate the dots
    dots.transition()
      .delay((d, i) => i * 50)
      .duration(500)
      .attr('r', 4);

    // Add a grid
    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
      );

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
          No time series data available
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

export default TimeSeriesChart; 