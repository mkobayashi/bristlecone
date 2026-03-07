# Git に上げたファイルを正しいランディングページに直す手順

間違えて push した内容を、正しい Bristlecone ランディングページ（1枚）の内容に差し替える手順です。

---

## パターン別の進め方

### パターンA：いまの PC の「tested-telescope フォルダ」が正しい中身である

Git のリポジトリは **tested-telescope の中** にある想定です。

---

#### A-1. 正しいフォルダで Git の状態を確認

```bash
cd /Users/kobayashimasahiro/Desktop/bristlecone/tested-telescope
git status
```

- 変更がある場合は、正しいランディングページの状態でコミットしてから次へ。

```bash
git add .
git commit -m "正しいランディングページに修正"
```

---

#### A-2. リモートを正しい内容で上書き（force push）

**注意：** これで GitHub 上の履歴が、今のローカルで上書きされます。ほかの人が同じブランチで作業していない場合だけ行ってください。

```bash
git push origin main --force
```

これで、Git に上がっている内容が「今の tested-telescope の正しい1枚のランディングページ」になります。

---

#### A-3. Cloudflare Pages の反映

- 同じリポジトリを Cloudflare Pages に連携している場合は、数分で自動で再デプロイされます。
- 手動でやりたい場合は、Cloudflare の **Deployments** から **Retry deployment** を実行。

---

### パターンB：Git のリポジトリが「bristlecone や親フォルダ」にあって、中身が違う

リポジトリが **bristlecone** や **Desktop/bristlecone** で `git init` してあり、**tested-telescope だけを正しい中身にしたい**場合です。

---

#### B-1. 正しい中身のフォルダだけをリポジトリにする（やり直し）

```bash
# いったん親フォルダの .git を削除（リモートの URL は控えておく）
cd /Users/kobayashimasahiro/Desktop/bristlecone
# リモート URL をメモ: git remote -v で確認してから
rm -rf .git
```

```bash
# 正しいランディングページがあるフォルダだけをリポジトリにする
cd /Users/kobayashimasahiro/Desktop/bristlecone/tested-telescope
git init
git remote add origin https://github.com/あなたのユーザー名/bristlecone.git
git add .
git commit -m "Bristlecone ランディングページ（正しい版）"
git branch -M main
git push origin main --force
```

これで GitHub 上は「tested-telescope の中身だけ」が正しい1枚のランディングページになります。

---

#### B-2. Cloudflare Pages の設定を合わせる

- **Root directory**：リポジトリのルートが **tested-telescope の中身そのもの** になったので、**空欄** のままにする。
- **Build command**：`npm run build`
- **Build output directory**：`dist`

設定を保存し、必要なら **Retry deployment** で再デプロイ。

---

## まとめ

| 状況 | やること |
|------|----------|
| リポジトリが **tested-telescope の中** にあり、中身は正しい | `git add .` → `commit` → `git push origin main --force` |
| リポジトリが **親フォルダ** にあり、中身が違う | 親の `.git` を削除 → **tested-telescope** で `git init` → ここをリポジトリとして `push --force` |
| Cloudflare で見えない | Pages の **Root directory** を空欄にし、再デプロイ |

これで、Git に上がっているファイルが正しい1枚のランディングページに直せます。
