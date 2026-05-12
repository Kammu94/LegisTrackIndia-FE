import MockAdapter from 'axios-mock-adapter';
import { describe, expect, it, vi } from 'vitest';
import { httpClient } from './httpClient';
import { setNotifyRef } from '../notifications/notifyService';

describe('httpClient', () => {
  it('adds Authorization header when token exists', async () => {
    const mock = new MockAdapter(httpClient);
    localStorage.setItem('token', 'token-123');

    mock.onGet('/echo').reply((config) => {
      return [200, { auth: config.headers?.Authorization }];
    });

    const response = await httpClient.get<{ auth?: string }>('/echo');
    expect(response.data.auth).toBe('Bearer token-123');

    localStorage.removeItem('token');
    mock.restore();
  });

  it('notifies on 500 errors with persist true', async () => {
    const notifyFn = vi.fn().mockReturnValue('id');
    setNotifyRef(notifyFn);

    const mock = new MockAdapter(httpClient);
    mock.onGet('/fail').reply(500, { message: 'Boom' });

    await expect(httpClient.get('/fail')).rejects.toBeDefined();

    expect(notifyFn).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        title: 'Server Error',
        message: 'Boom',
        persist: true,
      })
    );

    mock.restore();
    setNotifyRef(null);
  });

  it('notifies on 401 as security with persist true', async () => {
    const notifyFn = vi.fn().mockReturnValue('id');
    setNotifyRef(notifyFn);

    const mock = new MockAdapter(httpClient);
    mock.onGet('/unauthorized').reply(401, { message: 'Unauthorized' });

    await expect(httpClient.get('/unauthorized')).rejects.toBeDefined();

    expect(notifyFn).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'security',
        title: 'Session Expired',
        message: 'Unauthorized',
        persist: true,
      })
    );

    mock.restore();
    setNotifyRef(null);
  });

  it('extracts message from string payload', async () => {
    const notifyFn = vi.fn().mockReturnValue('id');
    setNotifyRef(notifyFn);

    const mock = new MockAdapter(httpClient);
    mock.onPost('/bad').reply(400, 'Bad payload');

    await expect(httpClient.post('/bad', { x: 1 })).rejects.toBeDefined();

    expect(notifyFn).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warning',
        title: 'Invalid Request',
        message: 'Bad payload',
        persist: false,
      })
    );

    mock.restore();
    setNotifyRef(null);
  });

  it('maps 403 and 404 correctly and uses title when provided', async () => {
    const notifyFn = vi.fn().mockReturnValue('id');
    setNotifyRef(notifyFn);

    const mock = new MockAdapter(httpClient);
    mock.onGet('/forbidden').reply(403, { title: 'Forbidden Title' });
    mock.onGet('/missing').reply(404, {});

    await expect(httpClient.get('/forbidden')).rejects.toBeDefined();
    await expect(httpClient.get('/missing')).rejects.toBeDefined();

    expect(notifyFn).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'security',
        title: 'Access Denied',
        message: 'Forbidden Title',
        persist: false,
      })
    );

    expect(notifyFn).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warning',
        title: 'Not Found',
        persist: false,
      })
    );

    mock.restore();
    setNotifyRef(null);
  });

  it('maps unexpected 4xx statuses to Request Failed and falls back to axios error message', async () => {
    const notifyFn = vi.fn().mockReturnValue('id');
    setNotifyRef(notifyFn);

    const mock = new MockAdapter(httpClient);
    mock.onGet('/teapot').reply(418, {});

    await expect(httpClient.get('/teapot')).rejects.toBeDefined();

    expect(notifyFn).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        title: 'Request Failed',
        persist: false,
      })
    );

    const call = notifyFn.mock.calls.find(
      ([arg]) => (arg as { title?: string }).title === 'Request Failed'
    );
    expect(call?.[0]).toHaveProperty('message');

    mock.restore();
    setNotifyRef(null);
  });
});
