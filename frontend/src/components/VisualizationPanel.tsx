import { useState } from 'react'
import { Box, Tab, Tabs, Typography } from '@mui/material'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'
import { DataItem } from '../types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
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
    },
  },
}

const barOptions: ChartOptions<'bar'> = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    title: {
      display: true,
      text: 'Intensity by Sector',
    },
  },
}

const pieOptions: ChartOptions<'pie'> = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    title: {
      display: true,
      text: 'Likelihood by Region',
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
    },
  },
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, height: '400px' }}>
          {children}
        </Box>
      )}
    </div>
  )
}

export default function VisualizationPanel({ data }: VisualizationPanelProps) {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
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
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
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
          `hsl(${(index * 360) / Object.keys(regionData).length}, 70%, 60%)`
        ),
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
        tension: 0.1,
        fill: true,
      },
    ],
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Sector Analysis" />
          <Tab label="Regional Distribution" />
          <Tab label="Time Trends" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Intensity Distribution by Sector
        </Typography>
        <Bar options={barOptions} data={sectorChartData} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Likelihood Distribution by Region
        </Typography>
        <Pie options={pieOptions} data={regionChartData} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Relevance Trends Over Time
        </Typography>
        <Line options={lineOptions} data={timeChartData} />
      </TabPanel>
    </Box>
  )
} 