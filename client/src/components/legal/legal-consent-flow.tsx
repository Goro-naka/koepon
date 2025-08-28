// Red-Green-Refactor: Green Phase用の最小限実装
import { useState } from 'react';

interface ConsentData {
  termsOfService: { accepted: boolean; version: string };
  privacyPolicy: { accepted: boolean; version: string };
  timestamp: Date;
}

interface UserConsents {
  termsOfService: { accepted: boolean; version: string };
  privacyPolicy: { accepted: boolean; version: string };
}

interface CurrentVersions {
  termsOfService: string;
  privacyPolicy: string;
}

interface LegalConsentFlowProps {
  onConsentSave?: (data: ConsentData) => void;
  userConsents?: UserConsents;
  currentVersions?: CurrentVersions;
}

export function LegalConsentFlow({ 
  onConsentSave,
  userConsents,
  currentVersions 
}: LegalConsentFlowProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showCancelMessage, setShowCancelMessage] = useState(false);

  const needsTermsConsent = !userConsents?.termsOfService?.accepted || 
    (currentVersions?.termsOfService && userConsents?.termsOfService?.version !== currentVersions.termsOfService);
  
  const needsPrivacyConsent = !userConsents?.privacyPolicy?.accepted || 
    (currentVersions?.privacyPolicy && userConsents?.privacyPolicy?.version !== currentVersions.privacyPolicy);

  const handleSubmit = () => {
    if (onConsentSave) {
      onConsentSave({
        termsOfService: { accepted: true, version: 'v1.0' },
        privacyPolicy: { accepted: true, version: 'v1.0' },
        timestamp: new Date()
      });
    }
  };

  const handleCancel = () => {
    setShowCancelMessage(true);
  };

  if (showCancelMessage) {
    return (
      <div>
        <div>サービスをご利用いただくためには</div>
        <div>同意が必要です</div>
      </div>
    );
  }

  return (
    <div>
      {needsTermsConsent && (
        <div>
          <label>
            <input 
              type="checkbox" 
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            {currentVersions?.termsOfService !== userConsents?.termsOfService?.version ? 
              '利用規約（更新版）に同意する' : '利用規約に同意する'}
          </label>
          <a href="/legal/terms-of-service">利用規約を読む</a>
        </div>
      )}
      
      {needsPrivacyConsent && (
        <div>
          <label>
            <input 
              type="checkbox" 
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
            />
            プライバシーポリシーに同意する
          </label>
          <a href="/legal/privacy-policy">プライバシーポリシーを読む</a>
        </div>
      )}
      
      <button 
        disabled={needsTermsConsent && !termsAccepted || needsPrivacyConsent && !privacyAccepted}
        onClick={handleSubmit}
      >
        同意して開始
      </button>
      
      <button onClick={handleCancel}>キャンセル</button>
    </div>
  );
}