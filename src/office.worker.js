import { inspectOffice, applyOfficeChanges } from './office.js';
let current;
function view(doc) {
  const { entries, bytes, ...rest } = doc;
  return rest;
}
self.onmessage = async ({ data }) => {
  try {
    if (data.action === 'open') { current = inspectOffice(data.bytes, data.name); self.postMessage({ id: data.id, document: view(current) }); }
    else if (data.action === 'apply') {
      if (!current || current.revision !== data.revision) throw new Error('Tài liệu đã thay đổi; hãy tạo lại đề xuất.');
      const bytes = applyOfficeChanges(current, data.changes);
      current = inspectOffice(bytes, data.name || current.name);
      self.postMessage({ id: data.id, document: view(current), bytes }, [bytes.buffer]);
    } else throw new Error('Thao tác file không được hỗ trợ.');
  } catch (e) { self.postMessage({ id: data.id, error: e.message || 'Không xử lý được tài liệu.' }); }
};
