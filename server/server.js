const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Fixed CORS for Azure deployment
const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL, // Add your Azure frontend URL here
    // Add your actual Azure URLs like:
    // 'https://your-frontend-app.azurewebsites.net'
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(undefined)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());

// MongoDB Connection - Removed deprecated options
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Connected to MongoDB database'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

const db = mongoose.connection;
db.on('error', console.error.bind(console, '❌ MongoDB connection error:'));
db.on('disconnected', () => console.log('⚠️ MongoDB disconnected'));
db.on('reconnected', () => console.log('✅ MongoDB reconnected'));

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
app.get('/', (req, res) => {
    res.json({ 
        message: 'Blog API is running!',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

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
            message: 'Failed to fetch posts',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
            message: 'Failed to create post',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
            message: 'Failed to update post',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
            message: 'Failed to delete post',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Simple 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        message: 'API endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📝 API available at: http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down server gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n👋 SIGTERM received, shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
});
