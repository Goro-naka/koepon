import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LegalConsentFlow } from '@/components/legal/legal-consent-flow';

// Red Phase: これらのテストは最初失敗する
describe('法的同意フロー', () => {
  test('初回登録時に利用規約とプライバシーポリシーの同意が必要', async () => {
    const user = userEvent.setup();
    
    render(<LegalConsentFlow />);
    
    expect(screen.getByText('利用規約に同意する')).toBeInTheDocument();
    expect(screen.getByText('プライバシーポリシーに同意する')).toBeInTheDocument();
    
    const termsCheckbox = screen.getByRole('checkbox', { name: /利用規約/ });
    const privacyCheckbox = screen.getByRole('checkbox', { name: /プライバシーポリシー/ });
    const submitButton = screen.getByRole('button', { name: '同意して開始' });
    
    // 初期状態では同意ボタンが無効
    expect(submitButton).toBeDisabled();
    
    // 利用規約のみ同意 - まだ無効
    await user.click(termsCheckbox);
    expect(submitButton).toBeDisabled();
    
    // 両方同意で有効化
    await user.click(privacyCheckbox);
    expect(submitButton).toBeEnabled();
  });

  test('法的文書のリンクが正しく表示される', async () => {
    render(<LegalConsentFlow />);
    
    const termsLink = screen.getByRole('link', { name: /利用規約を読む/ });
    const privacyLink = screen.getByRole('link', { name: /プライバシーポリシーを読む/ });
    
    expect(termsLink).toHaveAttribute('href', '/legal/terms-of-service');
    expect(privacyLink).toHaveAttribute('href', '/legal/privacy-policy');
  });

  test('同意情報がSupabaseに正しく保存される', async () => {
    const user = userEvent.setup();
    const mockSaveConsent = jest.fn();
    
    render(<LegalConsentFlow onConsentSave={mockSaveConsent} />);
    
    const termsCheckbox = screen.getByRole('checkbox', { name: /利用規約/ });
    const privacyCheckbox = screen.getByRole('checkbox', { name: /プライバシーポリシー/ });
    const submitButton = screen.getByRole('button', { name: '同意して開始' });
    
    await user.click(termsCheckbox);
    await user.click(privacyCheckbox);
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSaveConsent).toHaveBeenCalledWith({
        termsOfService: { accepted: true, version: 'v1.0' },
        privacyPolicy: { accepted: true, version: 'v1.0' },
        timestamp: expect.any(Date)
      });
    });
  });

  test('既存ユーザーは最新版の同意が必要な場合のみ表示', async () => {
    const mockUserConsents = {
      termsOfService: { accepted: true, version: 'v1.0' },
      privacyPolicy: { accepted: true, version: 'v1.0' }
    };
    
    const mockCurrentVersions = {
      termsOfService: 'v1.1', // バージョンアップ
      privacyPolicy: 'v1.0'
    };
    
    render(
      <LegalConsentFlow 
        userConsents={mockUserConsents}
        currentVersions={mockCurrentVersions}
      />
    );
    
    // 利用規約のみ再同意が必要
    expect(screen.getByText('利用規約（更新版）に同意する')).toBeInTheDocument();
    expect(screen.queryByText('プライバシーポリシーに同意する')).not.toBeInTheDocument();
  });

  test('同意拒否時の適切なメッセージ表示', async () => {
    const user = userEvent.setup();
    
    render(<LegalConsentFlow />);
    
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    await user.click(cancelButton);
    
    expect(screen.getByText(/サービスをご利用いただくためには/)).toBeInTheDocument();
    expect(screen.getByText(/同意が必要です/)).toBeInTheDocument();
  });
});