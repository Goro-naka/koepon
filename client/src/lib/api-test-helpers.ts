// Red-Green-Refactor: Green Phase用の最小限API テストヘルパー

// Node.js環境でResponseが定義されていない場合のポリフィル
if (typeof Response === 'undefined') {
  global.Response = class MockResponse {
    status: number;
    headers: any;
    private _body: string;

    constructor(body: string, init: { status: number; headers: any }) {
      this.status = init.status;
      this.headers = init.headers;
      this._body = body;
    }

    async json() {
      return JSON.parse(this._body);
    }
  } as any;
}

export async function GET(url: string): Promise<Response> {
  // モック実装: テストを通すための最小限の実装
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function POST(url: string, data?: any): Promise<Response> {
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}