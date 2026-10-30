import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import http from "node:http";
import https from "node:https";
import { createClient } from "@supabase/supabase-js";
import { parseIngredientLine } from "../../utils/parse-recipe-text";

export const runtime = "nodejs";

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 3;

function isPublicAddress(address) {
  const family = isIP(address);
  if (family === 4) {
    const octets = address.split(".").map(Number);
    const [a, b] = octets;
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 2)) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && octets[2] === 100))) ||
      (a === 203 && b === 0 && octets[2] === 113)
    );
  }

  if (family === 6) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:")) {
      return isPublicAddress(normalized.slice(7));
    }
    const firstHextet = Number.parseInt(normalized.split(":")[0] || "0", 16);
    return (
      firstHextet >= 0x2000 &&
      firstHextet <= 0x3fff &&
      !normalized.startsWith("2001:db8:")
    );
  }

  return false;
}

async function validateAndResolve(url) {
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Enter a public http:// or https:// recipe link.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const literalFamily = isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await lookup(hostname, { all: true, verbatim: true });

  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("That address cannot be fetched. Enter a public recipe website.");
  }

  return addresses.find(({ family }) => family === 4) || addresses[0];
}

function requestHtml(url, address) {
  const transport = url.protocol === "https:" ? https : http;
  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  return new Promise((resolve, reject) => {
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "NibbleRecipeImporter/1.0",
        },
        agent: false,
        lookup: (_hostname, options, callback) => {
          if (options.all) {
            callback(null, [{ address: address.address, family: address.family }]);
          } else {
            callback(null, address.address, address.family);
          }
        },
      },
      (response) => {
        const chunks = [];
        let totalBytes = 0;
        response.on("data", (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_HTML_BYTES) {
            request.destroy(new Error("The recipe page is too large to import."));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () =>
          resolve({
            status: response.statusCode || 0,
            location: response.headers.location,
            contentType: response.headers["content-type"] || "",
            html: Buffer.concat(chunks).toString("utf8"),
          })
        );
        response.on("error", reject);
      }
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () =>
      request.destroy(new Error("The recipe page took too long to respond."))
    );
    request.on("error", reject);
    request.end();
  });
}

async function fetchRecipePage(inputUrl) {
  let url = new URL(inputUrl);

  for (let redirects = 0; ; redirects += 1) {
    const address = await validateAndResolve(url);
    const response = await requestHtml(url, address);

    if ([301, 302, 303, 307, 308].includes(response.status) && response.location) {
      if (redirects >= MAX_REDIRECTS) {
        throw new Error("The recipe link redirected too many times.");
      }
      url = new URL(response.location, url);
      continue;
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`The recipe site returned HTTP ${response.status}.`);
    }
    if (!/text\/html|application\/xhtml\+xml/i.test(response.contentType)) {
      throw new Error("That link does not point to a recipe webpage.");
    }

    return response.html;
  }
}

function decodeHtml(value = "") {
  const namedEntities = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
    rsquo: "’",
    lsquo: "‘",
    rdquo: "”",
    ldquo: "“",
    mdash: "—",
    ndash: "–",
  };

  return value
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .replace(/&([a-z]+);/gi, (match, entity) => namedEntities[entity.toLowerCase()] ?? match)
    .trim();
}

function flattenInstructions(value) {
  if (typeof value === "string") return [decodeHtml(value.replace(/<[^>]*>/g, " "))];
  if (Array.isArray(value)) return value.flatMap(flattenInstructions);
  if (!value || typeof value !== "object") return [];
  if (value.text) return flattenInstructions(value.text);
  if (value.itemListElement) return flattenInstructions(value.itemListElement);
  if (value.name) return flattenInstructions(value.name);
  return [];
}

function findRecipeJsonLd(html) {
  const scripts = html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  const candidates = [];

  for (const [, contents] of scripts) {
    try {
      const parsed = JSON.parse(decodeHtml(contents));
      candidates.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      continue;
    }
  }

  const pending = [...candidates];
  while (pending.length) {
    const candidate = pending.shift();
    if (!candidate || typeof candidate !== "object") continue;
    const types = Array.isArray(candidate["@type"])
      ? candidate["@type"]
      : [candidate["@type"]];
    if (types.some((type) => type === "Recipe" || /[/#]Recipe$/.test(type || ""))) {
      return candidate;
    }
    if (Array.isArray(candidate)) pending.unshift(...candidate);
    else if (Array.isArray(candidate["@graph"])) pending.unshift(...candidate["@graph"]);
  }
  return null;
}

function getMeta(html, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tag = html.match(
    new RegExp(`<meta\\b(?=[^>]*(?:property|name)=["']${escapedKey}["'])[^>]*>`, "i")
  )?.[0];
  return decodeHtml(tag?.match(/\bcontent=["']([^"']*)["']/i)?.[1] || "");
}

function parsePageText(html) {
  return decodeHtml(
    html
      .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|li|h[1-6]|br|tr|section|article)>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
  )
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function parseDuration(value) {
  const match = value?.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  return match ? Number(match[1] || 0) * 60 + Number(match[2] || 0) : "";
}

function recipeFromHtml(html) {
  const recipe = findRecipeJsonLd(html);
  const title =
    recipe?.name ||
    getMeta(html, "og:title") ||
    decodeHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const description =
    recipe?.description || getMeta(html, "og:description") || getMeta(html, "description");
  const text = parsePageText(html);

  let ingredients = Array.isArray(recipe?.recipeIngredient)
    ? recipe.recipeIngredient.map(parseIngredientLine)
    : [];
  let instructions = flattenInstructions(recipe?.recipeInstructions);

  if (!ingredients.length || !instructions.length) {
    const lines = text.split("\n");
    let section = "";
    const scrapedIngredients = [];
    const scrapedInstructions = [];
    for (const line of lines) {
      if (/^(ingredients?|what you need)\b/i.test(line)) {
        section = "ingredients";
      } else if (/^(instructions?|directions|method|preparation|steps?)\b/i.test(line)) {
        section = "instructions";
      } else if (/^(notes?|nutrition|reviews|related recipes)\b/i.test(line)) {
        section = "";
      } else if (section === "ingredients") {
        scrapedIngredients.push(parseIngredientLine(line));
      } else if (section === "instructions") {
        scrapedInstructions.push(line.replace(/^\d+[.)]\s*/, ""));
      }
    }
    if (!ingredients.length) ingredients = scrapedIngredients;
    if (!instructions.length) instructions = scrapedInstructions;
  }

  return {
    title,
    description,
    prepTime: parseDuration(recipe?.prepTime),
    cookTime: parseDuration(recipe?.cookTime),
    servings: Array.isArray(recipe?.recipeYield)
      ? recipe.recipeYield.join(", ")
      : recipe?.recipeYield || "",
    ingredients,
    instructions,
  };
}

export async function POST(request) {
  try {
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return Response.json({ error: "Sign in to import a recipe link." }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Recipe link import is missing Supabase configuration.");
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: "Sign in to import a recipe link." }, { status: 401 });
    }

    const body = await request.json();
    if (typeof body.url !== "string" || !body.url.trim()) {
      return Response.json({ error: "Enter a recipe link to import." }, { status: 400 });
    }

    const html = await fetchRecipePage(body.url.trim());
    const recipe = recipeFromHtml(html);
    if (!recipe.title && !recipe.ingredients.length && !recipe.instructions.length) {
      return Response.json(
        { error: "Couldn't find recipe details on that page. You can still enter them manually." },
        { status: 422 }
      );
    }

    return Response.json({ recipe });
  } catch (error) {
    console.error("Recipe link import failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Couldn't read that recipe link." },
      { status: 400 }
    );
  }
}
