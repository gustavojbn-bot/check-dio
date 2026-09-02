export default function handler(req, res) {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/metar/:icao',
      'GET /api/taf/:icao',
      'GET /api/rotaer/:icao',
      'POST /api/admin/criar-usuario',
      'GET /api/health',
    ],
  });
}
