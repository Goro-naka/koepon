'use client'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-100 to-white p-8 border-b border-slate-100">
            <h1 className="text-4xl font-light text-slate-800 tracking-wide">プライバシーポリシー</h1>
            <p className="text-slate-600 mt-2">最終更新日: 2025年8月26日</p>
          </div>
          
          <div className="p-8 prose prose-slate max-w-none">
            <h2>第1条（個人情報の収集について）</h2>
            <p>
              当社では、利用者により良いサービスを提供するため、以下の個人情報を収集いたします：
            </p>
            <ul>
              <li><strong>メールアドレス</strong>: アカウント管理、連絡のため</li>
              <li><strong>利用履歴</strong>: サービス改善、推奨コンテンツ提供のため</li>
              <li><strong>端末情報</strong>: システム最適化、セキュリティ向上のため</li>
              <li><strong>IPアドレス</strong>: 不正利用防止、地域別サービス提供のため</li>
            </ul>

            <h2>第2条（個人情報の利用目的）</h2>
            <p>収集した個人情報は、以下の目的で利用いたします：</p>
            <ul>
              <li><strong>サービスの提供</strong>: ガチャ機能、コンテンツ配信等</li>
              <li><strong>お客様への連絡</strong>: 重要なお知らせ、システムメンテナンス情報等</li>
              <li><strong>サービス改善</strong>: 利用状況分析、新機能開発</li>
              <li><strong>不正利用の防止</strong>: セキュリティ強化、悪用対策</li>
              <li><strong>カスタマーサポート</strong>: お問い合わせ対応、技術支援</li>
            </ul>

            <h2>第3条（個人情報の第三者提供）</h2>
            <p>
              当社は、利用者の事前の同意なく個人情報を第三者に提供することはありません。
              ただし、以下の場合を除きます：
            </p>
            <ul>
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要である場合</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要である場合</li>
              <li>国の機関等が法令の定める事務を遂行することに対して協力する必要がある場合</li>
            </ul>

            <h2>第4条（個人情報の保護について）</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <p className="text-blue-900">
                当社では、個人情報の安全管理のため、適切な管理体制を整備し、従業員への教育を実施しています。
                また、SSL暗号化通信の採用、ファイアウォールの設置等、技術的安全管理措置を講じています。
              </p>
            </div>

            <h2>第5条（Cookie等の取扱い）</h2>
            <p>
              当サービスでは、より良いサービス提供のためCookieを使用しています：
            </p>
            <ul>
              <li><strong>必須Cookie</strong>: サービス機能に必要な認証情報等</li>
              <li><strong>分析Cookie</strong>: 利用状況分析のための匿名化されたデータ</li>
              <li><strong>広告Cookie</strong>: パートナー広告配信のための情報（オプトアウト可能）</li>
            </ul>
            <p className="text-sm text-slate-600">
              Cookieの設定はブラウザから変更可能です。ただし、無効化により一部機能が利用できなくなる場合があります。
            </p>

            <h2>第6条（個人情報の開示・訂正・削除）</h2>
            <p>
              利用者は、自身の個人情報について以下の権利を有します：
            </p>
            <div className="bg-slate-50 rounded-xl p-6">
              <ul className="space-y-2">
                <li><strong>開示権</strong>: 保有する個人情報の開示請求</li>
                <li><strong>訂正権</strong>: 個人情報の訂正・追加・削除請求</li>
                <li><strong>利用停止権</strong>: 個人情報の利用停止・消去請求</li>
                <li><strong>第三者提供停止権</strong>: 第三者への提供停止請求</li>
              </ul>
              <p className="text-sm text-slate-600 mt-4">
                これらの請求は、本人確認後に速やかに対応いたします。
              </p>
            </div>

            <h2>第7条（国際データ移転）</h2>
            <p>
              当サービスでは、サービス提供のため一部の個人情報を適切な安全管理措置を講じた上で
              海外のサーバーで処理する場合があります。移転先国はGDPR十分性認定国またはそれと
              同等の保護水準を満たす国に限定されます。
            </p>

            <h2>第8条（本ポリシーの変更）</h2>
            <p>
              当社は、法令の変更やサービス機能の追加に伴い、本ポリシーを変更する場合があります。
              重要な変更については、サービス内通知およびメール通知により事前にお知らせいたします。
            </p>

            <h2>第9条（お問い合わせ）</h2>
            <div className="bg-gradient-to-r from-slate-100 to-white rounded-xl p-6 border border-slate-200">
              <p className="text-slate-800 mb-4">
                個人情報の取扱いに関するお問い合わせは、以下までご連絡ください：
              </p>
              <div className="space-y-2 text-slate-700">
                <p><strong>こえポン！個人情報保護責任者</strong></p>
                <p>メール: privacy@koepon.jp</p>
                <p>電話: 03-1234-5678</p>
                <p className="text-sm text-slate-600">受付時間: 平日 10:00-18:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}