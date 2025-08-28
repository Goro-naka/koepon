
// TASK-504 UAT フィードバック収集システム
// ステージング環境にのみ表示されるフィードバックウィジェット

(function() {
  // ステージング環境でのみ実行
  if (!window.location.hostname.includes('staging')) {
    return;
  }
  
  // フィードバックボタンを作成
  const feedbackButton = document.createElement('div');
  feedbackButton.id = 'uat-feedback-button';
  feedbackButton.innerHTML = '📝 UAT フィードバック';
  feedbackButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #007bff;
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    cursor: pointer;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,123,255,0.3);
    z-index: 10000;
    transition: all 0.3s ease;
  `;
  
  feedbackButton.onmouseover = function() {
    this.style.transform = 'scale(1.05)';
    this.style.boxShadow = '0 4px 15px rgba(0,123,255,0.4)';
  };
  
  feedbackButton.onmouseout = function() {
    this.style.transform = 'scale(1)';
    this.style.boxShadow = '0 2px 10px rgba(0,123,255,0.3)';
  };
  
  // フィードバックモーダルを作成
  feedbackButton.onclick = function() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const form = document.createElement('div');
    form.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    form.innerHTML = `
      <h3 style="margin-top: 0; color: #333;">UAT フィードバック</h3>
      <p style="color: #666; margin-bottom: 20px;">テスト中に気づいた点をお聞かせください</p>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">フィードバック種別:</label>
        <select id="feedback-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="bug">バグ報告</option>
          <option value="improvement">改善要望</option>
          <option value="usability">使いやすさ</option>
          <option value="performance">性能問題</option>
          <option value="other">その他</option>
        </select>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">重要度:</label>
        <select id="feedback-priority" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="critical">クリティカル</option>
        </select>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">現在のページ:</label>
        <input type="text" id="feedback-page" value="${window.location.pathname}" readonly 
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">詳細内容:</label>
        <textarea id="feedback-content" rows="5" 
                  style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"
                  placeholder="具体的な内容、再現手順、期待される動作などを記入してください..."></textarea>
      </div>
      
      <div style="text-align: right;">
        <button type="button" onclick="this.closest('.feedback-modal').remove()" 
                style="margin-right: 10px; padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">
          キャンセル
        </button>
        <button type="button" id="submit-feedback" 
                style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          送信
        </button>
      </div>
    `;
    
    modal.className = 'feedback-modal';
    modal.appendChild(form);
    document.body.appendChild(modal);
    
    // 送信処理
    document.getElementById('submit-feedback').onclick = function() {
      const feedback = {
        type: document.getElementById('feedback-type').value,
        priority: document.getElementById('feedback-priority').value,
        page: document.getElementById('feedback-page').value,
        content: document.getElementById('feedback-content').value,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // ローカルストレージに保存（実際の実装では外部APIに送信）
      const feedbacks = JSON.parse(localStorage.getItem('uat-feedbacks') || '[]');
      feedbacks.push(feedback);
      localStorage.setItem('uat-feedbacks', JSON.stringify(feedbacks));
      
      alert('フィードバックを送信しました。ありがとうございます！');
      modal.remove();
    };
    
    // 背景クリックで閉じる
    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    };
  };
  
  // ページに追加
  document.body.appendChild(feedbackButton);
  
  // フィードバック数を表示
  const feedbacks = JSON.parse(localStorage.getItem('uat-feedbacks') || '[]');
  if (feedbacks.length > 0) {
    const badge = document.createElement('div');
    badge.textContent = feedbacks.length;
    badge.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      background: #dc3545;
      color: white;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 50%;
      min-width: 18px;
      text-align: center;
    `;
    feedbackButton.appendChild(badge);
  }
})();
