import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AppContextProvider } from '../contexts/AppContext';

describe('App routing integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/products')) {
          return {
            ok: true,
            status: 200,
            json: async () => [],
          } as Response;
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({}),
        } as Response;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderApp(path: string) {
    render(
      <MemoryRouter initialEntries={[path]}>
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </MemoryRouter>,
    );
  }

  it('renders home route', async () => {
    renderApp('/');

    expect(await screen.findByText('All Products')).toBeInTheDocument();
  });

  it('renders cart route', async () => {
    renderApp('/cart');

    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
  });
});
