module.exports = (req, res) => {
  res.json({
    status: 'ok',
    message: 'Koepon API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};