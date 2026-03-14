// =============================================
// ADD LOCATION JS
// =============================================

const API_BASE = 'http://localhost:5000/api';

let pickMap;
let pickMarker;
let selectedFiles = [];

// Accessibility score weights
const WEIGHTS = {
  hasRamp: 1.5, hasElevator: 1.5, hasAccessibleToilet: 1.5,
  hasAccessibleParking: 1.0, hasWideDoors: 1.0, hasAudioSignals: 0.5,
  hasBrailleSignage: 0.5, hasAccessibleTransport: 1.0,
  hasLowFloorBus: 0.5, hasWheelchairAvailable: 0.5
};

// Initialize pick map
function initPickMap() {
  pickMap = L.map('pickMap', {
    center: [20.5937, 78.9629],
    zoom: 4
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(pickMap);

  pickMap.on('click', (e) => {
    const { lat, lng } = e.latlng;
    setCoordinates(lat, lng);
  });

  // Fly to user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      pickMap.setView([pos.coords.latitude, pos.coords.longitude], 12);
    });
  }
}

function setCoordinates(lat, lng) {
  document.getElementById('lat').value = lat.toFixed(6);
  document.getElementById('lng').value = lng.toFixed(6);

  if (pickMarker) pickMap.removeLayer(pickMarker);

  pickMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      html: `<div style="background:var(--saffron);width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })
  }).addTo(pickMap);

  pickMap.setView([lat, lng], 15);
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation not supported by your browser', 'error');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setCoordinates(pos.coords.latitude, pos.coords.longitude);
      showToast('📍 Location set to your current position!', 'success');
    },
    () => showToast('Could not get your location', 'error')
  );
}

// Toggle checkbox state
function toggleCheck(label) {
  const cb = label.querySelector('input[type="checkbox"]');
  cb.checked = !cb.checked;
  label.classList.toggle('checked', cb.checked);
  updateScorePreview();
}

// Calculate and display score preview
function updateScorePreview() {
  let score = 0;
  document.querySelectorAll('#featuresGrid input[type="checkbox"]:checked').forEach(cb => {
    const field = cb.closest('.checkbox-item').dataset.field;
    if (WEIGHTS[field]) score += WEIGHTS[field];
  });

  score = Math.min(Math.round(score), 10);
  const pct = score * 10;

  document.getElementById('scoreDisplay').textContent = score;
  document.getElementById('scoreBarFill').style.width = pct + '%';

  let label, color;
  if (score >= 7) { label = '🟢 Fully Accessible'; color = 'var(--accessible-full)'; }
  else if (score >= 4) { label = '🟡 Partially Accessible'; color = 'var(--accessible-partial)'; }
  else if (score > 0) { label = '🔴 Not Accessible'; color = 'var(--accessible-none)'; }
  else { label = 'Select features above'; color = 'var(--text-muted)'; }

  const el = document.getElementById('scoreLabel');
  el.textContent = label;
  el.style.color = color;
  document.getElementById('scoreDisplay').style.color = score > 0 ? color : 'var(--text-muted)';
}

// Photo preview
function previewPhotos(event) {
  const files = Array.from(event.target.files);
  selectedFiles = files.slice(0, 5);
  renderPhotoPreviews();
}

function renderPhotoPreviews() {
  const container = document.getElementById('photoPreview');
  container.innerHTML = selectedFiles.map((file, i) => {
    const url = URL.createObjectURL(file);
    return `
      <div class="photo-preview-item">
        <img src="${url}" alt="Photo ${i+1}">
        <button class="remove-photo" onclick="removePhoto(${i})">×</button>
      </div>
    `;
  }).join('');
}

function removePhoto(index) {
  selectedFiles.splice(index, 1);
  renderPhotoPreviews();
}

// Drag and drop
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('dropZone');

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    selectedFiles = files.slice(0, 5);
    renderPhotoPreviews();
  });

  // Also add listeners for checkbox inputs directly
  document.querySelectorAll('#featuresGrid input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updateScorePreview);
  });

  initPickMap();
});

// Form submission
document.getElementById('addLocationForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) {
    showAlert('Please login to add locations. <a href="login.html" style="color:var(--saffron);">Login here</a>', 'error');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Submitting...';

  const formData = new FormData();

  // Basic fields
  ['name', 'city', 'address', 'accessibilityType', 'description', 'lat', 'lng'].forEach(field => {
    formData.append(field, document.getElementById(field)?.value || '');
  });

  // Feature checkboxes
  ['hasRamp', 'hasElevator', 'hasAccessibleToilet', 'hasAccessibleParking',
   'hasWideDoors', 'hasAudioSignals', 'hasBrailleSignage', 'hasAccessibleTransport',
   'hasLowFloorBus', 'hasWheelchairAvailable'].forEach(field => {
    const el = document.querySelector(`[name="${field}"]`);
    formData.append(field, el ? el.checked.toString() : 'false');
  });

  // Photos
  selectedFiles.forEach(file => {
    formData.append('photos', file);
  });

  try {
    const res = await fetch(`${API_BASE}/locations`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      showAlert('✅ ' + data.message, 'success');
      showToast('Location added successfully!', 'success');
      setTimeout(() => {
        window.location.href = 'map.html';
      }, 2000);
    } else {
      showAlert('❌ ' + data.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = '📍 Submit Accessibility Report';
    }
  } catch (err) {
    showAlert('❌ Server connection failed. Please try again.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = '📍 Submit Accessibility Report';
  }
});

function showAlert(message, type) {
  const box = document.getElementById('alertBox');
  box.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  box.scrollIntoView({ behavior: 'smooth' });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
