import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Database,
  ExternalLink,
  Factory,
  FileSpreadsheet,
  Gauge,
  GitBranch,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
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

type ThemeId = 'aurora' | 'graphite'
type DemoAccountId = 'admin' | 'guest'
type DemoAccount = {
  id: DemoAccountId
  password: string
  name: string
  role: string
  note: string
}
type StatDatum = { name: string; value: number }
type FetchResult<T> = { data: T; ok: boolean }

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const chartColors = ['#4f8cff', '#14b8a6', '#8b6cf6', '#f2b84b', '#ef6f6c', '#65758b']
const demoSessionKey = 'fangzhou-demo-account'

const demoAccounts: DemoAccount[] = [
  {
    id: 'admin',
    password: 'admin',
    name: '管理员演示',
    role: 'Admin Demo',
    note: '全功能展示与管理演示入口',
  },
  {
    id: 'guest',
    password: 'guest',
    name: '访客演示',
    role: 'Guest Demo',
    note: '客户预览与数据展示演示入口',
  },
]

const backendNavigation = [
  { id: 'admin-overview', label: '管理总览', href: `${apiBase}/admin/index.html#overview`, icon: Gauge },
  { id: 'admin-users', label: '用户管理', href: `${apiBase}/admin/index.html#users`, icon: UserRound },
  { id: 'admin-models', label: '模型/API', href: `${apiBase}/admin/index.html#models`, icon: ServerCog },
  { id: 'admin-data', label: '数据接口', href: `${apiBase}/admin/index.html#data`, icon: FileSpreadsheet },
  { id: 'admin-api', label: 'API 索引', href: `${apiBase}/api/v1`, icon: Database },
]

const fallbackOverview: Overview = {
  activeBatches: 0,
  configuredPoints: 0,
  onlineDevices: 0,
  activeAlerts: 0,
  realtimeDelaySeconds: 5,
  aiControlMode: 'RECOMMEND_ONLY',
}

const themeOptions: Array<{ id: ThemeId; label: string }> = [
  { id: 'aurora', label: '智控' },
  { id: 'graphite', label: '石墨' },
]

const viewIds = new Set(['overview', 'collection', 'process', 'points', 'data'])

function initialView() {
  const requestedView = new URLSearchParams(window.location.search).get('view') || ''
  return viewIds.has(requestedView) ? requestedView : 'overview'
}

function readDemoAccount() {
  const saved = window.localStorage.getItem(demoSessionKey)
  return demoAccounts.find((account) => account.id === saved) || null
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
  const [points, setPoints] = useState<Point[]>([])
  const [steps, setSteps] = useState<ProcessStep[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [demoAccount, setDemoAccount] = useState<DemoAccount | null>(() => readDemoAccount())

  useEffect(() => {
    if (!demoAccount) return
    void refresh()
  }, [demoAccount])

  function enterDemo(account: DemoAccount) {
    window.localStorage.setItem(demoSessionKey, account.id)
    setDemoAccount(account)
  }

  function exitDemo() {
    window.localStorage.removeItem(demoSessionKey)
    setDemoAccount(null)
    setLastUpdated('')
    setRefreshError('')
  }

  async function refresh() {
    setIsRefreshing(true)
    setRefreshError('')
    const [overviewResult, pointsResult, stepsResult, providersResult] = await Promise.all([
      fetchJson('/api/v1/overview', fallbackOverview),
      fetchJson<Point[]>('/api/v1/points', []),
      fetchJson<ProcessStep[]>('/api/v1/process-steps', []),
      fetchJson<Provider[]>('/api/v1/models/providers', []),
    ])

    if (overviewResult.ok) setOverview(overviewResult.data)
    if (pointsResult.ok) setPoints(pointsResult.data)
    if (stepsResult.ok) setSteps(stepsResult.data)
    if (providersResult.ok) setProviders(providersResult.data)

    const failed = [overviewResult, pointsResult, stepsResult, providersResult].some((result) => !result.ok)
    setRefreshError(failed ? '部分展示数据暂不可用，当前保留最近一次可用数据或空状态。' : '')
    setLastUpdated(new Date().toLocaleTimeString('zh-CN', { hour12: false }))
    setIsRefreshing(false)
  }

  const normalizedQuery = query.trim().toLowerCase()
  const sourceStats = useMemo(() => countBy(points, (point) => point.source), [points])
  const workshopStats = useMemo(() => countBy(steps, (step) => step.workshop), [steps])
  const typeStats = useMemo(() => countBy(points, (point) => point.dataType), [points])
  const filteredPoints = useMemo(
    () =>
      points.filter((point) =>
        matchesQuery(
          [point.fieldName, point.displayName, point.dataType, point.unitOrFormat, point.source, point.processStep],
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

  const aiReadyPoints = points.filter((point) => point.requiredForAiDataset).length
  const configuredProviders = providers.filter((provider) => provider.configured && provider.enabled).length
  const sourceCount = sourceStats.length

  const navigation = useMemo(
    () => [
      { id: 'overview', label: '展示总览', icon: Gauge },
      { id: 'collection', label: '采集链路', icon: Activity },
      { id: 'process', label: '工艺展示', icon: GitBranch },
      { id: 'points', label: '测点展示', icon: Database },
      { id: 'data', label: '数据说明', icon: FileSpreadsheet },
    ],
    [],
  )

  const activeNav = navigation.find((item) => item.id === activeView) || navigation[0]

  if (!demoAccount) {
    return <DemoLoginScreen accounts={demoAccounts} onEnter={enterDemo} />
  }

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

        <nav aria-label="展示导航">
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

        {demoAccount.id === 'admin' && (
          <section className="backend-nav-panel" aria-label="后台管理导航">
            <div className="backend-nav-title">
              <span>后台管理</span>
              <small>Admin only</small>
            </div>
            <div className="backend-nav-list">
              {backendNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <a key={item.id} href={item.href} target="_blank" rel="noreferrer" title={item.label}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                    <ExternalLink size={14} />
                  </a>
                )
              })}
            </div>
          </section>
        )}

        <div className="demo-account-card">
          <div className="demo-account-icon">
            <UserRound size={18} />
          </div>
          <div>
            <strong>{demoAccount.name}</strong>
            <span>{demoAccount.id} / {demoAccount.role}</span>
          </div>
          <button type="button" onClick={exitDemo} title="切换演示账号">
            <LogOut size={16} />
          </button>
        </div>

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
            <h1>工业数据展示看板</h1>
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
                <span className="eyebrow">展示端</span>
                <h2>AI 测点与全流程工艺展示</h2>
                <p>该入口只展示 Excel 表格可追溯数据；用户、模型、API Key 等后台管理功能已迁移到后端管理界面。</p>
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
                caption="仅展示配置状态"
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
              <Panel title="展示说明" icon={<ShieldCheck size={18} />} className="span-5">
                <div className="policy-card">
                  <div className="policy-line">
                    <Database size={16} />
                    <span>数据来源</span>
                    <strong>真实表格</strong>
                  </div>
                  <div className="policy-line">
                    <ShieldCheck size={16} />
                    <span>后台入口</span>
                    <strong>Backend</strong>
                  </div>
                  <p>当前展示端不提供用户管理、模型密钥配置或 API Provider 管理。</p>
                </div>
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
          <Panel title="AI 采集测点展示" icon={<Database size={18} />}>
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

        {activeView === 'data' && (
          <Panel title="数据边界" icon={<FileSpreadsheet size={18} />}>
            <div className="dataset-summary">
              <ShieldCheck size={18} />
              <span>本展示端只使用表格真实数据，不显示模拟批次、模拟曲线或模拟告警。</span>
            </div>
            <DataTable
              headers={['数据域', '当前状态', '展示策略']}
              rows={[
                ['AI测点', `${points.length} 条`, '展示真实测点清单'],
                ['全流程工艺', `${steps.length} 个节点`, '展示真实工艺/WIP 映射'],
                ['生产批次', '未接入真实实时表', '不展示模拟批次'],
                ['时序曲线', '未接入真实时序表', '不展示模拟曲线'],
                ['在线告警', '未接入真实告警事件', '不展示模拟告警'],
              ]}
            />
          </Panel>
        )}
      </main>
    </div>
  )
}

function DemoLoginScreen({
  accounts,
  onEnter,
}: {
  accounts: DemoAccount[]
  onEnter: (account: DemoAccount) => void
}) {
  return (
    <div className="demo-login-shell">
      <section className="demo-login-panel">
        <div className="demo-login-brand">
          <div className="brand-mark">
            <Factory size={24} />
          </div>
          <div>
            <strong>方舟智造（上海）</strong>
            <span>工业数据中台</span>
          </div>
        </div>

        <div className="demo-login-copy">
          <span>Demo Login</span>
          <h1>选择演示账号进入系统</h1>
          <p>账号密码固定展示，无需输入。当前仅用于演示入口，进入后前端功能全部开放。</p>
        </div>

        <div className="demo-account-list">
          {accounts.map((account) => (
            <article key={account.id} className="demo-login-card">
              <div className="demo-login-card-head">
                <div className="demo-account-icon">
                  <UserRound size={18} />
                </div>
                <div>
                  <strong>{account.name}</strong>
                  <span>{account.note}</span>
                </div>
              </div>
              <div className="demo-credential-grid">
                <div>
                  <span>账号</span>
                  <strong>{account.id}</strong>
                </div>
                <div>
                  <span>密码</span>
                  <strong>{account.password}</strong>
                </div>
              </div>
              <button type="button" onClick={() => onEnter(account)}>
                <LogIn size={17} />
                进入 {account.id}
              </button>
            </article>
          ))}
        </div>
      </section>
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
