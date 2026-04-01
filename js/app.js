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

  // Toggle Ingreso / Gasto
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  toggleBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      toggleBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');

      const submitBtn = document.querySelector('.btn-submit-movement');
      if (submitBtn) {
        submitBtn.textContent = btn.textContent === 'Ingreso' ? 'Registrar Ingreso' : 'Registrar Gasto';
      }
    });
  });

  // Filter tabs
  const tabs = document.querySelectorAll('.filter-tabs .tab');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
    });
  });

  // Mobile nav toggle (landing)
  const mobileMenuBtn = document.querySelector('.mobile-menu');
  const landingNav = document.querySelector('.landing-nav');
  if (mobileMenuBtn && landingNav) {
    mobileMenuBtn.addEventListener('click', function() {
      landingNav.classList.toggle('nav-open');
    });
  }
});
