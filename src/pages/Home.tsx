import { Typography, Card, CardContent, CardActions, Button, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Home = () => {
  return (
    <>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Blog
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Technical articles and thoughts
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={RouterLink} to="/blog">
                View Blog
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Utilities
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Useful calculators and tools
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={RouterLink} to="/utils/compound-turbo-calculator">
                Turbo Calculator
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default Home;
