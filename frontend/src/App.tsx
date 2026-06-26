import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Boxes,
  BrainCircuit,
  Database,
  Factory,
  FlaskConical,
  Gauge,
  GitBranch,
  LineChart as LineIcon,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
}

type ControlPolicy = {
  mode: string
  realtimeDelaySeconds: number
  requireHumanApproval: boolean
  persistDecisionLog: boolean
  safetyNote: string
}

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const fallbackOverview: Overview = {
  activeBatches: 3,
  configuredPoints: 16,
  onlineDevices: 8,
  activeAlerts: 2,
  realtimeDelaySeconds: 5,
  aiControlMode: 'RECOMMEND_ONLY',
}

const trendData = [
  { time: '00m', temperature: 30, ph: 5.8, uptake: 12 },
  { time: '15m', temperature: 48, ph: 5.6, uptake: 28 },
  { time: '30m', temperature: 68, ph: 5.4, uptake: 43 },
  { time: '45m', temperature: 82, ph: 5.3, uptake: 58 },
  { time: '60m', temperature: 88, ph: 5.2, uptake: 71 },
]

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiBase}${path}`)
    if (!response.ok) return fallback
    return await response.json()
  } catch {
    return fallback
  }
}

export default function App() {
  const [activeView, setActiveView] = useState('overview')
  const [overview, setOverview] = useState<Overview>(fallbackOverview)
  const [batches, setBatches] = useState<Batch[]>([])
  const [points, setPoints] = useState<Point[]>([])
  const [steps, setSteps] = useState<ProcessStep[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [policy, setPolicy] = useState<ControlPolicy | null>(null)
  const [exportFormat, setExportFormat] = useState('CSV')

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    const [nextOverview, nextBatches, nextPoints, nextSteps, nextProviders, nextPolicy] =
      await Promise.all([
        fetchJson('/api/v1/overview', fallbackOverview),
        fetchJson<Batch[]>('/api/v1/batches', []),
        fetchJson<Point[]>('/api/v1/points', []),
        fetchJson<ProcessStep[]>('/api/v1/process-steps', []),
        fetchJson<Provider[]>('/api/v1/models/providers', []),
        fetchJson<ControlPolicy | null>('/api/v1/models/control-policy', null),
      ])
    setOverview(nextOverview)
    setBatches(nextBatches)
    setPoints(nextPoints)
    setSteps(nextSteps)
    setProviders(nextProviders)
    setPolicy(nextPolicy)
  }

  const navigation = useMemo(
    () => [
      { id: 'overview', label: '总览', icon: Gauge },
      { id: 'collection', label: '采集监控', icon: Activity },
      { id: 'batches', label: '批次追踪', icon: Boxes },
      { id: 'process', label: '工艺流程', icon: GitBranch },
      { id: 'points', label: '测点配置', icon: Database },
      { id: 'models', label: '模型管理', icon: BrainCircuit },
      { id: 'datasets', label: '数据集导出', icon: FlaskConical },
      { id: 'alerts', label: '告警中心', icon: AlertTriangle },
    ],
    [],
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Factory size={22} />
          <div>
            <strong>AI Data PLC</strong>
            <span>工业数据中台</span>
          </div>
        </div>
        <nav>
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={activeView === item.id ? 'active' : ''}
                onClick={() => setActiveView(item.id)}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <h1>{navigation.find((item) => item.id === activeView)?.label}</h1>
            <p>默认实时目标 {overview.realtimeDelaySeconds}s，可按设备/测点后续调节</p>
          </div>
          <button className="icon-button" onClick={refresh} title="刷新数据">
            <RefreshCw size={18} />
          </button>
        </header>

        {activeView === 'overview' && (
          <>
            <section className="metric-grid">
              <Metric label="活跃批次" value={overview.activeBatches} tone="green" />
              <Metric label="已配置测点" value={overview.configuredPoints} tone="blue" />
              <Metric label="在线设备" value={overview.onlineDevices} tone="steel" />
              <Metric label="活跃告警" value={overview.activeAlerts} tone="red" />
            </section>
            <section className="split">
              <Panel title="染色曲线" icon={<LineIcon size={18} />}>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line dataKey="temperature" name="温度" stroke="#1f7a8c" strokeWidth={2} />
                      <Line dataKey="ph" name="pH" stroke="#8a5a44" strokeWidth={2} />
                      <Line dataKey="uptake" name="上染率" stroke="#6f8f3d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel title="AI反控策略" icon={<ShieldCheck size={18} />}>
                <PolicyCard policy={policy} />
              </Panel>
            </section>
          </>
        )}

        {activeView === 'collection' && (
          <Panel title="采集链路" icon={<Activity size={18} />}>
            <div className="pipeline">
              {['PLC', 'MQTT/Kafka', '治理规整', 'MySQL/InfluxDB', 'AI数据集'].map((item) => (
                <div key={item} className="pipeline-node">{item}</div>
              ))}
            </div>
          </Panel>
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
            />
          </Panel>
        )}

        {activeView === 'process' && (
          <Panel title="工艺/WIP映射" icon={<GitBranch size={18} />}>
            <div className="step-grid">
              {steps.map((step) => (
                <article key={`${step.sequence}-${step.stepName}`} className="step-card">
                  <span>{step.sequence}</span>
                  <strong>{step.workshop} · {step.stepName}</strong>
                  <p>{step.controlPoint}</p>
                  <small>{step.wipStatus}</small>
                </article>
              ))}
            </div>
          </Panel>
        )}

        {activeView === 'points' && (
          <Panel title="AI采集测点" icon={<Database size={18} />}>
            <DataTable
              headers={['字段', '中文名', '类型', '单位', '来源', '工序']}
              rows={points.map((point) => [
                point.fieldName,
                point.displayName,
                point.dataType,
                point.unitOrFormat,
                point.source,
                point.processStep,
              ])}
            />
          </Panel>
        )}

        {activeView === 'models' && (
          <Panel title="模型供应商" icon={<BrainCircuit size={18} />}>
            <div className="provider-grid">
              {providers.map((provider) => (
                <article key={provider.providerId} className="provider-card">
                  <strong>{provider.displayName}</strong>
                  <span>{provider.modelName || '未配置模型'}</span>
                  <p>{provider.baseUrl || '待配置 API Base URL'}</p>
                  <div className="badges">
                    <em className={provider.configured ? 'ok' : 'muted'}>
                      {provider.configured ? '已配置' : '缺少密钥'}
                    </em>
                    {provider.industrialAlgorithmCapable && <em>工业算法层</em>}
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        )}

        {activeView === 'datasets' && (
          <Panel title="数据集导出" icon={<FlaskConical size={18} />}>
            <div className="export-tools">
              {['CSV', 'JSON', 'EXCEL', 'PARQUET', 'REST_API', 'DB_VIEW'].map((format) => (
                <button
                  key={format}
                  className={exportFormat === format ? 'selected' : ''}
                  onClick={() => setExportFormat(format)}
                >
                  {format}
                </button>
              ))}
            </div>
            <p className="hint">当前选择：{exportFormat}。导出任务会绑定批次、WIP事件、光谱曲线和AI标签。</p>
          </Panel>
        )}

        {activeView === 'alerts' && (
          <Panel title="异常告警" icon={<AlertTriangle size={18} />}>
            <div className="alert-list">
              <div><strong>JET-03</strong><span>升温速率偏离标准曲线 0.8C/min</span></div>
              <div><strong>JET-05</strong><span>皂洗电导率超过终点阈值</span></div>
            </div>
          </Panel>
        )}
      </main>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <article className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-title">
        {icon}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function PolicyCard({ policy }: { policy: ControlPolicy | null }) {
  if (!policy) return <p className="hint">策略加载中</p>
  return (
    <div className="policy-card">
      <strong>{policy.mode}</strong>
      <span>{policy.requireHumanApproval ? '需要人工审批' : '仅建议/模拟'}</span>
      <p>{policy.safetyNote}</p>
    </div>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
