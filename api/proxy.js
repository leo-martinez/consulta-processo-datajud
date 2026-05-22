const API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

function buildNestedQuery(path, field, value) {
  return {
    nested: {
      path,
      query: { match: { [field]: value } }
    }
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { tribunal, tipo, valor, valorExtra, dataIni, dataFim, size, from } = req.body;

  let query;

  switch (tipo) {
    case "numero":
      query = { match: { numeroProcesso: valor } };
      break;

    case "parte":
      query = buildNestedQuery("partes", "partes.nome", valor);
      break;

    case "advogado":
      query = {
        nested: {
          path: "partes",
          query: {
            nested: {
              path: "partes.advogados",
              query: { match: { "partes.advogados.nome": valor } }
            }
          }
        }
      };
      break;

    case "oab":
      const oabQuery = { match: { "partes.advogados.numeroOAB": valor } };
      const oabFinal = valorExtra
        ? { bool: { must: [oabQuery, { match: { "partes.advogados.ufOAB": valorExtra } }] } }
        : oabQuery;
      query = {
        nested: {
          path: "partes",
          query: { nested: { path: "partes.advogados", query: oabFinal } }
        }
      };
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
      return res.status(400).json({ error: "Tipo de busca inválido" });
  }

  const sort = tipo !== "numero" ? [{ dataAjuizamento: { order: "desc" } }] : undefined;

  const body = { query, size: size || 10, from: from || 0 };
  if (sort) body.sort = sort;

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

  const data = await apiRes.json();
  return res.status(200).json(data);
}
