import { useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { AppBar, Box, Container, CssBaseline, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import StorageIcon from '@mui/icons-material/Storage'
import PrintIcon from '@mui/icons-material/Print'
import SettingsIcon from '@mui/icons-material/Settings'
import HomeIcon from '@mui/icons-material/Home'

// Import context providers
import { NodeProvider } from './context/NodeContext'
import { SettingsProvider } from './context/SettingsContext'

// Import pages
import NodeDisplayPage from './pages/NodeDisplayPage'
import SettingsPage from './pages/SettingsPage'
import WelcomePage from './pages/WelcomePage'
import DataWranglingPage from './pages/DataWranglingPage'
import MonitoringPage from './pages/MonitoringPage'

const drawerWidth = 240;

// Navigation items
const navItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Node Display', icon: <DashboardIcon />, path: '/nodes' },
  { text: 'Data Wrangling', icon: <StorageIcon />, path: '/data' },
  { text: 'Monitoring', icon: <DashboardIcon />, path: '/monitoring' },
  { text: 'Layout Display', icon: <PrintIcon />, path: '/layout' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.text : 'Sapwood';
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Sapwood
        </Typography>
      </Toolbar>
      <List>
        {navItems.map(({ text, icon, path }) => (
          <ListItem key={text} disablePadding>
            <ListItemButton
              component={Link}
              to={path}
              selected={location.pathname === path}
            >
              <ListItemIcon>
                {icon}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  ); return (
    <NodeProvider>
      <SettingsProvider>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar
            position="fixed"
            sx={{
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              ml: { sm: `${drawerWidth}px` },
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>          <Typography variant="h6" noWrap component="div">
                {getCurrentPageTitle()}
              </Typography>
            </Toolbar>
          </AppBar>
          <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            aria-label="navigation"
          >
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}
            >
              {drawer}
            </Drawer>
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: 'none', sm: 'block' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
              }}
              open
            >
              {drawer}
            </Drawer>
          </Box>      <Box
            component="main"
            sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
          >
            <Toolbar />        <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/nodes" element={<NodeDisplayPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/data" element={<DataWranglingPage />} />
              <Route path="/monitoring" element={<MonitoringPage />} />
              <Route path="/layout" element={
                <Container>
                  <Typography variant="h4" gutterBottom>
                    Layout Display
                  </Typography>
                  <Typography variant="body1">
                    This feature will be implemented in Sprint 5.
                  </Typography>
                </Container>
              } />
            </Routes></Box>
        </Box>
      </SettingsProvider>
    </NodeProvider>
  );
}

export default App
