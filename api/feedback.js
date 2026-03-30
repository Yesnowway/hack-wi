// api/feedback.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, username, deviceInfo, location } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';

  // Build a map link (same logic as log.js)
  let mapLink = '';
  if (location && location.lat && location.lon) {
    mapLink = `https://www.google.com/maps?q=${location.lat},${location.lon}`;
  } else {
    try {
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
      const geoData = await geoRes.json();
      const lat = geoData.latitude;
      const lon = geoData.longitude;
      if (lat && lon) {
        mapLink = `https://www.google.com/maps?q=${lat},${lon}`;
      } else {
        const query = encodeURIComponent(`${geoData.city || ''}, ${geoData.region || ''}`);
        mapLink = `https://www.google.com/maps/search/?api=1&query=${query}`;
      }
    } catch (err) {
      console.error('IP geolocation failed:', err);
      mapLink = '';
    }
  }

  const timestamp = new Date().toLocaleString();

  const telegramMessage = `📨 *Developer Message*\n✍️ *Message:* ${message}\n👤 *User:* ${username || 'Guest'}\n📱 *Device:* ${deviceInfo || 'Unknown'}\n🌍 *IP:* ${ip}\n🗺️ [Map Location](${mapLink})\n⏰ *Time:* ${timestamp}`;

  // Telegram bot credentials (same as log.js)
  const BOT_TOKEN = '7956448684:AAHA1Ka5G9NMAK-pHVnDADKg2AKS5gQhI5g';
  const CHAT_ID = '6941463365';

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: telegramMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.description);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Telegram error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}