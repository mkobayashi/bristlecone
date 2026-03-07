# Bristlecone を Cloudflare Pages で公開する手順

独自ドメイン **bristlecone.jp** を使い、Cloudflare Pages で公開する手順です。

---

## 前提

- プロジェクトを **Git** で管理し、**GitHub** にリポジトリがあること
- 独自ドメイン **bristlecone.jp** を取得済みであること

---

## 1. GitHub にリポジトリを用意する

まだの場合のみ実行してください。

```bash
cd /Users/kobayashimasahiro/Desktop/bristlecone/tested-telescope

# Git 初期化（まだの場合）
git init

# リモートを追加（GitHub でリポジトリ作成後の URL に置き換え）
git remote add origin https://github.com/あなたのユーザー名/bristlecone.git

# コミットしてプッシュ
git add .
git commit -m "Initial commit: Bristlecone landing page"
git branch -M main
git push -u origin main
```

---

## 2. Cloudflare にログイン

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左メニューで **Workers & Pages** をクリック

---

## 3. Pages プロジェクトを作成（Git 連携）

1. **Create application** → **Pages** を選択
2. **Connect to Git** を選ぶ
3. **GitHub** を選び、表示に従って GitHub と Cloudflare を連携
4. **リポジトリ**で `bristlecone`（または作成したリポジトリ名）を選択
5. **Begin setup** をクリック

---

## 4. ビルド設定を入力

| 項目 | 入力値 |
|------|--------|
| **Project name** | `bristlecone`（任意で変更可） |
| **Production branch** | `main` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

- **Root directory** は、リポジトリのルートが `tested-telescope` フォルダでない場合は、そのフォルダ名を指定（例: `tested-telescope`）
- **Environment variables** は、microCMS などを使う場合に後から **Settings** で追加可能

入力後、**Save and Deploy** をクリック。

---

## 5. デプロイの完了を待つ

初回ビルドが走ります。数分で完了し、  
`https://bristlecone.pages.dev` のような URL でプレビューできます。

---

## 6. 独自ドメイン bristlecone.jp を設定する

### A. ドメインがすでに Cloudflare にある場合

1. Pages プロジェクトの **Custom domains** を開く
2. **Set up a custom domain** をクリック
3. `bristlecone.jp` と `www.bristlecone.jp` を入力して追加
4. 表示される CNAME や A レコードのとおり、ドメイン側の DNS が Cloudflare を向いていればそのまま有効になります

### B. ドメインが別のレジストラ（お名前.com 等）にある場合

**方法1: ドメインを Cloudflare に移管（推奨）**

1. Cloudflare ダッシュボードで **Websites** → **Add a site**
2. `bristlecone.jp` を入力し、無料プランを選択
3. 表示された **ネームサーバー**（例: `xxx.ns.cloudflare.com`）を、ドメイン取得先の「ネームサーバー設定」で指定に変更
4. 移行完了後、**Workers & Pages** の Bristlecone プロジェクトの **Custom domains** で `bristlecone.jp` を追加

**方法2: Cloudflare に移管せず CNAME だけ設定**

1. Pages の **Custom domains** で `bristlecone.jp` を追加すると、**設定例**（例: `bristlecone.pages.dev` への CNAME）が表示されます
2. ドメイン取得先の DNS 設定で、  
   - ホスト: `@` または `bristlecone.jp`  
   - 種類: CNAME（または A レコードで Cloudflare の IP を案内される場合あり）  
   - 値: 表示されたターゲット（例: `bristlecone.pages.dev`）  
   を設定
3. **www** 用に `www` → 同じ CNAME または `bristlecone.pages.dev` を設定
4. DNS の反映には数分〜最大 48 時間かかることがあります

---

## 7. 確認

- `https://bristlecone.jp` と `https://www.bristlecone.jp` でサイトが開くか確認
- HTTPS は Cloudflare が自動で発行します

---

## よくある補足

- **リポジトリのルートが `tested-telescope` の場合**  
  Pages の **Settings** → **Builds & deployments** → **Build configurations** の **Root directory** に `tested-telescope` を指定してください。
- **ビルドが失敗する場合**  
  **Deployments** の該当ログでエラーを確認。Node のバージョン指定が必要なら、**Settings** → **Environment variables** で `NODE_VERSION` = `20` などを追加できます。
- **microCMS をあとから使う場合**  
  **Settings** → **Environment variables** に API キーなどを登録し、Astro のコードで `import.meta.env.XXX` などから参照します。

以上で、bristlecone.jp で Bristlecone を Cloudflare Pages に公開できます。
