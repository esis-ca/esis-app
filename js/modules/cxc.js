/**
 * ESIS, C.A. - MÓDULO 5: CUENTAS POR COBRAR (CxC)
 * Control de Cobros a Clientes Petroleros, Días de Mora Dinámicos
 * e Integración Automática con Facturación y Bancos
 */

(function(window) {
  'use strict';

  const CxCModule = {
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
      const form = document.getElementById('registerCobroForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSaveCobro();
        });
      }

      const statusFilter = document.getElementById('cxcStatusFilter');
      if (statusFilter) {
        statusFilter.addEventListener('change', () => this.render());
      }

      const searchInput = document.getElementById('searchCxCInput');
      if (searchInput) {
        searchInput.addEventListener('input', () => this.render());
      }
    },

    populateBankSelect() {
      const bankSelect = document.getElementById('cobroBankSelect');
      if (!bankSelect) return;

      const banks = window.EsisStore.getBankAccounts();
      bankSelect.innerHTML = '<option value="">-- Seleccionar Cuenta Receptora --</option>' +
        banks.map(b => `<option value="${b.id}">${b.name} (${b.currency} - Saldo Actual: ${b.balance.toLocaleString()})</option>`).join('');
    },

    render() {
      const tbody = document.getElementById('cxcTableBody');
      if (!tbody) return;

      const store = window.EsisStore;
      const projectFilter = document.getElementById('globalProjectFilter')?.value || 'ALL';
      const statusFilter = document.getElementById('cxcStatusFilter')?.value || 'ALL';
      const searchTerm = document.getElementById('searchCxCInput')?.value.toLowerCase() || '';

      let list = store.getReceivables(projectFilter);

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'VENCIDAS') {
          list = list.filter(item => item.isOverdue && item.status !== 'PAGADO');
        } else {
          list = list.filter(item => item.status === statusFilter);
        }
      }

      if (searchTerm) {
        list = list.filter(item => 
          item.clientName.toLowerCase().includes(searchTerm) ||
          item.docNumber.toLowerCase().includes(searchTerm) ||
          item.projectName.toLowerCase().includes(searchTerm)
        );
      }

      // Actualizar KPI de cabecera de CxC
      this.updateCxCSummaryCards(list);

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:25px; color:var(--text-muted);">No hay cuentas por cobrar con los filtros seleccionados</td></tr>';
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

        const canCobrar = item.status !== 'PAGADO' && item.pendingUSD > 0;

        return `
          <tr>
            <td><strong>${item.clientName}</strong><br><small style="color:var(--text-muted);">${item.clientRif}</small></td>
            <td><strong>${item.projectName}</strong></td>
            <td><code>${item.docNumber}</code></td>
            <td>${item.date}<br><small style="color:var(--text-muted);">Vence: ${item.dueDate}</small></td>
            <td style="font-weight:700;">$ ${(item.netUSD || item.totalUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="color:var(--success); font-weight:600;">$ ${(item.paidUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="color:var(--danger); font-weight:800; font-size:14px;">$ ${(item.pendingUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td>${moraBadge}<br><span class="badge-status ${statusBadge}" style="margin-top:3px;">${item.status}</span></td>
            <td>
              ${canCobrar ? `
                <button class="btn btn-sm btn-success" onclick="window.CxCModule.openCobroModal('${item.id}')">
                  💵 Cobrar
                </button>
              ` : `
                <span style="color:var(--success); font-size:12px; font-weight:700;">✓ Liquidada</span>
              `}
            </td>
          </tr>
        `;
      }).join('');
    },

    updateCxCSummaryCards(list) {
      let totalPendiente = 0;
      let totalVencido = 0;
      let totalCobrado = 0;

      list.forEach(i => {
        totalPendiente += i.pendingUSD || 0;
        totalCobrado += i.paidUSD || 0;
        if (i.isOverdue) {
          totalVencido += i.pendingUSD || 0;
        }
      });

      const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = '$ ' + val.toLocaleString('en-US', { minimumFractionDigits: 2 });
      };

      setEl('cxcSummaryPending', totalPendiente);
      setEl('cxcSummaryOverdue', totalVencido);
      setEl('cxcSummaryCollected', totalCobrado);
    },

    openCobroModal(invoiceId) {
      const invoice = (window.EsisStore.getInvoices() || []).find(i => i.id === invoiceId);
      if (!invoice) return;

      document.getElementById('cobroInvoiceId').value = invoice.id;
      document.getElementById('cobroInvoiceDoc').textContent = `${invoice.docNumber} (${invoice.clientName})`;
      document.getElementById('cobroTotalInvoice').textContent = `$ ${(invoice.netUSD || invoice.totalUSD).toFixed(2)}`;
      document.getElementById('cobroPendingAmount').textContent = `$ ${(invoice.pendingUSD || 0).toFixed(2)}`;
      
      const amountInput = document.getElementById('cobroAmountUSD');
      if (amountInput) amountInput.value = (invoice.pendingUSD || 0).toFixed(2);

      const dateInput = document.getElementById('cobroDate');
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

      window.ESIS_APP?.openModal('modalRegisterCobro');
    },

    handleSaveCobro() {
      try {
        const invoiceId = document.getElementById('cobroInvoiceId')?.value;
        const amountUSD = parseFloat(document.getElementById('cobroAmountUSD')?.value) || 0;
        const bankAccountId = document.getElementById('cobroBankSelect')?.value;
        const reference = document.getElementById('cobroReference')?.value.trim();
        const date = document.getElementById('cobroDate')?.value;
        const notes = document.getElementById('cobroNotes')?.value.trim();

        if (!invoiceId || amountUSD <= 0 || !bankAccountId || !reference) {
          window.ESIS_APP?.showToast('Campos Requeridos', 'Ingrese monto a abonar, cuenta bancaria receptora y referencia.', 'danger');
          return;
        }

        const result = window.EsisStore.registerCobro(invoiceId, amountUSD, bankAccountId, reference, date, notes);

        window.ESIS_APP?.showToast('Cobro Registrado', `Se procesó abono de $${amountUSD.toFixed(2)} a la factura ${result.invoice.docNumber} con ingreso en banco.`, 'success');
        window.ESIS_APP?.closeModal('modalRegisterCobro');
        document.getElementById('registerCobroForm')?.reset();
      } catch (err) {
        window.ESIS_APP?.showToast('Error en Cobro', err.message, 'danger');
      }
    }
  };

  window.CxCModule = CxCModule;
})(typeof window !== 'undefined' ? window : this);
