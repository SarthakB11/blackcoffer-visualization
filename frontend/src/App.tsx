import { useState, useEffect } from 'react'
import { Container, Grid, Paper, Typography, Box, CircularProgress, Alert, Snackbar } from '@mui/material'
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
  const [loading, setLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch initial metrics
    fetchMetrics()
    // Fetch initial data
    fetchData({})
  }, [])

  const fetchMetrics = async () => {
    setMetricsLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/metrics')
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }
      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      setError('Error loading metrics. Please try again later.')
      console.error('Error fetching metrics:', err)
    } finally {
      setMetricsLoading(false)
    }
  }

  const fetchData = async (filters: FilterState) => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString())
      })
      
      const response = await fetch(`http://localhost:5000/api/data?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      const data = await response.json()
      setData(data)
    } catch (err) {
      setError('Error loading data. Please try again later.')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    fetchData(newFilters)
    fetchMetrics() // Refresh metrics when filters change
  }

  const handleErrorClose = () => {
    setError(null)
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
            <MetricsPanel metrics={metrics} loading={metricsLoading} />
          </Paper>

          {/* Visualizations */}
          <Paper sx={{ p: 2, minHeight: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {loading ? (
              <CircularProgress />
            ) : data.length === 0 ? (
              <Typography variant="h6" color="text.secondary">
                No data available for the selected filters
              </Typography>
            ) : (
              <VisualizationPanel data={data} />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleErrorClose}>
        <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default App
