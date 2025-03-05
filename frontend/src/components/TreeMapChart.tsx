import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, useTheme } from '@mui/material';
import * as d3 from 'd3';
import { TopicDistributionData, TopicDistributionNode } from '../types';
import { motion } from 'framer-motion';

// Extended interface for D3 hierarchy nodes with treemap layout properties
interface TreemapHierarchyNode extends d3.HierarchyNode<TopicDistributionNode> {
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

interface TreeMapChartProps {
  data: TopicDistributionData | null;
  loading: boolean;
  width: number;
  height: number;
  title?: string;
}

const TreeMapChart: React.FC<TreeMapChartProps> = ({ 
  data, 
  loading, 
  width, 
  height,
  title = "Topic Distribution" 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (loading || !data || !svgRef.current) {
      return;
    }

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Ensure we have proper margins to prevent cutoff
    const margin = { top: 10, right: 10, bottom: 30, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom - 40; // Extra space for title

    // Create the SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top + 30})`); // Add space for title

    // Ensure data has the correct structure
    const processedData = data.children && data.children.length > 0 ? data : {
      name: "Topics",
      children: []
    };

    // Create a color scale
    const colorScale = d3.scaleOrdinal<string>()
      .domain(processedData.children.map(d => d.name))
      .range(d3.schemeCategory10);

    // Create the treemap layout
    const root = d3.hierarchy(processedData)
      .sum(d => (d as any).value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create the treemap generator
    const treemap = d3.treemap<TopicDistributionNode>()
      .size([innerWidth, innerHeight])
      .paddingOuter(3)
      .paddingTop(19)
      .paddingInner(2)
      .round(true);

    // Generate the treemap layout
    treemap(root as d3.HierarchyNode<TopicDistributionNode>);

    // Create a group for each node
    const nodes = svg.selectAll('g')
      .data(root.descendants() as TreemapHierarchyNode[])
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x0 || 0},${d.y0 || 0})`)
      .attr('class', d => d.depth === 1 ? 'topic-group' : 'subtopic-group');

    // Add rectangles for each node
    nodes.append('rect')
      .attr('width', d => Math.max(0, (d.x1 || 0) - (d.x0 || 0)))
      .attr('height', d => Math.max(0, (d.y1 || 0) - (d.y0 || 0)))
      .attr('fill', d => {
        if (d.depth === 1) {
          return colorScale(d.data.name);
        } else {
          const parentName = d.parent?.data.name || '';
          const parentColor = colorScale(parentName);
          const brighterColor = d3.color(parentColor)?.brighter(0.5);
          return brighterColor ? brighterColor.toString() : '#cccccc';
        }
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('opacity', 0.8)
      .on('mouseover', function(event, d: TreemapHierarchyNode) {
        // Highlight the current rectangle
        d3.select(this)
          .style('opacity', 1)
          .style('stroke', theme.palette.primary.main)
          .style('stroke-width', 2);
        
        if (tooltipRef.current) {
          const tooltip = d3.select(tooltipRef.current);
          tooltip.style('opacity', 0.9);
          
          // Create detailed tooltip content
          let tooltipContent = `
            <div style="font-weight: bold; margin-bottom: 5px; color: ${theme.palette.primary.main}">
              ${d.data.name}
            </div>
          `;
          
          if (d.value !== undefined) {
            tooltipContent += `<div>Value: ${d.value.toFixed(2)}</div>`;
          }
          
          if (d.depth === 2 && d.parent) {
            tooltipContent += `<div>Category: ${d.parent.data.name}</div>`;
          }
          
          tooltip.html(tooltipContent);
          
          // Position the tooltip near the cursor but avoid edges
          const tooltipWidth = tooltipRef.current.offsetWidth;
          const tooltipHeight = tooltipRef.current.offsetHeight;
          
          // Calculate position to avoid going off screen
          const xPosition = event.pageX > window.innerWidth - tooltipWidth - 20 ? 
            event.pageX - tooltipWidth - 10 : event.pageX + 10;
          const yPosition = event.pageY > window.innerHeight - tooltipHeight - 20 ? 
            event.pageY - tooltipHeight - 10 : event.pageY + 10;
            
          tooltip
            .style('left', `${xPosition}px`)
            .style('top', `${yPosition}px`);
        }
      })
      .on('mouseout', function() {
        // Restore original appearance
        d3.select(this)
          .style('opacity', 0.8)
          .style('stroke', '#fff')
          .style('stroke-width', 1);
        
        if (tooltipRef.current) {
          d3.select(tooltipRef.current).style('opacity', 0);
        }
      });

    // Add text labels for parent nodes (topics)
    nodes.filter(d => d.depth === 1)
      .append('text')
      .attr('x', 4)
      .attr('y', 14)
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .attr('fill', '#fff')
      .text(d => {
        const width = (d.x1 || 0) - (d.x0 || 0);
        const name = d.data.name;
        if (width < 50) return '';
        return name.length > Math.floor(width / 7) ? 
          name.substring(0, Math.floor(width / 7)) + '...' : 
          name;
      });

    // Add text labels for leaf nodes (subtopics) if they have enough space
    nodes.filter(d => d.depth === 2 && ((d.x1 || 0) - (d.x0 || 0)) > 40 && ((d.y1 || 0) - (d.y0 || 0)) > 14)
      .append('text')
      .attr('x', 4)
      .attr('y', 14)
      .attr('font-size', '10px')
      .attr('fill', '#333')
      .text(d => {
        const width = (d.x1 || 0) - (d.x0 || 0);
        const name = d.data.name;
        return name.length > Math.floor(width / 7) ? 
          name.substring(0, Math.floor(width / 7)) + '...' : 
          name;
      });

    // Create a legend
    const legendGroup = svg.append('g')
      .attr('transform', `translate(${innerWidth - 180}, ${innerHeight - Math.min(150, innerHeight / 3)})`);
      
    // Show only top categories to avoid overcrowding
    const legendItems = processedData.children.slice(0, Math.min(8, processedData.children.length));
    
    // Add legend background
    legendGroup.append('rect')
      .attr('width', 170)
      .attr('height', legendItems.length * 20 + 10)
      .attr('fill', 'white')
      .attr('stroke', '#ccc')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('opacity', 0.9);
    
    // Add legend items
    legendItems.forEach((item, i) => {
      const legendItem = legendGroup.append('g')
        .attr('transform', `translate(10, ${i * 20 + 15})`);
        
      legendItem.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colorScale(item.name));
        
      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 10)
        .attr('font-size', '12px')
        .text(item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name);
    });

    setIsRendered(true);
  }, [data, loading, width, height, theme]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || !data.children || data.children.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height }}>
        <Typography variant="body1" color="text.secondary">
          No topic distribution data available
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ position: 'relative', width: '100%', height: height }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderRadius: 2, 
          overflow: 'hidden',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Box sx={{ position: 'relative', flexGrow: 1 }}>
          <svg ref={svgRef} width="100%" height="100%" />
          <div 
            ref={tooltipRef} 
            style={{
              position: 'absolute',
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ddd',
              borderRadius: '4px',
              pointerEvents: 'none',
              opacity: 0,
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              maxWidth: '250px',
              fontSize: '12px',
              lineHeight: '1.5'
            }}
          />
        </Box>
      </Paper>
    </motion.div>
  );
};

export default TreeMapChart; 