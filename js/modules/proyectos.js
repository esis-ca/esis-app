/**
 * ESIS, C.A. - MÓDULO PROYECTOS & CONFIGURACIÓN
 * Gestión de hasta 20 Proyectos Simultáneos, Directorio de Clientes y Respaldo JSON
 */

(function(window) {
  'use strict';

  const ProyectosModule = {
    init() {
      this.bindEvents();
      this.render();
      window.addEventListener('esis:state-changed', () => this.render());
    },

    bindEvents() {
      const projectForm = document.getElementById('newProjectForm');
      if (projectForm) {
        projectForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSaveProject();
        });
      }

      const clientForm = document.getElementById('newClientForm');
      if (clientForm) {
        clientForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSaveClient();
        });
      }

      // Botones de respaldo
      const exportBtn = document.getElementById('btnExportBackup');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => window.EsisStore.exportJSON());
      }

      const importInput = document.getElementById('importBackupInput');
      if (importInput) {
        importInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const res = window.EsisStore.importJSON(event.target.result);
              if (res.success) {
                window.ESIS_APP?.showToast('Respaldo Restaurado', res.message, 'success');
              } else {
                window.ESIS_APP?.showToast('Error de Respaldo', res.message, 'danger');
              }
            };
            reader.readAsText(file);
          }
        });
      }

      const resetBtn = document.getElementById('btnResetDemoData');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('¿Está seguro de que desea reiniciar toda la base de datos a los valores de prueba originales de ESIS, C.A.? Esta acción no se puede deshacer.')) {
            window.EsisStore.resetToDefault();
            window.ESIS_APP?.showToast('Sistema Reiniciado', 'Datos restaurados a la configuración inicial.', 'info');
          }
        });
      }
    },

    render() {
      this.renderProjectsList();
      this.renderClientsList();
    },

    renderProjectsList() {
      const tbody = document.getElementById('projectsTableBody');
      if (!tbody) return;

      const store = window.EsisStore;
      const projects = store.getProjects();
      const metrics = store.getDashboardMetrics();
      const profitMap = {};
      metrics.projectProfitability.forEach(p => { profitMap[p.id] = p; });

      // Actualizar contador (ej. 12 de 20 proyectos)
      const countEl = document.getElementById('projectSlotsCounter');
      if (countEl) {
        countEl.textContent = `${projects.length} / 20 Proyectos`;
      }

      tbody.innerHTML = projects.map(p => {
        const prof = profitMap[p.id] || { revenueUSD: 0, costUSD: 0, marginUSD: 0, marginPercent: 0 };
        const statusBadge = p.status === 'ACTIVO' ? 'badge-paid' : 'badge-neutral';

        return `
          <tr>
            <td><strong>${p.code}</strong></td>
            <td><strong>${p.name}</strong><br><small style="color:var(--text-muted);">${p.description || ''}</small></td>
            <td><strong>${p.client}</strong></td>
            <td>$ ${p.budgetUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="color:var(--primary); font-weight:700;">$ ${prof.revenueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="color:var(--danger); font-weight:600;">$ ${prof.costUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="font-weight:800; color:${prof.marginUSD >= 0 ? 'var(--success)' : 'var(--danger)'};">$ ${prof.marginUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${prof.marginPercent}%)</td>
            <td><span class="badge-status ${statusBadge}">${p.status}</span></td>
            <td>
              <button class="btn btn-sm btn-outline" style="color:var(--danger);" onclick="window.ProyectosModule.deleteProject('${p.id}')">🗑️</button>
            </td>
          </tr>
        `;
      }).join('');
    },

    renderClientsList() {
      const tbody = document.getElementById('clientsTableBody');
      if (!tbody) return;

      const clients = window.EsisStore.getClients();
      tbody.innerHTML = clients.map(c => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td><code>${c.rif}</code></td>
          <td>${c.contact || 'N/A'}</td>
          <td>${c.phone || ''}<br><small style="color:var(--text-muted);">${c.email || ''}</small></td>
        </tr>
      `).join('');
    },

    handleSaveProject() {
      try {
        const name = document.getElementById('projName')?.value.trim();
        const client = document.getElementById('projClient')?.value.trim();
        const budgetUSD = parseFloat(document.getElementById('projBudgetUSD')?.value) || 0;
        const description = document.getElementById('projDescription')?.value.trim();

        if (!name || !client) {
          window.ESIS_APP?.showToast('Campos Requeridos', 'Ingrese nombre del proyecto y cliente.', 'danger');
          return;
        }

        const newP = window.EsisStore.addProject({
          name,
          client,
          budgetUSD,
          description,
          status: 'ACTIVO'
        });

        window.ESIS_APP?.showToast('Proyecto Creado', `Proyecto "${newP.name}" registrado con éxito.`, 'success');
        window.ESIS_APP?.closeModal('modalNewProject');
        document.getElementById('newProjectForm')?.reset();
      } catch (err) {
        window.ESIS_APP?.showToast('Límite de Proyectos', err.message, 'danger');
      }
    },

    handleSaveClient() {
      try {
        const name = document.getElementById('cliName')?.value.trim();
        const rif = document.getElementById('cliRif')?.value.trim();
        const contact = document.getElementById('cliContact')?.value.trim();
        const phone = document.getElementById('cliPhone')?.value.trim();
        const email = document.getElementById('cliEmail')?.value.trim();

        if (!name || !rif) {
          window.ESIS_APP?.showToast('Campos Requeridos', 'Ingrese razón social y RIF del cliente.', 'danger');
          return;
        }

        const newC = window.EsisStore.addClient({ name, rif, contact, phone, email });
        window.ESIS_APP?.showToast('Cliente Registrado', `Cliente ${newC.name} agregado al directorio.`, 'success');
        window.ESIS_APP?.closeModal('modalNewClient');
        document.getElementById('newClientForm')?.reset();
      } catch (err) {
        window.ESIS_APP?.showToast('Error', err.message, 'danger');
      }
    },

    deleteProject(id) {
      if (confirm('¿Está seguro de que desea eliminar este proyecto?')) {
        window.EsisStore.deleteProject(id);
        window.ESIS_APP?.showToast('Proyecto Eliminado', 'Proyecto retirado del catálogo.', 'info');
      }
    }
  };

  window.ProyectosModule = ProyectosModule;
})(typeof window !== 'undefined' ? window : this);
