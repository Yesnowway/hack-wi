// api/feedback.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, username, deviceInfo } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';

  const telegramMessage = `📨 MESSAGE FROM\n👤 User: ${username || 'Guest'}\n📱 Device: ${deviceInfo || 'Unknown'}\n🌍 IP: ${ip}\n✍️ Message: ${message}`;

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
        disable_web_page_preview: true// api/feedback.js
                                      export default async function handler(req, res) {
                                        // Only accept POST requests
                                        if (req.method !== 'POST') {
                                          return res.status(405).json({ error: 'Method not allowed' });
                                        }

                                        try {
                                          // Parse request body
                                          const { message, username, deviceInfo } = req.body;

                                          // Basic validation
                                          if (!message || message.trim() === '') {
                                            return res.status(400).json({ error: 'Message is required' });
                                          }

                                          // Get IP address
                                          const ip = req.headers['x-forwarded-for'] ||
                                                     req.headers['x-real-ip'] ||
                                                     req.connection?.remoteAddress ||
                                                     'unknown';

                                          // Build Telegram message
                                          const telegramMessage = `📨 MESSAGE FROM\n👤 User: ${username || 'Guest'}\n📱 Device: ${deviceInfo || 'Unknown'}\n🌍 IP: ${ip}\n✍️ Message: ${message}`;

                                          // Your bot credentials
                                          const BOT_TOKEN = '7956448684:AAHA1Ka5G9NMAK-pHVnDADKg2AKS5gQhI5g';
                                          const CHAT_ID = '6941463365';

                                          // Send to Telegram
                                          const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
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

                                          if (!result.ok) {
                                            console.error('Telegram API error:', result);
                                            return res.status(500).json({ error: 'Telegram send failed', details: result.description });
                                          }

                                          return res.status(200).json({ success: true });
                                        } catch (error) {
                                          console.error('Feedback handler error:', error);
                                          return res.status(500).json({ error: 'Internal server error' });
                                        }
                                      }
      })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.description);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Telegram error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
