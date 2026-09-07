const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) => Uint8Array.from(atob(value),c=>c.charCodeAt(0));
async function importKey(secret: string) {
  const bytes = fromBase64(secret);
  if (bytes.length !== 32) throw new Error("Invalid encryption key");
  return crypto.subtle.importKey("raw",bytes,"AES-GCM",false,["encrypt","decrypt"]);
}
export async function encryptSecret(value: string, master: string, owner: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:new TextEncoder().encode(owner)},await importKey(master),new TextEncoder().encode(value));
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(data))}`;
}
export async function decryptSecret(value: string, master: string, owner: string) {
  const [version,iv,data,...extra] = value.split(".");
  if (version!=="v1" || !iv || !data || extra.length) throw new Error("Invalid encrypted secret");
  return new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:fromBase64(iv),additionalData:new TextEncoder().encode(owner)},await importKey(master),fromBase64(data)));
}
