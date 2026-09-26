import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import type { Entry, Tank } from '../types'
import { fmtShortDate } from '../lib/utils'

const COLORS = {
  ammonia: '#f5b84f',
  nitrite: '#c490e8',
  nitrate: '#57d9c2',
  phosphate: '#8fb573',
  ph: '#e8a3c8',
  temp: '#f2925c',
}

type Range = '7' | '30' | '90' | 'all'

function testPoints(entries: Entry[], days: number | null) {
  const cutoff = days ? Date.now() - days * 86_400_000 : 0
  return entries
    .filter((e) => e.kind === 'test' && new Date(e.date).getTime() >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: e.date,
      ammonia: e.ammonia,
      nitrite: e.nitrite,
      nitrate: e.nitrate,
      phosphate: e.phosphate,
      ph: e.ph,
      waterTemp: e.waterTemp,
    }))
}

const baseAxis = {
  type: 'category' as const,
  axisLine: { lineStyle: { color: '#1e3531' } },
  axisLabel: { color: '#9db8b1', fontSize: 10.5 },
  axisTick: { show: false },
}

const legendStyle = { textStyle: { color: '#9db8b1', fontSize: 11 }, itemWidth: 14, itemHeight: 3, icon: 'roundRect' }

function mkChart(title: string, points: ReturnType<typeof testPoints>, series: { key: keyof (typeof points)[number]; name: string; color: string; yAxisIndex?: number }[], yNames: [string, string?]) {
  const present = series.filter((s) => points.some((p) => p[s.key] != null))
  if (!present.length) {
    return (
      <div className="card">
        <div className="h-section" style={{ margin: '0 0 6px' }}>{title}</div>
        <div className="muted">No data yet — log tests to see this chart.</div>
      </div>
    )
  }
  const option = {
    backgroundColor: 'transparent',
    animationDuration: 300,
    grid: { left: 6, right: 6, top: 30, bottom: 2, containLabel: true },
    legend: { ...legendStyle, top: 0, right: 0 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#12211f',
      borderColor: '#1e3531',
      textStyle: { color: '#e9f2ef', fontSize: 12 },
    },
    xAxis: { ...baseAxis, data: points.map((p) => fmtShortDate(p.date)) },
    yAxis: [
      {
        type: 'value',
        name: yNames[0],
        nameTextStyle: { color: '#5f7a73', fontSize: 10 },
        axisLabel: { color: '#9db8b1', fontSize: 10.5 },
        splitLine: { lineStyle: { color: '#182b28' } },
      },
      ...(yNames[1]
        ? [{
            type: 'value',
            name: yNames[1],
            nameTextStyle: { color: '#5f7a73', fontSize: 10 },
            axisLabel: { color: '#9db8b1', fontSize: 10.5 },
            splitLine: { show: false },
          }]
        : []),
    ],
    series: present.map((s) => ({
      name: s.name,
      type: 'line',
      yAxisIndex: s.yAxisIndex ?? 0,
      smooth: 0.35,
      symbol: 'circle',
      symbolSize: 5,
      connectNulls: true,
      lineStyle: { width: 2.2, color: s.color },
      itemStyle: { color: s.color },
      data: points.map((p) => p[s.key] ?? null),
    })),
  }
  return (
    <div className="card" style={{ padding: 12 }}>
      <ReactECharts option={option} notMerge style={{ height: 210 }} />
    </div>
  )
}


export default function Charts({ entries }: { entries: Entry[]; tank: Tank }) {
  const [range, setRange] = useState<Range>('30')
  const days = range === 'all' ? null : Number(range)
  const points = useMemo(() => testPoints(entries, days), [entries, days])

  return (
    <div>
      <div className="chips">
        {(['7', '30', '90', 'all'] as Range[]).map((r) => (
          <button key={r} type="button" className={`chip ${range === r ? 'on' : ''}`} onClick={() => setRange(r)}>
            {r === 'all' ? 'All' : `${r} days`}
          </button>
        ))}
      </div>

      {mkChart(
        'Toxins',
        points,
        [
          { key: 'ammonia', name: 'Ammonia', color: COLORS.ammonia },
          { key: 'nitrite', name: 'Nitrite', color: COLORS.nitrite },
        ],
        ['ppm'],
      )}

      {mkChart(
        'Nitrate & phosphate',
        points,
        [
          { key: 'nitrate', name: 'Nitrate', color: COLORS.nitrate },
          { key: 'phosphate', name: 'Phosphate', color: COLORS.phosphate },
        ],
        ['ppm'],
      )}

      {mkChart(
        'pH & temperature',
        points,
        [
          { key: 'ph', name: 'pH', color: COLORS.ph },
          { key: 'waterTemp', name: 'Temp', color: COLORS.temp, yAxisIndex: 1 },
        ],
        ['pH', '°C'],
      )}
    </div>
  )
}
