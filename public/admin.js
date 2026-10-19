(() => {
  const rows = document.getElementById('enquiryRows');
  const notice = document.getElementById('notice');
  const filter = document.getElementById('statusFilter');
  let enquiries = [];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = value => value ? new Date(value).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : '—';

  function showNotice(message, error=false) {
    notice.textContent = message;
    notice.className = error ? 'notice error' : 'notice';
  }
  function updateSummary() {
    document.getElementById('totalCount').textContent = enquiries.length;
    document.getElementById('newCount').textContent = enquiries.filter(e => e.status === 'New').length;
    document.getElementById('confirmedCount').textContent = enquiries.filter(e => e.status === 'Confirmed').length;
  }
  function render() {
    const selected = filter.value;
    const shown = enquiries.filter(e => selected === 'All' || e.status === selected);
    if (!shown.length) {
      rows.innerHTML = '<tr><td colspan="7">No enquiries match this filter.</td></tr>';
      return;
    }
    rows.innerHTML = shown.map(e => {
      const options = ['New','Contacted','Confirmed','Completed','Cancelled'].map(s => '<option '+(s===e.status?'selected':'')+'>'+s+'</option>').join('');
      const route = '<div class="route"><strong>'+esc(e.pickup)+' → '+esc(e.destination)+'</strong><small>'+esc(e.travel_date || 'Date not specified')+' · '+esc(e.trip_type)+'</small>'+(e.message?'<small>'+esc(e.message)+'</small>':'')+'</div>';
      return '<tr data-id="'+Number(e.id)+'"><td>'+esc(fmtDate(e.created_at))+'</td><td><strong>'+esc(e.full_name)+'</strong><small>'+esc(e.phone)+'</small></td><td>'+route+'</td><td>'+esc(e.trip_type)+'</td><td>'+esc(e.passengers)+'</td><td><select class="status-select" aria-label="Status for enquiry '+Number(e.id)+'">'+options+'</select></td><td><button class="action-btn save-status">Save</button><a class="action-btn" href="https://wa.me/'+esc(String(e.phone).replace(/\D/g,''))+'?text='+encodeURIComponent('Hello '+e.full_name+', this is Divine Travels following up on your trip enquiry from '+e.pickup+' to '+e.destination+'.')+'" target="_blank" rel="noopener noreferrer">WhatsApp</a></td></tr>';
    }).join('');
    rows.querySelectorAll('.save-status').forEach(button => button.addEventListener('click', saveStatus));
  }
  async function load() {
    showNotice('Loading enquiries…');
    try {
      const response = await fetch((window.DIVINE_API_BASE || '') + '/api/admin/enquiries', {headers:{'Accept':'application/json'}});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Admin access required. Sign in with an authorized project admin account, then reload this page.' : (data.error || 'Unable to load enquiries.'));
      enquiries = Array.isArray(data.enquiries) ? data.enquiries : [];
      updateSummary();
      render();
      showNotice('Loaded '+enquiries.length+' enquiry record(s).');
    } catch (error) {
      rows.innerHTML = '<tr><td colspan="7">Enquiries could not be loaded.</td></tr>';
      showNotice(error.message || 'Unable to load enquiries.', true);
    }
  }
  async function saveStatus(event) {
    const button = event.currentTarget;
    const tr = button.closest('tr');
    const id = Number(tr.dataset.id);
    const status = tr.querySelector('select').value;
    button.disabled = true;
    button.textContent = 'Saving…';
    try {
      const response = await fetch((window.DIVINE_API_BASE || '') + '/api/admin/enquiries', {method:'PATCH',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({id,status})});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not update status.');
      const entry = enquiries.find(e => Number(e.id) === id);
      if (entry) entry.status = data.enquiry.status;
      updateSummary(); render(); showNotice('Enquiry #'+id+' updated to '+status+'.');
    } catch (error) {
      showNotice(error.message || 'Could not update status.', true);
      button.disabled = false; button.textContent = 'Save';
    }
  }
  document.getElementById('refreshBtn').addEventListener('click', load);
  filter.addEventListener('change', render);
  load();
})();