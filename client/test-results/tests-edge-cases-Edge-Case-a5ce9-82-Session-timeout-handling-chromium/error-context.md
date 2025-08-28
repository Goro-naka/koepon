# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]:
        - link "こえポン！" [ref=e6] [cursor=pointer]:
          - /url: /
          - generic [ref=e9] [cursor=pointer]: こえポン！
        - navigation [ref=e10]:
          - link "VTuber" [ref=e11] [cursor=pointer]:
            - /url: /vtubers
          - link "イベント一覧" [ref=e12] [cursor=pointer]:
            - /url: /gacha
          - link "交換所" [ref=e13] [cursor=pointer]:
            - /url: /exchange
          - link "特典BOX" [ref=e14] [cursor=pointer]:
            - /url: /rewards
        - generic [ref=e16]:
          - link "ログイン" [ref=e17] [cursor=pointer]:
            - /url: /auth/login
          - link "新規登録" [ref=e18] [cursor=pointer]:
            - /url: /auth/register
    - heading "ガチャ一覧" [level=1] [ref=e21]
  - button "Open Next.js Dev Tools" [ref=e118] [cursor=pointer]:
    - img [ref=e119] [cursor=pointer]
  - alert [ref=e122]
```