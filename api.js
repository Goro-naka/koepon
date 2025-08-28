// Simple health check endpoint for debugging
module.exports = async (req, res) => {
  try {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      service: 'koepon-api',
      path: req.url,
      method: req.method
    });
  } catch (error) {
    console.error('Function error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
};