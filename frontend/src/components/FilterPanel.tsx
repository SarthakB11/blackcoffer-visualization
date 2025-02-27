import { useState, useEffect } from 'react'
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
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

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    end_years: [],
    topics: [],
    sectors: [],
    regions: [],
    pests: [],
    sources: [],
    countries: [],
    cities: []
  })

  const [selectedFilters, setSelectedFilters] = useState<FilterState>({})

  useEffect(() => {
    // Fetch filter options from API
    fetch('http://localhost:5000/api/filters')
      .then(res => res.json())
      .then(data => setFilterOptions(data))
      .catch(err => console.error('Error fetching filters:', err))
  }, [])

  const handleFilterChange = (field: keyof FilterState) => (event: any) => {
    const newFilters = {
      ...selectedFilters,
      [field]: event.target.value
    }
    setSelectedFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* End Year Filter */}
        <FormControl fullWidth>
          <InputLabel>End Year</InputLabel>
          <Select
            value={selectedFilters.end_year || ''}
            label="End Year"
            onChange={handleFilterChange('end_year')}
          >
            <MenuItem value="">All</MenuItem>
            {filterOptions.end_years.map(year => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Topic Filter */}
        <FormControl fullWidth>
          <InputLabel>Topic</InputLabel>
          <Select
            value={selectedFilters.topic || ''}
            label="Topic"
            onChange={handleFilterChange('topic')}
          >
            <MenuItem value="">All</MenuItem>
            {filterOptions.topics.map(topic => (
              <MenuItem key={topic} value={topic}>{topic}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sector Filter */}
        <FormControl fullWidth>
          <InputLabel>Sector</InputLabel>
          <Select
            value={selectedFilters.sector || ''}
            label="Sector"
            onChange={handleFilterChange('sector')}
          >
            <MenuItem value="">All</MenuItem>
            {filterOptions.sectors.map(sector => (
              <MenuItem key={sector} value={sector}>{sector}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Region Filter */}
        <FormControl fullWidth>
          <InputLabel>Region</InputLabel>
          <Select
            value={selectedFilters.region || ''}
            label="Region"
            onChange={handleFilterChange('region')}
          >
            <MenuItem value="">All</MenuItem>
            {filterOptions.regions.map(region => (
              <MenuItem key={region} value={region}>{region}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* PEST Filter */}
        <FormControl fullWidth>
          <InputLabel>PEST</InputLabel>
          <Select
            value={selectedFilters.pest || ''}
            label="PEST"
            onChange={handleFilterChange('pest')}
          >
            <MenuItem value="">All</MenuItem>
            {filterOptions.pests.map(pest => (
              <MenuItem key={pest} value={pest}>{pest}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Source Filter */}
        <FormControl fullWidth>
          <InputLabel>Source</InputLabel>
          <Select
            value={selectedFilters.source || ''}
            label="Source"
            onChange={handleFilterChange('source')}
          >
            <MenuItem value="">All</MenuItem>
            {filterOptions.sources.map(source => (
              <MenuItem key={source} value={source}>{source}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Country Filter */}
        <FormControl fullWidth>
          <InputLabel>Country</InputLabel>
          <Select
            value={selectedFilters.country || ''}
            label="Country"
            onChange={handleFilterChange('country')}
          >
            <MenuItem value="">All</MenuItem>
            {filterOptions.countries.map(country => (
              <MenuItem key={country} value={country}>{country}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* City Filter */}
        <FormControl fullWidth>
          <InputLabel>City</InputLabel>
          <Select
            value={selectedFilters.city || ''}
            label="City"
            onChange={handleFilterChange('city')}
          >
            <MenuItem value="">All</MenuItem>
            {filterOptions.cities.map(city => (
              <MenuItem key={city} value={city}>{city}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  )
} 