import { useState, useEffect } from 'react';
import { api, rupiah } from '../utils/api';

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
const BarChart = ({ data, valueKey, labelKey, color = 'var(--green)' }) => {
  if (!data || data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
      Belum ada data
    </div>
  );
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, paddingTop: 8 }}>
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = (val / max) * 100;
        return (
          <div key={i} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4,
          }}>
            <div style={{
              fontSize: '9.5px', color: 'var(--muted)', fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
            }}>
              {val > 0 ? (val >= 1_000_000 ? `${(val/1_000_000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}K` : val) : ''}
            </div>
            <div style={{
              width: '100%', maxWidth: 32, height: `${Math.max(pct, 2)}%`,
              background: color,
              borderRadius: '4px 4px 0 0',
              opacity: 0.85,
              transition: 'height 0.5s ease',
            }} />
            <div style={{
              fontSize: '9px', color: 'var(--muted)', textAlign: 'center',
              fontFamily: 'var(--font-mono)', lineHeight: 1.2,
            }}>
              {d[labelKey]}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Donut Chart (SVG) ────────────────────────────────────────────────────────
const DonutChart = ({ data, total }) => {
  const colors = ['#2d8c4e', '#4caf8a', '#78c8a0', '#a8dfc0', '#c8eedd', '#e0f5ec'];
  if (!data || data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>
      Belum ada data
    </div>
  );
  const radius = 54, cx = 70, cy = 70, strokeW = 18;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  const segments = data.map((d, i) => {
    const pct = total > 0 ? Number(d.revenue) / total : 0;
    const dash = pct * circ;
    const seg = { offset, dash, color: colors[i % colors.length] };
    offset += dash;
    return seg;
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width={140} height={140} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={radius} fill="none"
          stroke="var(--border)" strokeWidth={strokeW} />
        {segments.map((seg, i) => (
          <circle key={i} cx={cx} cy={cy} r={radius} fill="none"
            stroke={seg.color} strokeWidth={strokeW}
            strokeDasharray={`${seg.dash} ${circ - seg.dash}`}
            strokeDashoffset={-seg.offset + circ * 0.25}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle"
          style={{ fontSize: 10, fill: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          Total
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle"
          style={{ fontSize: 11, fill: 'var(--text)', fontWeight: 700 }}>
          {data.reduce((s, d) => s + Number(d.total_sold || 0), 0)} item
        </text>
      </svg>
      <div style={{ flex: 1 }}>
        {data.map((d, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: 2, flexShrink: 0,
              background: colors[i % colors.length],
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {d.icon} {d.category_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {d.total_sold} item
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSalesReport() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [year, setYear]         = useState(new Date().getFullYear());
  const [chartMode, setChartMode] = useState('revenue'); // 'revenue' | 'orders'

  const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

  useEffect(() => { loadReport(); }, [year]);

  const loadReport = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.salesReport(year);
      setData(res.data);
    } catch (e) {
      setError(e.message || 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyData = () => {
    const base = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1, month_name: MONTHS_ID[i], total_orders: 0, revenue: 0, gross_sales: 0,
    }));
    if (!data?.monthlySales) return base;
    data.monthlySales.forEach(m => {
      const idx = Number(m.month) - 1;
      if (idx >= 0 && idx < 12) {
        base[idx].total_orders = Number(m.total_orders);
        base[idx].revenue      = Number(m.revenue);
        base[idx].gross_sales  = Number(m.gross_sales);
      }
    });
    return base;
  };

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <span>Memuat laporan penjualan...</span>
    </div>
  );

  if (error) return (
    <div className="loading-page">
      <div style={{ marginBottom: 12, opacity: 0.4, color: 'var(--danger)' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M12 3L22 21H2L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M12 10v4M12 16.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
      <p style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</p>
      <button className="btn btn-primary btn-sm" onClick={loadReport}>Coba Lagi</button>
    </div>
  );

  const monthly   = getMonthlyData();
  const summary   = data?.summary       || {};
  const topPlants = data?.topPlants     || [];
  const catSales  = data?.categorySales || [];
  const catTotal  = catSales.reduce((s, c) => s + Number(c.revenue || 0), 0);
  const years     = data?.availableYears?.map(y => y.year) || [new Date().getFullYear()];

  const maxRevMonth = monthly.reduce((max, m) =>
    Number(m.revenue) > Number(max?.revenue || 0) ? m : max, monthly[0]);

  return (
    <div style={{ padding: '28px 28px 64px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 26, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.9rem',
              fontWeight: 700, marginBottom: 3, color: 'var(--text)',
            }}>Laporan Penjualan</h1>
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
              Analisis penjualan & produk terlaris Ali Nursery
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              style={{
                padding: '7px 12px', borderRadius: 8, fontSize: 13,
                border: '1.5px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-mono)',
              }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn btn-outline btn-sm" onClick={loadReport}>↻ Refresh</button>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 24,
      }}>
        {[
          { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="4" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 7h13" stroke="currentColor" strokeWidth="1.5"/><rect x="3.5" y="9.5" width="3" height="1.5" rx=".5" fill="currentColor"/></svg>, label: 'Revenue Terkonfirmasi', value: rupiah(summary.total_revenue || 0), color: 'var(--green)', bg: 'var(--green-dim)', accent: 'var(--green)' },
          { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, label: 'Total Pesanan', value: Number(summary.total_orders || 0).toLocaleString(), color: 'var(--text)', bg: 'var(--elevated)', accent: 'var(--border-2)' },
          { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1C8 1 3 5 3 9a5 5 0 0010 0C13 5 8 1 8 1z" fill="currentColor" opacity=".7"/><path d="M8 9v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>, label: 'Item Terjual', value: Number(summary.total_items_sold || 0).toLocaleString(), color: 'var(--info)', bg: '#eff6ff', accent: 'var(--info)' },
          { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 13c0-2.2 2.2-4 5-4M8.5 12c0-1.7 1.6-3 3.5-3s3.5 1.3 3.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>, label: 'Pelanggan Unik', value: Number(summary.unique_customers || 0).toLocaleString(), color: 'var(--purple)', bg: '#f5f3ff', accent: 'var(--purple)' },
        ].map((card, i) => (
          <div key={i} className="stat-card" style={{ borderLeft: `3px solid ${card.accent}` }}>
            <div className="stat-icon" style={{ background: card.bg }}>{card.icon}</div>
            <div>
              <div className="stat-label">{card.label}</div>
              <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart Penjualan Bulanan ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 20,
        }}>
          <div>
            <h3 style={{ marginBottom: 3 }}>Penjualan Per Bulan — {year}</h3>
            {maxRevMonth && Number(maxRevMonth.revenue) > 0 && (
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                Bulan terbaik: <strong style={{ color: 'var(--green)' }}>
                  {MONTHS_ID[(maxRevMonth.month || 1) - 1]}
                </strong> ({rupiah(maxRevMonth.revenue)})
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'revenue', label: 'Revenue', color: 'var(--green)' },
              { key: 'orders',  label: 'Pesanan', color: 'var(--info)' },
            ].map(m => (
              <button
                key={m.key}
                onClick={() => setChartMode(m.key)}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12,
                  border: `1.5px solid ${chartMode === m.key ? m.color : 'var(--border)'}`,
                  background: chartMode === m.key ? m.color : 'transparent',
                  color: chartMode === m.key ? '#fff' : 'var(--muted)',
                  cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s',
                }}
              >{m.label}</button>
            ))}
          </div>
        </div>

        <BarChart
          data={monthly}
          valueKey={chartMode === 'revenue' ? 'revenue' : 'total_orders'}
          labelKey="month_name"
          color={chartMode === 'revenue' ? 'var(--green)' : 'var(--info)'}
        />

        {/* Tabel ringkasan bulanan */}
        <div style={{ marginTop: 24, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: 'var(--elevated)' }}>
                {['Bulan','Pesanan','Revenue','Gross Sales','Rata-rata/Pesanan'].map(h => (
                  <th key={h} style={{
                    padding: '8px 10px', textAlign: h === 'Bulan' ? 'left' : 'right',
                    fontWeight: 700, color: 'var(--text-2)', fontSize: 11.5,
                    borderBottom: '1px solid var(--border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthly.map((m, i) => {
                const avg     = m.total_orders > 0 ? m.revenue / m.total_orders : 0;
                const hasData = m.total_orders > 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: hasData ? 600 : 400, color: hasData ? 'var(--text)' : 'var(--muted)' }}>
                      {MONTHS_ID[i]}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: hasData ? 'var(--info)' : 'var(--muted)' }}>
                      {hasData ? m.total_orders : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: hasData ? 'var(--green)' : 'var(--muted)', fontWeight: hasData ? 700 : 400 }}>
                      {hasData ? rupiah(m.revenue) : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                      {hasData ? rupiah(m.gross_sales) : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                      {hasData ? rupiah(avg) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--green-dim)', borderTop: '2px solid var(--green)' }}>
                <td style={{ padding: '9px 10px', fontWeight: 700, color: 'var(--green)' }}>TOTAL</td>
                <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {monthly.reduce((s, m) => s + m.total_orders, 0)}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)' }}>
                  {rupiah(monthly.reduce((s, m) => s + m.revenue, 0))}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--muted)' }}>
                  {rupiah(monthly.reduce((s, m) => s + m.gross_sales, 0))}
                </td>
                <td style={{ padding: '9px 10px', textAlign: 'right', color: 'var(--muted)', fontSize: 11 }}>—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Bottom Grid: Top Plants + Category ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>

        {/* Top Tanaman */}
        <div className="card">
          <h3 style={{ marginBottom: 4 }}>Tanaman Paling Banyak Dibeli</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
            Berdasarkan jumlah unit terjual tahun {year}
          </p>

          {topPlants.length === 0 ? (
            <div className="empty" style={{ padding: '30px 0' }}>
              <div style={{ opacity: 0.35, color: 'var(--green)', marginBottom: 8 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3C12 3 6 8 6 13.5a6 6 0 0012 0C18 8 12 3 12 3z" fill="currentColor"/>
                  <path d="M12 13.5V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p style={{ fontSize: 13 }}>Belum ada data penjualan</p>
            </div>
          ) : topPlants.map((plant, i) => {
            const maxSold = Number(topPlants[0]?.total_sold || 1);
            const pct     = (Number(plant.total_sold) / maxSold) * 100;
            return (
              <div key={i} style={{
                marginBottom: 14, paddingBottom: 14,
                borderBottom: i < topPlants.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', width: 22, textAlign: 'center', color: 'var(--muted)', fontWeight: 700 }}>
                    {i < 3 ? ['#1','#2','#3'][i] : `${i + 1}`}
                  </span>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)', flexShrink: 0 }}>
                    {plant.image_url
                      ? <img src={`http://localhost:3006${plant.image_url}`} alt={plant.name} style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} onError={e => { e.target.style.display='none'; }} />
                      : <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 3C12 3 6 8 6 13.5a6 6 0 0012 0C18 8 12 3 12 3z" fill="currentColor" opacity=".7"/><path d="M12 13.5V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plant.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{plant.category_name} · {plant.order_count} pesanan</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>{rupiah(plant.revenue)}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{plant.total_sold} unit</div>
                  </div>
                </div>
                <div style={{ marginLeft: 32, height: 5, background: 'var(--elevated)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : 'var(--green)',
                    width: `${pct}%`, opacity: 0.8, transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Per Kategori */}
        <div className="card">
          <h3 style={{ marginBottom: 4 }}>Penjualan per Kategori</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
            Distribusi revenue tahun {year}
          </p>
          <DonutChart data={catSales} total={catTotal} />

          {catSales.length > 0 && (
            <div style={{ marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              {catSales.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', fontSize: 12.5,
                  padding: '5px 0',
                  borderBottom: i < catSales.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ color: 'var(--text-2)' }}>{c.icon} {c.category_name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 700,
                      color: 'var(--green)', fontSize: 13,
                    }}>{rupiah(c.revenue)}</span>
                    <span style={{ color: 'var(--muted)', marginLeft: 6, fontSize: 11 }}>
                      ({catTotal > 0 ? Math.round(Number(c.revenue) / catTotal * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
