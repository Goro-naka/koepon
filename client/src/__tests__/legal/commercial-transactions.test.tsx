import { render, screen } from '@testing-library/react';
import { CommercialTransactionsPage } from '@/pages/legal/commercial-transactions';

// Red Phase: これらのテストは最初失敗する
describe('特定商取引法表記ページ', () => {
  test('特定商取引法ページが正常に表示される', async () => {
    render(<CommercialTransactionsPage />);
    
    // ページタイトルの確認
    expect(screen.getByRole('heading', { name: '特定商取引法に基づく表記' })).toBeInTheDocument();
    
    // 必須項目の存在確認
    expect(screen.getByText('事業者名')).toBeInTheDocument();
    expect(screen.getByText('所在地')).toBeInTheDocument();
    expect(screen.getByText('電話番号')).toBeInTheDocument();
    expect(screen.getByText('電子メールアドレス')).toBeInTheDocument();
    expect(screen.getByText('代表者')).toBeInTheDocument();
    expect(screen.getByText('販売価格')).toBeInTheDocument();
    expect(screen.getByText('支払方法')).toBeInTheDocument();
    expect(screen.getByText('商品の引渡時期')).toBeInTheDocument();
    expect(screen.getByText('返品・交換')).toBeInTheDocument();
  });

  test('特定商取引法情報が正しく表示される', async () => {
    const mockCommercialInfo = {
      companyName: 'テスト株式会社',
      representativeName: 'テスト太郎',
      address: '東京都渋谷区テスト1-1-1',
      phoneNumber: '03-1234-5678',
      email: 'contact@test.com'
    };
    
    render(<CommercialTransactionsPage commercialInfo={mockCommercialInfo} />);
    
    expect(screen.getByText('テスト株式会社')).toBeInTheDocument();
    expect(screen.getByText('テスト太郎')).toBeInTheDocument();
    expect(screen.getByText('東京都渋谷区テスト1-1-1')).toBeInTheDocument();
    expect(screen.getByText('03-1234-5678')).toBeInTheDocument();
    expect(screen.getByText('contact@test.com')).toBeInTheDocument();
  });
});