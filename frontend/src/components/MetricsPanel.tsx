import { Grid, Paper, Typography, Skeleton, Box } from '@mui/material'
import { Metrics } from '../types'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import BarChartIcon from '@mui/icons-material/BarChart'
import SpeedIcon from '@mui/icons-material/Speed'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import AssessmentIcon from '@mui/icons-material/Assessment'

interface MetricsPanelProps {
  metrics: Metrics;
  loading?: boolean;
}

export default function MetricsPanel({ metrics, loading = false }: MetricsPanelProps) {
  const metricCards = [
    {
      title: 'Total Records',
      value: metrics.total_records,
      color: '#2196f3',
      icon: <BarChartIcon fontSize="large" />,
      gradient: 'linear-gradient(135deg, #2196f3 0%, #0d47a1 100%)'
    },
    {
      title: 'Average Intensity',
      value: metrics.avg_intensity,
      color: '#f44336',
      icon: <SpeedIcon fontSize="large" />,
      gradient: 'linear-gradient(135deg, #f44336 0%, #b71c1c 100%)'
    },
    {
      title: 'Average Likelihood',
      value: metrics.avg_likelihood,
      color: '#4caf50',
      icon: <TrendingUpIcon fontSize="large" />,
      gradient: 'linear-gradient(135deg, #4caf50 0%, #1b5e20 100%)'
    },
    {
      title: 'Average Relevance',
      value: metrics.avg_relevance,
      color: '#ff9800',
      icon: <AssessmentIcon fontSize="large" />,
      gradient: 'linear-gradient(135deg, #ff9800 0%, #e65100 100%)'
    }
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
        Key Metrics
      </Typography>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
      >
        <Grid container spacing={3}>
          {metricCards.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={metric.title}>
              <motion.div variants={item}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    background: metric.gradient,
                    color: 'white',
                    height: '100%',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                      {metric.title}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      p: 1
                    }}>
                      {metric.icon}
                    </Box>
                  </Box>
                  
                  {loading ? (
                    <Skeleton 
                      variant="rectangular" 
                      width="100%" 
                      height={48} 
                      sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }} 
                    />
                  ) : (
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mt: 'auto' }}>
                      {typeof metric.value === 'number' ? (
                        <CountUp 
                          end={metric.value} 
                          decimals={1} 
                          duration={2} 
                          separator="," 
                        />
                      ) : (
                        metric.value
                      )}
                    </Typography>
                  )}
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Box>
  )
} 