/**
 * ESIS, C.A. - SISTEMA DE GESTIÓN ADMINISTRATIVA, FINANCIERA Y OPERATIVA
 * Gestor de Estado Centralizado (Store), Persistencia y Automatización
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'ESIS_SYSTEM_DB_V1';

  class EsisStore {
    constructor() {
      this.state = null;
      this.listeners = [];
      this.init();
    }

    /**
     * Inicializa el almacén cargando de LocalStorage o usando los datos semilla
     */
    init() {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          this.state = JSON.parse(savedData);
          // Validar estructura mínima
          if (!this.state.projects || !this.state.invoices || !this.state.bankTransactions) {
            this.state = JSON.parse(JSON.stringify(window.ESIS_SEED_DATA));
            this.save();
          }
        } else {
          this.state = JSON.parse(JSON.stringify(window.ESIS_SEED_DATA));
          this.save();
        }
      } catch (e) {
        console.error('Error al inicializar LocalStorage. Usando datos semilla:', e);
        this.state = JSON.parse(JSON.stringify(window.ESIS_SEED_DATA));
      }
      this.recalculateBankBalances();
    }

    /**
     * Guarda el estado actual en LocalStorage y notifica a los oyentes
     */
    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.notify();
      } catch (e) {
        console.error('Error al guardar en LocalStorage:', e);
      }
    }

    /**
     * Suscripción a cambios en el estado
     */
    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify() {
      this.listeners.forEach(listener => {
        try {
          listener(this.state);
        } catch (err) {
          console.error('Error en listener del Store:', err);
        }
      });
      // Despachar evento del DOM
      window.dispatchEvent(new CustomEvent('esis:state-changed', { detail: this.state }));
    }

    /**
     * Restablece los datos a la semilla original de demostración
     */
    resetToDefault() {
      this.state = JSON.parse(JSON.stringify(window.ESIS_SEED_DATA));
      this.save();
      return true;
    }

    /**
     * Exporta toda la base de datos a un archivo JSON descargable
     */
    exportJSON() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
      const downloadAnchor = document.createElement('a');
      const filename = `ESIS_CA_Respaldo_Admin_${new Date().toISOString().slice(0,10)}.json`;
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    /**
     * Importa una base de datos desde un archivo JSON
     */
    importJSON(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.projects && parsed.invoices && parsed.bankTransactions) {
          this.state = parsed;
          this.recalculateBankBalances();
          this.save();
          return { success: true, message: 'Base de datos importada con éxito.' };
        } else {
          return { success: false, message: 'El archivo JSON no tiene la estructura requerida para ESIS C.A.' };
        }
      } catch (e) {
        return { success: false, message: 'Error de formato JSON: ' + e.message };
      }
    }

    // =========================================================================
    // TASAS DE CAMBIO (RATES)
    // =========================================================================
    getRates() {
      return this.state.rates || { bcv: 72.50, usdt: 74.20 };
    }

    updateRates(bcv, usdt) {
      this.state.rates = {
        bcv: parseFloat(bcv) || 72.50,
        usdt: parseFloat(usdt) || 74.20,
        lastUpdated: new Date().toISOString()
      };
      this.save();
    }

    // =========================================================================
    // GESTIÓN DE PROYECTOS (HASTA 20 PROYECTOS)
    // =========================================================================
    getProjects() {
      return this.state.projects || [];
    }

    getProjectById(id) {
      return (this.state.projects || []).find(p => p.id === id);
    }

    addProject(projectData) {
      if ((this.state.projects || []).length >= 20) {
        throw new Error('Se ha alcanzado el límite máximo de 20 proyectos simultáneos.');
      }
      const newId = 'PRJ-' + String((this.state.projects || []).length + 1).padStart(2, '0');
      const newProject = {
        id: newId,
        code: projectData.code || `P${(this.state.projects || []).length + 1}`,
        name: projectData.name,
        client: projectData.client,
        budgetUSD: parseFloat(projectData.budgetUSD) || 0,
        status: projectData.status || 'ACTIVO',
        description: projectData.description || ''
      };
      this.state.projects.push(newProject);
      this.save();
      return newProject;
    }

    updateProject(id, projectData) {
      const idx = this.state.projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        this.state.projects[idx] = { ...this.state.projects[idx], ...projectData };
        this.save();
        return this.state.projects[idx];
      }
      return null;
    }

    deleteProject(id) {
      this.state.projects = this.state.projects.filter(p => p.id !== id);
      this.save();
    }

    // =========================================================================
    // GESTIÓN DE CLIENTES
    // =========================================================================
    getClients() {
      return this.state.clients || [];
    }

    addClient(clientData) {
      const newId = 'CLI-' + String((this.state.clients || []).length + 1).padStart(2, '0');
      const newClient = {
        id: newId,
        name: clientData.name,
        rif: clientData.rif,
        phone: clientData.phone || '',
        email: clientData.email || '',
        contact: clientData.contact || ''
      };
      this.state.clients.push(newClient);
      this.save();
      return newClient;
    }

    // =========================================================================
    // MÓDULO 2: FACTURACIÓN DUAL USD / BS & AUTOMATIZACIONES
    // =========================================================================
    getInvoices(projectIdFilter = 'ALL', clientIdFilter = 'ALL') {
      let list = this.state.invoices || [];
      if (projectIdFilter && projectIdFilter !== 'ALL') {
        list = list.filter(inv => inv.projectId === projectIdFilter);
      }
      if (clientIdFilter && clientIdFilter !== 'ALL') {
        list = list.filter(inv => inv.clientId === clientIdFilter);
      }
      return list;
    }

    createInvoice(data) {
      const bcvRate = parseFloat(data.rateBCV) || this.getRates().bcv;
      const baseUSD = parseFloat(data.baseUSD) || 0;
      const ivaPercent = 16.0;
      const ivaUSD = +(baseUSD * (ivaPercent / 100)).toFixed(2);
      const totalUSD = +(baseUSD + ivaUSD).toFixed(2);

      // Retenciones USD
      const retIvaUSD = parseFloat(data.retIvaUSD) || 0;
      const retIslrUSD = parseFloat(data.retIslrUSD) || 0;
      const retMunicipalUSD = parseFloat(data.retMunicipalUSD) || 0;
      const netUSD = +(totalUSD - (retIvaUSD + retIslrUSD + retMunicipalUSD)).toFixed(2);

      // Conversión a Bs
      const baseVES = +(baseUSD * bcvRate).toFixed(2);
      const ivaVES = +(ivaUSD * bcvRate).toFixed(2);
      const totalVES = +(totalUSD * bcvRate).toFixed(2);
      const retIvaVES = +(retIvaUSD * bcvRate).toFixed(2);
      const retIslrVES = +(retIslrUSD * bcvRate).toFixed(2);
      const retMunicipalVES = +(retMunicipalUSD * bcvRate).toFixed(2);
      const netVES = +(netUSD * bcvRate).toFixed(2);

      const project = this.getProjectById(data.projectId);
      const client = (this.state.clients || []).find(c => c.id === data.clientId) || { name: data.clientName || 'Cliente' };

      const newInvoice = {
        id: 'INV-' + String((this.state.invoices || []).length + 1).padStart(3, '0'),
        docNumber: data.docNumber || `FAC-2026-${String((this.state.invoices || []).length + 1).padStart(3, '0')}`,
        controlNumber: data.controlNumber || `00-${String(Math.floor(Math.random()*900000 + 100000))}`,
        date: data.date || new Date().toISOString().slice(0, 10),
        dueDate: data.dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 10),
        type: data.type || 'FACTURA',
        clientId: data.clientId,
        clientName: client.name || data.clientName,
        clientRif: client.rif || data.clientRif || 'J-00000000-0',
        projectId: data.projectId,
        projectName: project ? project.name : 'Proyecto General',
        concept: data.concept || 'Servicios de Seguridad y Custodia Integral',

        // Valores USD
        baseUSD,
        ivaPercent,
        ivaUSD,
        totalUSD,
        retIvaUSD,
        retIslrUSD,
        retMunicipalUSD,
        netUSD,

        // Valores Bs
        rateBCV: bcvRate,
        baseVES,
        ivaVES,
        totalVES,
        retIvaVES,
        retIslrVES,
        retMunicipalVES,
        netVES,

        // Estado CxC Automático
        paidUSD: 0.00,
        pendingUSD: netUSD,
        status: 'PENDIENTE',
        observations: data.observations || 'Generada desde el módulo de Facturación'
      };

      this.state.invoices.unshift(newInvoice);
      this.save();
      return newInvoice;
    }

    deleteInvoice(id) {
      this.state.invoices = this.state.invoices.filter(i => i.id !== id);
      this.save();
    }

    // =========================================================================
    // MÓDULO 3: BANCOS & CONCILIACIÓN
    // =========================================================================
    getBankAccounts() {
      return this.state.bankAccounts || [];
    }

    getBankTransactions(accountId = 'ALL', projectIdFilter = 'ALL') {
      let list = this.state.bankTransactions || [];
      if (accountId && accountId !== 'ALL') {
        list = list.filter(tx => tx.accountId === accountId || tx.destinationAccountId === accountId);
      }
      if (projectIdFilter && projectIdFilter !== 'ALL') {
        list = list.filter(tx => tx.project === projectIdFilter);
      }
      return list;
    }

    /**
     * Registra un movimiento bancario con automatizaciones:
     * - Si es EGRESO tipo GASTO -> Crea registro automático en Gastos
     * - Si es CAMBIO_DIVISAS -> Debita Binance USDT y Acredita en BDV o Banesco Bs
     * - Envía el movimiento a Conciliación Bancaria
     */
    addBankTransaction(txData) {
      const bcvRate = this.getRates().bcv;
      const usdtRate = this.getRates().usdt;
      const newId = 'BNK-' + String((this.state.bankTransactions || []).length + 1).padStart(3, '0');

      const amount = parseFloat(txData.amount) || 0;
      const rate = parseFloat(txData.rate) || (txData.currency === 'USDT' ? usdtRate : bcvRate);
      
      let amountVES = 0;
      let amountUSD = 0;

      if (txData.currency === 'USDT' || txData.currency === 'USD') {
        amountUSD = amount;
        amountVES = +(amount * rate).toFixed(2);
      } else {
        amountVES = amount;
        amountUSD = +(amount / rate).toFixed(2);
      }

      const tx = {
        id: newId,
        date: txData.date || new Date().toISOString().slice(0, 10),
        type: txData.type, // INGRESO, EGRESO, TRANSFERENCIA, PAGO, COMPRA, CAMBIO_DIVISAS
        subType: txData.subType || (txData.type === 'EGRESO' ? 'GASTO' : 'NORMAL'),
        accountId: txData.accountId,
        destinationAccountId: txData.destinationAccountId || null,
        reference: txData.reference || `REF-${Math.floor(Math.random()*900000+100000)}`,
        party: txData.party || 'ESIS C.A.',
        project: txData.project || 'PRJ-01',
        amount: amount,
        currency: txData.currency || 'USD',
        rate: rate,
        amountUSD: amountUSD,
        amountVES: amountVES,
        description: txData.description || '',
        category: txData.category || 'Operaciones',
        conciliated: false,
        linkedDoc: txData.linkedDoc || null
      };

      this.state.bankTransactions.unshift(tx);

      // AUTOMATIZACIÓN 1: Si es Egreso tipo GASTO -> Registrar automáticamente en Gastos
      if (tx.type === 'EGRESO' && (tx.subType === 'GASTO' || txData.autoExpense)) {
        const bank = this.getBankAccounts().find(b => b.id === tx.accountId);
        const project = this.getProjectById(tx.project);
        
        const newExpense = {
          id: 'EXP-' + String((this.state.expenses || []).length + 1).padStart(3, '0'),
          date: tx.date,
          category: txData.category || 'Operaciones de Seguridad & Custodia',
          subcategory: txData.subcategory || 'Gastos Operativos Directos',
          projectId: tx.project,
          projectName: project ? project.name : 'Proyecto General',
          amountUSD: amountUSD,
          amountVES: amountVES,
          rateBCV: rate,
          supplier: tx.party,
          invoiceNumber: tx.reference,
          bankAccountId: tx.accountId,
          bankName: bank ? bank.name : 'Banco',
          paymentMethod: tx.currency === 'USDT' ? 'CRYPTO_USDT' : 'TRANSFERENCIA',
          status: 'PAGADO',
          observations: `Generado automáticamente desde Banco (Ref: ${tx.reference})`
        };
        this.state.expenses.unshift(newExpense);
      }

      // AUTOMATIZACIÓN 2: Si es Cambio de Divisas (USDT -> Bs)
      // Se registra una sola transacción de cambio que recalcula ambos saldos
      
      this.recalculateBankBalances();
      this.save();
      return tx;
    }

    recalculateBankBalances() {
      // Tomar saldos base de cada cuenta
      const balances = {
        'ACC-BINANCE': 0,
        'ACC-BDV': 0,
        'ACC-BANESCO': 0
      };

      // Inicializar saldos iniciales fijos
      balances['ACC-BINANCE'] = 20000.00;
      balances['ACC-BDV'] = 1000000.00;
      balances['ACC-BANESCO'] = 1500000.00;

      (this.state.bankTransactions || []).forEach(tx => {
        if (tx.type === 'INGRESO') {
          if (balances[tx.accountId] !== undefined) {
            balances[tx.accountId] += tx.amount;
          }
        } else if (tx.type === 'EGRESO' || tx.type === 'PAGO' || tx.type === 'COMPRA') {
          if (balances[tx.accountId] !== undefined) {
            balances[tx.accountId] -= tx.amount;
          }
        } else if (tx.type === 'CAMBIO_DIVISAS') {
          // Debita cuenta origen (e.g. USDT) y Acredita cuenta destino (e.g. Bs)
          if (balances[tx.accountId] !== undefined) {
            balances[tx.accountId] -= tx.amount; // Resta USDT
          }
          if (tx.destinationAccountId && balances[tx.destinationAccountId] !== undefined) {
            balances[tx.destinationAccountId] += tx.amountVES; // Suma Bs
          }
        } else if (tx.type === 'TRANSFERENCIA') {
          if (balances[tx.accountId] !== undefined) {
            balances[tx.accountId] -= tx.amount;
          }
          if (tx.destinationAccountId && balances[tx.destinationAccountId] !== undefined) {
            balances[tx.destinationAccountId] += tx.amount;
          }
        }
      });

      // Asignar saldos a las cuentas
      (this.state.bankAccounts || []).forEach(acc => {
        if (balances[acc.id] !== undefined) {
          acc.balance = +(balances[acc.id]).toFixed(2);
        }
      });
    }

    toggleTransactionConciliation(id) {
      const tx = (this.state.bankTransactions || []).find(t => t.id === id);
      if (tx) {
        tx.conciliated = !tx.conciliated;
        this.save();
        return tx.conciliated;
      }
      return false;
    }

    // =========================================================================
    // MÓDULO 4: GASTOS OPERATIVOS
    // =========================================================================
    getExpenses(projectIdFilter = 'ALL') {
      let list = this.state.expenses || [];
      if (projectIdFilter && projectIdFilter !== 'ALL') {
        list = list.filter(exp => exp.projectId === projectIdFilter);
      }
      return list;
    }

    createExpense(data) {
      const bcvRate = this.getRates().bcv;
      const amountUSD = parseFloat(data.amountUSD) || 0;
      const amountVES = parseFloat(data.amountVES) || +(amountUSD * bcvRate).toFixed(2);
      const project = this.getProjectById(data.projectId);
      const bank = data.bankAccountId ? this.getBankAccounts().find(b => b.id === data.bankAccountId) : null;

      const newExpense = {
        id: 'EXP-' + String((this.state.expenses || []).length + 1).padStart(3, '0'),
        date: data.date || new Date().toISOString().slice(0, 10),
        category: data.category || 'Operaciones de Seguridad & Custodia',
        subcategory: data.subcategory || 'General',
        projectId: data.projectId,
        projectName: project ? project.name : 'Proyecto General',
        amountUSD: amountUSD,
        amountVES: amountVES,
        rateBCV: bcvRate,
        supplier: data.supplier || 'Proveedor',
        invoiceNumber: data.invoiceNumber || 'S/N',
        bankAccountId: data.bankAccountId || null,
        bankName: bank ? bank.name : (data.status === 'PENDIENTE' ? 'POR PAGAR (CxP)' : 'Caja Chica'),
        paymentMethod: data.paymentMethod || 'TRANSFERENCIA',
        status: data.status || 'PAGADO',
        observations: data.observations || ''
      };

      this.state.expenses.unshift(newExpense);

      // Si el gasto se pagó de inmediato con un banco, generar movimiento bancario
      if (newExpense.status === 'PAGADO' && data.bankAccountId) {
        const txAmount = bank.currency === 'VES' ? amountVES : amountUSD;
        const newTx = {
          id: 'BNK-' + String((this.state.bankTransactions || []).length + 1).padStart(3, '0'),
          date: newExpense.date,
          type: 'EGRESO',
          subType: 'GASTO',
          accountId: data.bankAccountId,
          reference: newExpense.invoiceNumber || `EXP-${newExpense.id}`,
          party: newExpense.supplier,
          project: newExpense.projectId,
          amount: txAmount,
          currency: bank.currency,
          rate: bcvRate,
          amountUSD: amountUSD,
          amountVES: amountVES,
          description: `Gasto: ${newExpense.category} - ${newExpense.subcategory} (${newExpense.supplier})`,
          category: newExpense.category,
          conciliated: false
        };
        this.state.bankTransactions.unshift(newTx);
        this.recalculateBankBalances();
      }

      // Si el gasto es a crédito (PENDIENTE), alimentar Cuentas por Pagar (CxP)
      if (newExpense.status === 'PENDIENTE') {
        const newPayable = {
          id: 'CXP-' + String((this.state.payables || []).length + 1).padStart(3, '0'),
          supplier: newExpense.supplier,
          rif: data.supplierRif || 'J-00000000-0',
          projectId: newExpense.projectId,
          projectName: newExpense.projectName,
          invoiceNumber: newExpense.invoiceNumber,
          issueDate: newExpense.date,
          dueDate: data.dueDate || new Date(Date.now() + 15*24*60*60*1000).toISOString().slice(0,10),
          amountUSD: amountUSD,
          amountVES: amountVES,
          paidUSD: 0.00,
          pendingUSD: amountUSD,
          status: 'PENDIENTE',
          observations: newExpense.observations
        };
        this.state.payables.unshift(newPayable);
      }

      this.save();
      return newExpense;
    }

    // =========================================================================
    // MÓDULO 5: CUENTAS POR COBRAR (CxC)
    // =========================================================================
    getReceivables(projectIdFilter = 'ALL', clientIdFilter = 'ALL') {
      const today = new Date();
      return this.getInvoices(projectIdFilter, clientIdFilter).map(inv => {
        const due = new Date(inv.dueDate);
        const diffTime = today - due;
        const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...inv,
          overdueDays: overdueDays > 0 && inv.status !== 'PAGADO' ? overdueDays : 0,
          isOverdue: overdueDays > 0 && inv.status !== 'PAGADO'
        };
      });
    }

    /**
     * Registra el cobro de una factura y genera el movimiento bancario de ingreso
     */
    registerCobro(invoiceId, amountUSD, bankAccountId, reference, date, notes) {
      const invoice = (this.state.invoices || []).find(i => i.id === invoiceId);
      if (!invoice) throw new Error('Factura no encontrada.');

      const bank = this.getBankAccounts().find(b => b.id === bankAccountId);
      if (!bank) throw new Error('Cuenta bancaria no válida.');

      const amountToPay = parseFloat(amountUSD) || 0;
      const bcvRate = this.getRates().bcv;
      const usdtRate = this.getRates().usdt;
      const rate = bank.currency === 'USDT' ? usdtRate : bcvRate;

      // Actualizar Factura
      invoice.paidUSD = +(parseFloat(invoice.paidUSD || 0) + amountToPay).toFixed(2);
      invoice.pendingUSD = +(parseFloat(invoice.netUSD) - invoice.paidUSD).toFixed(2);
      if (invoice.pendingUSD <= 0) {
        invoice.pendingUSD = 0;
        invoice.status = 'PAGADO';
      } else {
        invoice.status = 'PARCIAL';
      }
      invoice.observations = (invoice.observations ? invoice.observations + ' | ' : '') + 
        `Abono: $${amountToPay.toFixed(2)} (${date}) Ref: ${reference}`;

      // Crear Movimiento Bancario
      const bankAmount = bank.currency === 'VES' ? +(amountToPay * rate).toFixed(2) : amountToPay;
      const newTx = {
        id: 'BNK-' + String((this.state.bankTransactions || []).length + 1).padStart(3, '0'),
        date: date || new Date().toISOString().slice(0, 10),
        type: 'INGRESO',
        subType: 'COBRO_FACTURA',
        accountId: bankAccountId,
        reference: reference || `COB-${invoice.docNumber}`,
        party: invoice.clientName,
        project: invoice.projectId,
        amount: bankAmount,
        currency: bank.currency,
        rate: rate,
        amountUSD: amountToPay,
        amountVES: +(amountToPay * bcvRate).toFixed(2),
        description: `Cobro Factura ${invoice.docNumber} - ${notes || invoice.concept}`,
        category: 'Cobro de Factura',
        conciliated: false,
        linkedDoc: invoice.docNumber
      };

      this.state.bankTransactions.unshift(newTx);
      this.recalculateBankBalances();
      this.save();
      return { invoice, transaction: newTx };
    }

    // =========================================================================
    // MÓDULO 6: CUENTAS POR PAGAR (CxP)
    // =========================================================================
    getPayables(projectIdFilter = 'ALL') {
      const today = new Date();
      let list = this.state.payables || [];
      if (projectIdFilter && projectIdFilter !== 'ALL') {
        list = list.filter(p => p.projectId === projectIdFilter);
      }
      return list.map(item => {
        const due = new Date(item.dueDate);
        const diffTime = today - due;
        const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...item,
          overdueDays: overdueDays > 0 && item.status !== 'PAGADO' ? overdueDays : 0,
          isOverdue: overdueDays > 0 && item.status !== 'PAGADO'
        };
      });
    }

    /**
     * Registra el pago a un proveedor y genera el débito bancario
     */
    registerPagoCxP(payableId, amountUSD, bankAccountId, reference, date, notes) {
      const payable = (this.state.payables || []).find(p => p.id === payableId);
      if (!payable) throw new Error('Cuenta por pagar no encontrada.');

      const bank = this.getBankAccounts().find(b => b.id === bankAccountId);
      if (!bank) throw new Error('Cuenta bancaria no válida.');

      const amountToPay = parseFloat(amountUSD) || 0;
      const bcvRate = this.getRates().bcv;
      const usdtRate = this.getRates().usdt;
      const rate = bank.currency === 'USDT' ? usdtRate : bcvRate;

      payable.paidUSD = +(parseFloat(payable.paidUSD || 0) + amountToPay).toFixed(2);
      payable.pendingUSD = +(parseFloat(payable.amountUSD) - payable.paidUSD).toFixed(2);
      if (payable.pendingUSD <= 0) {
        payable.pendingUSD = 0;
        payable.status = 'PAGADO';
      } else {
        payable.status = 'PARCIAL';
      }
      payable.observations = (payable.observations ? payable.observations + ' | ' : '') +
        `Pago: $${amountToPay.toFixed(2)} (${date}) Ref: ${reference}`;

      // Generar débito bancario
      const bankAmount = bank.currency === 'VES' ? +(amountToPay * rate).toFixed(2) : amountToPay;
      const newTx = {
        id: 'BNK-' + String((this.state.bankTransactions || []).length + 1).padStart(3, '0'),
        date: date || new Date().toISOString().slice(0, 10),
        type: 'EGRESO',
        subType: 'PAGO_PROVEEDOR',
        accountId: bankAccountId,
        reference: reference || `PAG-${payable.invoiceNumber}`,
        party: payable.supplier,
        project: payable.projectId,
        amount: bankAmount,
        currency: bank.currency,
        rate: rate,
        amountUSD: amountToPay,
        amountVES: +(amountToPay * bcvRate).toFixed(2),
        description: `Pago CxP Proveedor ${payable.supplier} (Fact: ${payable.invoiceNumber}) - ${notes || ''}`,
        category: 'Pago a Proveedor',
        conciliated: false
      };

      this.state.bankTransactions.unshift(newTx);
      this.recalculateBankBalances();
      this.save();
      return { payable, transaction: newTx };
    }

    // =========================================================================
    // MÓDULO 7: CONCILIACIÓN BANCARIA & AUDITORÍA
    // =========================================================================
    getReconciliationData(accountId, period) {
      const bank = this.getBankAccounts().find(b => b.id === accountId);
      if (!bank) return null;

      // Filtrar transacciones de esta cuenta y período
      const allTx = (this.state.bankTransactions || []).filter(tx => {
        const matchAcc = tx.accountId === accountId || tx.destinationAccountId === accountId;
        const matchPeriod = period ? tx.date.startsWith(period) : true;
        return matchAcc && matchPeriod;
      });

      const conciliatedTx = allTx.filter(t => t.conciliated);
      const pendingTx = allTx.filter(t => !t.conciliated);

      // Calcular montos conciliados
      let conciliatedIncome = 0;
      let conciliatedExpense = 0;

      conciliatedTx.forEach(tx => {
        if (tx.type === 'INGRESO') {
          conciliatedIncome += tx.amount;
        } else if (tx.type === 'EGRESO' || tx.type === 'PAGO' || tx.type === 'COMPRA') {
          conciliatedExpense += tx.amount;
        } else if (tx.type === 'CAMBIO_DIVISAS') {
          if (tx.accountId === accountId) conciliatedExpense += tx.amount;
          if (tx.destinationAccountId === accountId) conciliatedIncome += tx.amountVES;
        }
      });

      const bookBalance = bank.balance;
      return {
        bank,
        allTx,
        conciliatedTx,
        pendingTx,
        bookBalance,
        conciliatedIncome,
        conciliatedExpense
      };
    }

    saveReconciliationAudit(record) {
      if (!this.state.reconciliations) this.state.reconciliations = [];
      const newRec = {
        id: 'REC-' + String(this.state.reconciliations.length + 1).padStart(3, '0'),
        date: new Date().toISOString().slice(0, 10),
        period: record.period,
        accountId: record.accountId,
        bankName: record.bankName,
        bookBalance: parseFloat(record.bookBalance) || 0,
        statementBalance: parseFloat(record.statementBalance) || 0,
        difference: parseFloat(record.difference) || 0,
        status: Math.abs(record.difference) < 0.01 ? 'CONCILIADO' : 'CON_DIFERENCIA',
        auditor: record.auditor || 'Auditoría ESIS C.A.',
        notes: record.notes || ''
      };
      this.state.reconciliations.unshift(newRec);
      this.save();
      return newRec;
    }

    // =========================================================================
    // MÉTRICAS CONSOLIDADAS Y DASHBOARD EN TIEMPO REAL
    // =========================================================================
    getDashboardMetrics(filterProjectId = 'ALL', filterClientId = 'ALL') {
      const bcvRate = this.getRates().bcv;
      const invoices = this.getInvoices(filterProjectId, filterClientId);
      const expenses = this.getExpenses(filterProjectId);
      const bankTx = this.getBankTransactions('ALL', filterProjectId);

      // Facturación Total
      let totalFacturadoUSD = 0;
      let totalCobradoUSD = 0;
      let totalPorCobrarUSD = 0;

      invoices.forEach(inv => {
        totalFacturadoUSD += inv.netUSD || inv.totalUSD;
        totalCobradoUSD += inv.paidUSD || 0;
        totalPorCobrarUSD += inv.pendingUSD || 0;
      });

      // Gastos Totales
      let totalGastosUSD = 0;
      expenses.forEach(exp => {
        totalGastosUSD += exp.amountUSD || 0;
      });

      // Cuentas por Pagar Totales
      const payables = this.getPayables(filterProjectId);
      let totalPorPagarUSD = 0;
      let totalPagadoCxPUSD = 0;
      payables.forEach(p => {
        totalPorPagarUSD += p.pendingUSD || 0;
        totalPagadoCxPUSD += p.paidUSD || 0;
      });

      // Flujo de Caja (Movimientos Bancarios Totales en USD equivalente)
      let cashInflowUSD = 0;
      let cashOutflowUSD = 0;
      bankTx.forEach(tx => {
        if (tx.type === 'INGRESO') {
          cashInflowUSD += tx.amountUSD;
        } else if (tx.type === 'EGRESO' || tx.type === 'PAGO' || tx.type === 'COMPRA') {
          cashOutflowUSD += tx.amountUSD;
        }
      });
      const netCashFlowUSD = +(cashInflowUSD - cashOutflowUSD).toFixed(2);

      // Rentabilidad por Proyecto
      const projects = this.getProjects();
      const projectProfitability = projects.map(proj => {
        const projInvoices = (this.state.invoices || []).filter(i => i.projectId === proj.id);
        const projExpenses = (this.state.expenses || []).filter(e => e.projectId === proj.id);

        const revenueUSD = projInvoices.reduce((sum, i) => sum + (i.netUSD || 0), 0);
        const costUSD = projExpenses.reduce((sum, e) => sum + (e.amountUSD || 0), 0);
        const marginUSD = +(revenueUSD - costUSD).toFixed(2);
        const marginPercent = revenueUSD > 0 ? +((marginUSD / revenueUSD) * 100).toFixed(1) : 0;

        return {
          id: proj.id,
          name: proj.name,
          client: proj.client,
          budgetUSD: proj.budgetUSD,
          revenueUSD,
          costUSD,
          marginUSD,
          marginPercent,
          status: proj.status
        };
      });

      return {
        rates: this.getRates(),
        totalFacturadoUSD: +totalFacturadoUSD.toFixed(2),
        totalFacturadoVES: +(totalFacturadoUSD * bcvRate).toFixed(2),
        totalCobradoUSD: +totalCobradoUSD.toFixed(2),
        totalCobradoVES: +(totalCobradoUSD * bcvRate).toFixed(2),
        totalPorCobrarUSD: +totalPorCobrarUSD.toFixed(2),
        totalPorCobrarVES: +(totalPorCobrarUSD * bcvRate).toFixed(2),
        totalGastosUSD: +totalGastosUSD.toFixed(2),
        totalGastosVES: +(totalGastosUSD * bcvRate).toFixed(2),
        totalPorPagarUSD: +totalPorPagarUSD.toFixed(2),
        totalPorPagarVES: +(totalPorPagarUSD * bcvRate).toFixed(2),
        cashInflowUSD: +cashInflowUSD.toFixed(2),
        cashOutflowUSD: +cashOutflowUSD.toFixed(2),
        netCashFlowUSD: netCashFlowUSD,
        netCashFlowVES: +(netCashFlowUSD * bcvRate).toFixed(2),
        projectProfitability,
        bankAccounts: this.getBankAccounts()
      };
    }
  }

  // Instancia global accesible
  window.EsisStore = new EsisStore();

})(typeof window !== 'undefined' ? window : this);
