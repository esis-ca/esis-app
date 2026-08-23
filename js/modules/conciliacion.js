/**
 * ESIS, C.A. - MÓDULO 7: CONCILIACIÓN BANCARIA
 * Conciliación de Cuentas, Comparación con Extractos Bancarios,
 * Control de Diferencias y Reportes Mensuales de Auditoría
 */

(function(window) {
  'use strict';

  const ConciliacionModule = {
    init() {
      this.bindEvents();
      this.populateSelects();
      this.render();
      window.addEventListener('esis:state-changed', () => {
        this.populateSelects();
        this.render();
      });
    },

    bindEvents() {
      const accountSelect = document.getElementById('concilAccountSelect');
      if (accountSelect) {
        accountSelect.addEventListener('change', () => this.render());
      }

      const periodSelect = document.getElementById('concilPeriodSelect');
      if (periodSelect) {
        periodSelect.addEventListener('change', () => this.render());
      }

      const statementInput = document.getElementById('concilStatementInput');
      if (statementInput) {
        statementInput.addEventListener('input', () => this.calculateDiscrepancy());
      }

      const saveBtn = document.getElementById('btnSaveReconciliation');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => this.handleSaveAudit());
      }
    },

    populateSelects() {
      const accountSelect = document.getElementById('concilAccountSelect');
      if (!accountSelect) return;

      const banks = window.EsisStore.getBankAccounts();
      const currentVal = accountSelect.value || 'ACC-BINANCE';
      accountSelect.innerHTML = banks.map(b => `<option value="${b.id}" ${b.id === currentVal ? 'selected' : ''}>${b.name} (${b.currency})</option>`).join('');

      // Períodos (Meses)
      const periodSelect = document.getElementById('concilPeriodSelect');
      if (periodSelect && periodSelect.options.length <= 1) {
        const months = [
          { val: '2026-08', label: 'Agosto 2026' },
          { val: '2026-07', label: 'Julio 2026' },
          { val: '2026-06', label: 'Junio 2026' }
        ];
        periodSelect.innerHTML = months.map(m => `<option value="${m.val}">${m.label}</option>`).join('');
      }
    },

    render() {
      const accountId = document.getElementById('concilAccountSelect')?.value || 'ACC-BINANCE';
      const period = document.getElementById('concilPeriodSelect')?.value || '2026-08';

      const data = window.EsisStore.getReconciliationData(accountId, period);
      if (!data) return;

      // Actualizar tarjeta de saldos
      const bookEl = document.getElementById('concilBookBalance');
      if (bookEl) {
        bookEl.textContent = `${data.bank.currency} ${data.bookBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      // Si el input de extracto está vacío, sugerir el saldo contable
      const statementInput = document.getElementById('concilStatementInput');
      if (statementInput && !statementInput.dataset.manual) {
        statementInput.value = data.bookBalance.toFixed(2);
      }

      this.calculateDiscrepancy();
      this.renderTable(data);
      this.renderAuditHistory();
    },

    calculateDiscrepancy() {
      const accountId = document.getElementById('concilAccountSelect')?.value || 'ACC-BINANCE';
      const period = document.getElementById('concilPeriodSelect')?.value || '2026-08';
      const data = window.EsisStore.getReconciliationData(accountId, period);
      if (!data) return;

      const statementVal = parseFloat(document.getElementById('concilStatementInput')?.value) || 0;
      const difference = +(statementVal - data.bookBalance).toFixed(2);

      const diffEl = document.getElementById('concilDifference');
      const bannerEl = document.getElementById('concilStatusBanner');

      if (diffEl) {
        diffEl.textContent = `${data.bank.currency} ${difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        diffEl.style.color = Math.abs(difference) < 0.01 ? 'var(--success)' : 'var(--danger)';
      }

      if (bannerEl) {
        if (Math.abs(difference) < 0.01) {
          bannerEl.className = 'card';
          bannerEl.style.backgroundColor = 'var(--success-light)';
          bannerEl.style.borderColor = 'var(--success)';
          bannerEl.innerHTML = `<strong style="color:var(--success-dark);">✓ CONCILIACIÓN PERFECTA:</strong> El saldo en libros contables coincide con el extracto bancario. Sin partidas discrepantes.`;
        } else {
          bannerEl.className = 'card';
          bannerEl.style.backgroundColor = 'var(--danger-light)';
          bannerEl.style.borderColor = 'var(--danger)';
          bannerEl.innerHTML = `<strong style="color:var(--danger-dark);">⚠️ EXISTE DIFERENCIA:</strong> Discrepancia de ${data.bank.currency} ${Math.abs(difference).toLocaleString('en-US', { minimumFractionDigits: 2 })}. Verifique cheques en tránsito o depósitos pendientes.`;
        }
      }
    },

    renderTable(data) {
      const tbody = document.getElementById('concilTableBody');
      if (!tbody) return;

      if (data.allTx.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:25px; color:var(--text-muted);">No hay movimientos registrados para esta cuenta en el período seleccionado.</td></tr>';
        return;
      }

      tbody.innerHTML = data.allTx.map(tx => {
        const isConciliated = tx.conciliated;
        const statusBadge = isConciliated ? 'badge-paid' : 'badge-pending';
        const typeBadge = tx.type === 'INGRESO' ? 'badge-paid' : (tx.type === 'EGRESO' ? 'badge-overdue' : 'badge-neutral');

        return `
          <tr style="${isConciliated ? 'background-color:rgba(16,185,129,0.04);' : ''}">
            <td style="text-align:center;">
              <input type="checkbox" ${isConciliated ? 'checked' : ''} onchange="window.ConciliacionModule.toggleItem('${tx.id}')" style="width:18px; height:18px; cursor:pointer;">
            </td>
            <td>${tx.date}</td>
            <td><span class="badge-status ${typeBadge}">${tx.type}</span></td>
            <td><code>${tx.reference}</code></td>
            <td><strong>${tx.party}</strong><br><small style="color:var(--text-muted);">${tx.description}</small></td>
            <td style="font-weight:700; text-align:right;">${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${tx.currency}</td>
            <td><span class="badge-status ${statusBadge}">${isConciliated ? 'Conciliado' : 'Pendiente'}</span></td>
          </tr>
        `;
      }).join('');
    },

    toggleItem(txId) {
      window.EsisStore.toggleTransactionConciliation(txId);
      this.render();
    },

    renderAuditHistory() {
      const tbody = document.getElementById('concilAuditHistoryBody');
      if (!tbody) return;

      const history = window.EsisStore.state.reconciliations || [];
      if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:15px; color:var(--text-muted);">No hay cierres de conciliación archivados</td></tr>';
        return;
      }

      tbody.innerHTML = history.map(rec => {
        const statusBadge = rec.status === 'CONCILIADO' ? 'badge-paid' : 'badge-overdue';
        return `
          <tr>
            <td><strong>${rec.period}</strong></td>
            <td>${rec.date}</td>
            <td><strong>${rec.bankName}</strong></td>
            <td>$ ${rec.bookBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td>$ ${rec.statementBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="font-weight:700; color:${Math.abs(rec.difference) < 0.01 ? 'var(--success)' : 'var(--danger)'};">$ ${rec.difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td><span class="badge-status ${statusBadge}">${rec.status}</span></td>
          </tr>
        `;
      }).join('');
    },

    handleSaveAudit() {
      const accountId = document.getElementById('concilAccountSelect')?.value || 'ACC-BINANCE';
      const period = document.getElementById('concilPeriodSelect')?.value || '2026-08';
      const data = window.EsisStore.getReconciliationData(accountId, period);
      if (!data) return;

      const statementVal = parseFloat(document.getElementById('concilStatementInput')?.value) || 0;
      const difference = +(statementVal - data.bookBalance).toFixed(2);

      const newAudit = window.EsisStore.saveReconciliationAudit({
        period,
        accountId,
        bankName: data.bank.name,
        bookBalance: data.bookBalance,
        statementBalance: statementVal,
        difference: difference,
        auditor: 'Auditoría Administrativa ESIS C.A.',
        notes: `Cierre mensual de cuenta ${data.bank.name} para el período ${period}.`
      });

      window.ESIS_APP?.showToast('Auditoría Guardada', `Reporte de conciliación ${newAudit.period} guardado en el archivo histórico.`, 'success');
      this.renderAuditHistory();
    },

    printReconciliationReport() {
      const accountId = document.getElementById('concilAccountSelect')?.value || 'ACC-BINANCE';
      const period = document.getElementById('concilPeriodSelect')?.value || '2026-08';
      const data = window.EsisStore.getReconciliationData(accountId, period);
      if (!data) return;

      const statementVal = parseFloat(document.getElementById('concilStatementInput')?.value) || 0;
      const difference = +(statementVal - data.bookBalance).toFixed(2);

      const modalContainer = document.getElementById('printableAuditContainer');
      if (!modalContainer) return;

      modalContainer.innerHTML = `
        <div class="printable-invoice" id="reconciliationReportSheet">
          <div class="invoice-header-grid">
            <div class="invoice-company-info">
              <h2>ESIS, C.A.</h2>
              <p><strong>INFORME DE CONCILIACIÓN BANCARIA MENSUAL</strong></p>
              <p>Seguridad Petrolera, Industrial y Comercial | RIF: J-40891234-5</p>
            </div>
            <div class="invoice-meta-box">
              <p><strong>Período:</strong> ${period}</p>
              <p><strong>Fecha de Emisión:</strong> ${new Date().toISOString().slice(0, 10)}</p>
              <p><strong>Cuenta:</strong> ${data.bank.name}</p>
              <p><strong>Moneda:</strong> ${data.bank.currency}</p>
            </div>
          </div>

          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:16px; border-radius:6px; margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
            <div>
              <p style="font-size:12px; color:#475569;">Saldo según Libros (Sistema)</p>
              <h3 style="color:#0b2545;">${data.bank.currency} ${data.bookBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div>
              <p style="font-size:12px; color:#475569;">Saldo según Extracto Bancario</p>
              <h3 style="color:#0284c7;">${data.bank.currency} ${statementVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div>
              <p style="font-size:12px; color:#475569;">Diferencia Neta</p>
              <h3 style="color:${Math.abs(difference) < 0.01 ? '#10b981' : '#ef4444'};">${data.bank.currency} ${difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <h4>Detalle de Partidas (${data.allTx.length} Registros)</h4>
          <table class="invoice-summary-table" style="width:100%; border:1px solid #cbd5e1; margin-top:8px;">
            <thead>
              <tr style="background:#0b2545; color:white; font-size:12px;">
                <th style="padding:6px;">Fecha</th>
                <th style="padding:6px;">Tipo</th>
                <th style="padding:6px;">Referencia</th>
                <th style="padding:6px;">Tercero / Descripción</th>
                <th style="padding:6px; text-align:right;">Monto</th>
                <th style="padding:6px; text-align:center;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${data.allTx.map(t => `
                <tr style="font-size:12px; border-bottom:1px solid #e2e8f0;">
                  <td style="padding:6px;">${t.date}</td>
                  <td style="padding:6px;">${t.type}</td>
                  <td style="padding:6px;">${t.reference}</td>
                  <td style="padding:6px;">${t.party} - ${t.description}</td>
                  <td style="padding:6px; text-align:right; font-weight:600;">${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${t.currency}</td>
                  <td style="padding:6px; text-align:center;">${t.conciliated ? 'CONCILIADO' : 'PENDIENTE'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top:40px; display:grid; grid-template-columns:1fr 1fr; gap:40px; text-align:center;">
            <div style="border-top:1px solid #000; padding-top:8px;">
              <p><strong>Elaborado por:</strong></p>
              <p>Departamento de Administración y Tesorería</p>
              <p style="font-size:11px; color:#64748b;">ESIS, C.A.</p>
            </div>
            <div style="border-top:1px solid #000; padding-top:8px;">
              <p><strong>Revisado y Aprobado por:</strong></p>
              <p>Auditoría Interna y Contabilidad Fiscal</p>
              <p style="font-size:11px; color:#64748b;">ESIS, C.A.</p>
            </div>
          </div>
        </div>
      `;

      window.ESIS_APP?.openModal('modalPrintAuditReport');
    }
  };

  window.ConciliacionModule = ConciliacionModule;
})(typeof window !== 'undefined' ? window : this);
