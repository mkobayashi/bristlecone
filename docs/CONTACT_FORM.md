# お問い合わせフォームの設定

## Formspree で受け取り・自動返信する

1. [Formspree](https://formspree.io/) に無料登録する
2. **New form** で新しいフォームを作成し、届け先メールアドレス（例: info@bristlecone.jp）を設定
3. 作成されたフォームの **Endpoint URL** をコピー（例: `https://formspree.io/f/xxxxxxxx`）
4. `src/pages/contact.astro` の先頭付近にある `formspreeEndpoint` を、その URL に書き換える

```js
const formspreeEndpoint = 'https://formspree.io/f/あなたのフォームID';
```

## 送信者への控えメール（同時返信）を有効にする

1. Formspree のダッシュボードで、該当フォームを開く
2. **Settings** または **Notifications** の **Auto Responder** をオンにする
3. 件名・本文を設定（例: 「Bristlecone お問い合わせを受け付けました」）
4. 保存すると、送信者のメールアドレス（フォームの「メールアドレス」欄）に自動で控えメールが送信されます

これで「あなたに届くお問い合わせ内容」と「送信者への控えメール」の両方が可能です。
