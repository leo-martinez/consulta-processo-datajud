const API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { tribunal, tipo, valor, valorExtra, dataIni, dataFim, size, from } = req.body;

  let query;
  let sort = [{ dataAjuizamento: { order: "desc" } }];

  switch (tipo) {
    case "numero":
      query = { match: { numeroProcesso: valor } };
      sort = undefined;
      break;
    case "parte":
      query = { match: { "partes.nome": valor } };
      break;
    case "advogado":
      query = { match: { "partes.advogados.nome": valor } };
      break;
    case "oab":
      query = valorExtra
        ? { bool: { must: [
            { match: { "partes.advogados.numeroOAB": valor } },
            { match: { "partes.advogados.ufOAB": valorExtra } }
          ]}}
        : { match: { "partes.advogados.numeroOAB": valor } };
      break;
    case "orgao":
      query = { match: { "orgaoJulgador.nome": valor } };
      break;
    case "periodo":
      const range = {};
      if (dataIni) range.gte = dataIni;
      if (dataFim) range.lte = dataFim + "T23:59:59";
      query = { range: { dataAjuizamento: range } };
      break;
    default:
      return res.status(400).json({ error: "Tipo inválido" });
  }

  const body = { query, size: size || 10, from: from || 0 };
  if (sort) body.sort = sort;

  try {
    const apiRes = await fetch(
      `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`,
      {
        method: "POST",
        headers: {
          Authorization: `APIKey ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const text = await apiRes.text();
    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: text });
    }
    return res.status(200).json(JSON.parse(text));
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
