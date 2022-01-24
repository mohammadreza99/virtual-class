(function (window) {
  window.__env = window.__env || {};
  const API_URL = 'https://vcdemoapi.iranlms.ir/api/v1';
  const SOCKET_URL = 'wss://vcdemoapi.iranlms.ir/ws/v1';
  window.__env.apiUrl = API_URL;
  window.__env.socketUrl = SOCKET_URL;
}(this));
