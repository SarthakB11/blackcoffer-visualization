import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent, 
  CircularProgress, 
  Alert, 
  Chip,
  Button,
  Tooltip,
  Divider,
  IconButton
} from '@mui/material'
import { motion } from 'framer-motion'
import { FilterState } from '../types'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import TopicIcon from '@mui/icons-material/Topic'
import BusinessIcon from '@mui/icons-material/Business'
import PublicIcon from '@mui/icons-material/Public'
import CategoryIcon from '@mui/icons-material/Category'
import SourceIcon from '@mui/icons-material/Source'
import FlagIcon from '@mui/icons-material/Flag'
import LocationCityIcon from '@mui/icons-material/LocationCity'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import RefreshIcon from '@mui/icons-material/Refresh'

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
}

interface FilterOptions {
  end_years: string[];
  topics: string[];
  sectors: string[];
  regions: string[];
  pests: string[];
  sources: string[];
  countries: string[];
  cities: string[];
}

const initialFilterOptions: FilterOptions = {
  end_years: [],
  topics: [],
  sectors: [],
  regions: [],
  pests: [],
  sources: [],
  countries: [],
  cities: []
}

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(initialFilterOptions)
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    // Count active filters
    setActiveFiltersCount(
      Object.values(selectedFilters).filter(value => value && value !== '').length
    )
  }, [selectedFilters])

  const fetchFilterOptions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('http://localhost:5000/api/filters')
      if (!response.ok) {
        throw new Error('Failed to fetch filter options')
      }
      const data = await response.json()
      setFilterOptions(data)
    } catch (err) {
      setError('Error loading filters. Please try refreshing the page.')
      console.error('Error fetching filters:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: keyof FilterState) => (event: SelectChangeEvent) => {
    const newFilters = {
      ...selectedFilters,
      [field]: event.target.value
    }
    setSelectedFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearFilters = () => {
    setSelectedFilters({})
    onFilterChange({})
  }

  const handleRefreshFilters = () => {
    fetchFilterOptions()
  }

  const filterControls = [
    { field: 'end_year' as const, label: 'End Year', options: filterOptions.end_years, icon: <CalendarTodayIcon /> },
    { field: 'topic' as const, label: 'Topic', options: filterOptions.topics, icon: <TopicIcon /> },
    { field: 'sector' as const, label: 'Sector', options: filterOptions.sectors, icon: <BusinessIcon /> },
    { field: 'region' as const, label: 'Region', options: filterOptions.regions, icon: <PublicIcon /> },
    { field: 'pest' as const, label: 'PEST', options: filterOptions.pests, icon: <CategoryIcon /> },
    { field: 'source' as const, label: 'Source', options: filterOptions.sources, icon: <SourceIcon /> },
    { field: 'country' as const, label: 'Country', options: filterOptions.countries, icon: <FlagIcon /> },
    { field: 'city' as const, label: 'City', options: filterOptions.cities, icon: <LocationCityIcon /> }
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading filters...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefreshFilters}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterListIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            Filters
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip 
              label={activeFiltersCount} 
              color="primary" 
              size="small" 
              sx={{ ml: 1 }} 
            />
          )}
        </Box>
        <Box>
          <Tooltip title="Refresh filters">
            <IconButton onClick={handleRefreshFilters} size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear all filters">
            <IconButton 
              onClick={handleClearFilters} 
              size="small" 
              disabled={activeFiltersCount === 0}
            >
              <ClearAllIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filterControls.map(({ field, label, options, icon }) => (
            <motion.div key={field} variants={item}>
              <FormControl 
                fullWidth 
                variant="outlined" 
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              >
                <InputLabel>{label}</InputLabel>
                <Select
                  value={selectedFilters[field] || ''}
                  label={label}
                  onChange={handleFilterChange(field)}
                  startAdornment={
                    <Box sx={{ color: 'text.secondary', mr: 1 }}>
                      {icon}
                    </Box>
                  }
                >
                  <MenuItem value="">
                    <em>All {label}s</em>
                  </MenuItem>
                  {options.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </motion.div>
          ))}
        </Box>
      </motion.div>

      {activeFiltersCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              startIcon={<ClearAllIcon />}
              onClick={handleClearFilters}
              size="small"
            >
              Clear All Filters
            </Button>
          </Box>
        </motion.div>
      )}
    </Box>
  )
} 