/**
 * お問い合わせフォーム送信 API（Resend 使用）
 *
 * 環境変数（Cloudflare Pages の Variables and Secrets）:
 * - RESEND_API_KEY: Resend の API キー
 * - CONTACT_FROM: 送信元メール（例: Bristlecone <info@bristlecone.jp>）
 * - CONTACT_TO: 届け先メール（例: info@bristlecone.jp）
 */

export async function onRequestPost(context) {
	const { request, env } = context;

	// CORS: 同一オリジンなら不要だが、必要に応じて
	const headers = {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
	};

	try {
		const apiKey = env.RESEND_API_KEY;
		const fromEmail = env.CONTACT_FROM || 'Bristlecone <info@bristlecone.jp>';
		const toEmail = env.CONTACT_TO || 'info@bristlecone.jp';

		if (!apiKey) {
			return new Response(
				JSON.stringify({ ok: false, error: 'Server configuration error' }),
				{ status: 500, headers }
			);
		}

		const formData = await request.formData();
		const name = formData.get('name') || '';
		const email = formData.get('_replyto') || formData.get('email') || '';
		const message = formData.get('message') || '';

		if (!name.trim() || !email.trim() || !message.trim()) {
			return new Response(
				JSON.stringify({ ok: false, error: 'Missing required fields' }),
				{ status: 400, headers }
			);
		}

		const resendUrl = 'https://api.resend.com/emails';
		const authHeader = { Authorization: `Bearer ${apiKey}` };

		// 1. あなた（業務用）に届くメール
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

		// 2. 送信者への控えメール（同時返信）
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
			// 届け先には送れているので 200 を返してもよい
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
