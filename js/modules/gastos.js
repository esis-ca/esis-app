/**
 * ESIS, C.A. - MÓDULO 4: GASTOS
 * Gestión de Gastos Operativos y Administrativos Petroleros
 * Integración con Bancos, Proyectos y Cuentas por Pagar
 */

(function(window) {
  'use strict';

  const GastosModule = {
    init() {
      this.bindEvents();
      this.render();
      this.populateSelects();
      this.setupCalculations();
      window.addEventListener('esis:state-changed', () => {
        this.render();
        this.populateSelects();
      });
    },

    bindEvents() {
      const form = document.getElementById('newExpenseForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSaveExpense();
        });
      }

      const categorySelect = document.getElementById('expCategorySelect');
      if (categorySelect) {
        categorySelect.addEventListener('change', () => this.updateSubcategories());
      }

      const statusSelect = document.getElementById('expStatusSelect');
      if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
          const bankGroup = document.getElementById('expBankGroup');
          const dueGroup = document.getElementById('expDueGroup');
          if (e.target.value === 'PAGADO') {
            if (bankGroup) bankGroup.style.display = 'flex';
            if (dueGroup) dueGroup.style.display = 'none';
          } else {
            if (bankGroup) bankGroup.style.display = 'none';
            if (dueGroup) dueGroup.style.display = 'flex';
          }
        });
      }

      const projectFilter = document.getElementById('expenseProjectFilter');
      if (projectFilter) {
        projectFilter.addEventListener('change', () => this.render());
      }

      const searchInput = document.getElementById('searchExpenseInput');
      if (searchInput) {
        searchInput.addEventListener('input', () => this.render());
      }
    },

    populateSelects() {
      const store = window.EsisStore;
      const projects = store.getProjects();
      const banks = store.getBankAccounts();
      const catList = store.state.expenseCategories || [];

      // Proyectos en Formulario y Filtro
      const expPrjSelect = document.getElementById('expProjectSelect');
      if (expPrjSelect) {
        expPrjSelect.innerHTML = '<option value="">-- Seleccionar Proyecto --</option>' +
          projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      }

      const filterPrjSelect = document.getElementById('expenseProjectFilter');
      if (filterPrjSelect) {
        filterPrjSelect.innerHTML = '<option value="ALL">Todos los Proyectos</option>' +
          projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      }

      // Bancos
      const expBankSelect = document.getElementById('expBankSelect');
      if (expBankSelect) {
        expBankSelect.innerHTML = '<option value="">-- Seleccionar Banco Pagador --</option>' +
          banks.map(b => `<option value="${b.id}">${b.name} (${b.currency} - Saldo: ${b.balance.toLocaleString()})</option>`).join('');
      }

      // Categorías
      const expCatSelect = document.getElementById('expCategorySelect');
      if (expCatSelect) {
        expCatSelect.innerHTML = '<option value="">-- Seleccionar Categoría --</option>' +
          catList.map(c => `<option value="${c.category}">${c.category}</option>`).join('');
      }

      this.updateSubcategories();
    },

    updateSubcategories() {
      const catSelect = document.getElementById('expCategorySelect');
      const subcatSelect = document.getElementById('expSubcategorySelect');
      if (!catSelect || !subcatSelect) return;

      const selectedCat = catSelect.value;
      const store = window.EsisStore;
      const catObj = (store.state.expenseCategories || []).find(c => c.category === selectedCat);

      if (catObj && catObj.subcategories) {
        subcatSelect.innerHTML = catObj.subcategories.map(s => `<option value="${s}">${s}</option>`).join('');
      } else {
        subcatSelect.innerHTML = '<option value="General">General / Operativo</option>';
      }
    },

    setupCalculations() {
      const amountUSDInput = document.getElementById('expAmountUSD');
      const rateInput = document.getElementById('expRateBCV');
      const amountVESInput = document.getElementById('expAmountVES');

      const calc = () => {
        const usd = parseFloat(amountUSDInput?.value) || 0;
        const rate = parseFloat(rateInput?.value) || window.EsisStore.getRates().bcv;
        const ves = +(usd * rate).toFixed(2);
        if (amountVESInput) amountVESInput.value = ves.toLocaleString('es-VE', { minimumFractionDigits: 2 });
      };

      if (amountUSDInput) amountUSDInput.addEventListener('input', calc);
      if (rateInput) rateInput.addEventListener('input', calc);
    },

    render() {
      const tbody = document.getElementById('expensesTableBody');
      if (!tbody) return;

      const store = window.EsisStore;
      const projectFilter = document.getElementById('expenseProjectFilter')?.value || 
                            document.getElementById('globalProjectFilter')?.value || 'ALL';
      const searchTerm = document.getElementById('searchExpenseInput')?.value.toLowerCase() || '';

      let list = store.getExpenses(projectFilter);

      if (searchTerm) {
        list = list.filter(e => 
          e.supplier.toLowerCase().includes(searchTerm) ||
          e.category.toLowerCase().includes(searchTerm) ||
          e.subcategory.toLowerCase().includes(searchTerm) ||
          e.projectName.toLowerCase().includes(searchTerm) ||
          (e.invoiceNumber && e.invoiceNumber.toLowerCase().includes(searchTerm))
        );
      }

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:25px; color:var(--text-muted);">No se encontraron gastos registrados</td></tr>';
        return;
      }

      tbody.innerHTML = list.map(exp => {
        const isPaid = exp.status === 'PAGADO';
        const statusBadge = isPaid ? 'badge-paid' : 'badge-overdue';

        return `
          <tr>
            <td>${exp.date}</td>
            <td><strong>${exp.category}</strong><br><small style="color:var(--text-muted);">${exp.subcategory}</small></td>
            <td><strong>${exp.projectName}</strong></td>
            <td><strong>${exp.supplier}</strong><br><small style="color:var(--text-muted);">Fact/Ref: ${exp.invoiceNumber}</small></td>
            <td style="font-weight:800; color:var(--danger);">$ ${exp.amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="font-size:12px; color:var(--text-muted);">Bs ${exp.amountVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
            <td><small>${exp.bankName || 'N/A'}</small></td>
            <td><span class="badge-status ${statusBadge}">${exp.status}</span></td>
          </tr>
        `;
      }).join('');
    },

    handleSaveExpense() {
      try {
        const date = document.getElementById('expDate')?.value || new Date().toISOString().slice(0, 10);
        const projectId = document.getElementById('expProjectSelect')?.value;
        const category = document.getElementById('expCategorySelect')?.value;
        const subcategory = document.getElementById('expSubcategorySelect')?.value;
        const supplier = document.getElementById('expSupplier')?.value.trim();
        const invoiceNumber = document.getElementById('expInvoiceNumber')?.value.trim();
        const amountUSD = parseFloat(document.getElementById('expAmountUSD')?.value) || 0;
        const status = document.getElementById('expStatusSelect')?.value || 'PAGADO';
        const bankAccountId = document.getElementById('expBankSelect')?.value;
        const dueDate = document.getElementById('expDueDate')?.value;
        const observations = document.getElementById('expObservations')?.value.trim();

        if (!projectId || !category || !supplier || amountUSD <= 0) {
          window.ESIS_APP?.showToast('Campos Incompletos', 'Complete proyecto, categoría, proveedor y monto.', 'danger');
          return;
        }

        if (status === 'PAGADO' && !bankAccountId) {
          window.ESIS_APP?.showToast('Banco Requerido', 'Seleccione el banco pagador para un gasto pagado.', 'warning');
          return;
        }

        window.EsisStore.createExpense({
          date,
          projectId,
          category,
          subcategory,
          supplier,
          invoiceNumber,
          amountUSD,
          status,
          bankAccountId: status === 'PAGADO' ? bankAccountId : null,
          dueDate,
          observations
        });

        window.ESIS_APP?.showToast('Gasto Registrado', 'Gasto guardado y actualizado en el Dashboard' + (status === 'PENDIENTE' ? ' y Cuentas por Pagar (CxP).' : ' y Bancos.'), 'success');
        window.ESIS_APP?.closeModal('modalNewExpense');
        document.getElementById('newExpenseForm')?.reset();
        this.populateSelects();
      } catch (err) {
        window.ESIS_APP?.showToast('Error al Guardar', err.message, 'danger');
      }
    }
  };

  window.GastosModule = GastosModule;
})(typeof window !== 'undefined' ? window : this);
