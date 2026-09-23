/**
 * Service to manage Google Maps API configuration and connection testing.
 */

export const mapsConfigService = {
  async getStatus() {
    try {
      const res = await fetch('/api/location/maps-config');
      if (res.ok) {
        return await res.json();
      }
      return { hasKey: false, isConfigured: false, provider: 'osm' };
    } catch (err) {
      console.warn('Could not fetch maps config:', err);
      return { hasKey: false, isConfigured: false, provider: 'osm' };
    }
  },

  async saveKey(apiKey) {
    try {
      const res = await fetch('/api/location/maps-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: (apiKey || '').trim() })
      });
      if (res.ok) {
        return await res.json();
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || 'Failed to save Google Maps key' };
    } catch (err) {
      return { success: false, error: err.message || 'Network error' };
    }
  },

  async testConnection(apiKey = null) {
    try {
      const body = apiKey ? { apiKey: apiKey.trim() } : {};
      const res = await fetch('/api/location/maps-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      return {
        connected: Boolean(data.connected),
        status: data.status || res.status,
        message: data.message || (data.connected ? 'Google Maps connection successful.' : 'Connection test failed.')
      };
    } catch (err) {
      return {
        connected: false,
        status: 500,
        message: 'Test request failed: ' + err.message
      };
    }
  }
};
