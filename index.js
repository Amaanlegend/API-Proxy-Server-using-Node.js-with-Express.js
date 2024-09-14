require('dotenv').config();
const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const winston = require('winston');

const app = express();
const cache = new NodeCache();
const port = process.env.PORT || 3000;

// Logger setup

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Rate limiter middleware

const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 5, 
  message: 'Too many requests, please try again later',
  handler: (req, res, next, options) => {
    res.status(options.statusCode).send(options.message);
    logger.info({
      message: 'Rate limit exceeded',
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  }
});

// Apply rate limiter middleware to all requests

app.use(limiter);

// Proxy route
app.get('/proxy', async (req, res) => {
  const url = 'https://api.github.com'; 
  const cacheKey = url;

  const cachedResponse = cache.get(cacheKey);
  if (cachedResponse) {
    logger.info({
      message: 'Serving from cache',
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    return res.json(cachedResponse);
  }

  try {
    const response = await axios.get(url);
    cache.set(cacheKey, response.data, process.env.CACHE_DURATION || 300);
    logger.info({
      message: 'Request successful',
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    return res.json(response.data);
  } catch (error) {
    logger.error({
      message: 'Error calling external API',
      ip: req.ip,
      timestamp: new Date().toISOString(),
      error: error.message,
    });
    res.status(500).json({ error: 'Error calling external API' });
  }
});

// Authentication middleware

const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (token === process.env.AUTH_TOKEN) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Apply authentication to the proxy route

app.use('/proxy', authenticate);

// Start the server

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
