const ROTAER_BASE_URL = 'https://api.decea.mil.br/aisweb';

export default async function handler(req, res) {
  const ROTAER_API_KEY = process.env.ROTAER_API_KEY;
  const ROTAER_API_PASS = process.env.ROTAER_API_PASS;
  if (!ROTAER_API_KEY || !ROTAER_API_PASS) {
    return res.status(500).json({ success: false, error: 'ROTAER_API_KEY / ROTAER_API_PASS não configuradas' });
  }

  const icao = String(req.query.icao || '').toUpperCase();
  const { area = 'rotaer', rowstart = 0, rowend = 100 } = req.query;

  try {
    const url = `${ROTAER_BASE_URL}/?apiKey=${ROTAER_API_KEY}&apiPass=${ROTAER_API_PASS}&area=${area}&icaoCode=${icao}&rowstart=${rowstart}&rowend=${rowend}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `ROTAER returned ${response.status}`,
        icao,
        area,
      });
    }

    const data = await response.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(data);
  } catch (error) {
    console.error(`[ROTAER] Error: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message, icao });
  }
}
