// ===============================
// CONEXIÓN CON API ESIS
// ===============================
const API_BASE = "https://esis-api.admonesisca.workers.dev";

async function enviarDatos(ruta, datos) {
  try {
    const respuesta = await fetch(`${API_BASE}${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();
    console.log("Respuesta del servidor:", resultado);
    return resultado;
  } catch (error) {
    console.error("Error al conectar con la API:", error);
  }
}

/**
 * ESIS, C.A. - CONTROLADOR PRINCIPAL Y APLICACIÓN
 * Enrutador de Pestañas, Modales, Notificaciones Toast y Sincronización Global
 */

(function(window) {
  'use strict';

  const ESIS_APP = {
    currentTab: 'tab-dashboard',

    init() {
      console.log('Iniciando Sistema Administrativo ESIS, C.A...');
      this.bindNavigation();
      this.bindModals();
      this.bindGlobalFilters();
      this.bindRatesEditor();
      this.updateRatesDisplay();

      // Inicializar módulos
      if (window.DashboardModule) window.DashboardModule.init();
      if (window.FacturacionModule) window.FacturacionModule.init();
      if (window.BancosModule) window.BancosModule.init();
      if (window.GastosModule) window.GastosModule.init();
      if (window.CxCModule) window.CxCModule.init();
      if (window.CxPModule) window.CxPModule.init();
      if (window.ConciliacionModule) window.ConciliacionModule.init();
      if (window.ProyectosModule) window.ProyectosModule.init();

      // Escuchar cambios de estado
      window.addEventListener('esis:state-changed', () => {
        this.updateRatesDisplay();
        this.populateGlobalProjectFilter();
      });

      this.populateGlobalProjectFilter();
    },

    // =========================================================================
    // NAVEGACIÓN ENTRE PESTAÑAS (TABS)
    // =========================================================================
    bindNavigation() {
      // Sidebar desktop
      const navItems = document.querySelectorAll('.sidebar .nav-item[data-tab]');
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          const tabId = item.getAttribute('data-tab');
          this.switchTab(tabId);
          // Cerrar sidebar en móviles tras hacer click
          document.querySelector('.sidebar')?.classList.remove('open');
        });
      });

      // Bottom nav móvil
      const mobileNavItems = document.querySelectorAll('.mobile-bottom-nav .mobile-nav-btn[data-tab]');
      mobileNavItems.forEach(item => {
        item.addEventListener('click', () => {
          const tabId = item.getAttribute('data-tab');
          this.switchTab(tabId);
        });
      });

      // Botón hamburguesa móvil
      const mobileMenuBtn = document.getElementById('mobileMenuBtn');
      if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
          document.querySelector('.sidebar')?.classList.toggle('open');
        });
      }
    },

    switchTab(tabId) {
      if (!tabId) return;
      this.currentTab = tabId;

      // Ocultar todas las pestañas y mostrar la activa
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });
      const activePane = document.getElementById(tabId);
      if (activePane) activePane.classList.add('active');

      // Actualizar clases de selección en la barra lateral
      document.querySelectorAll('.sidebar .nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
      });

      // Actualizar clases de selección en la barra móvil
      document.querySelectorAll('.mobile-bottom-nav .mobile-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
      });

      // Actualizar título de la página
      const titles = {
        'tab-dashboard': { title: 'Dashboard General', sub: 'Indicadores en tiempo real, Flujo de Caja y Rentabilidad' },
        'tab-facturacion': { title: 'Facturación & Emisión Fiscal', sub: 'Registro dual USD / Bs, retenciones e integración contable' },
        'tab-bancos': { title: 'Gestión Bancaria & Cripto', sub: 'Binance (USDT), Banco de Venezuela (Bs) y Banesco JM (Bs)' },
        'tab-gastos': { title: 'Control de Gastos Operativos', sub: 'Clasificación por centros de costo, proyectos y proveedores' },
        'tab-cxc': { title: 'Cuentas por Cobrar (CxC)', sub: 'Control de mora a clientes petroleros e industriales' },
        'tab-cxp': { title: 'Cuentas por Pagar (CxP)', sub: 'Control de obligaciones con proveedores y subcontratistas' },
        'tab-conciliacion': { title: 'Conciliación Bancaria', sub: 'Auditoría mensual de extractos y diferencias en libros' },
        'tab-proyectos': { title: 'Catálogo de Proyectos & Configuración', sub: 'Gestión de hasta 20 proyectos simultáneos y respaldos' }
      };

      const titleInfo = titles[tabId] || { title: 'Sistema Administrativo', sub: 'ESIS, C.A.' };
      const mainTitle = document.getElementById('pageMainTitle');
      const subTitle = document.getElementById('pageSubTitle');
      if (mainTitle) mainTitle.textContent = titleInfo.title;
      if (subTitle) subTitle.textContent = titleInfo.sub;

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // =========================================================================
    // MODALES
    // =========================================================================
    bindModals() {
      // Botones para cerrar modal
      document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
          const modalId = btn.getAttribute('data-close-modal');
          this.closeModal(modalId);
        });
      });

      // Cerrar al hacer click en el fondo
      document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) {
            backdrop.classList.remove('active');
          }
        });
      });
    },

    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    },

    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    },

    // =========================================================================
    // TASAS DE CAMBIO (RATES)
    // =========================================================================
    updateRatesDisplay() {
      const rates = window.EsisStore.getRates();
      const bcvEl = document.getElementById('headerRateBCV');
      const usdtEl = document.getElementById('headerRateUSDT');

      if (bcvEl) bcvEl.textContent = `Bs ${rates.bcv.toFixed(2)}`;
      if (usdtEl) usdtEl.textContent = `Bs ${rates.usdt.toFixed(2)}`;
    },

    bindRatesEditor() {
      const editBtn = document.getElementById('btnOpenRatesModal');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          const rates = window.EsisStore.getRates();
          const bcvInput = document.getElementById('editRateBCVInput');
          const usdtInput = document.getElementById('editRateUSDTInput');
          if (bcvInput) bcvInput.value = rates.bcv.toFixed(2);
          if (usdtInput) usdtInput.value = rates.usdt.toFixed(2);
          this.openModal('modalEditRates');
        });
      }

      const form = document.getElementById('editRatesForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const bcv = parseFloat(document.getElementById('editRateBCVInput')?.value);
          const usdt = parseFloat(document.getElementById('editRateUSDTInput')?.value);

          if (bcv > 0 && usdt > 0) {
            window.EsisStore.updateRates(bcv, usdt);
            this.showToast('Tasas Actualizadas', `BCV: Bs ${bcv.toFixed(2)} | USDT: Bs ${usdt.toFixed(2)}`, 'success');
            this.closeModal('modalEditRates');
          }
        });
      }
    },

    // =========================================================================
    // FILTROS GLOBALES
    // =========================================================================
    populateGlobalProjectFilter() {
      const filterSelect = document.getElementById('globalProjectFilter');
      if (!filterSelect) return;

      const currentVal = filterSelect.value || 'ALL';
      const projects = window.EsisStore.getProjects();

      filterSelect.innerHTML = '<option value="ALL">🌐 Todos los Proyectos (20)</option>' +
        projects.map(p => `<option value="${p.id}" ${p.id === currentVal ? 'selected' : ''}>${p.code} - ${p.name}</option>`).join('');

      filterSelect.onchange = () => {
        window.dispatchEvent(new CustomEvent('esis:state-changed'));
      };
    },

    bindGlobalFilters() {
      const clientFilter = document.getElementById('dashboardClientFilter');
      if (clientFilter) {
        const clients = window.EsisStore.getClients();
        clientFilter.innerHTML = '<option value="ALL">Todos los Clientes</option>' +
          clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        clientFilter.addEventListener('change', () => {
          if (window.DashboardModule) window.DashboardModule.render();
        });
      }
    },

    // =========================================================================
    // TOAST NOTIFICATIONS
    // =========================================================================
    showToast(title, message, type = 'info') {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;

      let icon = 'ℹ️';
      if (type === 'success') icon = '✅';
      else if (type === 'danger') icon = '❌';
      else if (type === 'warning') icon = '⚠️';

      toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
          <h4>${title}</h4>
          <p>${message}</p>
        </div>
      `;

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }
  };

  window.ESIS_APP = ESIS_APP;

  // Iniciar al cargar el DOM
  document.addEventListener('DOMContentLoaded', () => {
    window.ESIS_APP.init();
  });

})(typeof window !== 'undefined' ? window : this);
}
