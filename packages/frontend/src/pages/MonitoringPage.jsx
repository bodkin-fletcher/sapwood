import { Box, Paper } from '@mui/material';
import MonitoringDashboard from '../components/MonitoringDashboard';

const MonitoringPage = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <MonitoringDashboard />
      </Paper>
    </Box>
  );
};

export default MonitoringPage;
