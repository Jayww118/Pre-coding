const priority = { '3D': 3, PDF: 2, '2D': 1 };

const mockFiles = [
  { id: 'f1', name: 'Bracket_A_v1.step', type: '3D', size: '3.2MB', groupHint: 'A' },
  { id: 'f2', name: 'Bracket_A_v2.pdf', type: 'PDF', size: '540KB', groupHint: 'A' },
  { id: 'f3', name: 'Bracket_A_2D.dwg', type: '2D', size: '820KB', groupHint: 'A' },
  { id: 'f4', name: 'Housing_B_model.stp', type: '3D', size: '2.7MB', groupHint: 'B' },
  { id: 'f5', name: 'Housing_B_drawing.pdf', type: 'PDF', size: '660KB', groupHint: 'B' },
  { id: 'f6', name: 'Clip_C_flat.dxf', type: '2D', size: '120KB', groupHint: 'C' },
  { id: 'f7', name: 'Unknown_part_77.pdf', type: 'PDF', size: '440KB', groupHint: 'D' },
];

let smartGrouping = true;
let groups = [];
let activeGroupId = null;

function iconByType(type) {
  return type === '3D' ? '🧊' : type === 'PDF' ? '📄' : '📐';
}

function buildGroupsFromSmart() {
  if (smartGrouping) {
    const map = new Map();
    mockFiles.forEach((f) => {
      if (!map.has(f.groupHint)) {
        map.set(f.groupHint, {
          id: `g-${f.groupHint}`,
          name: `候选零件-${f.groupHint}`,
          files: [],
          selected: false,
          partInfo: {
            name: '',
            size: '',
            material: '',
            process: '',
            surfaceTreatment: '',
            heatTreatment: '',
            roughness: '',
            tolerance: '',
            technicalRequirement: '',
          },
        });
      }
      map.get(f.groupHint).files.push({ ...f, isMain: false });
    });
    groups = Array.from(map.values());
  } else {
    groups = mockFiles.map((f) => ({
      id: `g-${f.id}`,
      name: `候选零件-${f.id}`,
      files: [{ ...f, isMain: false }],
      selected: false,
      partInfo: {
        name: '',
        size: '',
        material: '',
        process: '',
        surfaceTreatment: '',
        heatTreatment: '',
        roughness: '',
        tolerance: '',
        technicalRequirement: '',
      },
    }));
  }

  groups.forEach((g) => {
    autoPickMain(g);
    autoFillPartInfo(g);
  });
  activeGroupId = groups[0]?.id || null;
}

function autoPickMain(group) {
  group.files.forEach((f) => (f.isMain = false));
  const candidate = [...group.files].sort((a, b) => priority[b.type] - priority[a.type])[0];
  if (candidate) candidate.isMain = true;
}

function autoFillPartInfo(group) {
  const main = group.files.find((f) => f.isMain);
  group.partInfo.name = main ? main.name.replace(/\.[^.]+$/, '') : '';
  group.partInfo.size = group.partInfo.size || '';
  group.partInfo.material = group.partInfo.material || (Math.random() > 0.4 ? 'AL6061-T6' : '');
  group.partInfo.process = group.partInfo.process || (Math.random() > 0.5 ? 'CNC加工' : '');
  group.partInfo.surfaceTreatment = group.partInfo.surfaceTreatment || '';
  group.partInfo.heatTreatment = group.partInfo.heatTreatment || '';
  group.partInfo.roughness = group.partInfo.roughness || '';
  group.partInfo.tolerance = group.partInfo.tolerance || '';
  group.partInfo.technicalRequirement = group.partInfo.technicalRequirement || '';
}

function renderGroups() {
  const wrap = document.getElementById('groupList');
  wrap.innerHTML = '';
  groups.forEach((group) => {
    const main = group.files.find((f) => f.isMain);
    const missingMain = !main;
    const el = document.createElement('article');
    el.className = `group-item ${group.id === activeGroupId ? 'active' : ''}`;
    el.innerHTML = `
      <div class="group-header">
        <div class="title">
          <input type="checkbox" data-role="select-group" data-id="${group.id}" ${group.selected ? 'checked' : ''} />
          <div class="thumb">${main ? iconByType(main.type) : '❓'}</div>
          <div>
            <strong>${group.name}</strong><br />
            <small>${group.files.length} 份图纸 ${missingMain ? ' · 缺主图' : ''}</small>
          </div>
        </div>
      </div>
      <div class="files-mini">
        ${group.files.map((f) => `<span class="file-chip">${iconByType(f.type)} ${f.name}</span>`).join('')}
      </div>
    `;
    el.addEventListener('click', (e) => {
      if (e.target.matches('input')) return;
      activeGroupId = group.id;
      render();
    });
    wrap.appendChild(el);
  });

  wrap.querySelectorAll('[data-role="select-group"]').forEach((input) => {
    input.addEventListener('change', (e) => {
      const group = groups.find((g) => g.id === e.target.dataset.id);
      group.selected = e.target.checked;
    });
  });
}

function renderDetail() {
  const detail = document.getElementById('detailContent');
  const badge = document.getElementById('riskBadge');
  const title = document.getElementById('detailTitle');
  const group = groups.find((g) => g.id === activeGroupId);

  if (!group) {
    detail.className = 'detail-content empty';
    detail.textContent = '请选择左侧候选零件组查看详情。';
    badge.classList.add('hidden');
    title.textContent = '零件详情';
    return;
  }

  title.textContent = `${group.name} - 详情与校验`;
  const hasMain = group.files.some((f) => f.isMain);
  badge.classList.toggle('hidden', hasMain);

  detail.className = 'detail-content';
  detail.innerHTML = document.getElementById('detailTemplate').innerHTML;

  const fileList = detail.querySelector('#fileList');
  group.files.forEach((file) => {
    const row = document.createElement('div');
    row.className = 'file-card';

    row.innerHTML = `
      <div class="file-row">
        <div>
          <span class="icon">${iconByType(file.type)}</span><strong>${file.name}</strong>
          <div class="file-meta">类型：${file.type} · 大小：${file.size}</div>
        </div>
        <div>
          <label><input type="radio" name="mainDrawing" data-id="${file.id}" ${file.isMain ? 'checked' : ''}/> 主图</label>
        </div>
      </div>
      <div class="file-row" style="margin-top:8px;">
        <button class="btn" data-action="split" data-id="${file.id}">移出并拆分为新零件</button>
        <label>移动到
          <select data-action="move" data-id="${file.id}">
            <option value="">-- 选择目标零件 --</option>
            ${groups.filter((g) => g.id !== group.id).map((g) => `<option value="${g.id}">${g.name}</option>`).join('')}
          </select>
        </label>
      </div>
    `;
    fileList.appendChild(row);
  });

  fileList.querySelectorAll('input[name="mainDrawing"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      group.files.forEach((f) => (f.isMain = f.id === e.target.dataset.id));
      autoFillPartInfo(group);
      render();
    });
  });

  fileList.querySelectorAll('[data-action="split"]').forEach((btn) => {
    btn.addEventListener('click', (e) => splitFileToNewGroup(e.target.dataset.id));
  });

  fileList.querySelectorAll('[data-action="move"]').forEach((select) => {
    select.addEventListener('change', (e) => {
      if (e.target.value) moveFile(e.target.dataset.id, group.id, e.target.value);
    });
  });

  const form = detail.querySelector('#partForm');
  Object.entries(group.partInfo).forEach(([key, val]) => {
    const field = form.querySelector(`[name="${key}"]`);
    if (field) field.value = val;
  });

  form.addEventListener('input', () => {
    const formData = new FormData(form);
    Object.keys(group.partInfo).forEach((k) => (group.partInfo[k] = formData.get(k) || ''));
  });

  detail.querySelector('#confirmBtn').addEventListener('click', () => {
    const main = group.files.find((f) => f.isMain);
    if (!main) {
      alert('该候选零件缺少主图，无法入库。');
      return;
    }
    detail.innerHTML = `
      <div class="success-view">
        <h3>✅ 入库成功，已进入零件详情页（原型）</h3>
        <p><strong>零件名：</strong>${group.partInfo.name}</p>
        <p><strong>主图：</strong>${main.name}</p>
        <p><strong>材料：</strong>${group.partInfo.material || '（未识别/未填写）'}</p>
        <p><strong>工艺：</strong>${group.partInfo.process || '（未识别/未填写）'}</p>
        <p><strong>技术要求：</strong>${group.partInfo.technicalRequirement || '（未填写）'}</p>
      </div>
    `;
  });
}

function splitFileToNewGroup(fileId) {
  const current = groups.find((g) => g.id === activeGroupId);
  const index = current.files.findIndex((f) => f.id === fileId);
  if (index === -1) return;

  const [file] = current.files.splice(index, 1);
  if (!current.files.some((f) => f.isMain)) autoPickMain(current);

  const newGroup = {
    id: `g-new-${Date.now()}`,
    name: `候选零件-新建${Math.floor(Math.random() * 100)}`,
    files: [{ ...file, isMain: true }],
    selected: false,
    partInfo: { ...current.partInfo, name: file.name.replace(/\.[^.]+$/, '') },
  };
  groups.push(newGroup);
  activeGroupId = newGroup.id;
  render();
}

function moveFile(fileId, fromGroupId, toGroupId) {
  const from = groups.find((g) => g.id === fromGroupId);
  const to = groups.find((g) => g.id === toGroupId);
  if (!from || !to) return;

  const index = from.files.findIndex((f) => f.id === fileId);
  if (index === -1) return;

  const [file] = from.files.splice(index, 1);
  file.isMain = false;
  to.files.push(file);

  if (!from.files.some((f) => f.isMain)) autoPickMain(from);
  if (!to.files.some((f) => f.isMain)) autoPickMain(to);
  autoFillPartInfo(from);
  autoFillPartInfo(to);

  render();
}

function mergeSelectedGroups() {
  const selected = groups.filter((g) => g.selected);
  if (selected.length < 2) {
    alert('请至少勾选 2 个候选零件再合并。');
    return;
  }
  const target = selected[0];
  for (let i = 1; i < selected.length; i++) {
    target.files.push(...selected[i].files.map((f) => ({ ...f, isMain: false })));
  }
  groups = groups.filter((g) => !selected.slice(1).some((s) => s.id === g.id));
  groups.forEach((g) => (g.selected = false));
  autoPickMain(target);
  autoFillPartInfo(target);
  activeGroupId = target.id;
  render();
}

function render() {
  renderGroups();
  renderDetail();
}

function bindEvents() {
  const toggle = document.getElementById('toggleSmartGrouping');
  toggle.addEventListener('click', () => {
    smartGrouping = !smartGrouping;
    toggle.textContent = smartGrouping ? '关闭系统分组' : '开启系统分组';
    buildGroupsFromSmart();
    render();
  });

  document.getElementById('mergeBtn').addEventListener('click', mergeSelectedGroups);
}

buildGroupsFromSmart();
bindEvents();
render();
