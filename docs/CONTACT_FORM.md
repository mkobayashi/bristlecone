# お問い合わせフォーム（Resend + Turnstile + ハニーポット）

- **UI**: `src/components/ContactForm.astro`（Turnstile ウィジェット・ハニーポット）
- **送信処理（本番）**: `functions/api/contact.js`（Cloudflare Pages Functions）
- **検証ロジックの参照（TypeScript）**: `src/pages/api/contact.ts`（型・関数の共有用。本番は `.js` が実行されます）

---

## 1. Cloudflare Pages の環境変数

| 変数名 | 種類 | 説明 |
|--------|------|------|
| `RESEND_API_KEY` | **Secret** | Resend の API キー |
| `TURNSTILE_SECRET_KEY` | **Secret** | [Turnstile](https://developers.cloudflare.com/turnstile/) のシークレットキー |
| `PUBLIC_TURNSTILE_SITE_KEY` | Variable | Turnstile の **サイトキー**（フロントに公開されるため PUBLIC） |
| `CONTACT_FROM` | Variable | 送信元（例: `Bristlecone <info@bristlecone.jp>`） |
| `CONTACT_TO` | Variable | 届け先メール |

**Turnstile の取得**: Cloudflare ダッシュボード → **Turnstile** → **Add widget** → ドメインに `bristlecone.jp` などを追加 → Site Key と Secret Key をコピー。

**ローカル開発用テストキー**（常に成功する組み合わせ）:

- Site Key: `1x00000000000000000000AA`
- Secret Key: `1x0000000000000000000000000000000AA`

`.env` に `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA` を入れると、`npm run dev` でウィジェットの表示確認ができます（`/api/contact` は本番と同様に Cloudflare 上でないと動きません）。

---

## 2. スパム対策の内容

1. **ハニーポット** … 画面に見えない `name="website"` 欄。値が入っていれば送信を拒否。
2. **Turnstile** … `cf-turnstile-response` を Cloudflare の `siteverify` API で検証。
3. **日本語必須** … お問い合わせ内容に、ひらがな・カタカナ・漢字などが 1 文字以上含まれない場合は拒否（クライアント・サーバー両方）。

---

## 3. 動きの概要

1. 入力 →「送信」→ 確認画面 →「送信する」
2. **POST /api/contact**（FormData に Turnstile トークン含む）
3. `functions/api/contact.js` で検証後、Resend で 2 通送信

---

## 4. ローカル

`npm run dev` では Pages Functions は動かないため、送信テストは **デプロイ後の URL** で行ってください。  
`wrangler pages dev` を使えばローカルで Functions を試せます。
