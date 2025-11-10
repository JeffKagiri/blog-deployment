const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://Jeff:Jeff6595@cluster0.nfko3ho.mongodb.net/blog?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB database: blog');
});

// Post Model
const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: { 
        type: Date,
        default: Date.now
    }
});

const Post = mongoose.model('Post', postSchema);

// Routes

// Health check route
app.get('/api', (req, res) => {
    res.json({ 
        message: 'Blog API is running!',
        timestamp: new Date().toISOString()
    });
});

// GET all posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({
            message: 'Failed to fetch posts'
        });
    }
});

// CREATE a new post
app.post('/api/posts', async (req, res) => {
    try {
        if (!req.body.title || !req.body.content) {
            return res.status(400).json({
                message: 'Title and content are required'
            });
        }

        const post = new Post({
            title: req.body.title.trim(),
            content: req.body.content.trim()
        });
        
        const newPost = await post.save();
        res.status(201).json(newPost);
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(400).json({
            message: 'Failed to create post'
        });
    }
});

// UPDATE a post
app.put('/api/posts/:id', async (req, res) => {
    try {
        if (!req.body.title || !req.body.content) {
            return res.status(400).json({
                message: 'Title and content are required'
            });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id, 
            {
                title: req.body.title.trim(),
                content: req.body.content.trim(),
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        res.json(updatedPost);
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(400).json({
            message: 'Failed to update post'
        });
    }
});

// DELETE a post
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        
        if (!deletedPost) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({
            message: 'Failed to delete post'
        });
    }
});

// Simple 404 handler for API routes
app.use('/api', (req, res) => {
    res.status(404).json({
        message: 'API endpoint not found'
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📝 API available at: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down server gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
});