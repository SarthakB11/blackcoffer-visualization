import { useState } from 'react'
import { Box, Tab, Tabs, Typography, Paper, Tooltip, IconButton, Divider } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  ChartOptions
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'
import { DataItem } from '../types'
import BarChartIcon from '@mui/icons-material/BarChart'
import PieChartIcon from '@mui/icons-material/PieChart'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import InfoIcon from '@mui/icons-material/Info'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import DownloadIcon from '@mui/icons-material/Download'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
)

interface VisualizationPanelProps {
  data: DataItem[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        font: {
          family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
          size: 12
        },
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        size: 14,
        weight: 'bold' as const
      },
      bodyFont: {
        family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        size: 13
      },
      padding: 12,
      cornerRadius: 8,
      displayColors: true
    }
  },
  animation: {
    duration: 2000,
    easing: 'easeOutQuart' as const
  }
}

const barOptions: ChartOptions<'bar'> = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    title: {
      display: true,
      text: 'Intensity by Sector',
      font: {
        family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        size: 16,
        weight: 'bold' as const
      },
      padding: {
        top: 10,
        bottom: 20
      }
    },
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        }
      }
    }
  }
}

const pieOptions: ChartOptions<'pie'> = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    title: {
      display: true,
      text: 'Likelihood by Region',
      font: {
        family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        size: 16,
        weight: 'bold' as const
      },
      padding: {
        top: 10,
        bottom: 20
      }
    },
  },
}

const lineOptions: ChartOptions<'line'> = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    title: {
      display: true,
      text: 'Relevance Over Time',
      font: {
        family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        size: 16,
        weight: 'bold' as const
      },
      padding: {
        top: 10,
        bottom: 20
      }
    },
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        }
      }
    }
  }
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      <AnimatePresence mode="wait">
        {value === index && (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ p: 3, height: '450px' }}>
              {children}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function VisualizationPanel({ data }: VisualizationPanelProps) {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleDownloadChart = () => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const link = document.createElement('a')
      link.download = `chart-${tabValue}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  // Prepare data for intensity by sector
  const sectorData = data.reduce((acc: { [key: string]: number }, item) => {
    if (item.sector && item.sector !== 'Unknown') {
      acc[item.sector] = (acc[item.sector] || 0) + (item.intensity || 0)
    }
    return acc
  }, {})

  const sectorChartData = {
    labels: Object.keys(sectorData),
    datasets: [
      {
        label: 'Intensity by Sector',
        data: Object.values(sectorData),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(54, 162, 235, 0.9)',
      },
    ],
  }

  // Prepare data for likelihood by region
  const regionData = data.reduce((acc: { [key: string]: number }, item) => {
    if (item.region && item.region !== 'Unknown') {
      acc[item.region] = (acc[item.region] || 0) + (item.likelihood || 0)
    }
    return acc
  }, {})

  const regionChartData = {
    labels: Object.keys(regionData),
    datasets: [
      {
        label: 'Likelihood by Region',
        data: Object.values(regionData),
        backgroundColor: Object.keys(regionData).map((_, index) => 
          `hsla(${(index * 360) / Object.keys(regionData).length}, 80%, 65%, 0.8)`
        ),
        borderColor: Object.keys(regionData).map((_, index) => 
          `hsla(${(index * 360) / Object.keys(regionData).length}, 80%, 45%, 1)`
        ),
        borderWidth: 1,
        hoverBackgroundColor: Object.keys(regionData).map((_, index) => 
          `hsla(${(index * 360) / Object.keys(regionData).length}, 80%, 65%, 1)`
        ),
        hoverOffset: 10,
      },
    ],
  }

  // Prepare data for relevance over time
  const timeData = data.reduce((acc: { [key: string]: number }, item) => {
    if (item.end_year && item.end_year !== 'Unknown') {
      acc[item.end_year] = (acc[item.end_year] || 0) + (item.relevance || 0)
    }
    return acc
  }, {})

  const timeChartData = {
    labels: Object.keys(timeData).sort(),
    datasets: [
      {
        label: 'Relevance Over Time',
        data: Object.keys(timeData).sort().map(key => timeData[key]),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(75, 192, 192)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const tabInfo = [
    {
      label: "Sector Analysis",
      icon: <BarChartIcon />,
      description: "Shows intensity distribution across different sectors",
    },
    {
      label: "Regional Distribution",
      icon: <PieChartIcon />,
      description: "Displays likelihood distribution by geographical regions",
    },
    {
      label: "Time Trends",
      icon: <ShowChartIcon />,
      description: "Visualizes relevance trends over different time periods",
    }
  ]

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Data Visualizations
        </Typography>
        <Box>
          <Tooltip title="Download chart">
            <IconButton onClick={handleDownloadChart} size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={tabInfo[tabValue].description}>
            <IconButton size="small">
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />

      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2, 
          overflow: 'hidden',
          border: '1px solid rgba(0, 0, 0, 0.08)'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: '60px',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)'
                }
              },
              '& .Mui-selected': {
                fontWeight: 'bold'
              }
            }}
          >
            {tabInfo.map((tab, index) => (
              <Tab 
                key={index}
                label={tab.label} 
                icon={tab.icon} 
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Bar options={barOptions} data={sectorChartData} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Pie options={pieOptions} data={regionChartData} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Line options={lineOptions} data={timeChartData} />
        </TabPanel>
      </Paper>
    </Box>
  )
} 