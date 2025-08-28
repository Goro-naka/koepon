'use client'

export default function CommercialTransactions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-100 to-white p-8 border-b border-slate-100">
            <h1 className="text-4xl font-light text-slate-800 tracking-wide">特定商取引法に基づく表記</h1>
            <p className="text-slate-600 mt-2">最終更新日: 2025年8月26日</p>
          </div>
          
          <div className="p-8">
            <div className="grid gap-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">事業者名</h3>
                    <p className="text-slate-600">こえポン！運営事務局</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">所在地</h3>
                    <p className="text-slate-600">
                      〒100-0001<br />
                      東京都千代田区千代田1-1-1<br />
                      こえポンビル5F
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">電話番号</h3>
                    <p className="text-slate-600">03-1234-5678</p>
                    <p className="text-sm text-slate-500">受付時間: 平日 10:00-18:00</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">電子メールアドレス</h3>
                    <p className="text-slate-600">support@koepon.jp</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">代表者</h3>
                    <p className="text-slate-600">代表取締役 田中 太郎</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">販売価格</h3>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-slate-700 mb-2">ガチャ単発: 100円〜500円（税込）</p>
                      <p className="text-slate-700 mb-2">ガチャ10連: 1,000円〜5,000円（税込）</p>
                      <p className="text-sm text-slate-600">※VTuberごとに価格設定が異なります</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">支払方法</h3>
                    <ul className="text-slate-600 space-y-1">
                      <li>・クレジットカード（Visa、MasterCard、JCB、AMEX）</li>
                      <li>・コンビニ決済</li>
                      <li>・銀行振込</li>
                      <li>・電子マネー決済</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">商品の引渡時期</h3>
                    <p className="text-slate-600">
                      決済完了後、即座にデジタルコンテンツをお客様のアカウントに付与いたします。
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">返品・交換</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-amber-800 text-sm">
                        デジタルコンテンツの性質上、お客様都合による返品・交換はお受けできません。
                        システム障害等により正常にサービスを提供できない場合は返金対応いたします。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}