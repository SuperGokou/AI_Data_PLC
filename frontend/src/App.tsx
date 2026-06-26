import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  Database,
  Factory,
  FileSpreadsheet,
  FlaskConical,
  Gauge,
  GitBranch,
  KeyRound,
  PlusCircle,
  Power,
  RefreshCw,
  Search,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Overview = {
  activeBatches: number
  configuredPoints: number
  onlineDevices: number
  activeAlerts: number
  realtimeDelaySeconds: number
  aiControlMode: string
}

type Batch = {
  batchId: string
  machineId: string
  fabricType: string
  currentStep: string
  wipStatus: string
  completionPct: number
  updatedAt: string
  datasetReady: boolean
}

type Point = {
  orderNo: number
  fieldName: string
  displayName: string
  dataType: string
  unitOrFormat: string
  source: string
  processStep: string
  requiredForAiDataset: boolean
}

type ProcessStep = {
  sequence: number
  workshop: string
  stepName: string
  controlPoint: string
  wipStatus: string
  systemAction: string
  equipment: string
}

type Provider = {
  providerId: string
  displayName: string
  baseUrl: string
  modelName: string
  configured: boolean
  enabled: boolean
  industrialAlgorithmCapable: boolean
  source: string
  apiKeyFingerprint: string
}

type ControlPolicy = {
  mode: string
  realtimeDelaySeconds: number
  requireHumanApproval: boolean
  persistDecisionLog: boolean
  safetyNote: string
}

type ProviderForm = {
  providerId: string
  displayName: string
  baseUrl: string
  modelName: string
  apiKey: string
  industrialAlgorithmCapable: boolean
  enabled: boolean
}

type PlatformUserRole = 'ADMIN' | 'OPERATOR' | 'DATA_ENGINEER' | 'AUDITOR'

type PlatformUser = {
  userId: string
  displayName: string
  username: string
  email: string
  role: PlatformUserRole
  enabled: boolean
  department: string
  createdAt: string
  lastLoginAt: string | null
  source: string
}

type UserForm = {
  userId: string
  displayName: string
  username: string
  email: string
  role: PlatformUserRole
  department: string
  enabled: boolean
}

type DatasetFormat = 'CSV' | 'JSON' | 'EXCEL' | 'PARQUET' | 'REST_API' | 'DB_VIEW'
type ThemeId = 'aurora' | 'graphite'
type StatDatum = { name: string; value: number }
type FetchResult<T> = { data: T; ok: boolean }

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const datasetFallback: DatasetFormat[] = ['CSV', 'JSON', 'EXCEL', 'PARQUET', 'REST_API', 'DB_VIEW']
const chartColors = ['#4f8cff', '#14b8a6', '#8b6cf6', '#f2b84b', '#ef6f6c', '#65758b']

const fallbackOverview: Overview = {
  activeBatches: 0,
  configuredPoints: 0,
  onlineDevices: 0,
  activeAlerts: 0,
  realtimeDelaySeconds: 5,
  aiControlMode: 'RECOMMEND_ONLY',
}

const emptyProviderForm: ProviderForm = {
  providerId: '',
  displayName: '',
  baseUrl: '',
  modelName: '',
  apiKey: '',
  industrialAlgorithmCapable: true,
  enabled: true,
}

const emptyUserForm: UserForm = {
  userId: '',
  displayName: '',
  username: '',
  email: '',
  role: 'OPERATOR',
  department: '',
  enabled: true,
}

const themeOptions: Array<{ id: ThemeId; label: string }> = [
  { id: 'aurora', label: '智控' },
  { id: 'graphite', label: '石墨' },
]

const roleOptions: Array<{ id: PlatformUserRole; label: string }> = [
  { id: 'ADMIN', label: '管理员' },
  { id: 'OPERATOR', label: '生产操作' },
  { id: 'DATA_ENGINEER', label: '数据工程' },
  { id: 'AUDITOR', label: '审计只读' },
]

const viewIds = new Set([
  'overview',
  'collection',
  'batches',
  'process',
  'points',
  'models',
  'users',
  'datasets',
  'alerts',
])

function initialView() {
  const requestedView = new URLSearchParams(window.location.search).get('view') || ''
  return viewIds.has(requestedView) ? requestedView : 'overview'
}

async function fetchJson<T>(path: string, fallback: T): Promise<FetchResult<T>> {
  try {
    const response = await fetch(`${apiBase}${path}`)
    if (!response.ok) return { data: fallback, ok: false }
    return { data: await response.json(), ok: true }
  } catch {
    return { data: fallback, ok: false }
  }
}

async function sendJson<T>(path: string, method: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: '请求失败' }))
    throw new Error(payload.error || '请求失败')
  }
  return response.json()
}

function countBy<T>(items: T[], getKey: (item: T) => string | null | undefined): StatDatum[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const key = (getKey(item) || '未标注').trim() || '未标注'
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name))
}

function matchesQuery(values: Array<string | number | boolean>, query: string) {
  if (!query) return true
  return values.some((value) => String(value).toLowerCase().includes(query))
}

export default function App() {
  const [activeView, setActiveView] = useState(initialView)
  const [theme, setTheme] = useState<ThemeId>('aurora')
  const [query, setQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const [refreshError, setRefreshError] = useState('')
  const [overview, setOverview] = useState<Overview>(fallbackOverview)
  const [batches, setBatches] = useState<Batch[]>([])
  const [points, setPoints] = useState<Point[]>([])
  const [steps, setSteps] = useState<ProcessStep[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [policy, setPolicy] = useState<ControlPolicy | null>(null)
  const [datasetFormats, setDatasetFormats] = useState<DatasetFormat[]>(datasetFallback)
  const [exportFormat, setExportFormat] = useState<DatasetFormat>('CSV')
  const [providerForm, setProviderForm] = useState<ProviderForm>(emptyProviderForm)
  const [providerSubmitting, setProviderSubmitting] = useState(false)
  const [providerMessage, setProviderMessage] = useState('')
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm)
  const [userSubmitting, setUserSubmitting] = useState(false)
  const [userMessage, setUserMessage] = useState('')

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    setIsRefreshing(true)
    setRefreshError('')
    const [
      overviewResult,
      batchesResult,
      pointsResult,
      stepsResult,
      providersResult,
      usersResult,
      policyResult,
      formatsResult,
    ] = await Promise.all([
        fetchJson('/api/v1/overview', fallbackOverview),
        fetchJson<Batch[]>('/api/v1/batches', []),
        fetchJson<Point[]>('/api/v1/points', []),
        fetchJson<ProcessStep[]>('/api/v1/process-steps', []),
        fetchJson<Provider[]>('/api/v1/models/providers', []),
        fetchJson<PlatformUser[]>('/api/v1/users', []),
        fetchJson<ControlPolicy | null>('/api/v1/models/control-policy', null),
        fetchJson<DatasetFormat[]>('/api/v1/datasets/formats', datasetFallback),
      ])

    if (overviewResult.ok) setOverview(overviewResult.data)
    if (batchesResult.ok) setBatches(batchesResult.data)
    if (pointsResult.ok) setPoints(pointsResult.data)
    if (stepsResult.ok) setSteps(stepsResult.data)
    if (providersResult.ok) setProviders(providersResult.data)
    if (usersResult.ok) setUsers(usersResult.data)
    if (policyResult.ok) setPolicy(policyResult.data)
    if (formatsResult.ok) {
      setDatasetFormats(formatsResult.data)
      if (!formatsResult.data.includes(exportFormat)) {
        setExportFormat(formatsResult.data[0] || 'CSV')
      }
    }

    const failed = [
      overviewResult,
      batchesResult,
      pointsResult,
      stepsResult,
      providersResult,
      usersResult,
      policyResult,
      formatsResult,
    ].some((result) => !result.ok)
    setRefreshError(failed ? '部分接口暂不可用，当前保留最近一次可用数据或空状态。' : '')
    setLastUpdated(new Date().toLocaleTimeString('zh-CN', { hour12: false }))
    setIsRefreshing(false)
  }

  async function submitProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProviderSubmitting(true)
    setProviderMessage('')
    try {
      const provider = await sendJson<Provider>('/api/v1/models/providers', 'POST', providerForm)
      setProviders((current) => [
        ...current.filter((item) => item.providerId !== provider.providerId),
        provider,
      ])
      setProviderForm(emptyProviderForm)
      setProviderMessage(`已保存 ${provider.displayName}`)
    } catch (error) {
      setProviderMessage(error instanceof Error ? error.message : '保存失败')
    } finally {
      setProviderSubmitting(false)
    }
  }

  async function toggleProvider(provider: Provider) {
    setProviderMessage('')
    try {
      const updated = await sendJson<Provider>(
        `/api/v1/models/providers/${provider.providerId}/enabled`,
        'PATCH',
        { enabled: !provider.enabled },
      )
      setProviders((current) =>
        current.map((item) => (item.providerId === updated.providerId ? updated : item)),
      )
    } catch (error) {
      setProviderMessage(error instanceof Error ? error.message : '状态更新失败')
    }
  }

  async function deleteProvider(provider: Provider) {
    setProviderMessage('')
    try {
      const response = await fetch(`${apiBase}/api/v1/models/providers/${provider.providerId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: '删除失败' }))
        throw new Error(payload.error || '删除失败')
      }
      setProviders((current) => current.filter((item) => item.providerId !== provider.providerId))
      setProviderMessage(`已删除 ${provider.displayName}`)
    } catch (error) {
      setProviderMessage(error instanceof Error ? error.message : '删除失败')
    }
  }

  async function submitUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUserSubmitting(true)
    setUserMessage('')
    try {
      const user = await sendJson<PlatformUser>('/api/v1/users', 'POST', userForm)
      setUsers((current) => [
        ...current.filter((item) => item.userId !== user.userId),
        user,
      ].sort((left, right) => left.userId.localeCompare(right.userId)))
      setUserForm(emptyUserForm)
      setUserMessage(`已保存 ${user.displayName}`)
    } catch (error) {
      setUserMessage(error instanceof Error ? error.message : '保存失败')
    } finally {
      setUserSubmitting(false)
    }
  }

  async function toggleUser(user: PlatformUser) {
    setUserMessage('')
    try {
      const updated = await sendJson<PlatformUser>(
        `/api/v1/users/${user.userId}/enabled`,
        'PATCH',
        { enabled: !user.enabled },
      )
      setUsers((current) =>
        current.map((item) => (item.userId === updated.userId ? updated : item)),
      )
    } catch (error) {
      setUserMessage(error instanceof Error ? error.message : '状态更新失败')
    }
  }

  async function deleteUser(user: PlatformUser) {
    setUserMessage('')
    try {
      const response = await fetch(`${apiBase}/api/v1/users/${user.userId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: '删除失败' }))
        throw new Error(payload.error || '删除失败')
      }
      setUsers((current) => current.filter((item) => item.userId !== user.userId))
      setUserMessage(`已删除 ${user.displayName}`)
    } catch (error) {
      setUserMessage(error instanceof Error ? error.message : '删除失败')
    }
  }

  const normalizedQuery = query.trim().toLowerCase()
  const sourceStats = useMemo(() => countBy(points, (point) => point.source), [points])
  const workshopStats = useMemo(() => countBy(steps, (step) => step.workshop), [steps])
  const typeStats = useMemo(() => countBy(points, (point) => point.dataType), [points])
  const filteredPoints = useMemo(
    () =>
      points.filter((point) =>
        matchesQuery(
          [
            point.fieldName,
            point.displayName,
            point.dataType,
            point.unitOrFormat,
            point.source,
            point.processStep,
          ],
          normalizedQuery,
        ),
      ),
    [normalizedQuery, points],
  )
  const filteredSteps = useMemo(
    () =>
      steps.filter((step) =>
        matchesQuery(
          [step.sequence, step.workshop, step.stepName, step.controlPoint, step.wipStatus, step.equipment],
          normalizedQuery,
        ),
      ),
    [normalizedQuery, steps],
  )
  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        matchesQuery(
          [user.userId, user.displayName, user.username, user.email, user.role, user.department, user.source],
          normalizedQuery,
        ),
      ),
    [normalizedQuery, users],
  )

  const aiReadyPoints = points.filter((point) => point.requiredForAiDataset).length
  const configuredProviders = providers.filter((provider) => provider.configured && provider.enabled).length
  const sourceCount = sourceStats.length
  const enabledUsers = users.filter((user) => user.enabled).length

  const navigation = useMemo(
    () => [
      { id: 'overview', label: '总览', icon: Gauge },
      { id: 'collection', label: '采集监控', icon: Activity },
      { id: 'batches', label: '批次追踪', icon: Boxes },
      { id: 'process', label: '工艺流程', icon: GitBranch },
      { id: 'points', label: '测点配置', icon: Database },
      { id: 'models', label: '模型管理', icon: BrainCircuit },
      { id: 'users', label: '用户管理', icon: Users },
      { id: 'datasets', label: '数据集导出', icon: FlaskConical },
      { id: 'alerts', label: '告警中心', icon: AlertTriangle },
    ],
    [],
  )

  const activeNav = navigation.find((item) => item.id === activeView) || navigation[0]

  return (
    <div className="app-shell" data-theme={theme}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Factory size={24} />
          </div>
          <div>
            <strong>方舟智造（上海）</strong>
            <span>工业数据中台</span>
          </div>
        </div>

        <nav aria-label="主导航">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={activeView === item.id ? 'active' : ''}
                onClick={() => setActiveView(item.id)}
                title={item.label}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div>
            <span>实时目标</span>
            <strong>{overview.realtimeDelaySeconds}s</strong>
          </div>
          <div>
            <span>数据源</span>
            <strong>{sourceCount}</strong>
          </div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="title-block">
            <p>{activeNav.label}</p>
            <h1>工业数据中台控制台</h1>
          </div>

          <div className="topbar-controls">
            <label className="search-box">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索测点、工艺、来源"
              />
            </label>

            <div className="theme-switch" aria-label="主题选择" role="group">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  className={theme === option.id ? 'active' : ''}
                  onClick={() => setTheme(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className={refreshError ? 'refresh-status error' : 'refresh-status'}>
              <span>{isRefreshing ? '同步中' : lastUpdated ? `更新 ${lastUpdated}` : '等待同步'}</span>
              {refreshError && <strong>{refreshError}</strong>}
            </div>

            <button
              className={isRefreshing ? 'icon-button spinning' : 'icon-button'}
              disabled={isRefreshing}
              onClick={refresh}
              title="刷新数据"
              type="button"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {activeView === 'overview' && (
          <div className="view-stack">
            <section className="command-band">
              <div>
                <span className="eyebrow">真实表格源</span>
                <h2>AI 测点与全流程工艺已接入</h2>
                <p>当前页面只展示 Excel 表格可追溯数据；未提供的批次、时序曲线、告警事件保持空状态。</p>
              </div>
              <div className="band-kpis">
                <MiniKpi label="AI测点" value={points.length} />
                <MiniKpi label="工艺节点" value={steps.length} />
                <MiniKpi label="AI必需" value={aiReadyPoints} />
              </div>
            </section>

            <section className="metric-grid">
              <Metric
                icon={<Database size={18} />}
                label="已配置测点"
                value={overview.configuredPoints || points.length}
                caption="来自 AI数据采集测点清单.xls"
                tone="blue"
              />
              <Metric
                icon={<GitBranch size={18} />}
                label="工艺节点"
                value={steps.length}
                caption="来自 全流程工艺文档.xlsx"
                tone="teal"
              />
              <Metric
                icon={<ServerCog size={18} />}
                label="可用模型"
                value={configuredProviders}
                caption="后台 API Provider 配置"
                tone="violet"
              />
              <Metric
                icon={<SlidersHorizontal size={18} />}
                label="实时目标"
                value={`${overview.realtimeDelaySeconds}s`}
                caption={overview.aiControlMode}
                tone="amber"
              />
            </section>

            <section className="dashboard-grid">
              <Panel title="测点来源分布" icon={<Database size={18} />} className="span-7">
                <BarPanel data={sourceStats.slice(0, 6)} />
              </Panel>

              <Panel title="工艺车间覆盖" icon={<Factory size={18} />} className="span-5">
                <DonutPanel data={workshopStats} />
              </Panel>

              <Panel title="数据类型结构" icon={<FileSpreadsheet size={18} />} className="span-7">
                <DistributionList data={typeStats} total={points.length} />
              </Panel>

              <Panel title="AI 反控策略" icon={<ShieldCheck size={18} />} className="span-5">
                <PolicyCard policy={policy} />
              </Panel>
            </section>
          </div>
        )}

        {activeView === 'collection' && (
          <div className="view-stack">
            <section className="pipeline">
              {['PLC', 'MQTT/Kafka', '数据治理', 'MySQL/InfluxDB', 'AI 数据集'].map((item, index) => (
                <div key={item} className="pipeline-node">
                  <span>{index + 1}</span>
                  <strong>{item}</strong>
                </div>
              ))}
            </section>

            <section className="dashboard-grid">
              <Panel title="采集来源" icon={<Activity size={18} />} className="span-5">
                <DistributionList data={sourceStats} total={points.length} />
              </Panel>
              <Panel title="测点预览" icon={<Database size={18} />} className="span-7">
                <DataTable
                  headers={['字段', '中文名', '类型', '来源', '工序']}
                  rows={filteredPoints.slice(0, 12).map((point) => [
                    point.fieldName,
                    point.displayName,
                    point.dataType,
                    point.source,
                    point.processStep,
                  ])}
                  emptyMessage="没有匹配的真实测点"
                />
              </Panel>
            </section>
          </div>
        )}

        {activeView === 'batches' && (
          <Panel title="生产批次" icon={<Boxes size={18} />}>
            <DataTable
              headers={['批次', '缸号', '材质', '当前工序', 'WIP', '完成度', '数据集']}
              rows={batches.map((batch) => [
                batch.batchId,
                batch.machineId,
                batch.fabricType,
                batch.currentStep,
                batch.wipStatus,
                `${batch.completionPct}%`,
                batch.datasetReady ? '可导出' : '处理中',
              ])}
              emptyMessage="原始表格未提供生产批次实时状态表，暂不展示模拟批次。"
            />
          </Panel>
        )}

        {activeView === 'process' && (
          <div className="view-stack">
            <Panel title="车间节点统计" icon={<Factory size={18} />}>
              <BarPanel data={workshopStats.slice(0, 8)} />
            </Panel>

            <Panel title="工艺 / WIP 映射" icon={<GitBranch size={18} />}>
              <div className="step-grid">
                {filteredSteps.map((step) => (
                  <article key={`${step.sequence}-${step.stepName}`} className="step-card">
                    <span>{String(step.sequence).padStart(2, '0')}</span>
                    <strong>
                      {step.workshop} · {step.stepName}
                    </strong>
                    <p>{step.controlPoint}</p>
                    <small>{step.wipStatus}</small>
                  </article>
                ))}
                {filteredSteps.length === 0 && <EmptyState message="没有匹配的真实工艺节点。" />}
              </div>
            </Panel>
          </div>
        )}

        {activeView === 'points' && (
          <Panel title="AI 采集测点" icon={<Database size={18} />}>
            <DataTable
              headers={['序号', '字段', '中文名', '类型', '单位/格式', '来源', '工序', 'AI必需']}
              rows={filteredPoints.map((point) => [
                String(point.orderNo),
                point.fieldName,
                point.displayName,
                point.dataType,
                point.unitOrFormat,
                point.source,
                point.processStep,
                point.requiredForAiDataset ? '是' : '否',
              ])}
              emptyMessage="没有匹配的真实测点"
            />
          </Panel>
        )}

        {activeView === 'models' && (
          <div className="view-stack">
            <Panel title="添加模型 API" icon={<KeyRound size={18} />}>
              <form className="provider-form" onSubmit={submitProvider}>
                <div className="form-grid">
                  <label>
                    <span>Provider ID</span>
                    <input
                      required
                      pattern="[a-z0-9][a-z0-9-]{1,48}"
                      value={providerForm.providerId}
                      onChange={(event) =>
                        setProviderForm((current) => ({
                          ...current,
                          providerId: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                        }))
                      }
                      placeholder="customer-gateway"
                    />
                  </label>
                  <label>
                    <span>显示名称</span>
                    <input
                      required
                      value={providerForm.displayName}
                      onChange={(event) =>
                        setProviderForm((current) => ({ ...current, displayName: event.target.value }))
                      }
                      placeholder="客户自有模型网关"
                    />
                  </label>
                  <label>
                    <span>API Base URL</span>
                    <input
                      required
                      type="url"
                      value={providerForm.baseUrl}
                      onChange={(event) =>
                        setProviderForm((current) => ({ ...current, baseUrl: event.target.value }))
                      }
                      placeholder="https://api.example.com/v1"
                    />
                  </label>
                  <label>
                    <span>模型名称</span>
                    <input
                      required
                      value={providerForm.modelName}
                      onChange={(event) =>
                        setProviderForm((current) => ({ ...current, modelName: event.target.value }))
                      }
                      placeholder="industrial-dyeing-v1"
                    />
                  </label>
                  <label>
                    <span>API Key</span>
                    <input
                      required
                      type="password"
                      value={providerForm.apiKey}
                      onChange={(event) =>
                        setProviderForm((current) => ({ ...current, apiKey: event.target.value }))
                      }
                      placeholder="sk-..."
                    />
                  </label>
                  <div className="form-switches">
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={providerForm.industrialAlgorithmCapable}
                        onChange={(event) =>
                          setProviderForm((current) => ({
                            ...current,
                            industrialAlgorithmCapable: event.target.checked,
                          }))
                        }
                      />
                      <span>工业算法层</span>
                    </label>
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={providerForm.enabled}
                        onChange={(event) =>
                          setProviderForm((current) => ({ ...current, enabled: event.target.checked }))
                        }
                      />
                      <span>保存后启用</span>
                    </label>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={providerSubmitting}>
                    <PlusCircle size={16} />
                    <span>{providerSubmitting ? '保存中' : '保存 API Provider'}</span>
                  </button>
                  <p className="hint">API Key 只提交给后端，列表仅显示脱敏指纹。</p>
                </div>
                {providerMessage && <p className="status-message">{providerMessage}</p>}
              </form>
            </Panel>

            <Panel title="模型供应商" icon={<BrainCircuit size={18} />}>
              <div className="provider-grid">
                {providers.map((provider) => (
                  <article key={provider.providerId} className="provider-card">
                    <div className="provider-head">
                      <strong>{provider.displayName}</strong>
                      <span className={provider.enabled ? 'status-dot on' : 'status-dot'} />
                    </div>
                    <span>{provider.modelName || '未配置模型'}</span>
                    <p>{provider.baseUrl || '待配置 API Base URL'}</p>
                    <div className="badges">
                      <em className={provider.enabled ? 'ok' : 'muted'}>
                        {provider.enabled ? '启用中' : '已停用'}
                      </em>
                      <em className={provider.configured ? 'ok' : 'muted'}>
                        {provider.configured ? '已配置' : '缺少密钥'}
                      </em>
                      {provider.industrialAlgorithmCapable && <em>工业算法层</em>}
                      {provider.source === 'USER_ADDED' && <em>用户添加</em>}
                    </div>
                    {provider.apiKeyFingerprint && (
                      <small className="key-fingerprint">{provider.apiKeyFingerprint}</small>
                    )}
                    {provider.source === 'USER_ADDED' && (
                      <div className="card-actions">
                        <button type="button" onClick={() => toggleProvider(provider)}>
                          <Power size={14} />
                          <span>{provider.enabled ? '停用' : '启用'}</span>
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => deleteProvider(provider)}
                        >
                          <Trash2 size={14} />
                          <span>删除</span>
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {activeView === 'users' && (
          <div className="view-stack">
            <section className="metric-grid users-metrics">
              <Metric
                icon={<Users size={18} />}
                label="后台用户"
                value={users.length}
                caption="系统初始化 + 管理员添加"
                tone="blue"
              />
              <Metric
                icon={<CheckCircle2 size={18} />}
                label="启用用户"
                value={enabledUsers}
                caption="可进入管理控制台"
                tone="teal"
              />
              <Metric
                icon={<ShieldCheck size={18} />}
                label="管理员"
                value={users.filter((user) => user.role === 'ADMIN').length}
                caption="保留至少一个启用管理员"
                tone="violet"
              />
              <Metric
                icon={<UserPlus size={18} />}
                label="可新增"
                value="CRUD"
                caption="添加、启停、删除用户"
                tone="amber"
              />
            </section>

            <Panel title="添加后台用户" icon={<UserPlus size={18} />}>
              <form className="provider-form" onSubmit={submitUser}>
                <div className="form-grid">
                  <label>
                    <span>用户 ID</span>
                    <input
                      required
                      pattern="[A-Za-z0-9][A-Za-z0-9-]{1,48}"
                      value={userForm.userId}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          userId: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                        }))
                      }
                      placeholder="production-admin"
                    />
                  </label>
                  <label>
                    <span>姓名</span>
                    <input
                      required
                      value={userForm.displayName}
                      onChange={(event) =>
                        setUserForm((current) => ({ ...current, displayName: event.target.value }))
                      }
                      placeholder="张工"
                    />
                  </label>
                  <label>
                    <span>登录名</span>
                    <input
                      required
                      pattern="[A-Za-z0-9._-]{2,64}"
                      value={userForm.username}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          username: event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''),
                        }))
                      }
                      placeholder="zhang.gong"
                    />
                  </label>
                  <label>
                    <span>邮箱</span>
                    <input
                      required
                      type="email"
                      value={userForm.email}
                      onChange={(event) =>
                        setUserForm((current) => ({ ...current, email: event.target.value }))
                      }
                      placeholder="user@ark-mfg.com"
                    />
                  </label>
                  <label>
                    <span>部门</span>
                    <input
                      required
                      value={userForm.department}
                      onChange={(event) =>
                        setUserForm((current) => ({ ...current, department: event.target.value }))
                      }
                      placeholder="生产运营"
                    />
                  </label>
                  <label>
                    <span>角色</span>
                    <select
                      value={userForm.role}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          role: event.target.value as PlatformUserRole,
                        }))
                      }
                    >
                      {roleOptions.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="form-switches">
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={userForm.enabled}
                        onChange={(event) =>
                          setUserForm((current) => ({ ...current, enabled: event.target.checked }))
                        }
                      />
                      <span>保存后启用</span>
                    </label>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={userSubmitting}>
                    <UserPlus size={16} />
                    <span>{userSubmitting ? '保存中' : '保存用户'}</span>
                  </button>
                  <p className="hint">当前为后台管理用户，至少保留一个启用的管理员账号。</p>
                </div>
                {userMessage && <p className="status-message">{userMessage}</p>}
              </form>
            </Panel>

            <Panel title="后台用户" icon={<Users size={18} />}>
              <div className="provider-grid">
                {filteredUsers.map((user) => (
                  <article key={user.userId} className="provider-card user-card">
                    <div className="provider-head">
                      <strong>{user.displayName}</strong>
                      <span className={user.enabled ? 'status-dot on' : 'status-dot'} />
                    </div>
                    <span>{roleLabel(user.role)}</span>
                    <p>{user.department} · {user.email}</p>
                    <div className="user-meta">
                      <small>@{user.username}</small>
                      <small>{formatDate(user.createdAt)}</small>
                    </div>
                    <div className="badges">
                      <em className={user.enabled ? 'ok' : 'muted'}>
                        {user.enabled ? '启用中' : '已停用'}
                      </em>
                      <em>{user.source === 'SYSTEM' ? '系统初始化' : '管理员添加'}</em>
                      <em>{user.userId}</em>
                    </div>
                    <div className="card-actions">
                      <button type="button" onClick={() => toggleUser(user)}>
                        <Power size={14} />
                        <span>{user.enabled ? '停用' : '启用'}</span>
                      </button>
                      {user.source !== 'SYSTEM' && (
                        <button type="button" className="danger" onClick={() => deleteUser(user)}>
                          <Trash2 size={14} />
                          <span>删除</span>
                        </button>
                      )}
                    </div>
                  </article>
                ))}
                {filteredUsers.length === 0 && <EmptyState message="没有匹配的后台用户。" />}
              </div>
            </Panel>
          </div>
        )}

        {activeView === 'datasets' && (
          <Panel title="数据集格式" icon={<FlaskConical size={18} />}>
            <div className="export-tools">
              {datasetFormats.map((format) => (
                <button
                  key={format}
                  className={exportFormat === format ? 'selected' : ''}
                  onClick={() => setExportFormat(format)}
                  type="button"
                >
                  {formatLabel(format)}
                </button>
              ))}
            </div>
            <div className="dataset-summary">
              <CheckCircle2 size={18} />
              <span>当前选择：{formatLabel(exportFormat)}</span>
            </div>
            <EmptyState message="批次实时表尚未提供，暂不创建带批次 ID 的导出任务。" />
          </Panel>
        )}

        {activeView === 'alerts' && (
          <Panel title="异常告警" icon={<AlertTriangle size={18} />}>
            <EmptyState message="原始表格未提供在线告警事件，暂不展示模拟告警。" />
          </Panel>
        )}
      </main>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: ReactNode
  label: string
  value: number | string
  caption: string
  tone: string
}) {
  return (
    <article className={`metric ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{caption}</small>
    </article>
  )
}

function MiniKpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="mini-kpi">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function Panel({
  title,
  icon,
  children,
  className = '',
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-title">
        <div>
          {icon}
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

function PolicyCard({ policy }: { policy: ControlPolicy | null }) {
  if (!policy) return <EmptyState message="策略加载中" />
  return (
    <div className="policy-card">
      <div className="policy-line">
        <CircleDot size={16} />
        <span>模式</span>
        <strong>{policy.mode}</strong>
      </div>
      <div className="policy-line">
        <ShieldCheck size={16} />
        <span>审批</span>
        <strong>{policy.requireHumanApproval ? '需要人工确认' : '建议 / 模拟'}</strong>
      </div>
      <div className="policy-line">
        <Database size={16} />
        <span>日志</span>
        <strong>{policy.persistDecisionLog ? '持久化' : '未开启'}</strong>
      </div>
      <p>{policy.safetyNote}</p>
    </div>
  )
}

function BarPanel({ data }: { data: StatDatum[] }) {
  if (data.length === 0) return <EmptyState message="暂无可统计数据" />
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} minTickGap={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={34} />
          <Tooltip cursor={{ fill: 'rgba(79, 140, 255, 0.08)' }} />
          <Bar dataKey="value" isAnimationActive={false} radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DonutPanel({ data }: { data: StatDatum[] }) {
  if (data.length === 0) return <EmptyState message="暂无可统计数据" />
  const total = data.reduce((sum, item) => sum + item.value, 0)
  return (
    <div className="donut-layout">
      <div className="donut-chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={3}
              isAnimationActive={false}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>{total}</strong>
          <span>节点</span>
        </div>
      </div>
      <DistributionList data={data} total={total} compact />
    </div>
  )
}

function DistributionList({
  data,
  total,
  compact = false,
}: {
  data: StatDatum[]
  total: number
  compact?: boolean
}) {
  if (data.length === 0) return <EmptyState message="暂无可统计数据" />
  return (
    <div className={compact ? 'distribution compact' : 'distribution'}>
      {data.map((item, index) => {
        const percent = total > 0 ? Math.round((item.value / total) * 100) : 0
        return (
          <div key={item.name} className="distribution-row">
            <span style={{ '--dot': chartColors[index % chartColors.length] } as React.CSSProperties} />
            <strong>{item.name}</strong>
            <em>{item.value}</em>
            <div className="progress">
              <i style={{ width: `${percent}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <div className="empty-state">{message}</div>
}

function DataTable({
  headers,
  rows,
  emptyMessage = '暂无数据',
}: {
  headers: string[]
  rows: string[][]
  emptyMessage?: string
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="empty-cell" colSpan={headers.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function roleLabel(role: PlatformUserRole) {
  return roleOptions.find((item) => item.id === role)?.label || role
}

function formatDate(value: string | null) {
  if (!value) return '未登录'
  return new Date(value).toLocaleDateString('zh-CN', { timeZone: 'UTC' })
}

function formatLabel(format: DatasetFormat) {
  return format.replace('_', ' ')
}
