// Scroll suave para anclas (mantiene comportamiento original)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', href);
  });
});

// Acordeones accesibles
document.querySelectorAll('.accordion').forEach(acc => {
  const btn = acc.querySelector('.accordion-toggle');
  const panel = acc.querySelector('.accordion-panel');

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    panel.hidden = expanded;
    // focus al primer item para accesibilidad
    if (!expanded) {
      const first = panel.querySelector('li');
      if (first) first.focus();
    }
  });
});

// --- FILTRADO POR MENÚ SUPERIOR (desktop) ---
// Comportamiento: al clicar una opción del top-nav se muestran solo las secciones correspondientes.
// Si se vuelve a clicar la misma opción, se restaura la vista completa.
const navFilters = document.querySelectorAll('.nav-filter');
let activeFilter = null;

function showOnlySection(sectionKey) {
  document.querySelectorAll('.section').forEach(sec => {
    if (sec.dataset.section === sectionKey) {
      sec.classList.remove('hidden');
      // abrir acordeón de la sección para visibilidad
      const acc = sec.querySelector('.accordion');
      if (acc) {
        const btn = acc.querySelector('.accordion-toggle');
        const panel = acc.querySelector('.accordion-panel');
        btn.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
      }
    } else {
      sec.classList.add('hidden');
    }
  });
  // marcar nav activo
  navFilters.forEach(n => n.classList.toggle('active', n.dataset.target === sectionKey));
  activeFilter = sectionKey;
}

function showAllSections() {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('hidden'));
  // cerrar todos los acordeones
  document.querySelectorAll('.accordion-toggle').forEach(btn => btn.setAttribute('aria-expanded','false'));
  document.querySelectorAll('.accordion-panel').forEach(p => p.hidden = true);
  navFilters.forEach(n => n.classList.remove('active'));
  activeFilter = null;
}

navFilters.forEach(link => {
  link.addEventListener('click', (e) => {
    // Solo aplicar filtro si el menú está visible (desktop). Si está oculto, no interferir.
    const computed = window.getComputedStyle(document.querySelector('.top-nav'));
    if (computed.display === 'none') return;

    e.preventDefault();
    const key = link.dataset.target;
    if (activeFilter === key) {
      showAllSections();
    } else {
      showOnlySection(key);
      // scroll a la sección seleccionada
      const sec = document.getElementById(key);
      if (sec) sec.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });
});

// --- BUSCADOR: filtra herramientas y muestra solo las secciones con coincidencias --- //
const search = document.getElementById('search');
search.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();

  // Si hay filtro activo por nav, quitarlo para que el buscador controle la vista
  if (activeFilter) {
    navFilters.forEach(n => n.classList.remove('active'));
    activeFilter = null;
  }

  if (!q) {
    // Restaurar todo
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('hidden'));
    document.querySelectorAll('.accordion-panel').forEach(p => p.hidden = true);
    document.querySelectorAll('.accordion-toggle').forEach(t => t.setAttribute('aria-expanded','false'));
    document.querySelectorAll('.tool-list li').forEach(li => li.style.display = '');
    return;
  }

  // Para cada sección, comprobar si alguno de sus items coincide
  document.querySelectorAll('.section').forEach(sec => {
    const items = sec.querySelectorAll('.tool-list li');
    let anyMatch = false;
    items.forEach(li => {
      const text = li.textContent.toLowerCase();
      if (text.includes(q)) {
        li.style.display = '';
        anyMatch = true;
      } else {
        li.style.display = 'none';
      }
    });

    if (anyMatch) {
      sec.classList.remove('hidden');
      // abrir acordeón si está cerrado
      const acc = sec.querySelector('.accordion');
      if (acc) {
        const btn = acc.querySelector('.accordion-toggle');
        const panel = acc.querySelector('.accordion-panel');
        btn.setAttribute('aria-expanded','true');
        panel.hidden = false;
      }
    } else {
      sec.classList.add('hidden');
    }
  });
});

// --- CLICK EN UNA HERRAMIENTA: abrir URL oficial o mostrar modal si no existe --- //
const modal = document.getElementById('tool-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalCopy = document.getElementById('modal-copy');
const modalClose = document.getElementById('modal-close');

function openModal(name) {
  modalTitle.textContent = name;
  modalBody.textContent = 'No hay URL configurada. Puedes copiar el nombre y buscarla manualmente.';
  modal.setAttribute('aria-hidden','false');
  modalCopy.dataset.name = name;
}

function closeModal() {
  modal.setAttribute('aria-hidden','true');
  modalCopy.dataset.name = '';
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

modalCopy.addEventListener('click', () => {
  const name = modalCopy.dataset.name || '';
  if (!name) return;
  navigator.clipboard?.writeText(name).then(() => {
    modalBody.textContent = 'Nombre copiado al portapapeles.';
  }).catch(() => {
    modalBody.textContent = 'No se pudo copiar automáticamente. Selecciona y copia manualmente.';
  });
});

document.querySelectorAll('.tool-item').forEach(li => {
  li.addEventListener('click', () => {
    const url = li.dataset.url || '#';
    const name = li.textContent.trim();
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener');
    } else {
      openModal(name);
    }
  });

  // Soporte teclado: Enter abre igual que click
  li.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      li.click();
    }
  });
});

// --- Deep link: si la URL tiene hash, abrir acordeón correspondiente --- //
window.addEventListener('load', () => {
  const hash = location.hash.replace('#','');
  if (!hash) return;
  const section = document.getElementById(hash);
  if (section) {
    // abrir acordeón si existe
    const acc = section.querySelector('.accordion');
    if (acc) {
      const btn = acc.querySelector('.accordion-toggle');
      const panel = acc.querySelector('.accordion-panel');
      btn.setAttribute('aria-expanded','true');
      panel.hidden = false;
      setTimeout(() => section.scrollIntoView({behavior:'smooth', block:'start'}), 120);
    } else {
      section.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }
});