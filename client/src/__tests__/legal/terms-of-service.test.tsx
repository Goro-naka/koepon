import { render, screen } from '@testing-library/react';
import { TermsOfServicePage } from '@/pages/legal/terms-of-service';

// Red Phase: これらのテストは最初失敗する
describe('利用規約ページ', () => {
  test('利用規約ページが正常に表示される', async () => {
    render(<TermsOfServicePage />);
    
    expect(screen.getByRole('heading', { name: '利用規約' })).toBeInTheDocument();
    expect(screen.getByText('サービス内容')).toBeInTheDocument();
    expect(screen.getByText('利用者の義務')).toBeInTheDocument();
    expect(screen.getByText('禁止行為')).toBeInTheDocument();
    expect(screen.getByText('知的財産権')).toBeInTheDocument();
    expect(screen.getByText('免責事項')).toBeInTheDocument();
    expect(screen.getByText('準拠法・管轄裁判所')).toBeInTheDocument();
  });

  test('最終更新日が表示される', async () => {
    const mockTerms = {
      lastUpdated: new Date('2024-01-01T00:00:00Z'),
      version: 'v1.0'
    };
    
    render(<TermsOfServicePage terms={mockTerms} />);
    
    expect(screen.getByText(/最終更新日.*2024年1月1日/)).toBeInTheDocument();
    expect(screen.getByText('バージョン: v1.0')).toBeInTheDocument();
  });
});