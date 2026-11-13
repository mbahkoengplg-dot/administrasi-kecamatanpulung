// Vercel Serverless Function Proxy for Google Apps Script (GAS)
// Automatically mounted at /api/gas when deployed on Vercel.

interface ProxyRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ProxyResponse {
  status: (code: number) => ProxyResponse;
  setHeader: (name: string, value: string) => void;
  json: (data: unknown) => void;
  send: (body: unknown) => void;
  end: () => void;
}

const getEnv = (key: string): string => {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return (proc?.env?.[key] || '').trim();
};

export default async function handler(req: ProxyRequest, res: ProxyResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const gasUrl = getEnv('GAS_URL');
  const gasApiKey = getEnv('GAS_API_KEY') || getEnv('API_KEY');

  // Health check / status check
  if (req.method === 'GET') {
    const fileIdParam = req.query?.fileId;
    const fileId = Array.isArray(fileIdParam) ? fileIdParam[0] : fileIdParam;

    if (!fileId) {
      return res.status(200).json({
        success: true,
        configured: Boolean(gasUrl),
        hasApiKey: Boolean(gasApiKey),
      });
    }

    // Stream private Google Drive file through Vercel proxy so KTP/KK never become public links
    if (!gasUrl) {
      return res.status(503).json({ success: false, error: 'GAS_URL belum diatur di Vercel.' });
    }

    try {
      const upstream = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'get_file',
          api_key: gasApiKey,
          payload: { fileId },
        }),
        redirect: 'follow',
      });

      const rawText = await upstream.text();
      let parsed: { success?: boolean; mimeType?: string; fileName?: string; base64Data?: string; error?: string };
      try {
        parsed = JSON.parse(rawText);
      } catch {
        return res.status(502).json({ success: false, error: 'Respons GAS tidak valid saat mengambil berkas.' });
      }

      if (!parsed.success || !parsed.base64Data) {
        return res.status(404).json({ success: false, error: parsed.error || 'Berkas tidak ditemukan.' });
      }

      const globalBuffer = (globalThis as { Buffer?: { from: (data: string, encoding: string) => Uint8Array } }).Buffer;
      const bytes = globalBuffer
        ? globalBuffer.from(parsed.base64Data, 'base64')
        : Uint8Array.from(atob(parsed.base64Data), (c) => c.charCodeAt(0));

      res.setHeader('Content-Type', parsed.mimeType || 'application/octet-stream');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      if (parsed.fileName) {
        res.setHeader('Content-Disposition', `inline; filename="${parsed.fileName.replace(/"/g, '')}"`);
      }
      return res.status(200).send(bytes);
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Gagal mengambil berkas dari Google Drive.',
      });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method tidak diizinkan.' });
  }

  if (!gasUrl) {
    return res.status(200).json({
      success: false,
      configured: false,
      code: 'GAS_NOT_CONFIGURED',
      error: 'GAS_URL belum dikonfigurasi di Environment Variables Vercel.',
    });
  }

  try {
    let bodyObj: { action?: string; payload?: Record<string, unknown> } = {};
    if (typeof req.body === 'string') {
      bodyObj = JSON.parse(req.body);
    } else if (req.body && typeof req.body === 'object') {
      bodyObj = req.body as { action?: string; payload?: Record<string, unknown> };
    }

    if (!bodyObj.action) {
      return res.status(400).json({ success: false, error: 'Parameter action wajib diisi.' });
    }

    // Forward request to Google Apps Script Web App with secret API_KEY
    const upstream = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: bodyObj.action,
        api_key: gasApiKey,
        payload: bodyObj.payload || {},
      }),
      redirect: 'follow',
    });

    const rawText = await upstream.text();
    try {
      const json = JSON.parse(rawText);
      return res.status(200).json({ ...json, configured: true });
    } catch {
      return res.status(502).json({
        success: false,
        configured: true,
        error: 'Respons dari Google Apps Script bukan JSON valid. Pastikan Web App di-deploy dengan akses Anyone.',
        rawPreview: rawText.slice(0, 200),
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      configured: true,
      error: err instanceof Error ? err.message : 'Gagal menghubungi Google Apps Script.',
    });
  }
}
