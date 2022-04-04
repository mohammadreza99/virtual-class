(function (window) {
  window.__env = window.__env || {};
  // const API_URL = 'https://192.168.88.32:8008/api/v1';
  const API_URL = 'https://dvcportal.iranlms.ir/api/v1';
  // const SOCKET_URL = 'wss://192.168.88.32:8008/ws/v1';
  const SOCKET_URL = 'wss://dvcportal.iranlms.ir/ws/v1';
  window.__env.apiUrl = API_URL;
  window.__env.socketUrl = SOCKET_URL;
}(this));
