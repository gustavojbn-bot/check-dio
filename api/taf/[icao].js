const TAF_BASE_URL_NOVO = 'https://api-redemet.decea.mil.br/mensagens/taf';
const TAF_BASE_URL_ANTIGO = 'https://api-redemet.decea.gov.br/api/taf';

export default async function handler(req, res) {
  const REDEMET_API_KEY = process.env.REDEMET_API_KEY;
  if (!REDEMET_API_KEY) {
    return res.status(500).json({ success: false, error: 'REDEMET_API_KEY não configurada' });
  }

  const icao = String(req.query.icao || '').toUpperCase();
  const { data_ini, data_fim } = req.query;

  try {
    const url = `${TAF_BASE_URL_NOVO}/${icao}?data_ini=${data_ini || '2026080100'}&data_fim=${data_fim || '2026083100'}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-Api-Key': REDEMET_API_KEY, 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.text();
      try {
        return res.status(200).json({ success: true, data: JSON.parse(data), endpoint: 'NOVO (.mil.br)', statusCode: 200 });
      } catch {
        return res.status(200).json({ success: true, data: { raw: data }, endpoint: 'NOVO (.mil.br)', statusCode: 200 });
      }
    }
    console.log('[TAF] Fallback to antigo...');
  } catch (error) {
    console.warn(`[TAF] Error: ${error.message}`);
  }

  // Fallback
  try {
    const url = `${TAF_BASE_URL_ANTIGO}/${icao}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-Api-Key': REDEMET_API_KEY, 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.text();
      try {
        return res.status(200).json({ success: true, data: JSON.parse(data), endpoint: 'ANTIGO (.gov.br)', statusCode: 200 });
      } catch {
        return res.status(200).json({ success: true, data: { raw: data }, endpoint: 'ANTIGO (.gov.br)', statusCode: 200 });
      }
    }

    return res.status(response.status).json({
      success: false,
      error: `RedMET returned ${response.status}`,
      icao,
      endpoint: 'ANTIGO (.gov.br)',
    });
  } catch (error) {
    console.error(`[TAF] Error: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message, icao });
  }
}
