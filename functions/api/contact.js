/**
 * お問い合わせフォーム送信 API（Resend + Turnstile + ハニーポット + 日本語検証）
 *
 * 環境変数（Cloudflare Pages）:
 * - RESEND_API_KEY (Secret)
 * - TURNSTILE_SECRET_KEY (Secret)
 * - CONTACT_FROM, CONTACT_TO (Variable)
 */

const JAPANESE_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF]/;

function hasJapaneseInMessage(text) {
	if (!text || typeof text !== 'string') return false;
	return JAPANESE_REGEX.test(text);
}

async function verifyTurnstile(secret, token, remoteip) {
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
	const data = await res.json();
	return data.success === true;
}

export async function onRequestPost(context) {
	const { request, env } = context;

	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
	};

	try {
		const apiKey = env.RESEND_API_KEY;
		const turnstileSecret = env.TURNSTILE_SECRET_KEY;
		const fromEmail = env.CONTACT_FROM || 'Bristlecone <info@bristlecone.jp>';
		const toEmail = env.CONTACT_TO || 'info@bristlecone.jp';

		if (!apiKey) {
			return new Response(
				JSON.stringify({ ok: false, error: 'Server configuration error' }),
				{ status: 500, headers }
			);
		}

		const formData = await request.formData();

		// ハニーポット: 値が入っていれば bot とみなしてブロック（成功レスポンスは返さず 400）
		const honeypot = formData.get('website');
		if (honeypot != null && String(honeypot).trim() !== '') {
			return new Response(
				JSON.stringify({ ok: false, error: 'invalid' }),
				{ status: 400, headers }
			);
		}

		const name = String(formData.get('name') || '').trim();
		const email = String(formData.get('_replyto') || formData.get('email') || '').trim();
		const message = String(formData.get('message') || '').trim();
		const turnstileToken = formData.get('cf-turnstile-response') || '';

		if (!name || !email || !message) {
			return new Response(
				JSON.stringify({ ok: false, error: 'Missing required fields' }),
				{ status: 400, headers }
			);
		}

		// メッセージに日本語が含まれない場合はブロック
		if (!hasJapaneseInMessage(message)) {
			return new Response(
				JSON.stringify({ ok: false, error: 'message_requires_japanese' }),
				{ status: 400, headers }
			);
		}

		// Turnstile 検証
		if (!turnstileSecret) {
			return new Response(
				JSON.stringify({ ok: false, error: 'turnstile_not_configured' }),
				{ status: 500, headers }
			);
		}
		const cfConnectingIp = request.headers.get('CF-Connecting-IP') || '';
		const okTurnstile = await verifyTurnstile(turnstileSecret, String(turnstileToken), cfConnectingIp);
		if (!okTurnstile) {
			return new Response(
				JSON.stringify({ ok: false, error: 'turnstile_failed' }),
				{ status: 400, headers }
			);
		}

		const resendUrl = 'https://api.resend.com/emails';
		const authHeader = { Authorization: `Bearer ${apiKey}` };

		const ownerBody = {
			from: fromEmail,
			to: [toEmail],
			subject: `[Bristlecone] お問い合わせ: ${name}`,
			reply_to: email,
			html: `
        <p><strong>お名前:</strong> ${escapeHtml(name)}</p>
        <p><strong>メールアドレス:</strong> ${escapeHtml(email)}</p>
        <p><strong>お問い合わせ内容:</strong></p>
        <pre style="white-space:pre-wrap;">${escapeHtml(message)}</pre>
      `.trim(),
		};

		const resOwner = await fetch(resendUrl, {
			method: 'POST',
			headers: {
				...authHeader,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(ownerBody),
		});

		if (!resOwner.ok) {
			const err = await resOwner.text();
			console.error('Resend owner email failed:', err);
			return new Response(
				JSON.stringify({ ok: false, error: 'Failed to send email' }),
				{ status: 502, headers }
			);
		}

		const replyBody = {
			from: fromEmail,
			to: [email],
			subject: '【Bristlecone】お問い合わせを受け付けました',
			html: `
        <p>${escapeHtml(name)} 様</p>
        <p>お問い合わせいただきありがとうございます。<br>以下の内容で受け付けました。内容を確認のうえ、ご連絡いたします。</p>
        <hr>
        <p><strong>お問い合わせ内容</strong></p>
        <pre style="white-space:pre-wrap;">${escapeHtml(message)}</pre>
        <hr>
        <p>Bristlecone<br>リフォーム・坪庭・太陽光発電</p>
      `.trim(),
		};

		const resReply = await fetch(resendUrl, {
			method: 'POST',
			headers: {
				...authHeader,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(replyBody),
		});

		if (!resReply.ok) {
			const err = await resReply.text();
			console.error('Resend reply email failed:', err);
		}

		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers,
		});
	} catch (e) {
		console.error(e);
		return new Response(
			JSON.stringify({ ok: false, error: 'Server error' }),
			{ status: 500, headers }
		);
	}
}

function escapeHtml(str) {
	if (typeof str !== 'string') return '';
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
