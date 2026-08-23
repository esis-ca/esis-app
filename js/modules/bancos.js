/**
 * ESIS, C.A. - MÓDULO 3: BANCOS
 * Gestión de 3 Cuentas (Binance USDT, Banco de Venezuela Bs, Banesco JM Bs)
 * Movimientos, Cambio de Divisas USDT -> Bs, y Conciliación
 */

(function(window) {
  'use strict';

  const BancosModule = {
    init() {
      this.bindEvents();
      this.render();
      this.populateSelects();
      window.addEventListener('esis:state-changed', () => {
        this.render();
        this.populateSelects();
      });
    },

    bindEvents() {
      // Formulario nuevo movimiento
      const newTxForm = document.getElementById('newBankTxForm');
      if (newTxForm) {
        newTxForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSaveTransaction();
        });
      }

      // Formulario cambio de divisas USDT -> Bs
      const exchangeForm = document.getElementById('currencyExchangeForm');
      if (exchangeForm) {
        exchangeForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleExchangeCurrency();
        });
      }

      // Filtros
      const accountFilter = document.getElementById('bankAccountFilter');
      if (accountFilter) {
        accountFilter.addEventListener('change', () => this.renderTransactionsTable());
      }

      const searchInput = document.getElementById('searchBankTxInput');
      if (searchInput) {
        searchInput.addEventListener('input', () => this.renderTransactionsTable());
      }

      // Cálculo dinámico en el modal de cambio de divisas
      const usdtAmountInput = document.getElementById('exchangeUsdtAmount');
      const usdtRateInput = document.getElementById('exchangeRateInput');
      const calcExchange = () => {
        const amount = parseFloat(usdtAmountInput?.value) || 0;
        const rate = parseFloat(usdtRateInput?.value) || window.EsisStore.getRates().usdt;
        const result = +(amount * rate).toFixed(2);
        const resultEl = document.getElementById('exchangeBsResult');
        if (resultEl) resultEl.value = result.toLocaleString('es-VE', { minimumFractionDigits: 2 });
      };

      if (usdtAmountInput) usdtAmountInput.addEventListener('input', calcExchange);
      if (usdtRateInput) usdtRateInput.addEventListener('input', calcExchange);
    },

    populateSelects() {
      const store = window.EsisStore;
      const bankAccounts = store.getBankAccounts();
      const projects = store.getProjects();

      // Selector de cuenta en movimiento nuevo
      const accSelect = document.getElementById('bankTxAccountSelect');
      if (accSelect) {
        accSelect.innerHTML = bankAccounts.map(b => `<option value="${b.id}">${b.name} (${b.currency})</option>`).join('');
      }

      // Selector de cuenta destino en cambio de divisas (solo cuentas en Bs)
      const destSelect = document.getElementById('exchangeDestAccountSelect');
      if (destSelect) {
        const bsAccounts = bankAccounts.filter(b => b.currency === 'VES');
        destSelect.innerHTML = bsAccounts.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
      }

      // Selector de proyectos
      const prjSelect = document.getElementById('bankTxProjectSelect');
      if (prjSelect) {
        prjSelect.innerHTML = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      }

      // Prellenar tasa USDT
      const rateInput = document.getElementById('exchangeRateInput');
      if (rateInput && !rateInput.value) {
        rateInput.value = store.getRates().usdt.toFixed(2);
      }
    },

    render() {
      this.renderAccountCards();
      this.renderTransactionsTable();
    },

    renderAccountCards() {
      const container = document.getElementById('bankModuleCards');
      if (!container) return;

      const store = window.EsisStore;
      const bankAccounts = store.getBankAccounts();
      const rates = store.getRates();

      container.innerHTML = bankAccounts.map(acc => {
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
            <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center; font-size:11px; opacity:0.85;">
              <span>${acc.accountNumber}</span>
              <span>${acc.type}</span>
            </div>
          </div>
        `;
      }).join('');
    },

    renderTransactionsTable() {
      const tbody = document.getElementById('bankTransactionsTableBody');
      if (!tbody) return;

      const store = window.EsisStore;
      const accountFilter = document.getElementById('bankAccountFilter')?.value || 'ALL';
      const projectFilter = document.getElementById('globalProjectFilter')?.value || 'ALL';
      const searchTerm = document.getElementById('searchBankTxInput')?.value.toLowerCase() || '';

      let list = store.getBankTransactions(accountFilter, projectFilter);

      if (searchTerm) {
        list = list.filter(t => 
          t.reference.toLowerCase().includes(searchTerm) ||
          (t.party && t.party.toLowerCase().includes(searchTerm)) ||
          (t.description && t.description.toLowerCase().includes(searchTerm)) ||
          t.type.toLowerCase().includes(searchTerm)
        );
      }

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:25px; color:var(--text-muted);">No se encontraron movimientos bancarios</td></tr>';
        return;
      }

      const bankMap = {};
      store.getBankAccounts().forEach(b => { bankMap[b.id] = b.name; });

      tbody.innerHTML = list.map(tx => {
        let typeBadge = 'badge-neutral';
        let amountColor = 'var(--text-main)';
        let sign = '';

        if (tx.type === 'INGRESO') {
          typeBadge = 'badge-paid';
          amountColor = 'var(--success)';
          sign = '+ ';
        } else if (tx.type === 'EGRESO' || tx.type === 'PAGO' || tx.type === 'COMPRA') {
          typeBadge = 'badge-overdue';
          amountColor = 'var(--danger)';
          sign = '- ';
        } else if (tx.type === 'CAMBIO_DIVISAS') {
          typeBadge = 'badge-partial';
          amountColor = 'var(--secondary)';
          sign = '⇄ ';
        }

        const isConciliated = tx.conciliated;
        const conciliatedBadge = isConciliated 
          ? '<span class="badge-status badge-paid" style="cursor:pointer;" onclick="window.BancosModule.toggleConciliate(\''+tx.id+'\')">✓ Conciliado</span>'
          : '<span class="badge-status badge-pending" style="cursor:pointer;" onclick="window.BancosModule.toggleConciliate(\''+tx.id+'\')">⏳ Pendiente</span>';

        return `
          <tr>
            <td>${tx.date}</td>
            <td><span class="badge-status ${typeBadge}">${tx.type}</span></td>
            <td><strong>${bankMap[tx.accountId] || tx.accountId}</strong>${tx.destinationAccountId ? '<br><small style="color:var(--secondary);">➔ ' + (bankMap[tx.destinationAccountId] || tx.destinationAccountId) + '</small>' : ''}</td>
            <td><code>${tx.reference}</code></td>
            <td><strong>${tx.party}</strong><br><small style="color:var(--text-muted);">${tx.description}</small></td>
            <td style="font-weight:800; color:${amountColor};">${sign}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${tx.currency}</td>
            <td style="font-size:12px; color:var(--text-muted);">$ ${tx.amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}<br>Bs ${tx.amountVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
            <td>${conciliatedBadge}</td>
          </tr>
        `;
      }).join('');
    },

    handleSaveTransaction() {
      try {
        const type = document.getElementById('bankTxTypeSelect')?.value;
        const accountId = document.getElementById('bankTxAccountSelect')?.value;
        const project = document.getElementById('bankTxProjectSelect')?.value;
        const reference = document.getElementById('bankTxReference')?.value.trim();
        const party = document.getElementById('bankTxParty')?.value.trim();
        const amount = parseFloat(document.getElementById('bankTxAmount')?.value) || 0;
        const date = document.getElementById('bankTxDate')?.value;
        const description = document.getElementById('bankTxDescription')?.value.trim();
        const isExpense = document.getElementById('bankTxIsExpense')?.checked;
        const category = document.getElementById('bankTxCategorySelect')?.value || 'Operaciones de Seguridad & Custodia';

        if (!type || !accountId || amount <= 0) {
          window.ESIS_APP?.showToast('Campos Inválidos', 'Seleccione cuenta, tipo y monto válido.', 'danger');
          return;
        }

        const bank = window.EsisStore.getBankAccounts().find(b => b.id === accountId);

        window.EsisStore.addBankTransaction({
          type,
          subType: isExpense ? 'GASTO' : 'NORMAL',
          autoExpense: isExpense,
          accountId,
          project,
          reference,
          party,
          amount,
          currency: bank ? bank.currency : 'USD',
          date,
          description,
          category
        });

        window.ESIS_APP?.showToast('Movimiento Registrado', 'Transacción guardada exitosamente' + (isExpense ? ' y sincronizada con Gastos.' : '.'), 'success');
        window.ESIS_APP?.closeModal('modalNewBankTx');
        document.getElementById('newBankTxForm')?.reset();
      } catch (err) {
        window.ESIS_APP?.showToast('Error', err.message, 'danger');
      }
    },

    handleExchangeCurrency() {
      try {
        const usdtAmount = parseFloat(document.getElementById('exchangeUsdtAmount')?.value) || 0;
        const destAccountId = document.getElementById('exchangeDestAccountSelect')?.value;
        const rate = parseFloat(document.getElementById('exchangeRateInput')?.value) || window.EsisStore.getRates().usdt;
        const reference = document.getElementById('exchangeReference')?.value.trim() || `P2P-${Math.floor(Math.random()*900000+100000)}`;
        const buyer = document.getElementById('exchangeBuyerParty')?.value.trim() || 'Comprador P2P Verificado';
        const date = document.getElementById('exchangeDate')?.value || new Date().toISOString().slice(0, 10);

        if (usdtAmount <= 0 || !destAccountId) {
          window.ESIS_APP?.showToast('Error', 'Ingrese un monto en USDT y seleccione cuenta destino.', 'danger');
          return;
        }

        // Verificar saldo suficiente en Binance
        const binance = window.EsisStore.getBankAccounts().find(b => b.id === 'ACC-BINANCE');
        if (binance && binance.balance < usdtAmount) {
          window.ESIS_APP?.showToast('Saldo Insuficiente', `Saldo en Binance: ${binance.balance.toFixed(2)} USDT`, 'danger');
          return;
        }

        const totalVES = +(usdtAmount * rate).toFixed(2);

        window.EsisStore.addBankTransaction({
          type: 'CAMBIO_DIVISAS',
          accountId: 'ACC-BINANCE',
          destinationAccountId: destAccountId,
          reference,
          party: buyer,
          project: 'PRJ-07',
          amount: usdtAmount,
          currency: 'USDT',
          rate: rate,
          amountUSD: usdtAmount,
          amountVES: totalVES,
          date: date,
          description: `Venta P2P de ${usdtAmount.toFixed(2)} USDT a tasa ${rate.toFixed(2)} Bs para crédito en ${destAccountId}`,
          category: 'Cambio de Divisas'
        });

        window.ESIS_APP?.showToast('Cambio Completado', `Se debitaron ${usdtAmount.toFixed(2)} USDT y se acreditaron Bs ${totalVES.toLocaleString('es-VE')} en banco destino.`, 'success');
        window.ESIS_APP?.closeModal('modalExchangeCurrency');
        document.getElementById('currencyExchangeForm')?.reset();
      } catch (err) {
        window.ESIS_APP?.showToast('Error en Cambio', err.message, 'danger');
      }
    },

    toggleConciliate(txId) {
      const isNow = window.EsisStore.toggleTransactionConciliation(txId);
      window.ESIS_APP?.showToast('Conciliación', isNow ? 'Movimiento marcado como CONCILIADO' : 'Movimiento desmarcado (PENDIENTE)', 'info');
      this.renderTransactionsTable();
    }
  };

  window.BancosModule = BancosModule;
})(typeof window !== 'undefined' ? window : this);
