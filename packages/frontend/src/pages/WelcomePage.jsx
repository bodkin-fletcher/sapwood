import { Box, Button, Container, Grid, Paper, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';

const WelcomePage = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ textAlign: 'center', mt: 4, mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Sapwood
        </Typography>
        <Typography variant="h5" component="div" color="text.secondary" gutterBottom>
          Integrating diverse nodes for streamlined automation
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6} lg={3}>          <Paper 
            component={Link} 
            to="/nodes" 
            sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              color: 'text.primary',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}
          >
            <DashboardIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Node Display
            </Typography>
            <Typography variant="body1">
              Create, configure, and visualize nodes with connections and status indicators
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>          <Paper 
            component={Link} 
            to="/data" 
            sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              color: 'text.primary',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}
          >
            <StorageIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Data Wrangling
            </Typography>
            <Typography variant="body1">
              Process and transform data between nodes
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Paper 
            component={Link} 
            to="/layout" 
            sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              color: 'text.secondary',
              bgcolor: 'background.default',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}
          >
            <PrintIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Layout Display
            </Typography>
            <Typography variant="body1">
              Generate printable SVG layouts for nodes and connections (Coming in Sprint 5)
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" disabled>Coming Soon</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Paper 
            component={Link} 
            to="/settings" 
            sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              color: 'text.primary',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}
          >
            <SettingsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Settings
            </Typography>
            <Typography variant="body1">
              Configure application settings including theme, heartbeat intervals and more
            </Typography>
          </Paper>
        </Grid>
      </Grid>      <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Sprint 3 - Data Wrangling Complete
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This version includes node management, connection visualization,
          and data wrangling capabilities. You can now view, edit, transform, and validate data
          flowing between nodes.
        </Typography>
      </Box>
    </Container>
  );
};

export default WelcomePage;
