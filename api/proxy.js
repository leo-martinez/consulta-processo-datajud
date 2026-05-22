const API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { tribunal, query } = req.body;

  const apiRes = await fetch(
    `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`,
    {
      method: "POST",
      headers: {
        Authorization: `APIKey ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const data = await apiRes.json();
  return res.status(200).json(data);
}
