import { Typography, Card, CardContent, CardActions, Button, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Home = () => {
  return (
    <>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
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
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2">
                Turbo Calculator
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Compound turbo boost ratio calculator
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={RouterLink} to="/turbo-calculator">
                Open Calculator
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" sx={{ textTransform: 'none' }}>
                kfa
              </Typography>
              <Typography variant="body2" color="text.secondary">
                QWERTY phonetic alphabet translator
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={RouterLink} to="/kfa">
                Open Translator
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default Home;
