(() => {
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      menuToggle.textContent = isOpen ? '×' : '☰';
    });
    mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      menuToggle.textContent = '☰';
    }));
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  const dateInput = document.getElementById('travelDate');
  if (dateInput) {
    const now = new Date();
    dateInput.min = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  const tripType = document.getElementById('tripType');
  document.querySelectorAll('.trip-tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.trip-tab').forEach(item => item.classList.remove('active'));
    tab.classList.add('active');
    if (tripType) tripType.value = tab.dataset.trip || 'One way';
  }));

  document.querySelectorAll('.rate-cta[data-vehicle]').forEach(link => link.addEventListener('click', () => {
    const vehicleSelect = document.querySelector('select[name="vehicle"]');
    if (vehicleSelect) vehicleSelect.value = link.dataset.vehicle;
  }));

  const form = document.getElementById('bookingForm');
  const result = document.getElementById('formResult');
  const submit = document.getElementById('submitBtn');
  if (form && result && submit) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      result.className = 'form-result';
      result.textContent = '';
      submit.disabled = true;
      submit.innerHTML = 'Sending request…';
      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());
      payload.passengers = Number(payload.passengers || 1);
      try {
        const response = await fetch((window.DIVINE_API_BASE || '') + '/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.ok) throw new Error(body.error || 'We could not submit your request. Please try again.');
        result.className = 'form-result show success';
        result.textContent = body.message || 'Your trip enquiry has been received. We will contact you to confirm details.';
        form.reset();
        if (tripType) tripType.value = 'One way';
        document.querySelectorAll('.trip-tab').forEach(item => item.classList.toggle('active', item.dataset.trip === 'One way'));
        if (dateInput) {
          const now = new Date();
          dateInput.min = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
        }
      } catch (error) {
        result.className = 'form-result show error';
        result.textContent = error.message || 'Something went wrong. Please try again.';
      } finally {
        submit.disabled = false;
        submit.innerHTML = 'Request a trip <span>↗</span>';
      }
    });
  }
})();