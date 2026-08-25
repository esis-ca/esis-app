/**
 * ESIS, C.A. - MÓDULO 2: FACTURACIÓN
 * Formulario Dual USD / Bs, Cálculo de IVA 16%, Retenciones, Emisión y Formato Fiscal
 */

(function(window) {
  'use strict';

  const FacturacionModule = {
    init() {
      this.bindEvents();
      this.renderInvoiceTable();
      this.populateSelects();
      this.setupDualCalculations();
      window.addEventListener('esis:state-changed', () => {
        this.renderInvoiceTable();
        this.populateSelects();
      });
    },

    bindEvents() {
      const form = document.getElementById('newInvoiceForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSaveInvoice();
        });
      }

      const searchInput = document.getElementById('searchInvoiceInput');
      if (searchInput) {
        searchInput.addEventListener('input', () => this.renderInvoiceTable());
      }
    },

    populateSelects() {
      const projectSelect = document.getElementById('invoiceProjectSelect');
      const clientSelect = document.getElementById('invoiceClientSelect');
      const store = window.EsisStore;

      if (projectSelect) {
        const projects = store.getProjects();
        projectSelect.innerHTML = '<option value="">-- Seleccionar Proyecto --</option>' +
          projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      }

      if (clientSelect) {
        const clients = store.getClients();
        clientSelect.innerHTML = '<option value="">-- Seleccionar Cliente --</option>' +
          clients.map(c => `<option value="${c.id}" data-rif="${c.rif}">${c.name} (${c.rif})</option>`).join('');
      }

      // Prellenar tasa BCV actual
      const rateInput = document.getElementById('invRateBCV');
      if (rateInput && !rateInput.value) {
        rateInput.value = store.getRates().bcv.toFixed(2);
      }
    },

    setupDualCalculations() {
      const baseUSDInput = document.getElementById('invBaseUSD');
      const rateBCVInput = document.getElementById('invRateBCV');
      const retIvaUSDInput = document.getElementById('invRetIvaUSD');
      const retIslrUSDInput = document.getElementById('invRetIslrUSD');
      const retMunUSDInput = document.getElementById('invRetMunUSD');

      const calcHandler = () => this.recalculateForm();

      if (baseUSDInput) baseUSDInput.addEventListener('input', calcHandler);
      if (rateBCVInput) rateBCVInput.addEventListener('input', calcHandler);
      if (retIvaUSDInput) retIvaUSDInput.addEventListener('input', calcHandler);
      if (retIslrUSDInput) retIslrUSDInput.addEventListener('input', calcHandler);
      if (retMunUSDInput) retMunUSDInput.addEventListener('input', calcHandler);
    },

    recalculateForm() {
      const baseUSD = parseFloat(document.getElementById('invBaseUSD')?.value) || 0;
      let rateBCV = parseFloat(document.getElementById('invRateBCV')?.value);
      if (isNaN(rateBCV) || rateBCV <= 0) rateBCV = window.EsisStore.getRates().bcv;

      // Cálculos USD
      const ivaUSD = +(baseUSD * 0.16).toFixed(2);
      const totalUSD = +(baseUSD + ivaUSD).toFixed(2);

      // Sugerir Retenciones estándar si están vacías o al cambiar base
      const retIvaInput = document.getElementById('invRetIvaUSD');
      const retIslrInput = document.getElementById('invRetIslrUSD');
      const retMunInput = document.getElementById('invRetMunUSD');

      // 75% del IVA
      const retIvaUSD = parseFloat(retIvaInput?.value) || +(ivaUSD * 0.75).toFixed(2);
      // 2% de la base
      const retIslrUSD = parseFloat(retIslrInput?.value) || +(baseUSD * 0.02).toFixed(2);
      // 1% de la base
      const retMunUSD = parseFloat(retMunInput?.value) || +(baseUSD * 0.01).toFixed(2);

      const netUSD = +(totalUSD - (retIvaUSD + retIslrUSD + retMunUSD)).toFixed(2);

      // Actualizar campos USD
      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      setVal('invIvaUSD', ivaUSD.toFixed(2));
      setVal('invTotalUSD', totalUSD.toFixed(2));
      setVal('invNetUSD', netUSD.toFixed(2));

      // Cálculos Bs
      const baseVES = +(baseUSD * rateBCV).toFixed(2);
      const ivaVES = +(ivaUSD * rateBCV).toFixed(2);
      const totalVES = +(totalUSD * rateBCV).toFixed(2);
      const retIvaVES = +(retIvaUSD * rateBCV).toFixed(2);
      const retIslrVES = +(retIslrUSD * rateBCV).toFixed(2);
      const retMunVES = +(retMunUSD * rateBCV).toFixed(2);
      const netVES = +(netUSD * rateBCV).toFixed(2);

      setVal('invBaseVES', baseVES.toLocaleString('es-VE', { minimumFractionDigits: 2 }));
      setVal('invIvaVES', ivaVES.toLocaleString('es-VE', { minimumFractionDigits: 2 }));
      setVal('invTotalVES', totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 }));
      setVal('invRetIvaVES', retIvaVES.toLocaleString('es-VE', { minimumFractionDigits: 2 }));
      setVal('invRetIslrVES', retIslrVES.toLocaleString('es-VE', { minimumFractionDigits: 2 }));
      setVal('invRetMunVES', retMunVES.toLocaleString('es-VE', { minimumFractionDigits: 2 }));
      setVal('invNetVES', netVES.toLocaleString('es-VE', { minimumFractionDigits: 2 }));
    },

    handleSaveInvoice() {
      try {
        const docNumber = document.getElementById('invDocNumber')?.value.trim();
        const controlNumber = document.getElementById('invControlNumber')?.value.trim();
        const date = document.getElementById('invDate')?.value;
        const dueDate = document.getElementById('invDueDate')?.value;
        const type = document.getElementById('invType')?.value || 'FACTURA';
        const clientId = document.getElementById('invoiceClientSelect')?.value;
        const projectId = document.getElementById('invoiceProjectSelect')?.value;
        const baseUSD = parseFloat(document.getElementById('invBaseUSD')?.value) || 0;
        const rateBCV = parseFloat(document.getElementById('invRateBCV')?.value) || window.EsisStore.getRates().bcv;
        const retIvaUSD = parseFloat(document.getElementById('invRetIvaUSD')?.value) || 0;
        const retIslrUSD = parseFloat(document.getElementById('invRetIslrUSD')?.value) || 0;
        const retMunicipalUSD = parseFloat(document.getElementById('invRetMunUSD')?.value) || 0;
        const concept = document.getElementById('invConcept')?.value.trim();

        if (!docNumber || !clientId || !projectId || baseUSD <= 0) {
          window.ESIS_APP?.showToast('Error', 'Por favor complete todos los campos obligatorios y un monto válido.', 'danger');
          return;
        }

        const newInvoice = window.EsisStore.createInvoice({
          docNumber,
          controlNumber,
          date,
          dueDate,
          type,
          clientId,
          projectId,
          baseUSD,
          rateBCV,
          retIvaUSD,
          retIslrUSD,
          retMunicipalUSD,
          concept
        });

        window.ESIS_APP?.showToast('Factura Creada', `Factura ${newInvoice.docNumber} registrada y enviada a Cuentas por Cobrar.`, 'success');
        window.ESIS_APP?.closeModal('modalNewInvoice');
        document.getElementById('newInvoiceForm')?.reset();
        this.populateSelects();
      } catch (err) {
        window.ESIS_APP?.showToast('Error al Guardar', err.message, 'danger');
      }
    },

    renderInvoiceTable() {
      const tbody = document.getElementById('invoicesTableBody');
      if (!tbody) return;

      const searchTerm = document.getElementById('searchInvoiceInput')?.value.toLowerCase() || '';
      const activeProjectFilter = document.getElementById('globalProjectFilter')?.value || 'ALL';

      let invoices = window.EsisStore.getInvoices(activeProjectFilter);

      if (searchTerm) {
        invoices = invoices.filter(i => 
          i.docNumber.toLowerCase().includes(searchTerm) ||
          i.clientName.toLowerCase().includes(searchTerm) ||
          i.projectName.toLowerCase().includes(searchTerm)
        );
      }

      if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 25px; color: var(--text-muted);">No se encontraron facturas registradas</td></tr>';
        return;
      }

      tbody.innerHTML = invoices.map(inv => {
        let statusBadge = 'badge-pending';
        if (inv.status === 'PAGADO') statusBadge = 'badge-paid';
        else if (inv.status === 'PARCIAL') statusBadge = 'badge-partial';

        return `
          <tr>
            <td><strong>${inv.docNumber}</strong><br><small style="color:var(--text-muted);">Ctrl: ${inv.controlNumber}</small></td>
            <td>${inv.date}</td>
            <td><span class="badge-status badge-neutral">${inv.type}</span></td>
            <td><strong>${inv.clientName}</strong><br><small style="color:var(--text-muted);">${inv.projectName}</small></td>
            <td style="font-weight:700;">$ ${inv.baseUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="font-weight:800; color:var(--primary);">$ ${(inv.netUSD || inv.totalUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}<br><small style="color:var(--text-muted);">Bs ${(inv.netVES || inv.totalVES).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</small></td>
            <td>$ ${inv.pendingUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td><span class="badge-status ${statusBadge}">${inv.status}</span></td>
            <td>
              <div style="display:flex; gap:6px;">
                <button class="btn btn-sm btn-outline" onclick="window.FacturacionModule.showInvoiceModal('${inv.id}')" title="Ver Formato Fiscal">📄 Ver</button>
                <button class="btn btn-sm btn-outline" onclick="window.FacturacionModule.printInvoice('${inv.id}')" title="Imprimir">🖨️</button>
                <button class="btn btn-sm btn-outline" style="color:var(--danger);" onclick="window.FacturacionModule.deleteInvoice('${inv.id}')" title="Eliminar">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    },

    showInvoiceModal(invoiceId) {
      const invoice = (window.EsisStore.getInvoices() || []).find(i => i.id === invoiceId);
      if (!invoice) return;

      const container = document.getElementById('printableInvoiceContainer');
      if (!container) return;

      container.innerHTML = `
        <div class="printable-invoice" id="fiscalInvoiceSheet">
          <div class="invoice-header-grid">
            <div class="invoice-company-info">
              <h2>ESIS, C.A.</h2>
              <p><strong>RIF:</strong> J-40891234-5 | <strong>NIT:</strong> 054238910</p>
              <p>Servicios de Seguridad Petrolera, Industrial, Comercial y Residencial</p>
              <p>Av. Principal de Lechería, Edif. Centro Empresarial ESIS, Piso 4, Anzoátegui, Venezuela</p>
              <p><strong>Teléfono:</strong> +58 (281) 281-9900 | <strong>Email:</strong> administracion@esis-seguridad.com</p>
            </div>
            <div class="invoice-meta-box">
              <h3 style="margin-bottom:4px;">${invoice.type}</h3>
              <p style="font-size:16px; font-weight:800; color:#c8102e;">N° ${invoice.docNumber}</p>
              <p><strong>N° Control:</strong> ${invoice.controlNumber}</p>
              <p><strong>Fecha de Emisión:</strong> ${invoice.date}</p>
              <p><strong>Fecha de Vencimiento:</strong> ${invoice.dueDate}</p>
            </div>
          </div>

          <div style="background:#f8fafc; padding:12px; border-radius:6px; margin-bottom:16px; border:1px solid #e2e8f0; display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
              <p><strong>Cliente:</strong> ${invoice.clientName}</p>
              <p><strong>RIF:</strong> ${invoice.clientRif}</p>
            </div>
            <div>
              <p><strong>Proyecto Asociado:</strong> ${invoice.projectName}</p>
              <p><strong>Tasa BCV Aplicada:</strong> Bs ${invoice.rateBCV.toFixed(2)} por USD</p>
            </div>
          </div>

          <table class="invoice-summary-table" style="width:100%; border:1px solid #cbd5e1; margin-bottom:16px;">
            <thead>
              <tr style="background:#0b2545; color:white;">
                <th style="padding:8px; text-align:left;">Descripción del Servicio</th>
                <th style="padding:8px; text-align:right;">Monto USD</th>
                <th style="padding:8px; text-align:right;">Monto Bs (BCV)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:10px; border-bottom:1px solid #e2e8f0;">
                  <strong>${invoice.concept}</strong><br>
                  <span style="font-size:12px; color:#475569;">Proyecto: ${invoice.projectName}</span>
                </td>
                <td style="padding:10px; text-align:right; font-weight:600; border-bottom:1px solid #e2e8f0;">$ ${invoice.baseUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td style="padding:10px; text-align:right; font-weight:600; border-bottom:1px solid #e2e8f0;">Bs ${invoice.baseVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div style="display:flex; justify-content:flex-end;">
            <div style="width:340px; background:#f8fafc; padding:12px; border-radius:6px; border:1px solid #cbd5e1;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Base Imponible:</span> <strong>$ ${invoice.baseUSD.toFixed(2)}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>IVA (16%):</span> <strong>$ ${invoice.ivaUSD.toFixed(2)}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px; border-top:1px solid #cbd5e1; padding-top:4px;"><span>Total Factura:</span> <strong>$ ${invoice.totalUSD.toFixed(2)}</strong></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#c8102e;"><span>(-) Retención IVA (75%):</span> <span>-$ ${invoice.retIvaUSD.toFixed(2)}</span></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#c8102e;"><span>(-) Retención ISLR (2%):</span> <span>-$ ${invoice.retIslrUSD.toFixed(2)}</span></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; color:#c8102e;"><span>(-) Ret. Municipal (1%):</span> <span>-$ ${invoice.retMunicipalUSD.toFixed(2)}</span></div>
              <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:800; border-top:2px solid #000; padding-top:6px; color:#0b2545;">
                <span>Total Neto a Cobrar:</span>
                <span>$ ${invoice.netUSD.toFixed(2)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; color:#475569; margin-top:2px;">
                <span>Equivalente en Bs:</span>
                <span>Bs ${invoice.netVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div style="margin-top:24px; padding-top:12px; border-top:1px dashed #cbd5e1; font-size:11px; color:#64748b; text-align:center;">
            <p>Comprobante de Control Administrativo Interno - ESIS, C.A. Seguridad Industrial & Petrolera</p>
          </div>
        </div>
      `;

      window.ESIS_APP?.openModal('modalViewInvoice');
    },

    printInvoice(invoiceId) {
      this.showInvoiceModal(invoiceId);
      setTimeout(() => {
        window.print();
      }, 300);
    },

    deleteInvoice(invoiceId) {
      if (confirm('¿Está seguro de que desea anular y eliminar esta factura?')) {
        window.EsisStore.deleteInvoice(invoiceId);
        window.ESIS_APP?.showToast('Factura Eliminada', 'La factura ha sido eliminada del sistema.', 'info');
      }
    }
  };

  window.FacturacionModule = FacturacionModule;
})(typeof window !== 'undefined' ? window : this);
document.getElementById("btnGuardarFactura").addEventListener("click", async () => {
  const datosFactura = {
    fecha_emision: "2026-08-24",
    numero_doc: "F001",
    tipo: "factura",
    base_usd: 100,
    iva_usd: 16,
    total_usd: 116,
    tipo_cambio: 40,
    base_bs: 4000,
    iva_bs: 640,
    total_bs: 4640,
    ret_iva_bs: 0,
    ret_islr_bs: 0,
    ret_municipal_bs: 0,
    cliente_id: 1,
    proyecto_id: 1
  };

  const resultado = await enviarDatos("/api/facturacion", datosFactura);
  alert("Factura registrada correctamente");
});
// ===============================
// PRUEBA DE REGISTRO DE FACTURACIÓN
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const boton = document.createElement("button");
  boton.textContent = "Probar conexión API";
  boton.style.margin = "20px";
  boton.onclick = async () => {
    const datosFactura = {
      fecha_emision: "2026-08-24",
      numero_doc: "F001",
      tipo: "factura",
      base_usd: 100,
      iva_usd: 16,
      total_usd: 116,
      tipo_cambio: 40,
      base_bs: 4000,
      iva_bs: 640,
      total_bs: 4640,
      ret_iva_bs: 0,
      ret_islr_bs: 0,
      ret_municipal_bs: 0,
      cliente_id: 1,
      proyecto_id: 1
    };

    const resultado = await enviarDatos("/api/facturacion", datosFactura);
    alert("Factura registrada correctamente");
  };

  document.body.appendChild(boton);
});
