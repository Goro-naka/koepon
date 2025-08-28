import { render, screen } from '@testing-library/react';
import { PrivacyPolicyPage } from '@/pages/legal/privacy-policy';

// Red Phase: これらのテストは最初失敗する
describe('プライバシーポリシーページ', () => {
  test('プライバシーポリシーページが正常に表示される', async () => {
    render(<PrivacyPolicyPage />);
    
    expect(screen.getByRole('heading', { name: 'プライバシーポリシー' })).toBeInTheDocument();
    expect(screen.getByText('個人情報の収集について')).toBeInTheDocument();
    expect(screen.getByText('個人情報の利用目的')).toBeInTheDocument();
    expect(screen.getByText('個人情報の第三者提供')).toBeInTheDocument();
    expect(screen.getByText('個人情報の保護について')).toBeInTheDocument();
    expect(screen.getByText('Cookie等の取扱い')).toBeInTheDocument();
    expect(screen.getByText('個人情報の開示・訂正・削除')).toBeInTheDocument();
    expect(screen.getByText('本ポリシーの変更')).toBeInTheDocument();
    expect(screen.getByText('お問い合わせ')).toBeInTheDocument();
  });

  test('最終更新日とバージョンが表示される', async () => {
    const mockPolicy = {
      lastUpdated: new Date('2024-01-01T00:00:00Z'),
      version: 'v1.0'
    };
    
    render(<PrivacyPolicyPage policy={mockPolicy} />);
    
    expect(screen.getByText(/最終更新日.*2024年1月1日/)).toBeInTheDocument();
    expect(screen.getByText('バージョン: v1.0')).toBeInTheDocument();
  });

  test('収集する個人情報の種類が明記される', async () => {
    render(<PrivacyPolicyPage />);
    
    // 収集する情報の種類
    expect(screen.getByText(/メールアドレス/)).toBeInTheDocument();
    expect(screen.getByText(/利用履歴/)).toBeInTheDocument();
    expect(screen.getByText(/端末情報/)).toBeInTheDocument();
    expect(screen.getByText(/IPアドレス/)).toBeInTheDocument();
  });

  test('利用目的が明確に記載される', async () => {
    render(<PrivacyPolicyPage />);
    
    expect(screen.getByText(/サービスの提供/)).toBeInTheDocument();
    expect(screen.getByText(/お客様への連絡/)).toBeInTheDocument();
    expect(screen.getByText(/サービス改善/)).toBeInTheDocument();
    expect(screen.getByText(/不正利用の防止/)).toBeInTheDocument();
  });
});