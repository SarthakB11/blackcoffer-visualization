import { Grid, Paper, Typography, Skeleton } from '@mui/material'
import { Metrics } from '../types'

interface MetricsPanelProps {
  metrics: Metrics;
  loading?: boolean;
}

export default function MetricsPanel({ metrics, loading = false }: MetricsPanelProps) {
  const metricCards = [
    {
      title: 'Total Records',
      value: metrics.total_records,
      color: '#2196f3'
    },
    {
      title: 'Average Intensity',
      value: metrics.avg_intensity,
      color: '#f44336'
    },
    {
      title: 'Average Likelihood',
      value: metrics.avg_likelihood,
      color: '#4caf50'
    },
    {
      title: 'Average Relevance',
      value: metrics.avg_relevance,
      color: '#ff9800'
    }
  ]

  return (
    <Grid container spacing={3}>
      {metricCards.map((metric) => (
        <Grid item xs={12} sm={6} md={3} key={metric.title}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: metric.color,
              color: 'white'
            }}
          >
            <Typography variant="h6" component="div" gutterBottom>
              {metric.title}
            </Typography>
            {loading ? (
              <Skeleton 
                variant="rectangular" 
                width={100} 
                height={48} 
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} 
              />
            ) : (
              <Typography variant="h4" component="div">
                {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}
              </Typography>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  )
} 