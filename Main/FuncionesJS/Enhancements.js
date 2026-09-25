// Calendario personalizado para los campos de fecha.
// No depende del selector nativo del navegador: dibuja su propio calendario
// con los colores de la web y permite saltar de mes/año con selects, para
// que elegir una fecha de nacimiento (por ejemplo) sea rápido.
//
// Cada input[type="date"] original se reemplaza por:
//   - un input de texto (solo lectura) que muestra la fecha en formato largo
//   - un botón con ícono de calendario
//   - un input oculto (type="hidden") que guarda el valor real en formato
//     AAAA-MM-DD, con el mismo "name" que el campo original, para que el
//     formulario se envíe exactamente igual que antes.
//
// Si el navegador no ejecuta JavaScript, el input original nunca se
// reemplaza y el formulario sigue funcionando con el selector nativo.

document.addEventListener('DOMContentLoaded', function () {
  var MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  var DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  var originals = Array.prototype.slice.call(document.querySelectorAll('input[type="date"]'));
  originals.forEach(createDatePicker);

  function createDatePicker(original) {
    var name = original.name;
    var id = original.id;
    var isRequired = original.required;
    var min = original.min ? parseISO(original.min) : null;
    var max = original.max ? parseISO(original.max) : null;
    var initialValue = original.value ? parseISO(original.value) : null;

    // --- Construir la estructura nueva ---
    var wrapper = document.createElement('div');
    wrapper.className = 'dp';

    var display = document.createElement('input');
    display.type = 'text';
    display.id = id; // el <label for="..."> del formulario sigue apuntando aquí
    display.className = 'dp-display';
    display.placeholder = 'Selecciona una fecha';
    display.readOnly = true;
    display.autocomplete = 'off';
    if (isRequired) display.required = true;
    display.setAttribute('aria-haspopup', 'dialog');

    var icon = document.createElement('button');
    icon.type = 'button';
    icon.className = 'dp-icon';
    icon.setAttribute('aria-label', 'Abrir calendario');
    icon.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M3 9.5H21" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M8 3V6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M16 3V6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '</svg>';

    var hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = name;

    var popup = document.createElement('div');
    popup.className = 'dp-popup';
    popup.setAttribute('role', 'dialog');

    wrapper.appendChild(display);
    wrapper.appendChild(icon);
    wrapper.appendChild(hidden);
    wrapper.appendChild(popup);

    original.parentNode.replaceChild(wrapper, original);

    // --- Estado ---
    var selected = initialValue;
    var view = initialValue ? new Date(initialValue) : clampToRange(new Date());

    if (initialValue) {
      hidden.value = toISO(initialValue);
      display.value = formatLong(initialValue);
    }

    function clampToRange(d) {
      if (min && d < min) return new Date(min);
      if (max && d > max) return new Date(max);
      return d;
    }

    // --- Abrir / cerrar ---
    function open() {
      document.querySelectorAll('.dp-popup.is-open').forEach(function (p) {
        if (p !== popup) p.classList.remove('is-open');
      });
      renderCalendar();
      popup.classList.add('is-open');
      document.addEventListener('click', onOutsideClick);
      document.addEventListener('keydown', onKeyDown);
    }
    function close() {
      popup.classList.remove('is-open');
      document.removeEventListener('click', onOutsideClick);
      document.removeEventListener('keydown', onKeyDown);
    }
    function onOutsideClick(e) {
      if (!wrapper.contains(e.target)) close();
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') close();
    }
    function toggle(e) {
      e.stopPropagation();
      if (popup.classList.contains('is-open')) close();
      else open();
    }

    display.addEventListener('click', toggle);
    icon.addEventListener('click', toggle);
    display.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(e);
      }
    });

    // --- Dibujar el calendario ---
    function renderCalendar() {
      popup.innerHTML = '';

      var header = document.createElement('div');
      header.className = 'dp-header';

      var prevBtn = navButton('&#8249;', 'Mes anterior', function () {
        view.setMonth(view.getMonth() - 1);
        renderCalendar();
      });

      var nextBtn = navButton('&#8250;', 'Mes siguiente', function () {
        view.setMonth(view.getMonth() + 1);
        renderCalendar();
      });

      var monthSelect = document.createElement('select');
      monthSelect.className = 'dp-select dp-select-month';
      MESES.forEach(function (m, i) {
        var opt = document.createElement('option');
        opt.value = i;
        opt.textContent = capitalize(m);
        if (i === view.getMonth()) opt.selected = true;
        monthSelect.appendChild(opt);
      });
      monthSelect.addEventListener('change', function () {
        view.setMonth(parseInt(monthSelect.value, 10));
        renderCalendar();
      });

      var yearSelect = document.createElement('select');
      yearSelect.className = 'dp-select dp-select-year';
      var currentYear = new Date().getFullYear();
      var startYear = min ? min.getFullYear() : currentYear - 100;
      var endYear = max ? max.getFullYear() : currentYear + 1;
      for (var y = endYear; y >= startYear; y--) {
        var yopt = document.createElement('option');
        yopt.value = y;
        yopt.textContent = y;
        if (y === view.getFullYear()) yopt.selected = true;
        yearSelect.appendChild(yopt);
      }
      yearSelect.addEventListener('change', function () {
        view.setFullYear(parseInt(yearSelect.value, 10));
        renderCalendar();
      });

      var selects = document.createElement('div');
      selects.className = 'dp-selects';
      selects.appendChild(monthSelect);
      selects.appendChild(yearSelect);

      header.appendChild(prevBtn);
      header.appendChild(selects);
      header.appendChild(nextBtn);
      popup.appendChild(header);

      var dayLabels = document.createElement('div');
      dayLabels.className = 'dp-daylabels';
      DIAS.forEach(function (d) {
        var span = document.createElement('span');
        span.textContent = d;
        dayLabels.appendChild(span);
      });
      popup.appendChild(dayLabels);

      var grid = document.createElement('div');
      grid.className = 'dp-grid';

      var firstOfMonth = new Date(view.getFullYear(), view.getMonth(), 1);
      var startOffset = (firstOfMonth.getDay() + 6) % 7; // semana empieza en lunes
      var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

      for (var i = 0; i < startOffset; i++) {
        var blank = document.createElement('span');
        blank.className = 'dp-day dp-day--empty';
        grid.appendChild(blank);
      }

      var today = new Date();

      var addDayButton = function (day) {
        var cellDate = new Date(view.getFullYear(), view.getMonth(), day);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dp-day';
        btn.textContent = day;

        var disabled = (min && cellDate < min) || (max && cellDate > max);
        if (disabled) {
          btn.disabled = true;
          btn.classList.add('dp-day--disabled');
        }
        if (selected && sameDay(cellDate, selected)) {
          btn.classList.add('dp-day--selected');
        }
        if (sameDay(cellDate, today)) {
          btn.classList.add('dp-day--today');
        }

        btn.addEventListener('click', function () {
          selected = cellDate;
          hidden.value = toISO(cellDate);
          display.value = formatLong(cellDate);
          display.classList.remove('error');
          close();
          hidden.dispatchEvent(new Event('change', { bubbles: true }));
        });

        grid.appendChild(btn);
      };

      for (var day = 1; day <= daysInMonth; day++) {
        addDayButton(day);
      }

      popup.appendChild(grid);

      var footer = document.createElement('div');
      footer.className = 'dp-footer';

      var todayBtn = document.createElement('button');
      todayBtn.type = 'button';
      todayBtn.className = 'dp-today-btn';
      todayBtn.textContent = 'Hoy';
      todayBtn.addEventListener('click', function () {
        var t = clampToRange(new Date());
        selected = t;
        hidden.value = toISO(t);
        display.value = formatLong(t);
        view = new Date(t);
        display.classList.remove('error');
        close();
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
      });

      var clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'dp-clear-btn';
      clearBtn.textContent = 'Limpiar';
      clearBtn.addEventListener('click', function () {
        selected = null;
        hidden.value = '';
        display.value = '';
        close();
      });

      footer.appendChild(todayBtn);
      footer.appendChild(clearBtn);
      popup.appendChild(footer);
    }

    function navButton(html, label, onClick) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dp-nav';
      btn.innerHTML = html;
      btn.setAttribute('aria-label', label);
      btn.addEventListener('click', onClick);
      return btn;
    }

    // Validación propia: los inputs "hidden" no participan en la
    // validación nativa del navegador, así que si el campo es obligatorio
    // lo verificamos nosotros mismos al enviar el formulario.
    var form = wrapper.closest('form');
    if (form && isRequired) {
      form.addEventListener('submit', function (e) {
        if (!hidden.value) {
          e.preventDefault();
          display.classList.add('error');
          display.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }

  function parseISO(str) {
    var parts = str.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  function toISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }
  function formatLong(d) {
    return d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear();
  }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
});