const UNSPLASH_RANDOM =
  "https://api.unsplash.com/photos/random?query=nature&orientation=landscape&content_filter=high";

export type NaturePhoto = {
  imageUrl: string;
  photographerName: string;
  photographerProfileUrl: string;
  photoPageUrl: string;
};

type UnsplashRandomResponse = {
  urls?: { raw?: string; regular?: string; full?: string };
  user?: { name?: string; links?: { html?: string } };
  links?: { html?: string; download_location?: string };
};

function sizedImageUrl(raw: string | undefined, regular: string | undefined) {
  if (raw) return `${raw}&w=1920&h=1080&q=80`;
  return regular ?? "";
}

/** Registra visualização conforme diretrizes da API Unsplash. */
async function triggerDownload(
  downloadLocation: string | undefined,
  clientId: string,
) {
  if (!downloadLocation) return;
  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${clientId}` },
    });
  } catch {
    /* ignore */
  }
}

export async function fetchNatureBackground(): Promise<NaturePhoto | null> {
  const clientId = import.meta.env.VITE_UNSPLASH_ACCESS_KEY?.trim();
  if (!clientId) return null;

  const res = await fetch(UNSPLASH_RANDOM, {
    headers: { Authorization: `Client-ID ${clientId}` },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as UnsplashRandomResponse;
  const imageUrl = sizedImageUrl(data.urls?.raw, data.urls?.regular);
  if (!imageUrl) return null;

  void triggerDownload(data.links?.download_location, clientId);

  return {
    imageUrl,
    photographerName: data.user?.name ?? "Unsplash",
    photographerProfileUrl: data.user?.links?.html ?? "https://unsplash.com",
    photoPageUrl: data.links?.html ?? "https://unsplash.com",
  };
}
