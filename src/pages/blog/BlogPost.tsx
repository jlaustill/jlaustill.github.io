import { useParams, Navigate } from 'react-router-dom';
import { Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import posts from './posts';
import { SITE_URL } from '../../constants';

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
      <Helmet>
        <title>{`${post.title} | joSUu ostel`}</title>
        <meta name="description" content={post.summary} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.summary} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${SITE_URL}/blog/${post.id}`} />
      </Helmet>
      <Button component={RouterLink} to="/blog" sx={{ mb: 2 }}>
        &larr; Back to Blog
      </Button>
      <PostComponent />
    </Box>
  );
};

export default BlogPost;
