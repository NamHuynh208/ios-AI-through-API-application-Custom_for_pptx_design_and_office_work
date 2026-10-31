const KEY = 'agenty-mobile-preferences-v1';
export const defaults = { endpoint: 'https://api.openai.com/v1', model: '', theme: 'system', saveHistory: false };
export function loadPreferences(store = localStorage) {
  try {
    const value = JSON.parse(store.getItem(KEY) || '{}');
    return { endpoint: typeof value.endpoint === 'string' ? value.endpoint : defaults.endpoint, model: typeof value.model === 'string' ? value.model : '', theme: ['system', 'light', 'dark'].includes(value.theme) ? value.theme : 'system', saveHistory: value.saveHistory === true };
  } catch { return { ...defaults }; }
}
export function savePreferences(value, store = localStorage) {
  // Chỉ allowlist cài đặt không nhạy cảm; key không bao giờ được đưa vào storage.
  store.setItem(KEY, JSON.stringify({ endpoint: value.endpoint, model: value.model, theme: value.theme, saveHistory: value.saveHistory === true }));
}
export function saveHistory(messages, enabled, store = localStorage) {
  if (!enabled) { store.removeItem('agenty-mobile-chat-v1'); return; }
  store.setItem('agenty-mobile-chat-v1', JSON.stringify(messages.slice(-30).map(m => ({ role: m.role, content: m.content.slice(0, 12000) }))));
}
export function loadHistory(enabled, store = localStorage) {
  if (!enabled) return [];
  try {
    const value = JSON.parse(store.getItem('agenty-mobile-chat-v1') || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string').slice(-30).map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));
  } catch { return []; }
}
