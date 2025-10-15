import DuneClient from '../../api/dune';

export default async function handler(req, res) {
  try {
    const protocol = req.query.protocol || 'ethereum';
    const data = await DuneClient.getProtocolData(protocol);
    res.status(200).json(data);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Failed to fetch protocol data' });
  }
}
