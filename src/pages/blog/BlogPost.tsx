import { useParams, Navigate } from 'react-router-dom';
import { Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import posts from './posts';

const BlogPost = () => {
  const { postNumber } = useParams<{ postNumber: string }>();
  const postId = parseInt(postNumber || '0', 10);
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const PostComponent = post.component;

  return (
    <Box>
      <Button component={RouterLink} to="/blog" sx={{ mb: 2 }}>
        &larr; Back to Blog
      </Button>
      <PostComponent />
    </Box>
  );
};

export default BlogPost;
