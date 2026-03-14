// =============================================
// MAP.JS — SAHAJ Accessibility Map
// =============================================

const API_BASE = 'http://localhost:5000/api';

let map;
let allLocations = [];
let markers = {};
let activeFilters = { status: 'all', type: 'all' };

// Emoji icons per type
const typeEmojis = {
  hospital: '🏥', government_office: '🏛', metro_station: '🚇',
  bus_stop: '🚌', railway_station: '🚂', airport: '✈️',
  shopping_mall: '🛒', park: '🌳', educational_institution: '🏫',
  religious_place: '⛪', restaurant: '🍽', hotel: '🏨',
  bank: '🏦', public_building: '🏢', other: '📍'
};

const statusColors = {
  fully_accessible: '#2E7D32',
  partially_accessible: '#F57F17',
  not_accessible: '#C62828',
  unknown: '#546E7A'
};

// Initialize Leaflet Map
function initMap() {
  map = L.map('map', {
    center: [20.5937, 78.9629], // Center of India
    zoom: 5,
    zoomControl: true
  });

  // OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  // Try to get user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 12);
        // Add user location marker
        L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
          radius: 10, fillColor: '#1565C0', color: 'white',
          weight: 3, opacity: 1, fillOpacity: 1
        }).addTo(map).bindPopup('<b>📍 You are here</b>');
      },
      () => { /* Use default India view */ }
    );
  }

  loadLocations();
}

// Create custom marker icon
function createMarkerIcon(location) {
  const color = statusColors[location.accessibilityStatus] || statusColors.unknown;
  const emoji = typeEmojis[location.accessibilityType] || '📍';

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <path d="M20 0C8.954 0 0 8.954 0 20c0 15 20 28 20 28s20-13 20-28C40 8.954 31.046 0 20 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="20" cy="19" r="12" fill="white" opacity="0.9"/>
      <text x="20" y="23" text-anchor="middle" font-size="14">${emoji}</text>
      ${location.isVerified ? '<circle cx="32" cy="6" r="7" fill="#2E7D32" stroke="white" stroke-width="1.5"/><text x="32" y="10" text-anchor="middle" font-size="9" fill="white">✓</text>' : ''}
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: '',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48]
  });
}

// Load locations from API
async function loadLocations() {
  try {
    const res = await fetch(`${API_BASE}/locations`);
    const data = await res.json();

    if (data.success) {
      allLocations = data.locations;
    } else {
      allLocations = getDemoLocations();
    }
  } catch (e) {
    console.log('Using demo data — connect backend for live data');
    allLocations = getDemoLocations();
  }

  renderMap(allLocations);
  renderList(allLocations);
  document.getElementById('locationCount').textContent = allLocations.length;
}

// Render markers on map
function renderMap(locations) {
  // Clear existing markers
  Object.values(markers).forEach(m => map.removeLayer(m));
  markers = {};

  const markerLayer = L.featureGroup();

  locations.forEach(loc => {
    if (!loc.coordinates?.lat || !loc.coordinates?.lng) return;

    const marker = L.marker([loc.coordinates.lat, loc.coordinates.lng], {
      icon: createMarkerIcon(loc)
    });

    marker.bindPopup(createPopupHTML(loc), {
      maxWidth: 300,
      className: 'custom-popup'
    });

    marker.on('click', () => {
      highlightListItem(loc._id);
    });

    marker.addTo(map);
    markers[loc._id || loc.name] = marker;
    markerLayer.addLayer(marker);
  });
}

// Create popup HTML
function createPopupHTML(loc) {
  const color = statusColors[loc.accessibilityStatus] || statusColors.unknown;
  const statusLabel = {
    fully_accessible: '🟢 Fully Accessible',
    partially_accessible: '🟡 Partially Accessible',
    not_accessible: '🔴 Not Accessible',
    unknown: '❓ Unknown'
  }[loc.accessibilityStatus] || '❓ Unknown';

  const features = loc.features || {};
  const featureTags = [
    features.hasRamp && '♿ Ramp',
    features.hasElevator && '🛗 Elevator',
    features.hasAccessibleToilet && '🚻 WC',
    features.hasAccessibleParking && '🅿 Parking',
    features.hasBrailleSignage && '⬛ Braille',
    features.hasLowFloorBus && '🚌 Low Floor',
  ].filter(Boolean);

  const id = loc._id || '';
  const token = localStorage.getItem('token');
  const authBtns = token
    ? `<button class="popup-btn" onclick="voteLocation('${id}','upvote')">👍 ${loc.upvotes || 0}</button>
       <button class="popup-btn confirm" onclick="voteLocation('${id}','confirm')">✔ Verify</button>`
    : `<a href="login.html" class="popup-btn" style="text-align:center">Login to Vote</a>`;

  return `
    <div class="popup-card">
      <div class="popup-header" style="border-left:4px solid ${color}">
        <h3>${loc.name}</h3>
        <p>📍 ${loc.city || ''}  •  ${formatType(loc.accessibilityType)}</p>
      </div>
      <div class="popup-body">
        <div class="popup-score">
          <span style="color:${color};font-weight:700;font-size:14px;">${statusLabel}</span>
          <span style="background:${color}22;color:${color};font-weight:700;padding:3px 8px;border-radius:20px;font-size:13px;">
            ${loc.accessibilityScore || 0}/10
          </span>
        </div>
        ${loc.description ? `<p style="font-size:12px;color:#546E7A;margin-bottom:8px;">${loc.description.substring(0,100)}${loc.description.length > 100 ? '...' : ''}</p>` : ''}
        <div class="popup-features">
          ${featureTags.slice(0,4).map(f => `<span class="popup-feat">${f}</span>`).join('')}
          ${loc.isVerified ? '<span class="popup-feat" style="background:#E8F5E9;color:#2E7D32;">✅ Verified</span>' : ''}
        </div>
        <div class="popup-actions">
          ${authBtns}
        </div>
      </div>
    </div>
  `;
}

// Render sidebar list
function renderList(locations) {
  const container = document.getElementById('locationList');
  if (locations.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;">
        <div style="font-size:48px;margin-bottom:12px;">🔍</div>
        <p style="color:var(--text-muted);">No locations match your filters</p>
        <a href="add-location.html" class="btn btn-primary btn-sm" style="margin-top:12px;">+ Add Location</a>
      </div>
    `;
    return;
  }

  container.innerHTML = locations.map(loc => {
    const color = statusColors[loc.accessibilityStatus] || statusColors.unknown;
    const emoji = typeEmojis[loc.accessibilityType] || '📍';
    const id = loc._id || loc.name;

    return `
      <div class="location-list-item" id="list-${id}" onclick="flyToLocation('${id}','${loc.coordinates?.lat}','${loc.coordinates?.lng}')">
        <div class="list-marker" style="background:${color};color:white;">${emoji}</div>
        <div class="list-info" style="flex:1;min-width:0;">
          <h4 style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${loc.name}</h4>
          <p>${loc.city || ''} • Score: ${loc.accessibilityScore || 0}/10</p>
          <div style="margin-top:5px;display:flex;gap:4px;flex-wrap:wrap;">
            ${loc.isVerified ? '<span style="font-size:10px;background:#E8F5E9;color:#2E7D32;padding:1px 6px;border-radius:4px;font-weight:600;">✅ Verified</span>' : ''}
            <span style="font-size:10px;background:#F5F5F5;color:#546E7A;padding:1px 6px;border-radius:4px;">👍 ${loc.upvotes || 0}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Fly to location on map
function flyToLocation(id, lat, lng) {
  if (lat && lng) {
    map.flyTo([parseFloat(lat), parseFloat(lng)], 16, { animate: true, duration: 1 });
    if (markers[id]) {
      setTimeout(() => markers[id].openPopup(), 800);
    }
  }
  highlightListItem(id);
}

// Highlight list item
function highlightListItem(id) {
  document.querySelectorAll('.location-list-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(`list-${id}`);
  if (el) {
    el.classList.add('active');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Filter functions
let statusFilter = 'all';
let typeFilter = 'all';
let searchQuery = '';

function setFilter(filterType, value, btn) {
  if (filterType === 'status') {
    statusFilter = value;
    document.querySelectorAll('[data-status]').forEach(b => b.classList.remove('active'));
  } else {
    typeFilter = value;
    document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
  }
  btn.classList.add('active');
  applyFilters();
}

function filterLocations() {
  searchQuery = document.getElementById('searchInput').value.toLowerCase();
  applyFilters();
}

function applyFilters() {
  let filtered = allLocations;

  if (statusFilter !== 'all') {
    filtered = filtered.filter(l => l.accessibilityStatus === statusFilter);
  }

  if (typeFilter !== 'all') {
    filtered = filtered.filter(l => l.accessibilityType === typeFilter);
  }

  if (searchQuery) {
    filtered = filtered.filter(l =>
      l.name?.toLowerCase().includes(searchQuery) ||
      l.city?.toLowerCase().includes(searchQuery) ||
      l.address?.toLowerCase().includes(searchQuery)
    );
  }

  document.getElementById('locationCount').textContent = filtered.length;
  renderMap(filtered);
  renderList(filtered);
}

// Vote for location
async function voteLocation(id, type) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/locations/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ type })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      // Update local data
      const loc = allLocations.find(l => l._id === id);
      if (loc && data.location) {
        Object.assign(loc, data.location);
        applyFilters();
      }
    } else {
      showToast(data.message, 'error');
    }
  } catch (e) {
    showToast('Could not record vote. Please try again.', 'error');
  }
}

// Toast notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatType(type) {
  const types = {
    'public_building': 'Public Building', 'hospital': 'Hospital',
    'government_office': 'Govt Office', 'metro_station': 'Metro Station',
    'bus_stop': 'Bus Stop', 'railway_station': 'Railway Station',
    'airport': 'Airport', 'shopping_mall': 'Shopping Mall',
    'park': 'Park', 'educational_institution': 'Education',
    'religious_place': 'Religious Place', 'other': 'Other'
  };
  return types[type] || type;
}

// Demo data for offline/dev mode
function getDemoLocations() {
  return [
    { _id: '1', name: 'AIIMS New Delhi', city: 'New Delhi', address: 'Ansari Nagar, New Delhi', accessibilityType: 'hospital', accessibilityStatus: 'fully_accessible', accessibilityScore: 9, isVerified: true, upvotes: 24, confirmations: 14, coordinates: { lat: 28.5672, lng: 77.2100 }, features: { hasRamp: true, hasElevator: true, hasAccessibleToilet: true, hasAccessibleParking: true, hasWideDoors: true }, description: 'Excellent wheelchair accessibility. Multiple ramps and lifts available.' },
    { _id: '2', name: 'Rajiv Chowk Metro Station', city: 'New Delhi', address: 'Connaught Place, New Delhi', accessibilityType: 'metro_station', accessibilityStatus: 'fully_accessible', accessibilityScore: 8, isVerified: true, upvotes: 31, confirmations: 18, coordinates: { lat: 28.6328, lng: 77.2197 }, features: { hasRamp: true, hasElevator: true, hasBrailleSignage: true, hasAudioSignals: true }, description: 'DMRC metro station with excellent accessibility infrastructure.' },
    { _id: '3', name: 'India Gate', city: 'New Delhi', address: 'Rajpath, New Delhi', accessibilityType: 'park', accessibilityStatus: 'partially_accessible', accessibilityScore: 5, isVerified: false, upvotes: 8, confirmations: 2, coordinates: { lat: 28.6129, lng: 77.2295 }, features: { hasRamp: true, hasAccessibleParking: true }, description: 'Some accessible paths but uneven ground in many areas.' },
    { _id: '4', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', address: 'Bori Bunder, Mumbai', accessibilityType: 'railway_station', accessibilityStatus: 'partially_accessible', accessibilityScore: 6, isVerified: true, upvotes: 15, confirmations: 7, coordinates: { lat: 18.9402, lng: 72.8356 }, features: { hasRamp: true, hasElevator: true, hasAudioSignals: true }, description: 'Heritage station with some modern accessibility additions.' },
    { _id: '5', name: 'Kokilaben Dhirubhai Ambani Hospital', city: 'Mumbai', address: 'Four Bungalows, Mumbai', accessibilityType: 'hospital', accessibilityStatus: 'fully_accessible', accessibilityScore: 9, isVerified: true, upvotes: 19, confirmations: 11, coordinates: { lat: 19.1170, lng: 72.8295 }, features: { hasRamp: true, hasElevator: true, hasAccessibleToilet: true, hasAccessibleParking: true, hasWideDoors: true, hasWheelchairAvailable: true } },
    { _id: '6', name: 'Ahmedabad Civil Hospital', city: 'Ahmedabad', address: 'Asarwa, Ahmedabad', accessibilityType: 'hospital', accessibilityStatus: 'partially_accessible', accessibilityScore: 6, isVerified: false, upvotes: 6, confirmations: 3, coordinates: { lat: 23.0424, lng: 72.5961 }, features: { hasRamp: true, hasElevator: true } },
    { _id: '7', name: 'Lal Darwaja Bus Station', city: 'Ahmedabad', address: 'Lal Darwaja, Ahmedabad', accessibilityType: 'bus_stop', accessibilityStatus: 'not_accessible', accessibilityScore: 2, isVerified: false, upvotes: 3, downvotes: 8, confirmations: 1, coordinates: { lat: 23.0225, lng: 72.5714 }, features: {}, description: 'No ramps or accessibility features. Urgent improvement needed.' },
    { _id: '8', name: 'Bangalore International Airport', city: 'Bengaluru', address: 'Devanahalli, Bengaluru', accessibilityType: 'airport', accessibilityStatus: 'fully_accessible', accessibilityScore: 10, isVerified: true, upvotes: 42, confirmations: 22, coordinates: { lat: 13.1986, lng: 77.7066 }, features: { hasRamp: true, hasElevator: true, hasAccessibleToilet: true, hasAccessibleParking: true, hasWideDoors: true, hasAudioSignals: true, hasBrailleSignage: true, hasWheelchairAvailable: true } },
    { _id: '9', name: 'Gateway of India', city: 'Mumbai', address: 'Apollo Bandar, Mumbai', accessibilityType: 'public_building', accessibilityStatus: 'not_accessible', accessibilityScore: 2, isVerified: false, upvotes: 4, confirmations: 1, coordinates: { lat: 18.9220, lng: 72.8347 }, features: {}, description: 'Historic monument with very limited accessibility. Multiple steps.' },
    { _id: '10', name: 'Chennai Central Railway Station', city: 'Chennai', address: 'Park Town, Chennai', accessibilityType: 'railway_station', accessibilityStatus: 'partially_accessible', accessibilityScore: 5, isVerified: false, upvotes: 9, confirmations: 4, coordinates: { lat: 13.0827, lng: 80.2753 }, features: { hasRamp: true, hasElevator: true } },
    { _id: '11', name: 'Secretariat Building', city: 'Chennai', address: 'Fort St. George, Chennai', accessibilityType: 'government_office', accessibilityStatus: 'partially_accessible', accessibilityScore: 5, isVerified: false, upvotes: 5, confirmations: 2, coordinates: { lat: 13.0813, lng: 80.2854 }, features: { hasRamp: true } },
    { _id: '12', name: 'Hyderabad Rajiv Gandhi Airport', city: 'Hyderabad', address: 'Shamshabad, Hyderabad', accessibilityType: 'airport', accessibilityStatus: 'fully_accessible', accessibilityScore: 9, isVerified: true, upvotes: 28, confirmations: 13, coordinates: { lat: 17.2403, lng: 78.4294 }, features: { hasRamp: true, hasElevator: true, hasAccessibleToilet: true, hasAccessibleParking: true, hasWheelchairAvailable: true } }
  ];
}

// Initialize
document.addEventListener('DOMContentLoaded', initMap);
