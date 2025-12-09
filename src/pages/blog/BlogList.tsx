import { Typography, Card, CardContent, CardActions, Button, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import posts from './posts';

const BlogList = () => {
  return (
    <>
      <Typography variant="h3" component="h1" gutterBottom>
        Blog
      </Typography>
      <Grid container spacing={3}>
        {posts.map((post) => (
          <Grid size={12} key={post.id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2">
                  {post.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {post.date}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {post.summary}
                </Typography>
              </CardContent>
              <CardActions>
                <Button component={RouterLink} to={`/blog/${post.id}`}>
                  Read More
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default BlogList;
