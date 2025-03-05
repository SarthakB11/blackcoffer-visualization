import { useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { NetworkData, NetworkNode, NetworkLink } from '../types';

// Extend NetworkNode to include SimulationNodeDatum properties
interface SimulationNode extends NetworkNode, d3.SimulationNodeDatum {
  x?: number;
  y?: number;
}

// Define a custom link type for the simulation
interface SimulationLink {
  source: SimulationNode | string | number;
  target: SimulationNode | string | number;
  value: number;
}

interface NetworkChartProps {
  data: NetworkData | null;
  loading: boolean;
  width?: number;
  height?: number;
}

const NetworkChart = ({ data, loading, width = 800, height = 600 }: NetworkChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const theme = useTheme();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (loading || !data || !svgRef.current) {
      return;
    }

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Create a map to track node connections
    const linkedNodes = new Map<string, Set<string>>();
    
    // Initialize the map with empty sets for each node
    data.nodes.forEach((node: NetworkNode) => {
      linkedNodes.set(node.id, new Set<string>());
    });
    
    // Populate the connections
    data.links.forEach((link: NetworkLink) => {
      const sourceId = typeof link.source === 'string' ? link.source : 
                      typeof link.source === 'object' && 'id' in link.source ? link.source.id : 
                      String(link.source);
      
      const targetId = typeof link.target === 'string' ? link.target : 
                      typeof link.target === 'object' && 'id' in link.target ? link.target.id : 
                      String(link.target);
      
      // Add bidirectional connections
      if (linkedNodes.has(sourceId)) {
        linkedNodes.get(sourceId)?.add(targetId);
      }
      
      if (linkedNodes.has(targetId)) {
        linkedNodes.get(targetId)?.add(sourceId);
      }
    });

    // Set margins
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom - 40; // Extra space for title

    const svg = d3.select(svgRef.current);
    
    // Create a container group with margins
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .attr('opacity', 1);

    // Create a zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        svg.select('g.network-container').attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create a network container
    const container = svg.append('g')
      .attr('class', 'network-container')
      .attr('transform', `translate(${innerWidth / 2},${innerHeight / 2})`);

    // Prepare data for simulation
    const nodes = data.nodes.map(node => ({ ...node })) as SimulationNode[];
    const links = data.links.map(link => ({ ...link })) as SimulationLink[];

    // Create a force simulation
    const simulation = d3.forceSimulation<SimulationNode>(nodes)
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(links)
        .id(d => d.id)
        .distance(100)
        .strength(0.2))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide(30)); // Use a constant radius

    // Create links
    const linkElements = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', theme.palette.grey[300])
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.value || 1));

    // Create a color scale for node types
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['topic', 'sector', 'region'])
      .range([
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main
      ]);

    // Create nodes
    const nodeElements = container.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => Math.sqrt(d.value || 1) * 3 + 5)
      .attr('fill', d => colorScale(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, SimulationNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Create labels
    const labelElements = container.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => d.name)
      .attr('font-size', 10)
      .attr('dx', 12)
      .attr('dy', 4)
      .style('pointer-events', 'none')
      .style('font-family', theme.typography.fontFamily as string)
      .style('opacity', 0) // Initially hidden
      .style('text-shadow', '0 1px 0 rgba(255, 255, 255, 0.8), 0 -1px 0 rgba(255, 255, 255, 0.8), 1px 0 0 rgba(255, 255, 255, 0.8), -1px 0 0 rgba(255, 255, 255, 0.8)');

    // Add hover effects
    nodeElements
      .on('mouseover', function(event, d: SimulationNode) {
        // Highlight the current node
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', Math.sqrt(d.value || 1) * 3 + 8);
        
        // Highlight connected links and nodes
        linkElements
          .style('stroke-opacity', l => 
            l.source === d || l.target === d ? 1 : 0.1
          )
          .style('stroke-width', l => 
            l.source === d || l.target === d ? 3 : 1
          );
        
        labelElements.filter((label: SimulationNode) => label.id === d.id)
          .transition()
          .duration(200)
          .style('opacity', 1);
        
        // Show tooltip with detailed information
        if (tooltipRef.current) {
          const tooltip = d3.select(tooltipRef.current);
          tooltip.transition().duration(200).style('opacity', 0.9);
          
          // Create detailed tooltip content
          let tooltipContent = `
            <div style="font-weight: bold; margin-bottom: 5px; color: ${colorScale(d.type)}">
              ${d.name}
            </div>
            <div>Type: ${d.type}</div>
            <div>Value: ${d.value.toFixed(2)}</div>
            <div>Connections: ${Array.from(linkedNodes.get(d.id) || new Set()).length}</div>
          `;
          
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
        
        setSelectedNode(d.name);
      })
      .on('mouseout', function(event, d: SimulationNode) {
        // Restore original appearance
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', Math.sqrt(d.value || 1) * 3 + 5);
        
        // Hide all labels
        labelElements.transition()
          .duration(200)
          .style('opacity', 0);
        
        // Restore all links and nodes
        linkElements
          .style('stroke-opacity', 0.6)
          .style('stroke-width', 1);
        
        // Hide tooltip
        if (tooltipRef.current) {
          d3.select(tooltipRef.current)
            .transition()
            .duration(500)
            .style('opacity', 0);
        }
        
        setSelectedNode(null);
      });

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 120}, 20)`);

    const legendItems = [
      { type: 'topic', label: 'Topic' },
      { type: 'sector', label: 'Sector' },
      { type: 'region', label: 'Region' }
    ];

    legendItems.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendItem.append('circle')
        .attr('r', 6)
        .attr('fill', colorScale(item.type));

      legendItem.append('text')
        .attr('x', 12)
        .attr('y', 4)
        .text(item.label)
        .style('font-size', '12px')
        .style('font-family', theme.typography.fontFamily as string);
    });

    // Update positions on each tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', d => typeof d.source === 'object' ? d.source.x || 0 : 0)
        .attr('y1', d => typeof d.source === 'object' ? d.source.y || 0 : 0)
        .attr('x2', d => typeof d.target === 'object' ? d.target.x || 0 : 0)
        .attr('y2', d => typeof d.target === 'object' ? d.target.y || 0 : 0);

      nodeElements
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);

      labelElements
        .attr('x', d => d.x || 0)
        .attr('y', d => d.y || 0);
    });

    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>, d: SimulationNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>, d: SimulationNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, SimulationNode, SimulationNode>, d: SimulationNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Clean up on unmount
    return () => {
      simulation.stop();
    };
  }, [data, loading, width, height, theme]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height }}>
        <Typography variant="body1" color="text.secondary">
          No network data available
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
          Network Relationships
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

export default NetworkChart; 