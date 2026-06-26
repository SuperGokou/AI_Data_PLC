const moduleOptions = [
  ['overview', '展示总览'],
  ['collection', '采集链路'],
  ['process', '工艺展示'],
  ['points', '测点展示'],
  ['data', '数据说明'],
]

const adminViewIds = new Set(['overview', 'users', 'models', 'data'])

function normalizeAdminView(view) {
  return adminViewIds.has(view) ? view : 'overview'
}

function initialAdminView() {
  return normalizeAdminView(window.location.hash.replace(/^#/, ''))
}

const state = {
  view: initialAdminView(),
  theme: localStorage.getItem('ai-data-plc-admin-theme') || 'aurora',
  overview: null,
  users: [],
  userDraft: null,
  providers: [],
  providerDraft: null,
  formats: [],
  points: [],
  steps: [],
  batches: [],
}

const views = {
  overview: ['管理总览', '工业数据中台后台'],
  users: ['用户管理', '账号、角色与前台画像'],
  models: ['模型/API', '供应商与密钥配置'],
  data: ['数据接口', '表格来源与接口状态'],
}

const app = document.querySelector('#app')
const statusBox = document.querySelector('#status')
const kicker = document.querySelector('#view-kicker')
const title = document.querySelector('#view-title')
const shell = document.querySelector('.admin-shell')

document.querySelector('#refresh').addEventListener('click', () => loadAll(true))
document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => {
    setAdminView(button.dataset.view)
  })
})
document.querySelectorAll('[data-theme-choice]').forEach((button) => {
  button.addEventListener('click', () => {
    applyTheme(button.dataset.themeChoice)
  })
})

window.addEventListener('hashchange', () => {
  setAdminView(window.location.hash.replace(/^#/, ''), false)
})

app.addEventListener('submit', async (event) => {
  event.preventDefault()
  const form = event.target
  if (form.matches('#user-form')) {
    await saveUser(form)
  }
  if (form.matches('#provider-form')) {
    await saveProvider(form)
  }
})

app.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]')
  if (!button) return
  const { action, id, enabled } = button.dataset
  try {
    if (action === 'toggle-user') {
      await api(`/api/v1/users/${encodeURIComponent(id)}/enabled`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: enabled !== 'true' }),
      })
      showStatus('用户状态已更新')
    }
    if (action === 'edit-user') {
      state.userDraft = state.users.find((user) => user.userId === id) || null
      render()
      return
    }
    if (action === 'new-user') {
      state.userDraft = null
      render()
      return
    }
    if (action === 'delete-user') {
      await api(`/api/v1/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
      showStatus('用户已删除')
    }
    if (action === 'toggle-provider') {
      await api(`/api/v1/models/providers/${encodeURIComponent(id)}/enabled`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: enabled !== 'true' }),
      })
      showStatus('模型供应商状态已更新')
    }
    if (action === 'edit-provider') {
      state.providerDraft = state.providers.find((provider) => provider.providerId === id) || null
      render()
      return
    }
    if (action === 'new-provider') {
      state.providerDraft = null
      render()
      return
    }
    if (action === 'delete-provider') {
      await api(`/api/v1/models/providers/${encodeURIComponent(id)}`, { method: 'DELETE' })
      showStatus('模型供应商已删除')
    }
    await loadAll()
  } catch (error) {
    showStatus(error.message, true)
  }
})

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const payload = await response.json()
      message = payload.message || payload.error || message
    } catch {
      // Keep the HTTP fallback message.
    }
    throw new Error(message)
  }
  if (response.status === 204) return null
  return response.json()
}

async function loadAll(forceMessage = false) {
  try {
    const [overview, users, providers, formats, points, steps, batches] = await Promise.all([
      api('/api/v1/overview'),
      api('/api/v1/users'),
      api('/api/v1/models/providers'),
      api('/api/v1/datasets/formats'),
      api('/api/v1/points'),
      api('/api/v1/process-steps'),
      api('/api/v1/batches'),
    ])
    Object.assign(state, { overview, users, providers, formats, points, steps, batches })
    render()
    if (forceMessage) showStatus('已从 backend API 重新加载')
  } catch (error) {
    showStatus(`加载失败：${error.message}`, true)
    render()
  }
}

async function saveUser(form) {
  const formData = new FormData(form)
  const payload = {
    userId: formData.get('userId'),
    displayName: formData.get('displayName'),
    username: formData.get('username'),
    email: formData.get('email'),
    role: formData.get('role'),
    department: formData.get('department'),
    enabled: formData.get('enabled') === 'on',
    frontendTheme: formData.get('frontendTheme'),
    frontendHomeView: formData.get('frontendHomeView'),
    frontendModules: formData.getAll('frontendModules'),
  }
  try {
    await api('/api/v1/users', { method: 'POST', body: JSON.stringify(payload) })
    state.userDraft = null
    form.reset()
    form.elements.enabled.checked = true
    showStatus('用户与前台画像已保存')
    await loadAll()
  } catch (error) {
    showStatus(error.message, true)
  }
}

async function saveProvider(form) {
  const formData = new FormData(form)
  const payload = {
    providerId: formData.get('providerId'),
    displayName: formData.get('displayName'),
    baseUrl: formData.get('baseUrl'),
    modelName: formData.get('modelName'),
    apiKey: formData.get('apiKey'),
    industrialAlgorithmCapable: formData.get('industrialAlgorithmCapable') === 'on',
    enabled: formData.get('enabled') === 'on',
  }
  try {
    await api('/api/v1/models/providers', { method: 'POST', body: JSON.stringify(payload) })
    state.providerDraft = null
    form.reset()
    form.elements.enabled.checked = true
    form.elements.industrialAlgorithmCapable.checked = true
    showStatus('模型供应商已保存，API Key 仅保留指纹展示')
    await loadAll()
  } catch (error) {
    showStatus(error.message, true)
  }
}

function setAdminView(view, syncHash = true) {
  state.view = normalizeAdminView(view)
  if (syncHash && window.location.hash !== `#${state.view}`) {
    window.history.replaceState(null, '', `#${state.view}`)
  }
  render()
}

function render() {
  applyTheme(state.theme)
  document.querySelectorAll('[data-view]').forEach((item) => {
    item.classList.toggle('active', item.dataset.view === state.view)
  })
  const [nextKicker, nextTitle] = views[state.view]
  kicker.textContent = nextKicker
  title.textContent = nextTitle
  if (state.view === 'overview') app.innerHTML = renderOverview()
  if (state.view === 'users') app.innerHTML = renderUsers()
  if (state.view === 'models') app.innerHTML = renderModels()
  if (state.view === 'data') app.innerHTML = renderData()
}

function applyTheme(theme) {
  state.theme = theme === 'graphite' ? 'graphite' : 'aurora'
  shell.dataset.theme = state.theme
  localStorage.setItem('ai-data-plc-admin-theme', state.theme)
  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.classList.toggle('active', button.dataset.themeChoice === state.theme)
  })
}

function renderOverview() {
  const overview = state.overview || {}
  const enabledProviders = state.providers.filter((provider) => provider.enabled && provider.configured).length
  return `
    <div class="stat-grid">
      ${stat('后台用户', state.users.length, '来自 /api/v1/users')}
      ${stat('可用模型', enabledProviders, '已配置且启用')}
      ${stat('真实测点', overview.configuredPoints ?? state.points.length, '来自 AI 测点清单')}
      ${stat('工艺节点', state.steps.length, '来自全流程工艺文档')}
    </div>
    <section class="panel">
      <div class="section-title">
        <div>
          <h2>账号驱动的前台展示</h2>
          <p>不同用户登录 frontend 后，会按后台配置自动切换主题、默认首页和可见模块；backend 管理台负责维护这些账号画像。</p>
        </div>
      </div>
      <div class="data-list">
        <article><strong>展示端</strong><span>https://ai-data-plc-frontend.onrender.com/</span></article>
        <article><strong>登录接口</strong><span>POST /api/v1/auth/login</span></article>
        <article><strong>画像字段</strong><span>theme / homeView / modules</span></article>
      </div>
    </section>
    <section class="panel">
      <div class="section-title">
        <div>
          <h2>实时策略</h2>
          <p>默认目标延迟 ${escapeHtml(String(overview.realtimeDelaySeconds ?? 5))}s，AI 控制模式 ${escapeHtml(String(overview.aiControlMode ?? 'SUGGESTION_ONLY'))}。</p>
        </div>
      </div>
    </section>
  `
}

function renderUsers() {
  const rows = state.users.map((user) => {
    const profile = user.frontendProfile || {}
    return `
      <tr>
        <td><strong>${escapeHtml(user.displayName)}</strong><br><span class="muted">${escapeHtml(user.userId)}</span></td>
        <td>${escapeHtml(user.username)}<br><span class="muted">${escapeHtml(user.email)}</span></td>
        <td>${tag(roleName(user.role), user.role === 'ADMIN' ? 'ok' : '')}</td>
        <td>${escapeHtml(user.department)}</td>
        <td>${tag(themeName(profile.theme), profile.theme === 'aurora' ? 'ok' : '')}</td>
        <td>${escapeHtml(moduleName(profile.homeView))}<br><span class="muted">${moduleList(profile.modules)}</span></td>
        <td>${tag(user.enabled ? '启用' : '停用', user.enabled ? 'ok' : 'danger')}</td>
        <td>
          <div class="row-actions">
            <button type="button" data-action="edit-user" data-id="${escapeHtml(user.userId)}">编辑画像</button>
            <button type="button" data-action="toggle-user" data-id="${escapeHtml(user.userId)}" data-enabled="${user.enabled}">
              ${user.enabled ? '停用' : '启用'}
            </button>
            ${user.source === 'SYSTEM' ? '<button type="button" class="muted" disabled>内置</button>' : `<button type="button" class="danger" data-action="delete-user" data-id="${escapeHtml(user.userId)}">删除</button>`}
          </div>
        </td>
      </tr>
    `
  }).join('')
  return `
    <div class="split">
      <section class="panel">
        <div class="section-title">
          <div>
            <h2>用户列表</h2>
            <p>账号、角色、启停状态和 frontend 展示画像只在 backend 管理台维护。</p>
          </div>
        </div>
        ${table(['用户', '登录标识', '角色', '部门', '前台主题', '首页/模块', '状态', '操作'], rows)}
      </section>
      ${renderUserForm()}
    </div>
  `
}

function renderUserForm() {
  const draft = state.userDraft
  const profile = draft?.frontendProfile || {}
  const modules = profile.modules || ['overview', 'collection', 'process']
  return `
    <section class="panel">
      <div class="section-title">
        <div>
          <h2>${draft ? '编辑前台画像' : '新增/更新用户'}</h2>
          <p>${draft ? '当前正在编辑该账号登录 frontend 后看到的界面。' : '使用相同 userId 可更新用户资料和前台展示配置。'}</p>
        </div>
      </div>
      <form id="user-form">
        <div class="form-grid">
          ${field('用户 ID', 'userId', 'text', 'ops-engineer', true, '', draft?.userId || '', Boolean(draft))}
          ${field('显示名称', 'displayName', 'text', '工艺工程师', true, '', draft?.displayName || '')}
          ${field('用户名', 'username', 'text', 'ops.engineer', true, '', draft?.username || '')}
          ${field('邮箱', 'email', 'email', 'ops.engineer@ark-mfg.local', true, '', draft?.email || '')}
          ${selectField('角色', 'role', [
            ['OPERATOR', '操作员'],
            ['ADMIN', '管理员'],
            ['DATA_ENGINEER', '数据工程师'],
            ['AUDITOR', '审计员'],
          ], draft?.role || 'OPERATOR')}
          ${field('部门', 'department', 'text', '生产运营', true, '', draft?.department || '')}
          ${selectField('前台主题', 'frontendTheme', [
            ['aurora', '智控'],
            ['graphite', '石墨'],
          ], profile.theme || 'aurora')}
          ${selectField('默认首页', 'frontendHomeView', moduleOptions, profile.homeView || 'overview')}
          <div class="field full">
            <span>前台可见模块</span>
            <div class="checkbox-grid">
              ${moduleOptions.map(([value, label]) => `
                <label class="check-field">
                  <input name="frontendModules" type="checkbox" value="${value}" ${modules.includes(value) ? 'checked' : ''}>
                  ${label}
                </label>
              `).join('')}
            </div>
          </div>
          <label class="check-field full"><input name="enabled" type="checkbox" ${draft ? (draft.enabled ? 'checked' : '') : 'checked'}>启用账号</label>
        </div>
        <div class="form-actions">
          ${draft ? '<button type="button" data-action="new-user">清空/新增</button>' : ''}
          <button class="primary" type="submit">保存用户</button>
        </div>
      </form>
    </section>
  `
}

function renderModels() {
  const draft = state.providerDraft
  const editing = Boolean(draft)
  const rows = state.providers.map((provider) => `
    <tr>
      <td><strong>${escapeHtml(provider.displayName)}</strong><br><span class="muted">${escapeHtml(provider.providerId)}</span></td>
      <td>${escapeHtml(provider.modelName)}<br><span class="muted">${escapeHtml(provider.baseUrl)}</span></td>
      <td>${tag(provider.configured ? '已配置' : '缺少密钥', provider.configured ? 'ok' : 'danger')}</td>
      <td>${tag(provider.enabled ? '启用' : '停用', provider.enabled ? 'ok' : 'danger')}</td>
      <td>${tag(provider.industrialAlgorithmCapable ? '工业算法' : '通用模型', provider.industrialAlgorithmCapable ? 'ok' : '')}</td>
      <td>${escapeHtml(provider.apiKeyFingerprint || '未配置')}</td>
      <td>${tag(providerSourceName(provider.source), provider.source === 'USER_ADDED' ? 'warn' : provider.source === 'BACKEND_OVERRIDE' ? 'ok' : '')}</td>
      <td>
        <div class="row-actions">
          <button type="button" data-action="edit-provider" data-id="${escapeHtml(provider.providerId)}">编辑密钥</button>
          <button type="button" data-action="toggle-provider" data-id="${escapeHtml(provider.providerId)}" data-enabled="${provider.enabled}">
            ${provider.enabled ? '停用' : '启用'}
          </button>
          ${provider.source === 'USER_ADDED' ? `<button type="button" class="danger" data-action="delete-provider" data-id="${escapeHtml(provider.providerId)}">删除</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('')
  return `
    <div class="split">
      <section class="panel">
        <div class="section-title">
          <div>
            <h2>模型供应商</h2>
            <p>支持 DeepSeek Pro、GLM、Qwen、MiniMax 与 OpenAI-compatible 网关。</p>
          </div>
        </div>
        ${table(['供应商', '模型/网关', '配置', '状态', '能力', 'Key 指纹', '来源', '操作'], rows)}
      </section>
      <section class="panel">
        <div class="section-title">
          <div>
            <h2>${editing ? '编辑模型密钥' : '新增 API Provider'}</h2>
            <p>${editing ? '已载入当前 Provider 参数；旧密钥不会回显，请输入新 API Key 后保存。' : '密钥不会在列表中明文显示，只显示 SHA-256 指纹。'}</p>
          </div>
        </div>
        <form id="provider-form">
          <div class="form-grid">
            ${field('Provider ID', 'providerId', 'text', 'deepseek-pro', true, '', draft?.providerId || '', editing)}
            ${field('显示名称', 'displayName', 'text', 'DeepSeek Pro', true, '', draft?.displayName || '')}
            ${field('Base URL', 'baseUrl', 'url', 'https://api.deepseek.com', true, 'full', draft?.baseUrl || '')}
            ${field('模型名称', 'modelName', 'text', 'deepseek-reasoner', true, '', draft?.modelName || '')}
            ${field('API Key', 'apiKey', 'password', editing ? '输入新 API Key（不会回显旧密钥）' : 'sk-...', true)}
            <label class="check-field full"><input name="industrialAlgorithmCapable" type="checkbox" ${draft ? (draft.industrialAlgorithmCapable ? 'checked' : '') : 'checked'}>支持工业算法层</label>
            <label class="check-field full"><input name="enabled" type="checkbox" ${draft ? (draft.enabled ? 'checked' : '') : 'checked'}>启用供应商</label>
          </div>
          <div class="form-actions">
            ${editing ? '<button type="button" data-action="new-provider">清空/新增</button>' : ''}
            <button class="primary" type="submit">${editing ? '保存密钥' : '保存 Provider'}</button>
          </div>
        </form>
      </section>
    </div>
  `
}

function renderData() {
  const pointRows = state.points.slice(0, 12).map((point) => `
    <tr>
      <td>${escapeHtml(point.orderNo)}</td>
      <td><strong>${escapeHtml(point.displayName)}</strong><br><span class="muted">${escapeHtml(point.fieldName)}</span></td>
      <td>${escapeHtml(point.dataType)}</td>
      <td>${escapeHtml(point.unitOrFormat || '-')}</td>
      <td>${escapeHtml(point.processStep || '-')}</td>
      <td>${tag(point.requiredForAiDataset ? 'AI 必需' : '可选', point.requiredForAiDataset ? 'ok' : '')}</td>
    </tr>
  `).join('')
  return `
    <section class="panel">
      <div class="section-title">
        <div>
          <h2>数据来源</h2>
          <p>后台接口仅展示从 Excel/XLS 资源解析出的真实数据；未提供的实时批次、曲线和告警不做模拟。</p>
        </div>
      </div>
      <div class="data-list">
        <article><strong>AI 测点</strong><span>${state.points.length} 项，来自 AI 数据采集测点清单</span></article>
        <article><strong>工艺节点</strong><span>${state.steps.length} 项，来自全流程工艺文档</span></article>
        <article><strong>导出格式</strong><span>${state.formats.join(' / ')}</span></article>
      </div>
    </section>
    <section class="panel">
      <div class="section-title">
        <div>
          <h2>测点预览</h2>
          <p>展示前 12 条真实测点，完整数据由 /api/v1/points 提供。</p>
        </div>
      </div>
      ${table(['序号', '测点', '类型', '单位/格式', '工序', 'AI 数据集'], pointRows)}
    </section>
  `
}

function stat(label, value, hint) {
  return `<article class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value ?? 0))}</strong><span>${escapeHtml(hint)}</span></article>`
}

function field(label, name, type, placeholder, required, extraClass = '', value = '', readOnly = false) {
  const valueAttribute = value === '' ? '' : ` value="${escapeHtml(value)}"`
  return `
    <label class="field ${extraClass}">
      <span>${escapeHtml(label)}</span>
      <input name="${escapeHtml(name)}" type="${escapeHtml(type)}" placeholder="${escapeHtml(placeholder)}"${valueAttribute} ${required ? 'required' : ''} ${readOnly ? 'readonly' : ''}>
    </label>
  `
}

function selectField(label, name, options, value, extraClass = '') {
  return `
    <label class="field ${extraClass}">
      <span>${escapeHtml(label)}</span>
      <select name="${escapeHtml(name)}" required>
        ${options.map(([optionValue, optionLabel]) => `
          <option value="${escapeHtml(optionValue)}" ${optionValue === value ? 'selected' : ''}>${escapeHtml(optionLabel)}</option>
        `).join('')}
      </select>
    </label>
  `
}

function table(headers, rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
        <tbody>${rows || `<tr><td class="empty" colspan="${headers.length}">暂无数据</td></tr>`}</tbody>
      </table>
    </div>
  `
}

function tag(label, tone = '') {
  return `<span class="tag ${tone}">${escapeHtml(label)}</span>`
}

function roleName(role) {
  return {
    ADMIN: '管理员',
    OPERATOR: '操作员',
    DATA_ENGINEER: '数据工程师',
    AUDITOR: '审计员',
  }[role] || role
}

function themeName(theme) {
  return {
    aurora: '智控',
    graphite: '石墨',
  }[theme] || theme || '-'
}

function moduleName(moduleId) {
  return Object.fromEntries(moduleOptions)[moduleId] || moduleId || '-'
}

function moduleList(modules = []) {
  return modules.map(moduleName).join(' / ') || '-'
}

function providerSourceName(source) {
  return {
    ENVIRONMENT: '环境变量',
    BACKEND_OVERRIDE: '后台配置',
    USER_ADDED: '后台新增',
  }[source] || source
}

function showStatus(message, isError = false) {
  statusBox.textContent = message
  statusBox.className = `status show ${isError ? 'error' : 'ok'}`
  window.clearTimeout(showStatus.timer)
  showStatus.timer = window.setTimeout(() => {
    statusBox.className = 'status'
  }, 4200)
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

applyTheme(state.theme)
loadAll()
