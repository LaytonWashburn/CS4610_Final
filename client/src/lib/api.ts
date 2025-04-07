
import store from '../store/store';
import { setError } from '../store/error_slice';


export class Api {
  authToken: string | null = null;

  constructor(initialToken: string | null) {
    this.authToken = initialToken
  }

  async makeRequest(url: string, method: "GET" | "PUT" | "POST" | "DELETE", body: any = {}) {
    const options: any = {};
    if (method === 'POST' || method === 'PUT') {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const responseBody = await res.json();
    if (res.status >= 400) {
      store.dispatch(setError(responseBody.error || "An error occurred. Please contact support."));
    }
    return responseBody;
  }

  async formPost(url: string, body: string) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
      body
    });
    const responseBody = await res.json();
    if (res.status >= 400) {
      store.dispatch(setError(responseBody.error || "An error occurred. Please contact support."));
    }
    return responseBody;
  }

  get(url: string) {
    return this.makeRequest(url, 'GET');
  }

  post(url: string, body: any = {}) {
    return this.makeRequest(url, 'POST', body);
  }

  put(url: string, body: any = {}) {
    return this.makeRequest(url, 'PUT', body);
  }

  del(url: string) {
    return this.makeRequest(url, 'DELETE');
  }
}