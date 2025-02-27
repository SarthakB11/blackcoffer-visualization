import { useState, useEffect } from 'react'
import { Container, Grid, Paper, Typography, Box } from '@mui/material'
import FilterPanel from './components/FilterPanel'
import MetricsPanel from './components/MetricsPanel'
import VisualizationPanel from './components/VisualizationPanel'
import { FilterState } from './types'

function App() {
  const [data, setData] = useState([])
  const [filters, setFilters] = useState<FilterState>({})
  const [metrics, setMetrics] = useState({
    total_records: 0,
    avg_intensity: 0,
    avg_likelihood: 0,
    avg_relevance: 0
  })

  useEffect(() => {
    // Fetch initial metrics
    fetch('http://localhost:5000/api/metrics')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error('Error fetching metrics:', err))
  }, [])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    
    // Construct query string from filters
    const queryParams = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString())
    })
    
    // Fetch filtered data
    fetch(`http://localhost:5000/api/data?${queryParams}`)
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error('Error fetching data:', err))
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Data Visualization Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Filters */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <FilterPanel onFilterChange={handleFilterChange} />
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          {/* Metrics */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <MetricsPanel metrics={metrics} />
          </Paper>

          {/* Visualizations */}
          <Paper sx={{ p: 2 }}>
            <VisualizationPanel data={data} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default App
