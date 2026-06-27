# providers.py
# --------------------------------------------------
# One LLM client for every supported provider. Groq and OpenRouter both speak
# the OpenAI chat-completions format, so a single call shape covers both — only
# the base URL (and a couple of optional headers) differ.
#
# Keys are BYOK: they arrive per-request from the browser and are used here
# transiently. Nothing is stored or logged.

import httpx

# Each provider is just a base URL for the OpenAI-compatible chat endpoint.
# All of these offer a free key or free credits.
PROVIDERS = {
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "label": "Groq",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "label": "OpenRouter",
    },
    "google": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        "label": "Google Gemini",
    },
    "cerebras": {
        "base_url": "https://api.cerebras.ai/v1",
        "label": "Cerebras",
    },
    "mistral": {
        "base_url": "https://api.mistral.ai/v1",
        "label": "Mistral",
    },
    "together": {
        "base_url": "https://api.together.xyz/v1",
        "label": "Together AI",
    },
    "sambanova": {
        "base_url": "https://api.sambanova.ai/v1",
        "label": "SambaNova",
    },
}

class ProviderError(Exception):
    """Raised when an LLM provider call fails (bad key, bad model, network…)."""


async def chat_completion(
    provider: str,
    model: str,
    messages: list[dict],
    api_key: str,
    temperature: float = 0.7,
) -> str:
    """Call an OpenAI-compatible chat endpoint and return the assistant text."""
    cfg = PROVIDERS.get(provider)
    if cfg is None:
        raise ProviderError(f"Unknown provider '{provider}'.")
    if not api_key:
        raise ProviderError(
            f"No API key provided for {cfg['label']}. Paste one in Settings."
        )

    headers = {"Authorization": f"Bearer {api_key}"}
    # OpenRouter likes these attribution headers; harmless elsewhere.
    if provider == "openrouter":
        headers["HTTP-Referer"] = "http://localhost:3000"
        headers["X-Title"] = "VectorShift Pipeline Builder"

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{cfg['base_url']}/chat/completions",
                headers=headers,
                json=payload,
            )
    except httpx.HTTPError as exc:
        raise ProviderError(f"Could not reach {cfg['label']}: {exc}") from exc

    if resp.status_code != 200:
        # Surface the provider's own error message when we can.
        detail = resp.text
        try:
            detail = resp.json().get("error", {}).get("message", detail)
        except Exception:
            pass
        raise ProviderError(f"{cfg['label']} error ({resp.status_code}): {detail}")

    data = resp.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise ProviderError(f"Unexpected response from {cfg['label']}.") from exc


# ---- Embeddings ----------------------------------------------------------
# Real embedding APIs, BYOK like the chat ones. Most speak the OpenAI
# `/embeddings` shape; Cohere and Google Gemini have their own, so each
# provider declares which "dialect" it uses.
EMBEDDING_PROVIDERS = {
    "openai":   {"base_url": "https://api.openai.com/v1",   "label": "OpenAI",        "dialect": "openai"},
    "jina":     {"base_url": "https://api.jina.ai/v1",      "label": "Jina AI",       "dialect": "openai"},
    "mistral":  {"base_url": "https://api.mistral.ai/v1",   "label": "Mistral",       "dialect": "openai"},
    "voyage":   {"base_url": "https://api.voyageai.com/v1", "label": "Voyage AI",     "dialect": "openai"},
    "together": {"base_url": "https://api.together.xyz/v1", "label": "Together AI",   "dialect": "openai"},
    "cohere":   {"base_url": "https://api.cohere.com",      "label": "Cohere",        "dialect": "cohere"},
    "google":   {"base_url": "https://generativelanguage.googleapis.com/v1beta", "label": "Google Gemini", "dialect": "gemini"},
}

# Matches the frontend's modelCatalog so the UI dropdowns and the runtime agree.
EMBEDDING_MODELS = {
    "google":   ["text-embedding-004"],
    "jina":     ["jina-embeddings-v3", "jina-embeddings-v2-base-en"],
    "mistral":  ["mistral-embed"],
    "voyage":   ["voyage-3-lite", "voyage-3"],
    "cohere":   ["embed-english-v3.0", "embed-multilingual-v3.0"],
    "together": ["BAAI/bge-base-en-v1.5", "togethercomputer/m2-bert-80M-8k-retrieval"],
    "openai":   ["text-embedding-3-small", "text-embedding-3-large"],
}


async def embed_text(provider: str, model: str, text: str, api_key: str) -> list[float]:
    """Embed `text` with an external provider and return the float vector."""
    cfg = EMBEDDING_PROVIDERS.get(provider)
    if cfg is None:
        raise ProviderError(f"Unknown embedding provider '{provider}'.")
    if not api_key:
        raise ProviderError(f"No API key provided for {cfg['label']}.")
    if not model:
        model = (EMBEDDING_MODELS.get(provider) or [""])[0]

    dialect = cfg["dialect"]
    bearer = {"Authorization": f"Bearer {api_key}"}
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            if dialect == "openai":
                resp = await client.post(
                    f"{cfg['base_url']}/embeddings",
                    headers=bearer,
                    json={"model": model, "input": text},
                )
            elif dialect == "cohere":
                resp = await client.post(
                    f"{cfg['base_url']}/v2/embed",
                    headers=bearer,
                    json={
                        "model": model,
                        "texts": [text],
                        "input_type": "search_document",
                        "embedding_types": ["float"],
                    },
                )
            else:  # gemini — key goes in the query string, not a header
                resp = await client.post(
                    f"{cfg['base_url']}/models/{model}:embedContent?key={api_key}",
                    json={"model": f"models/{model}", "content": {"parts": [{"text": text}]}},
                )
    except httpx.HTTPError as exc:
        raise ProviderError(f"Could not reach {cfg['label']}: {exc}") from exc

    if resp.status_code != 200:
        detail = resp.text
        try:
            body = resp.json()
            err = body.get("error")
            if isinstance(err, dict):
                detail = err.get("message", detail)
            elif isinstance(err, str):
                detail = err
            else:
                detail = body.get("message", detail)
        except Exception:
            pass
        raise ProviderError(f"{cfg['label']} error ({resp.status_code}): {detail}")

    body = resp.json()
    try:
        if dialect == "openai":
            return body["data"][0]["embedding"]
        if dialect == "cohere":
            return body["embeddings"]["float"][0]
        return body["embedding"]["values"]  # gemini
    except (KeyError, IndexError) as exc:
        raise ProviderError(f"Unexpected response from {cfg['label']}.") from exc
