import { useState, useEffect } from 'react'
import { Container, Grid, CircularProgress, Alert, Snackbar, Box, Typography, Tab, Tabs, Paper, Button, ButtonGroup } from '@mui/material'
import BarChartIcon from '@mui/icons-material/BarChart'
import BubbleChartIcon from '@mui/icons-material/BubbleChart'
import FilterPanel from './components/FilterPanel'
import VisualizationPanel from './components/VisualizationPanel'
import MetricsPanel from './components/MetricsPanel'
import NetworkChart from './components/NetworkChart'
import TreeMapChart from './components/TreeMapChart'
import TimeSeriesChart from './components/TimeSeriesChart'
import GeoMapChart from './components/GeoMapChart'
import { FilterState, Metrics, DataItem, NetworkData, TopicDistributionData, TimeSeriesData, GeoData } from './types'

function App() {
  const [data, setData] = useState<DataItem[]>([])
  const [metrics, setMetrics] = useState<Metrics>({
    total_records: 0,
    avg_intensity: 0,
    avg_likelihood: 0,
    avg_relevance: 0
  })
  const [filterOptions, setFilterOptions] = useState<FilterState>({
    end_year: '',
    topic: '',
    sector: '',
    region: '',
    pest: '',
    source: '',
    country: '',
    city: ''
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [d3TabValue, setD3TabValue] = useState<number>(0)
  const [visualizationType, setVisualizationType] = useState<'standard' | 'd3'>('standard')
  
  // D3.js visualization data
  const [networkData, setNetworkData] = useState<NetworkData | null>(null)
  const [topicData, setTopicData] = useState<TopicDistributionData | null>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null)
  const [geoData, setGeoData] = useState<GeoData | null>(null)
  const [d3Loading, setD3Loading] = useState<boolean>(true)

  // State for responsive charts
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    fetchMetrics()
    fetchData()
    fetchD3Data()
    
    // Add window resize listener for responsive charts
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const fetchMetrics = async () => {
    setMetricsLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/metrics')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setMetrics(data)
    } catch (e) {
      setError(`Failed to fetch metrics: ${e instanceof Error ? e.message : String(e)}`)
      console.error('Error fetching metrics:', e)
    } finally {
      setMetricsLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/data')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setData(data)
    } catch (e) {
      setError(`Failed to fetch data: ${e instanceof Error ? e.message : String(e)}`)
      console.error('Error fetching data:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchD3Data = async () => {
    setD3Loading(true)
    try {
      // Fetch network data
      const networkResponse = await fetch('http://localhost:5000/api/network')
      if (!networkResponse.ok) {
        throw new Error(`HTTP error! status: ${networkResponse.status}`)
      }
      const networkData = await networkResponse.json()
      setNetworkData(networkData)

      // Fetch topic distribution data
      const topicResponse = await fetch('http://localhost:5000/api/topic-distribution')
      if (!topicResponse.ok) {
        throw new Error(`HTTP error! status: ${topicResponse.status}`)
      }
      const topicData = await topicResponse.json()
      setTopicData(topicData)

      // Fetch time series data
      const timeSeriesResponse = await fetch('http://localhost:5000/api/timeseries')
      if (!timeSeriesResponse.ok) {
        throw new Error(`HTTP error! status: ${timeSeriesResponse.status}`)
      }
      const timeSeriesData = await timeSeriesResponse.json()
      setTimeSeriesData(timeSeriesData)

      // Fetch geo data
      const geoResponse = await fetch('http://localhost:5000/api/geo')
      if (!geoResponse.ok) {
        throw new Error(`HTTP error! status: ${geoResponse.status}`)
      }
      const geoData = await geoResponse.json()
      setGeoData(geoData)
    } catch (e) {
      setError(`Failed to fetch D3 data: ${e instanceof Error ? e.message : String(e)}`)
      console.error('Error fetching D3 data:', e)
    } finally {
      setD3Loading(false)
    }
  }

  const handleFilterChange = async (newFilters: FilterState) => {
    setFilterOptions(newFilters)
    setLoading(true)
    setMetricsLoading(true)
    setD3Loading(true)
    
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams()
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
      
      // Fetch filtered data
      const dataResponse = await fetch(`http://localhost:5000/api/data?${queryParams}`)
      if (!dataResponse.ok) {
        throw new Error(`HTTP error! status: ${dataResponse.status}`)
      }
      const filteredData = await dataResponse.json()
      setData(filteredData)
      
      // Fetch filtered metrics
      const metricsResponse = await fetch(`http://localhost:5000/api/metrics?${queryParams}`)
      if (!metricsResponse.ok) {
        throw new Error(`HTTP error! status: ${metricsResponse.status}`)
      }
      const filteredMetrics = await metricsResponse.json()
      setMetrics(filteredMetrics)
      
      // Fetch filtered D3 data
      const networkResponse = await fetch(`http://localhost:5000/api/network?${queryParams}`)
      if (!networkResponse.ok) {
        throw new Error(`HTTP error! status: ${networkResponse.status}`)
      }
      const filteredNetworkData = await networkResponse.json()
      setNetworkData(filteredNetworkData)
      
      const topicResponse = await fetch(`http://localhost:5000/api/topic-distribution?${queryParams}`)
      if (!topicResponse.ok) {
        throw new Error(`HTTP error! status: ${topicResponse.status}`)
      }
      const filteredTopicData = await topicResponse.json()
      setTopicData(filteredTopicData)
      
      const timeSeriesResponse = await fetch(`http://localhost:5000/api/timeseries?${queryParams}`)
      if (!timeSeriesResponse.ok) {
        throw new Error(`HTTP error! status: ${timeSeriesResponse.status}`)
      }
      const filteredTimeSeriesData = await timeSeriesResponse.json()
      setTimeSeriesData(filteredTimeSeriesData)
      
      const geoResponse = await fetch(`http://localhost:5000/api/geo?${queryParams}`)
      if (!geoResponse.ok) {
        throw new Error(`HTTP error! status: ${geoResponse.status}`)
      }
      const filteredGeoData = await geoResponse.json()
      setGeoData(filteredGeoData)
    } catch (e) {
      setError(`Failed to fetch filtered data: ${e instanceof Error ? e.message : String(e)}`)
      console.error('Error fetching filtered data:', e)
    } finally {
      setLoading(false)
      setMetricsLoading(false)
      setD3Loading(false)
    }
  }

  const handleD3TabChange = (event: React.SyntheticEvent, newValue: number) => {
    setD3TabValue(newValue)
  }

  const handleErrorClose = () => {
    setError(null)
  }

  const handleVisualizationTypeChange = (type: 'standard' | 'd3') => {
    setVisualizationType(type)
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Filter Panel */}
        <Grid item xs={12}>
          <FilterPanel 
            onFilterChange={handleFilterChange} 
          />
        </Grid>
        
        {/* Metrics Panel */}
        <Grid item xs={12}>
          <MetricsPanel 
            metrics={metrics} 
            loading={metricsLoading} 
          />
        </Grid>
        
        {/* Visualization Type Selector */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <ButtonGroup variant="contained" aria-label="visualization type">
              <Button 
                startIcon={<BarChartIcon />}
                onClick={() => handleVisualizationTypeChange('standard')}
                color={visualizationType === 'standard' ? 'primary' : 'inherit'}
                variant={visualizationType === 'standard' ? 'contained' : 'outlined'}
              >
                Standard Charts
              </Button>
              <Button 
                startIcon={<BubbleChartIcon />}
                onClick={() => handleVisualizationTypeChange('d3')}
                color={visualizationType === 'd3' ? 'primary' : 'inherit'}
                variant={visualizationType === 'd3' ? 'contained' : 'outlined'}
              >
                Advanced D3 Visualizations
              </Button>
            </ButtonGroup>
          </Box>
        </Grid>
        
        {/* Chart.js Visualizations */}
        {visualizationType === 'standard' && (
          <Grid item xs={12}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                overflow: 'hidden',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
                Standard Visualizations
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <VisualizationPanel data={data} />
              )}
            </Paper>
          </Grid>
        )}
        
        {/* D3.js Visualizations */}
        {visualizationType === 'd3' && (
          <Grid item xs={12}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                overflow: 'hidden',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
                Advanced D3.js Visualizations
              </Typography>
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                  value={d3TabValue} 
                  onChange={handleD3TabChange} 
                  aria-label="d3 visualization tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Network Relationships" />
                  <Tab label="Topic Distribution" />
                  <Tab label="Time Series Analysis" />
                  <Tab label="Geographic Distribution" />
                </Tabs>
              </Box>
              
              {d3TabValue === 0 && (
                <Box sx={{ width: '100%', height: 600, overflow: 'hidden' }}>
                  <NetworkChart 
                    data={networkData} 
                    loading={d3Loading} 
                    width={windowWidth > 1200 ? 1200 : windowWidth - 64} 
                    height={600} 
                  />
                </Box>
              )}
              
              {d3TabValue === 1 && (
                <Box sx={{ width: '100%', height: 600, overflow: 'hidden' }}>
                  <TreeMapChart 
                    data={topicData} 
                    loading={d3Loading} 
                    width={windowWidth > 1200 ? 1200 : windowWidth - 64} 
                    height={600} 
                    title="Topic Distribution"
                  />
                </Box>
              )}
              
              {d3TabValue === 2 && (
                <Box sx={{ width: '100%', height: 500, overflow: 'hidden' }}>
                  <TimeSeriesChart 
                    data={timeSeriesData} 
                    loading={d3Loading} 
                    width={windowWidth > 1200 ? 1200 : windowWidth - 64} 
                    height={500} 
                    title="Intensity Over Time" 
                  />
                </Box>
              )}
              
              {d3TabValue === 3 && (
                <Box sx={{ width: '100%', height: 600, overflow: 'hidden' }}>
                  <GeoMapChart 
                    data={geoData} 
                    loading={d3Loading} 
                    width={windowWidth > 1200 ? 1200 : windowWidth - 64} 
                    height={600} 
                    title="Geographic Distribution" 
                  />
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
      
      <Snackbar 
        open={error !== null} 
        autoHideDuration={6000} 
        onClose={handleErrorClose}
      >
        <Alert 
          onClose={handleErrorClose} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default App
