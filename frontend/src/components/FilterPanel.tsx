import { useState, useEffect } from 'react'
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, CircularProgress, Alert } from '@mui/material'
import { FilterState } from '../types'

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

  useEffect(() => {
    fetchFilterOptions()
  }, [])

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

  const filterControls = [
    { field: 'end_year' as const, label: 'End Year', options: filterOptions.end_years },
    { field: 'topic' as const, label: 'Topic', options: filterOptions.topics },
    { field: 'sector' as const, label: 'Sector', options: filterOptions.sectors },
    { field: 'region' as const, label: 'Region', options: filterOptions.regions },
    { field: 'pest' as const, label: 'PEST', options: filterOptions.pests },
    { field: 'source' as const, label: 'Source', options: filterOptions.sources },
    { field: 'country' as const, label: 'Country', options: filterOptions.countries },
    { field: 'city' as const, label: 'City', options: filterOptions.cities }
  ]

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filterControls.map(({ field, label, options }) => (
          <FormControl key={field} fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select
              value={selectedFilters[field] || ''}
              label={label}
              onChange={handleFilterChange(field)}
            >
              <MenuItem value="">All</MenuItem>
              {options.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      </Box>
    </Box>
  )
} 