/**
 * ESIS, C.A. - MÓDULO 6: CUENTAS POR PAGAR (CxP)
 * Gestión de Pasivos y Facturas de Proveedores Petroleros
 * Días de Mora, Control de Vencimientos y Emisión de Pagos Bancarios
 */

(function(window) {
  'use strict';

  const CxPModule = {
    init() {
      this.bindEvents();
      this.render();
      this.populateBankSelect();
      window.addEventListener('esis:state-changed', () => {
        this.render();
        this.populateBankSelect();
      });
    },

    bindEvents() {
      const form = document.getElementById('registerPagoForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSavePago();
        });
      }

      const statusFilter = document.getElementById('cxpStatusFilter');
      if (statusFilter) {
        statusFilter.addEventListener('change', () => this.render());
      }

      const searchInput = document.getElementById('searchCxPInput');
      if (searchInput) {
        searchInput.addEventListener('input', () => this.render());
      }
    },

    populateBankSelect() {
      const bankSelect = document.getElementById('pagoBankSelect');
      if (!bankSelect) return;

      const banks = window.EsisStore.getBankAccounts();
      bankSelect.innerHTML = '<option value="">-- Seleccionar Cuenta Pagadora --</option>' +
        banks.map(b => `<option value="${b.id}">${b.name} (${b.currency} - Saldo: ${b.balance.toLocaleString()})</option>`).join('');
    },

    render() {
      const tbody = document.getElementById('cxpTableBody');
      if (!tbody) return;

      const store = window.EsisStore;
      const projectFilter = document.getElementById('globalProjectFilter')?.value || 'ALL';
      const statusFilter = document.getElementById('cxpStatusFilter')?.value || 'ALL';
      const searchTerm = document.getElementById('searchCxPInput')?.value.toLowerCase() || '';

      let list = store.getPayables(projectFilter);

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'VENCIDAS') {
          list = list.filter(item => item.isOverdue && item.status !== 'PAGADO');
        } else {
          list = list.filter(item => item.status === statusFilter);
        }
      }

      if (searchTerm) {
        list = list.filter(item => 
          item.supplier.toLowerCase().includes(searchTerm) ||
          item.invoiceNumber.toLowerCase().includes(searchTerm) ||
          item.projectName.toLowerCase().includes(searchTerm)
        );
      }

      this.updateCxPSummaryCards(list);

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:25px; color:var(--text-muted);">No hay cuentas por pagar registradas</td></tr>';
        return;
      }

      tbody.innerHTML = list.map(item => {
        let statusBadge = 'badge-pending';
        if (item.status === 'PAGADO') statusBadge = 'badge-paid';
        else if (item.status === 'PARCIAL') statusBadge = 'badge-partial';

        let moraBadge = '<span class="badge-status badge-paid">Al Día</span>';
        if (item.isOverdue) {
          moraBadge = `<span class="badge-status badge-overdue">⚠️ ${item.overdueDays} Días</span>`;
        }

        const canPagar = item.status !== 'PAGADO' && item.pendingUSD > 0;

        return `
          <tr>
            <td><strong>${item.supplier}</strong><br><small style="color:var(--text-muted);">${item.rif}</small></td>
            <td><strong>${item.projectName}</strong></td>
            <td><code>${item.invoiceNumber}</code></td>
            <td>${item.issueDate}<br><small style="color:var(--text-muted);">Vence: ${item.dueDate}</small></td>
            <td style="font-weight:700;">$ ${item.amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="color:var(--success); font-weight:600;">$ ${(item.paidUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="color:var(--danger); font-weight:800; font-size:14px;">$ ${(item.pendingUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td>${moraBadge}<br><span class="badge-status ${statusBadge}" style="margin-top:3px;">${item.status}</span></td>
            <td>
              ${canPagar ? `
                <button class="btn btn-sm btn-danger" onclick="window.CxPModule.openPagoModal('${item.id}')">
                  💳 Pagar
                </button>
              ` : `
                <span style="color:var(--success); font-size:12px; font-weight:700;">✓ Cancelado</span>
              `}
            </td>
          </tr>
        `;
      }).join('');
    },

    updateCxPSummaryCards(list) {
      let totalPendiente = 0;
      let totalVencido = 0;
      let totalPagado = 0;

      list.forEach(i => {
        totalPendiente += i.pendingUSD || 0;
        totalPagado += i.paidUSD || 0;
        if (i.isOverdue) {
          totalVencido += i.pendingUSD || 0;
        }
      });

      const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = '$ ' + val.toLocaleString('en-US', { minimumFractionDigits: 2 });
      };

      setEl('cxpSummaryPending', totalPendiente);
      setEl('cxpSummaryOverdue', totalVencido);
      setEl('cxpSummaryPaid', totalPagado);
    },

    openPagoModal(payableId) {
      const payable = (window.EsisStore.getPayables() || []).find(p => p.id === payableId);
      if (!payable) return;

      document.getElementById('pagoPayableId').value = payable.id;
      document.getElementById('pagoSupplierName').textContent = `${payable.supplier} (Fact: ${payable.invoiceNumber})`;
      document.getElementById('pagoTotalAmount').textContent = `$ ${payable.amountUSD.toFixed(2)}`;
      document.getElementById('pagoPendingAmount').textContent = `$ ${(payable.pendingUSD || 0).toFixed(2)}`;

      const amountInput = document.getElementById('pagoAmountUSD');
      if (amountInput) amountInput.value = (payable.pendingUSD || 0).toFixed(2);

      const dateInput = document.getElementById('pagoDate');
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

      window.ESIS_APP?.openModal('modalRegisterPago');
    },

    handleSavePago() {
      try {
        const payableId = document.getElementById('pagoPayableId')?.value;
        const amountUSD = parseFloat(document.getElementById('pagoAmountUSD')?.value) || 0;
        const bankAccountId = document.getElementById('pagoBankSelect')?.value;
        const reference = document.getElementById('pagoReference')?.value.trim();
        const date = document.getElementById('pagoDate')?.value;
        const notes = document.getElementById('pagoNotes')?.value.trim();

        if (!payableId || amountUSD <= 0 || !bankAccountId || !reference) {
          window.ESIS_APP?.showToast('Campos Requeridos', 'Ingrese monto a pagar, cuenta bancaria pagadora y número de referencia.', 'danger');
          return;
        }

        const result = window.EsisStore.registerPagoCxP(payableId, amountUSD, bankAccountId, reference, date, notes);

        window.ESIS_APP?.showToast('Pago Registrado', `Se procesó pago de $${amountUSD.toFixed(2)} a ${result.payable.supplier} con débito bancario.`, 'success');
        window.ESIS_APP?.closeModal('modalRegisterPago');
        document.getElementById('registerPagoForm')?.reset();
      } catch (err) {
        window.ESIS_APP?.showToast('Error en Pago', err.message, 'danger');
      }
    }
  };

  window.CxPModule = CxPModule;
})(typeof window !== 'undefined' ? window : this);
