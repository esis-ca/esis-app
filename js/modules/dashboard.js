/**
 * ESIS, C.A. - MÓDULO 1: DASHBOARD (PANEL PRINCIPAL)
 * Indicadores Financieros, KPI en USD y Bs, Gráficos y Rentabilidad
 */

(function(window) {
  'use strict';

  let chartInstances = {};

  const DashboardModule = {
    init() {
      this.render();
      window.addEventListener('esis:state-changed', () => this.render());
    },

    render() {
      const activeProjectFilter = document.getElementById('globalProjectFilter')?.value || 'ALL';
      const activeClientFilter = document.getElementById('dashboardClientFilter')?.value || 'ALL';

      const metrics = window.EsisStore.getDashboardMetrics(activeProjectFilter, activeClientFilter);
      this.renderKPIs(metrics);
      this.renderBankCards(metrics.bankAccounts, metrics.rates);
      this.renderProfitabilityTable(metrics.projectProfitability);
      this.renderCharts(metrics);
    },

    renderKPIs(metrics) {
      // 1. Total Facturado
      this.setCardValues('kpi-facturado', metrics.totalFacturadoUSD, metrics.totalFacturadoVES);
      // 2. Total Cobrado
      this.setCardValues('kpi-cobrado', metrics.totalCobradoUSD, metrics.totalCobradoVES);
      // 3. Total Por Cobrar (CxC)
      this.setCardValues('kpi-por-cobrar', metrics.totalPorCobrarUSD, metrics.totalPorCobrarVES);
      // 4. Total Gastos
      this.setCardValues('kpi-gastos', metrics.totalGastosUSD, metrics.totalGastosVES);
      // 5. Total Por Pagar (CxP)
      this.setCardValues('kpi-por-pagar', metrics.totalPorPagarUSD, metrics.totalPorPagarVES);
      // 6. Flujo de Caja Neto
      this.setCardValues('kpi-flujo-caja', metrics.netCashFlowUSD, metrics.netCashFlowVES, true);
    },

    setCardValues(elementId, usd, ves, isCashFlow = false) {
      const card = document.getElementById(elementId);
      if (!card) return;

      const usdEl = card.querySelector('.kpi-value-usd');
      const vesEl = card.querySelector('.kpi-value-bs');

      if (usdEl) {
        usdEl.textContent = (usd >= 0 ? '$ ' : '-$ ') + Math.abs(usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (isCashFlow) {
          usdEl.style.color = usd >= 0 ? 'var(--success)' : 'var(--danger)';
        }
      }
      if (vesEl) {
        vesEl.textContent = 'Bs ' + Math.abs(ves).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    },

    renderBankCards(bankAccounts, rates) {
      const container = document.getElementById('dashboardBankSummary');
      if (!container) return;

      const cardsHtml = bankAccounts.map(acc => {
        let cardClass = 'binance';
        let currencySymbol = 'USDT';
        let equivText = '';

        if (acc.id === 'ACC-BINANCE') {
          cardClass = 'binance';
          currencySymbol = 'USDT';
          const inBs = acc.balance * rates.usdt;
          equivText = `≈ Bs ${inBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
        } else if (acc.id === 'ACC-BDV') {
          cardClass = 'bdv';
          currencySymbol = 'Bs';
          const inUSD = acc.balance / rates.bcv;
          equivText = `≈ $ ${inUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Tasa BCV)`;
        } else if (acc.id === 'ACC-BANESCO') {
          cardClass = 'banesco';
          currencySymbol = 'Bs';
          const inUSD = acc.balance / rates.bcv;
          equivText = `≈ $ ${inUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Tasa BCV)`;
        }

        return `
          <div class="bank-card ${cardClass}">
            <div class="bank-card-top">
              <span class="bank-card-title">${acc.name}</span>
              <span class="bank-card-badge">${acc.currency}</span>
            </div>
            <div class="bank-card-balance">
              <span class="amount">${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span class="currency">${currencySymbol}</span>
            </div>
            <div class="bank-card-equiv">${equivText}</div>
          </div>
        `;
      }).join('');

      container.innerHTML = cardsHtml;
    },

    renderProfitabilityTable(profitabilityList) {
      const tbody = document.getElementById('profitabilityTableBody');
      if (!tbody) return;

      if (!profitabilityList || profitabilityList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--text-muted);">No hay proyectos registrados</td></tr>';
        return;
      }

      tbody.innerHTML = profitabilityList.map(p => {
        const marginColor = p.marginUSD >= 0 ? 'var(--success)' : 'var(--danger)';
        const marginBadge = p.marginPercent >= 25 ? 'badge-paid' : (p.marginPercent > 0 ? 'badge-pending' : 'badge-overdue');

        return `
          <tr>
            <td><strong>${p.name}</strong><br><small style="color:var(--text-muted);">${p.client || 'Cliente General'}</small></td>
            <td>$ ${p.budgetUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="color:var(--primary); font-weight:700;">$ ${p.revenueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="color:var(--danger); font-weight:600;">$ ${p.costUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="color:${marginColor}; font-weight:800;">$ ${p.marginUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td><span class="badge-status ${marginBadge}">${p.marginPercent}%</span></td>
            <td><span class="badge-status badge-neutral">${p.status}</span></td>
          </tr>
        `;
      }).join('');
    },

    renderCharts(metrics) {
      if (typeof Chart === 'undefined') return;

      // 1. Gráfico de Facturación vs Cobros
      const ctx1 = document.getElementById('chartBillingVsIncome');
      if (ctx1) {
        if (chartInstances.billing) chartInstances.billing.destroy();
        chartInstances.billing = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: ['Total Facturado', 'Total Cobrado (Ingresos)', 'Total Gastos'],
            datasets: [{
              label: 'Monto USD',
              data: [metrics.totalFacturadoUSD, metrics.totalCobradoUSD, metrics.totalGastosUSD],
              backgroundColor: ['#0b2545', '#10b981', '#ef4444'],
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `$ ${context.raw.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => '$ ' + value.toLocaleString()
                }
              }
            }
          }
        });
      }

      // 2. Gráfico de Gastos por Categoría
      const ctx2 = document.getElementById('chartExpensesCategory');
      if (ctx2) {
        if (chartInstances.expenses) chartInstances.expenses.destroy();

        const expenses = window.EsisStore.getExpenses();
        const catMap = {};
        expenses.forEach(e => {
          catMap[e.category] = (catMap[e.category] || 0) + (e.amountUSD || 0);
        });

        const labels = Object.keys(catMap);
        const dataValues = Object.values(catMap);

        chartInstances.expenses = new Chart(ctx2, {
          type: 'doughnut',
          data: {
            labels: labels.length ? labels : ['Sin Gastos'],
            datasets: [{
              data: dataValues.length ? dataValues : [1],
              backgroundColor: ['#0284c7', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#ec4899']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
              tooltip: {
                callbacks: {
                  label: (context) => ` $ ${context.raw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                }
              }
            }
          }
        });
      }
    }
  };

  window.DashboardModule = DashboardModule;
})(typeof window !== 'undefined' ? window : this);
