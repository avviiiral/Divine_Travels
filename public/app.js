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

  // This is a static-site booking flow: it opens WhatsApp with the enquiry details.
  // No server, database, API key, or backend deployment is required.
  const form = document.getElementById('bookingForm');
  const result = document.getElementById('formResult');
  const submit = document.getElementById('submitBtn');
  if (form && result && submit) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const fields = [
        ['Name', data.get('fullName')],
        ['Phone', data.get('phone')],
        ['Email', data.get('email')],
        ['Trip type', data.get('tripType')],
        ['Pickup', data.get('pickup')],
        ['Destination', data.get('destination')],
        ['Travel date', data.get('travelDate')],
        ['Pickup time', data.get('pickup_time')],
        ['Return date', data.get('return_date')],
        ['Vehicle', data.get('vehicle')],
        ['Estimated distance (km)', data.get('estimated_km')],
        ['Passengers', data.get('passengers')],
        ['Package stops', data.getAll('package_stop').join(', ')],
        ['Additional details', data.get('message')]
      ].filter(([, value]) => value !== null && String(value).trim() !== '');
      const message = 'Hello Divine Travels, I would like to enquire about a taxi booking.\n\n' +
        fields.map(([label, value]) => label + ': ' + value).join('\n');
      result.className = 'form-result show success';
      result.textContent = 'WhatsApp is opening with your trip details. Please send the message there to complete your enquiry.';
      const whatsappUrl = 'https://wa.me/919685366855?text=' + encodeURIComponent(message);
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    });
  }
})();
