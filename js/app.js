// ===== Sidebar Toggle =====
document.addEventListener('DOMContentLoaded', function() {

  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('.sidebar-toggle');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function() {

      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        sidebar.classList.toggle('expanded-mobile');
      } else {
        sidebar.classList.toggle('collapsed');
      }

    });
  }

  // =====================================================
  // Toggle Ingreso / Gasto
  // =====================================================

  const toggleBtns = document.querySelectorAll('.toggle-btn');

  toggleBtns.forEach(function(btn) {

    btn.addEventListener('click', function() {

      toggleBtns.forEach(function(b) {
        b.classList.remove('active');
      });

      btn.classList.add('active');

      const submitBtn = document.querySelector('.btn-submit-movement');

      if (submitBtn) {
        submitBtn.textContent =
          btn.textContent === 'Ingreso'
            ? 'Registrar Ingreso'
            : 'Registrar Gasto';
      }

    });

  });

  // =====================================================
  // Filter tabs
  // =====================================================

  const tabs = document.querySelectorAll('.filter-tabs .tab');

  tabs.forEach(function(tab) {

    tab.addEventListener('click', function() {

      tabs.forEach(function(t) {
        t.classList.remove('active');
      });

      tab.classList.add('active');

    });

  });

  // =====================================================
  // Mobile nav toggle
  // =====================================================

  const mobileMenuBtn = document.querySelector('.mobile-menu');
  const landingNav = document.querySelector('.landing-nav');

  if (mobileMenuBtn && landingNav) {

    mobileMenuBtn.addEventListener('click', function() {
      landingNav.classList.toggle('nav-open');
    });

  }

  // =====================================================
  // MODAL METAS
  // =====================================================

  const modal = document.getElementById('goalModal');
  const closeModal = document.getElementById('closeModal');

  const openButtons = document.querySelectorAll('.btn.btn-primary');

  if (modal) {

    openButtons.forEach(function(btn) {

      if (
        btn.textContent.includes('Nueva Meta') ||
        btn.textContent.includes('primera meta')
      ) {

        btn.addEventListener('click', function() {
          modal.classList.add('active');
        });

      }

    });

    // Cerrar modal
    if (closeModal) {

      closeModal.addEventListener('click', function() {
        modal.classList.remove('active');
      });

    }

    // Cerrar haciendo click fuera
    modal.addEventListener('click', function(e) {

      if (e.target === modal) {
        modal.classList.remove('active');
      }

    });

  }

  // =====================================================
  // CREAR METAS
  // =====================================================

  const goalForm = document.getElementById('goalForm');

  if (goalForm) {

    const emptyState = document.querySelector('.empty-state');
    const cardContainer = emptyState.parentElement;

    const goalsContainer = document.createElement('div');
    goalsContainer.classList.add('goals-container');

    cardContainer.appendChild(goalsContainer);

    goalForm.addEventListener('submit', function(e) {

      e.preventDefault();

      const name = document.getElementById('goalName').value;
      const target = Number(document.getElementById('goalTarget').value);
      const saved = Number(document.getElementById('goalSaved').value);
      const date = document.getElementById('goalDate').value;

      const percentage = Math.min((saved / target) * 100, 100);

      // Ocultar empty state
      emptyState.style.display = 'none';

      // Crear card
      const goalCard = document.createElement('div');
      goalCard.classList.add('goal-card');

      goalCard.innerHTML = `
        <div class="goal-top">
          <h3>${name}</h3>
          <strong>${percentage.toFixed(0)}%</strong>
        </div>

        <div class="goal-progress">

          <div class="progress-bar">
            <div 
              class="progress-fill" 
              style="width:${percentage}%">
            </div>
          </div>

          <div class="goal-values">
            <span>$${saved.toLocaleString()}</span>
            <span>$${target.toLocaleString()}</span>
          </div>

        </div>

        ${
          date
            ? `<p class="subtitle">Meta: ${date}</p>`
            : ''
        }
      `;

      goalsContainer.appendChild(goalCard);

      // Cerrar modal
      modal.classList.remove('active');

      // Limpiar formulario
      goalForm.reset();

    });

  }

});