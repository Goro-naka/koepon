'use client'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-100 to-white p-8 border-b border-slate-100">
            <h1 className="text-4xl font-light text-slate-800 tracking-wide">利用規約</h1>
            <p className="text-slate-600 mt-2">最終更新日: 2025年8月26日</p>
          </div>
          
          <div className="p-8 prose prose-slate max-w-none">
            <h2>第1条（適用範囲）</h2>
            <p>
              本利用規約（以下「本規約」といいます）は、こえポン！（以下「当サービス」といいます）の利用に関して、
              当サービスを運営する当社と利用者との間の権利義務関係を定めるものです。
            </p>

            <h2>第2条（定義）</h2>
            <ol>
              <li><strong>ガチャ</strong>: デジタルコンテンツを確率的に取得できるサービス</li>
              <li><strong>推しメダル</strong>: 当サービス内で使用される仮想通貨</li>
              <li><strong>デジタルコンテンツ</strong>: VTuberが提供する音声、画像、動画等のデジタルファイル</li>
              <li><strong>VTuber</strong>: 当サービスでコンテンツを販売する配信者</li>
            </ol>

            <h2>第3条（景品表示法に関する表示）</h2>
            <p>
              当サービスのガチャシステムは、景品表示法（昭和37年法律第134号）の規定に準拠しています：
            </p>
            <ul>
              <li>各アイテムの提供割合を明確に表示</li>
              <li>推しメダルを必ず付与することで、全ての購入に対して価値を保証</li>
              <li>確率表示の透明性確保</li>
            </ul>

            <h2>第4条（禁止事項）</h2>
            <p>利用者は以下の行為を行ってはなりません：</p>
            <ul>
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当サービスの運営を妨害する行為</li>
              <li>他の利用者に迷惑をかける行為</li>
              <li>推しメダルやアイテムの不正取得・譲渡</li>
            </ul>

            <h2>第5条（決済・返金）</h2>
            <p>
              当サービスの決済は信頼性の高い決済代行サービスを利用しています。
              返金についてはデジタルコンテンツの性質上、原則として対応いたしかねます。
              ただし、システム障害等による場合はこの限りではありません。
            </p>

            <h2>第6条（個人情報の取扱い）</h2>
            <p>
              当社は、利用者の個人情報を当社のプライバシーポリシーに従って適切に取り扱います。
            </p>

            <h2>第7条（免責事項）</h2>
            <p>
              当社は、当サービスの利用により利用者に生じた損害について、故意または重大な過失がある場合を除き、
              一切の責任を負いません。
            </p>

            <h2>第8条（準拠法・管轄）</h2>
            <p>
              本規約は日本法に準拠し、当サービスに関する一切の紛争については、
              東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>

            <h2>第9条（規約の変更）</h2>
            <p>
              当社は、利用者への事前通知により本規約を変更することができます。
              変更後の利用規約は、当サービス上に掲示した時点から効力を生じます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}