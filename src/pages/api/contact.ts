/**
 * お問い合わせ送信の検証ロジック（型・参照用）
 *
 * 本番（Cloudflare Pages）の実際の送信処理は
 * `functions/api/contact.js` にあります。内容はここと同等です。
 *
 * Astro をサーバーアダプタで動かす場合は、このモジュールを API ルートから
 * import して使うこともできます。
 */

/** ひらがな・カタカナ・漢字・全角記号など（日本語を含むかの判定用） */
export const JAPANESE_REGEX =
	/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF]/;

export function hasJapaneseInMessage(text: string): boolean {
	if (!text || typeof text !== 'string') return false;
	return JAPANESE_REGEX.test(text);
}

/** Turnstile トークンを Cloudflare の siteverify で検証 */
export async function verifyTurnstileToken(
	secret: string,
	token: string,
	remoteip?: string
): Promise<boolean> {
	if (!secret || !token) return false;
	const body = new URLSearchParams();
	body.set('secret', secret);
	body.set('response', token);
	if (remoteip) body.set('remoteip', remoteip);
	const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	});
	const data = (await res.json()) as { success?: boolean };
	return data.success === true;
}

/** ハニーポットに値が入っている = bot の可能性 */
export function isHoneypotFilled(websiteField: FormDataEntryValue | null): boolean {
	if (websiteField == null) return false;
	return String(websiteField).trim() !== '';
}
