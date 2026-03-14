import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ILayoutProps from '../types/ILayoutProps';

const AppLayout = ({ children }: ILayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <RouterLink to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              JoSOu ostel
            </RouterLink>
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">
            Home
          </Button>
          <Button color="inherit" component={RouterLink} to="/blog">
            Blog
          </Button>
          <Button color="inherit" component={RouterLink} to="/turbo-calculator">
            Turbo Calculator
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/kfa"
            sx={{ textTransform: 'none' }}
          >
            kfa
          </Button>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flex: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default AppLayout;
