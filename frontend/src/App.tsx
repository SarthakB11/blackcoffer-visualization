import { useState, useEffect } from 'react'
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert, 
  Snackbar, 
  AppBar, 
  Toolbar, 
  useTheme, 
  useMediaQuery,
  Drawer,
  IconButton,
  Divider
} from '@mui/material'
import { motion } from 'framer-motion'
import FilterPanel from './components/FilterPanel'
import MetricsPanel from './components/MetricsPanel'
import VisualizationPanel from './components/VisualizationPanel'
import { FilterState } from './types'
import DashboardIcon from '@mui/icons-material/Dashboard'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import RefreshIcon from '@mui/icons-material/Refresh'

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
  const [mobileOpen, setMobileOpen] = useState(false)
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const drawerWidth = 280

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
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const handleErrorClose = () => {
    setError(null)
  }
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }
  
  const handleRefresh = () => {
    fetchData(filters)
    fetchMetrics()
  }

  const drawer = (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterAltIcon sx={{ mr: 1 }} /> Filters
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <Divider sx={{ mb: 2 }} />
      <FilterPanel onFilterChange={handleFilterChange} />
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f7' }}>
      <AppBar position="static" color="primary" elevation={0} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <DashboardIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div">
              Data Visualization Dashboard
            </Typography>
          </motion.div>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="inherit" onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Sidebar for filters */}
        {!isMobile ? (
          <Box
            component="nav"
            sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
          >
            <Paper
              sx={{
                width: drawerWidth,
                height: '100%',
                borderRadius: 0,
                borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                boxShadow: 'none',
              }}
            >
              {drawer}
            </Paper>
          </Box>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                borderRadius: 0
              },
            }}
          >
            {drawer}
          </Drawer>
        )}

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Container maxWidth="xl" disableGutters>
            {/* Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f7 100%)'
                }}
              >
                <MetricsPanel metrics={metrics} loading={metricsLoading} />
              </Paper>
            </motion.div>

            {/* Visualizations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  minHeight: '500px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  borderRadius: 2
                }}
              >
                {loading ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Loading visualization data...
                    </Typography>
                  </Box>
                ) : data.length === 0 ? (
                  <Typography variant="h6" color="text.secondary">
                    No data available for the selected filters
                  </Typography>
                ) : (
                  <VisualizationPanel data={data} />
                )}
              </Paper>
            </motion.div>
          </Container>
        </Box>
      </Box>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleErrorClose} 
          severity="error" 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default App
