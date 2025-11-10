import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { Delete, Edit, Save, Cancel } from '@mui/icons-material';
import './App.css';

// UPDATE THIS LINE - Add /api prefix
const API_URL = 'http://localhost:5000/api/posts';

function App() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all posts - UPDATED to handle new response format
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      // UPDATE: Extract data from the new response format
      setPosts(response.data.data || response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch posts. Make sure the backend server is running.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Create new post - UPDATED to handle new response format
  const handleAddPost = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please fill in both title and content');
      return;
    }

    try {
      await axios.post(API_URL, { title, content });
      setTitle('');
      setContent('');
      setSuccess('Post created successfully!');
      fetchPosts();
    } catch (err) {
      setError('Failed to create post. Check your connection.');
      console.error('Error creating post:', err);
    }
  };

  // Update post - UPDATED URL format
  const handleUpdatePost = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please fill in both title and content');
      return;
    }

    try {
      await axios.put(`${API_URL}/${editingPost._id}`, { title, content });
      setEditingPost(null);
      setTitle('');
      setContent('');
      setSuccess('Post updated successfully!');
      fetchPosts();
    } catch (err) {
      setError('Failed to update post.');
      console.error('Error updating post:', err);
    }
  };

  // Delete post - UPDATED URL format
  const handleDeletePost = async (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        setSuccess('Post deleted successfully!');
        fetchPosts();
      } catch (err) {
        setError('Failed to delete post.');
        console.error('Error deleting post:', err);
      }
    }
  };

  // Start editing post
  const handleEditPost = (post) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setError('');
    setSuccess('');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingPost(null);
    setTitle('');
    setContent('');
    setError('');
    setSuccess('');
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="app">
      <AppBar position="static" className="app-bar">
        <Toolbar>
          <Typography variant="h6" className="app-title">
            MERN Blog Platform
          </Typography>
        </Toolbar>
      </AppBar>

      <Container className="container" maxWidth="lg">
        {/* Success/Error Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Add/Edit Post Card */}
        <Card className="card" sx={{ mb: 4 }}>
          <CardContent className="card-content">
            <Typography variant="h5" gutterBottom color="primary">
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </Typography>
            <TextField
              fullWidth
              label="Post Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              margin="normal"
              variant="outlined"
              placeholder="Enter a catchy title..."
            />
            <TextField
              fullWidth
              label="Post Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              margin="normal"
              variant="outlined"
              multiline
              rows={4}
              placeholder="Write your blog post content here..."
            />
          </CardContent>
          <CardActions className="card-actions">
            {editingPost ? (
              <>
                <Button
                  startIcon={<Save />}
                  onClick={handleUpdatePost}
                  className="update-button"
                  variant="contained"
                  size="large"
                >
                  Update Post
                </Button>
                <Button
                  startIcon={<Cancel />}
                  onClick={handleCancelEdit}
                  className="cancel-button"
                  variant="contained"
                  size="large"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={handleAddPost}
                className="add-post-button"
                variant="contained"
                size="large"
                disabled={!title.trim() || !content.trim()}
              >
                Add Post
              </Button>
            )}
          </CardActions>
        </Card>

        {/* Posts List */}
        {loading ? (
          <div className="loading">
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Loading posts...</Typography>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <Typography variant="h5" gutterBottom color="textSecondary">
              No Posts Yet
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Create your first blog post above to get started!
            </Typography>
          </div>
        ) : (
          <Grid container spacing={3} className="posts-grid">
            {posts.map((post) => (
              <Grid item xs={12} md={6} lg={4} key={post._id}>
                <Card className="card">
                  <CardContent className="card-content">
                    <Typography variant="h6" className="post-title">
                      {post.title}
                    </Typography>
                    <Typography variant="body2" className="post-date" color="textSecondary">
                      Created: {formatDate(post.createdAt)}
                      {post.updatedAt !== post.createdAt && 
                        ` • Updated: ${formatDate(post.updatedAt)}`
                      }
                    </Typography>
                    <Typography variant="body1" className="post-content">
                      {post.content}
                    </Typography>
                  </CardContent>
                  <CardActions className="card-actions">
                    <Button
                      startIcon={<Edit />}
                      onClick={() => handleEditPost(post)}
                      className="edit-button"
                      variant="contained"
                      size="small"
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<Delete />}
                      onClick={() => handleDeletePost(post._id)}
                      className="delete-button"
                      variant="contained"
                      size="small"
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </div>
  );
}

export default App;