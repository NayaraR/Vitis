/** Read a small image as a data URL (logos are stored inline, max 200 KB). */
export async function imageToDataUrl(file: File, maxBytes = 200_000): Promise<string> {
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) throw new Error("Use PNG, JPG, WebP ou SVG.");
  if (file.size > maxBytes) throw new Error(`Imagem muito grande (máx. ${Math.round(maxBytes / 1000)} KB).`);
  return await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("Não foi possível ler o arquivo."));
    r.readAsDataURL(file);
  });
}
