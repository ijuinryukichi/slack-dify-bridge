# Slack-Dify Bridge 🤖

軽量で安定したSlack-Difyブリッジアプリケーション。Socket Modeを使用してPrivate channelでも確実に動作し、画像処理にも対応しています。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

## 🎯 特徴

- ✅ **Socket Mode対応** - Webhookの設定不要で安定した接続
- ✅ **Private channel完全対応** - 認証問題を回避
- ✅ **画像処理対応** - 画像ファイルをDifyに送信可能
- ✅ **シンプルな設定** - 環境変数のみで動作
- ✅ **DM・メンション両対応** - 柔軟な対話方法
- ✅ **会話の継続性** - conversation_idによる文脈維持
- ✅ **高度なエラーハンドリング** - タイムアウト処理とリトライ対応
- ✅ **動的メッセージ更新** - 処理中メッセージを結果で更新
- ✅ **ローカル実行** - サーバー不要、各自のPCで動作

## 🎓 勉強会・デモ発表での利用について

このアプリケーションは**ローカル実行専用**として設計されており、勉強会参加者が各自のPCで起動して利用できます。

### 利用シナリオ
- **個人環境での実行**: 各参加者が自分のPCでNode.jsアプリとして起動
- **独立した動作**: 各自のSlack Workspace + Dify ChatFlowで完全に独立
- **成果発表デモ**: ローカル起動したままSlackでリアルタイムデモが可能
- **カスタマイズ自由**: Dify側のプロンプト、ナレッジベース、AIモデルは各自で設定

### メリット
- 🚀 **即座に試せる** - git cloneして数分で動作開始
- 💰 **費用不要** - サーバー費用やデプロイ費用は一切不要
- 🔧 **デバッグ簡単** - ローカル実行なのでログ確認やデバッグが容易
- 🎨 **実験しやすい** - コード変更して即座に再起動して試せる

## 🚨 重要: NPMセキュリティ警告

**現在、npmエコシステムで大規模なサプライチェーン攻撃が発生中です（2025年1月）**

### 必須対応事項
```bash
# ✅ 安全な依存関係インストール
npm ci  # package-lock.jsonに従ってインストール

# ❌ 絶対に実行しないでください
npm install  # 新しいパッケージ取得の可能性
npm update   # パッケージ更新は危険
```

### プロジェクトの安全性確認済み
- ✅ 攻撃対象パッケージ（@ctrl/tinycolor等）は含まれていません
- ✅ package-lock.jsonは清浄です
- ✅ CI/CDパイプラインは設定されていません

### セキュリティガイドライン
1. **package-lock.jsonの変更を絶対にコミットしない**
2. **新しいパッケージ追加は事態収束まで禁止**
3. **環境変数とシークレットをローテーション推奨**
4. **疑わしい動作があれば即座に報告**

詳細: [BleepingComputer記事](https://www.bleepingcomputer.com/news/security/self-propagating-supply-chain-attack-hits-187-npm-packages/)

## 📋 必要条件

- Node.js 18.0.0以上
- npm (npm ci コマンドのみ使用)
- Slack Workspace管理者権限（App作成用）
- Dify APIアクセス
- インターネット接続（Slack/Dify API通信用）

## 🚀 クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/ijuinryukichi/slack-dify-bridge.git
cd slack-dify-bridge
```

### 2. 依存関係のインストール

```bash
# 🚨 セキュリティ警告: npm installは使用禁止
npm ci  # 必ずnpm ciを使用してください
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env`ファイルを編集して必要な情報を入力：

```env
# Slack設定
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token

# Dify設定
DIFY_API_KEY=app-your-dify-api-key
DIFY_API_BASE_URL=https://api.dify.ai/v1

# オプション
DEBUG=false
PORT=3000
```

### 4. アプリケーションの起動

```bash
# 開発モード（自動リロード付き）
npm run dev

# 本番モード
npm run build
npm start
```

## 📱 Slack App設定ガイド

### Step 1: Slack Appの作成

1. [Slack API](https://api.slack.com/apps)にアクセス
2. 「Create New App」→「From scratch」を選択
3. App名を入力（例：Dify Bridge Bot）
4. Workspaceを選択

### Step 2: Socket Modeの有効化

1. 左メニューの「Socket Mode」を選択
2. 「Enable Socket Mode」をON
3. App-Level Tokenを作成
   - Token Name: `socket-token`（任意）
   - Scopes: `connections:write`を選択
4. 生成されたトークン（`xapp-`で始まる）をコピー → `.env`の`SLACK_APP_TOKEN`に設定

### Step 3: Bot権限の設定

1. 左メニューの「OAuth & Permissions」を選択
2. 「Scopes」→「Bot Token Scopes」に以下を追加：
   - `app_mentions:read` - メンション読み取り
   - `channels:history` - チャンネル履歴読み取り
   - `channels:read` - チャンネル情報読み取り
   - `chat:write` - メッセージ送信
   - `groups:history` - プライベートチャンネル履歴
   - `groups:read` - プライベートチャンネル情報
   - `im:history` - DM履歴読み取り
   - `im:read` - DM情報読み取り
   - `im:write` - DM送信
   - `users:read` - ユーザー情報読み取り

### Step 4: イベント設定

1. 左メニューの「Event Subscriptions」を選択
2. 「Enable Events」をON
3. 「Subscribe to bot events」に以下を追加：
   - `app_mention` - メンション検知
   - `message.channels` - チャンネルメッセージ
   - `message.groups` - プライベートチャンネル
   - `message.im` - ダイレクトメッセージ

### Step 5: Appのインストール

1. 左メニューの「Install App」を選択
2. 「Install to Workspace」をクリック
3. 権限を確認して「Allow」
4. Bot User OAuth Token（`xoxb-`で始まる）をコピー → `.env`の`SLACK_BOT_TOKEN`に設定

### Step 6: Botをチャンネルに追加

1. Slackでチャンネルを開く
2. チャンネル名をクリック → 「Integrations」タブ
3. 「Add an App」でBotを追加

## 🔧 Dify設定ガイド

### Step 1: API Keyの取得

1. [Dify](https://dify.ai)にログイン
2. アプリケーションを選択または作成
3. 「API Access」を開く
4. 「API Key」をコピー → `.env`の`DIFY_API_KEY`に設定

### Step 2: ChatFlowの準備

1. Difyでアプリケーションを作成（Chat型）
2. プロンプトやナレッジベースを設定
3. 「Publish」で公開

## 💬 使い方

### メンション
```
@BotName こんにちは
```

### ダイレクトメッセージ
Botとの1対1チャットで直接メッセージを送信

### Private Channel
通常のチャンネルと同様に、Botを追加してメンション

### 画像送信
メッセージと一緒に画像ファイルを添付すると、Difyが画像を認識して回答します。
- 対応形式: JPG, PNG, GIF等の一般的な画像フォーマット
- 用途例: 画像の内容質問、OCR、画像分析など

## 🔍 トラブルシューティング

### Botが応答しない

1. `.env`の設定を確認
2. `npm run dev`でログを確認
3. Slack AppのSocket Modeが有効か確認

### "Configuration errors"が表示される

必要な環境変数が設定されていません。`.env`ファイルを確認してください。

### Private channelで動作しない

1. Botがチャンネルに追加されているか確認
2. `groups:history`と`groups:read`権限があるか確認

### Dify APIエラー

1. API Keyが正しいか確認
2. Dify側でアプリケーションが公開されているか確認
3. `DEBUG=true`でより詳細なログを確認

## 📊 開発コマンド

```bash
# 開発サーバー起動（自動リロード）
npm run dev

# TypeScriptコンパイル
npm run build

# 本番実行
npm start

# コード検証
npm run lint

# 型チェック
npm run typecheck

# クリーンビルド
npm run clean && npm run build
```

## 🆕 更新履歴

### v1.1.0 (2025-09-16)
- 🖼️ 画像ファイルアップロード機能を追加
- ⏱️ 高度なタイムアウト処理（60秒）
- 💬 動的メッセージ更新（処理中→結果）
- 🔍 ログレベル動的切り替え
- 🛡️ エラーハンドリング強化

### v1.0.0 (2025-09-16)
- 🚀 初回リリース
- Socket Mode対応
- 基本的なメッセージング機能

## 🏗️ プロジェクト構造

```
slack-dify-bridge/
├── src/
│   ├── index.ts           # エントリーポイント
│   ├── slack-handler.ts   # Slack イベントハンドラー（ファイル処理含む）
│   ├── dify-client.ts     # Dify API クライアント（アップロード対応）
│   └── config.ts          # 設定管理
├── dist/                  # ビルド出力
├── .env.example           # 環境変数テンプレート
├── package.json           # プロジェクト設定
├── tsconfig.json          # TypeScript設定
└── README.md             # このファイル
```

## 💡 勉強会での活用例

### デモパターン例
1. **カスタマーサポートBot**
   - FAQナレッジベースを構築
   - 画像での問い合わせ対応（スクリーンショット分析）

2. **技術ドキュメント検索Bot**
   - 社内ドキュメントをRAG化
   - コード質問への回答

3. **画像分析Bot**
   - 画像内容の説明
   - OCR機能での文字抽出
   - ダイアグラムの解析

4. **多言語対応Bot**
   - 自動翻訳機能
   - 多言語ナレッジベース

### プレゼンのコツ
- ターミナルでログを表示しながらデモ（DEBUG=true）
- 画像送信で視覚的なインパクト
- Private channelでの動作を実演
- レスポンス時間を計測して性能アピール

## 🤝 コントリビューション

Issue報告やPull Requestは歓迎します！

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照

## 🙏 謝辞

- [Slack Bolt Framework](https://slack.dev/bolt-js/)
- [Dify](https://dify.ai)
- 勉強会メンバーの皆様

## 📞 サポート

問題が発生した場合は、[Issues](https://github.com/ijuinryukichi/slack-dify-bridge/issues)でお知らせください。

---

Made with ❤️ for Dify Study Group