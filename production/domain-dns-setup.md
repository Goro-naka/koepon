# Domain & DNS Configuration for Koepon

## Overview
こえポン！プロジェクト用のカスタムドメイン設定とDNS構成

## Domain Strategy

### Recommended Domain Names
1. **koepon.app** (推奨) - アプリらしい印象
2. **koepon.com** - 一般的な選択
3. **koepon.io** - テック系らしい印象
4. **koepon.co.jp** - 日本市場向け（高コスト）

### Domain Purchase Options

#### Cloudflare Domains (推奨)
- **コスト**: $10-15/year
- **メリット**: DNS管理統合、セキュリティ機能、低価格
- **購入手順**:
  1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
  2. Domain Registration > Search for domain
  3. koepon.app を検索・購入

#### Google Domains / Squarespace
- **コスト**: $12-20/year  
- **メリット**: 使いやすいUI、Google Workspace統合
- **購入後**: Cloudflareにネームサーバー変更

## DNS Configuration (Cloudflare)

### DNS Records Setup

#### Production Environment
```dns
# A Records (IPv4)
koepon.app                A    76.76.19.19  # Vercel IP
www.koepon.app           A    76.76.19.19  # Vercel IP

# CNAME Records  
staging.koepon.app       CNAME  koepon.vercel.app
api.koepon.app          CNAME  koepon-api.railway.app  # 将来のAPI
api-staging.koepon.app   CNAME  koepon-api-staging.railway.app

# MX Records (メール配信用)
koepon.app              MX    10 mx1.improvmx.com
koepon.app              MX    20 mx2.improvmx.com

# TXT Records (検証・SPF)
koepon.app              TXT   "v=spf1 include:_spf.improvmx.com ~all"
_dmarc.koepon.app       TXT   "v=DMARC1; p=quarantine; rua=mailto:dmarc@koepon.app"
```

#### SSL/TLS Configuration
- **SSL/TLS Mode**: Full (Strict)
- **Edge Certificates**: Universal SSL有効
- **HSTS**: 有効 (max-age=31536000)
- **Always Use HTTPS**: 有効

## Vercel Domain Configuration

### Custom Domain Setup
```bash
# Vercelにカスタムドメイン追加
vercel domains add koepon.app
vercel domains add www.koepon.app  
vercel domains add staging.koepon.app

# DNS検証確認
vercel domains verify koepon.app
```

### Domain Assignment
```bash
# Production環境にドメイン割り当て
vercel domains assign koepon.app koepon --prod
vercel domains assign www.koepon.app koepon --prod

# Staging環境 
vercel domains assign staging.koepon.app koepon --env=preview
```

## Email Configuration (ImprovMX)

### Free Email Forwarding Setup
1. [ImprovMX](https://improvmx.com/) でアカウント作成
2. ドメイン追加: koepon.app
3. MX/TXT レコード設定（上記DNS設定参照）

### Email Aliases
```
info@koepon.app      → [管理者メール]
support@koepon.app   → [サポートメール] 
noreply@koepon.app   → [システムメール]
admin@koepon.app     → [管理者メール]
legal@koepon.app     → [法務担当メール]
```

## Security Configuration

### Cloudflare Security Settings

#### Firewall Rules
```javascript
// 日本・アメリカ以外からのアクセス制限
(ip.geoip.country ne "JP" and ip.geoip.country ne "US") 
and (http.request.uri.path contains "/admin")
// Action: Challenge

// Bot攻撃対策
(cf.bot_management.score lt 30)
// Action: Block

// API レート制限
(http.request.uri.path contains "/api/gacha") 
and (rate.limit.window.10m gt 100)
// Action: Block
```

#### DDoS Protection
- **DDoS Protection**: 有効
- **Bot Fight Mode**: 有効
- **Security Level**: Medium
- **Browser Integrity Check**: 有効

### Content Security Policy
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://vercel.live;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://rtwclsmarfgfidbmcudu.supabase.co;
  frame-src 'none';
  object-src 'none';
  upgrade-insecure-requests;
```

## Performance Optimization

### Cloudflare Caching Rules
```javascript
// Static Assets (1年キャッシュ)
(http.request.uri.path matches ".*\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?)$")
// Cache Level: Cache Everything, Edge TTL: 1 year

// HTML Pages (1時間キャッシュ)
(http.request.uri.path matches "^/$" or http.request.uri.path matches ".*\\.html$")
// Cache Level: Cache Everything, Edge TTL: 1 hour

// API endpoints (キャッシュ無効)
(http.request.uri.path contains "/api/")
// Cache Level: Bypass
```

### Page Rules Priority
1. `/api/*` - Cache Level: Bypass
2. `*.koepon.app/admin*` - Security Level: High
3. `*.koepon.app/*` - Cache Everything

## Monitoring & Analytics

### Cloudflare Analytics
- **Web Analytics**: 有効（プライバシー重視）
- **Real User Monitoring**: 有効
- **Core Web Vitals**: 監視

### Google Analytics 4
```html
<!-- Global Site Tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID', {
    page_title: 'Koepon - VTuber Gacha Platform',
    custom_map: {'custom_parameter_1': 'vtuber_id'}
  });
</script>
```

## SEO Configuration

### Meta Tags (Next.js)
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: 'こえポン！ - VTuberガチャプラットフォーム',
  description: 'お気に入りのVTuberの限定メダルを集めて、特別な体験を手に入れよう！',
  keywords: 'VTuber,ガチャ,推しメダル,デジタルコンテンツ',
  authors: [{name: 'Koepon Team'}],
  creator: 'Koepon',
  publisher: 'Koepon',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'こえポン！ - VTuberガチャプラットフォーム',
    description: 'お気に入りのVTuberの限定メダルを集めて、特別な体験を手に入れよう！',
    url: 'https://koepon.app',
    siteName: 'こえポン！',
    images: [{
      url: 'https://koepon.app/og-image.png',
      width: 1200,
      height: 630,
      alt: 'こえポン！ - VTuberガチャプラットフォーム',
    }],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'こえポン！ - VTuberガチャプラットフォーム',
    description: 'お気に入りのVTuberの限定メダルを集めて、特別な体験を手に入れよう！',
    creator: '@koepon_official',
    images: ['https://koepon.app/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
```

### Sitemap & Robots.txt
```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://koepon.app</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://koepon.app/gacha</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://koepon.app/legal/terms-of-service</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

```text
# public/robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /*.json$

Sitemap: https://koepon.app/sitemap.xml
```

## Cost Estimation

### Domain & DNS (Annual)
- **Domain**: $12/year (koepon.app)
- **Cloudflare Pro**: $20/month = $240/year (オプション)
- **Email Forwarding**: $0 (ImprovMX Free)
- **Total**: $12-252/year

### Monthly Operations (Free Tier)
- **Cloudflare Free**: $0
- **DNS Queries**: Unlimited
- **SSL Certificates**: $0
- **Basic DDoS Protection**: $0

## Implementation Timeline

### Phase 1: Domain Purchase & Basic Setup
1. ドメイン購入 (koepon.app)
2. Cloudflare DNS設定
3. Vercel カスタムドメイン設定
4. SSL証明書検証

### Phase 2: Security & Performance  
1. Firewall Rules設定
2. Page Rules設定  
3. Security Headers設定
4. Performance最適化

### Phase 3: Monitoring & Analytics
1. Analytics設定
2. Uptime監視設定
3. Performance監視設定
4. SEO最適化

## Verification Commands

```bash
# DNS設定確認
dig koepon.app
dig www.koepon.app
dig staging.koepon.app

# SSL証明書確認  
curl -I https://koepon.app
openssl s_client -connect koepon.app:443 -servername koepon.app

# Performance テスト
curl -o /dev/null -s -w "%{time_total}\n" https://koepon.app

# Security Headers確認
curl -I https://koepon.app | grep -i security
```

## Next Steps

1. 🌐 ドメイン購入・DNS設定
2. 🔒 SSL/Security設定  
3. 📊 Analytics・監視設定
4. 🚀 Performance最適化
5. 🔍 SEO対策実装