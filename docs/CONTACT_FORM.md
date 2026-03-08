# お問い合わせフォーム（Resend 連携）

フォーム送信は **Cloudflare Pages Functions** で受け取り、**Resend** でメール送信しています。  
Resend は業務メール（Gmail 連携など）で使っている同じアカウント・ドメインがそのまま使えます。

---

## 1. Cloudflare Pages に環境変数を設定

**Workers & Pages** → **bristlecone** → **Settings** → **Variables and Secrets** で次を追加してください。

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `RESEND_API_KEY` | `re_xxxx...` | [Resend](https://resend.com) の API キー（Dashboard → API Keys） |
| `CONTACT_FROM` | `Bristlecone <info@bristlecone.jp>` | 送信元（Resend で検証済みのドメイン） |
| `CONTACT_TO` | `info@bristlecone.jp` | お問い合わせの届け先メール |

- `CONTACT_FROM` / `CONTACT_TO` を省略した場合は、コード内のデフォルト（例: info@bristlecone.jp）が使われます。
- Resend で **bristlecone.jp** を検証し、送信元として使えるようにしておいてください。

---

## 2. 動きの概要

1. ユーザーがフォームで「送信」→ 確認画面 →「送信する」
2. ブラウザが **POST /api/contact** にフォーム内容を送信
3. Cloudflare の **Functions**（`functions/api/contact.js`）が受け取り、**Resend API** を 2 回呼び出し：
   - **あなた（業務用）へ** … お名前・メールアドレス・お問い合わせ内容
   - **送信者へ** … 「お問い合わせを受け付けました」の控えメール（同時返信）
4. 成功すると画面に「送信が完了しました」と表示

---

## 3. ローカルで試す場合

`npm run build` と `npm run preview` だけでは Functions は動きません。  
Resend 連携の動作確認は、**Cloudflare にデプロイした環境**で行ってください。

---

## 4. 送信元・届け先を変える場合

- **届け先だけ変える**: 環境変数 `CONTACT_TO` を変更
- **送信元の表示名・アドレスを変える**: 環境変数 `CONTACT_FROM` を変更（Resend で検証済みのアドレスにすること）

これで、Resend で設定している業務メール（Gmail 連携含む）を、このフォームでも利用できます。
