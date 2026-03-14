// =============================================
// DASHBOARD.JS — SAHAJ
// =============================================

const API_BASE = 'http://localhost:5000/api';

const TYPE_EMOJIS = {
  hospital: '🏥', government_office: '🏛', metro_station: '🚇',
  bus_stop: '🚌', railway_station: '🚂', airport: '✈️',
  shopping_mall: '🛒', park: '🌳', educational_institution: '🏫',
  religious_place: '⛪', bank: '🏦', public_building: '🏢', other: '📍'
};

const TYPE_LABELS = {
  hospital: 'Hospital', government_office: 'Govt Office', metro_station: 'Metro Station',
  bus_stop: 'Bus Stop', railway_station: 'Railway Station', airport: 'Airport',
  shopping_mall: 'Shopping Mall', park: 'Park / Garden',
  educational_institution: 'School / College', religious_place: 'Religious Place',
  bank: 'Bank / ATM', public_building: 'Public Building', other: 'Other'
};

async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/locations/dashboard`);
    const data = await res.json();
    if (data.success) {
      renderStats(data.stats, data.cityStats);
      renderCityRankings(data.cityStats);
      renderTypeBreakdown(data.typeStats);
      renderRecentAdditions(data.recentLocations);
      renderTopContributors(data.topContributors);
      renderProgressIndex(data.stats, data.cityStats);
    } else {
      useDemoData();
    }
  } catch (e) {
    useDemoData();
  }
}

function useDemoData() {
  const stats = { totalLocations: 2847, verifiedLocations: 1234, totalUsers: 8921, verificationRate: 43 };
  const cityStats = [
    { city: 'Bengaluru', accessibilityPercent: 71, total: 312, avgScore: 7.2 },
    { city: 'Mumbai', accessibilityPercent: 65, total: 481, avgScore: 6.8 },
    { city: 'Ahmedabad', accessibilityPercent: 63, total: 198, avgScore: 6.5 },
    { city: 'Hyderabad', accessibilityPercent: 60, total: 241, avgScore: 6.2 },
    { city: 'Pune', accessibilityPercent: 58, total: 167, avgScore: 6.0 },
    { city: 'New Delhi', accessibilityPercent: 55, total: 524, avgScore: 5.8 },
    { city: 'Chennai', accessibilityPercent: 52, total: 289, avgScore: 5.5 },
    { city: 'Kolkata', accessibilityPercent: 48, total: 213, avgScore: 5.0 },
    { city: 'Jaipur', accessibilityPercent: 44, total: 134, avgScore: 4.6 },
    { city: 'Lucknow', accessibilityPercent: 41, total: 98, avgScore: 4.3 }
  ];
  const typeStats = [
    { _id: 'hospital', count: 523 }, { _id: 'government_office', count: 412 },
    { _id: 'metro_station', count: 387 }, { _id: 'bus_stop', count: 341 },
    { _id: 'railway_station', count: 298 }, { _id: 'park', count: 267 },
    { _id: 'shopping_mall', count: 234 }, { _id: 'educational_institution', count: 198 },
    { _id: 'public_building', count: 187 }
  ];
  const recentLocations = [
    { name: 'AIIMS Raipur', city: 'Raipur', accessibilityStatus: 'fully_accessible', accessibilityType: 'hospital', createdBy: { name: 'Priya Sharma' }, createdAt: new Date(Date.now() - 3600000) },
    { name: 'Indore Metro Phase 1', city: 'Indore', accessibilityStatus: 'fully_accessible', accessibilityType: 'metro_station', createdBy: { name: 'Rahul Verma' }, createdAt: new Date(Date.now() - 7200000) },
    { name: 'Nehru Place Govt Office', city: 'New Delhi', accessibilityStatus: 'partially_accessible', accessibilityType: 'government_office', createdBy: { name: 'Anita Gupta' }, createdAt: new Date(Date.now() - 18000000) },
    { name: 'Ahmedabad Civil Hospital', city: 'Ahmedabad', accessibilityStatus: 'partially_accessible', accessibilityType: 'hospital', createdBy: { name: 'Suresh Patel' }, createdAt: new Date(Date.now() - 86400000) },
    { name: 'Charminar Bus Stand', city: 'Hyderabad', accessibilityStatus: 'not_accessible', accessibilityType: 'bus_stop', createdBy: { name: 'Kavitha R.' }, createdAt: new Date(Date.now() - 172800000) }
  ];
  const topContributors = [
    { name: 'Priya Sharma', contributionsCount: 47, verificationsCount: 23, role: 'contributor', city: 'Bengaluru' },
    { name: 'Rahul Verma', contributionsCount: 38, verificationsCount: 19, role: 'contributor', city: 'Mumbai' },
    { name: 'Anita Gupta', contributionsCount: 29, verificationsCount: 31, role: 'contributor', city: 'New Delhi' },
    { name: 'Suresh Patel', contributionsCount: 24, verificationsCount: 15, role: 'user', city: 'Ahmedabad' },
    { name: 'Kavitha R.', contributionsCount: 18, verificationsCount: 22, role: 'user', city: 'Chennai' }
  ];
  renderStats(stats, cityStats);
  renderCityRankings(cityStats);
  renderTypeBreakdown(typeStats);
  renderRecentAdditions(recentLocations);
  renderTopContributors(topContributors);
  renderProgressIndex(stats, cityStats);
}

function renderStats(stats, cityStats) {
  document.getElementById('totalLoc').textContent = stats.totalLocations.toLocaleString('en-IN');
  document.getElementById('verLoc').textContent = stats.verifiedLocations.toLocaleString('en-IN');
  document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString('en-IN');
  document.getElementById('totalCities').textContent = (cityStats || []).length;
}

function renderCityRankings(cityStats) {
  if (!cityStats || cityStats.length === 0) {
    document.getElementById('cityRankings').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No data yet</p>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const html = cityStats.slice(0, 10).map((city, i) => {
    const pct = city.accessibilityPercent || 0;
    const color = pct >= 60 ? 'var(--accessible-full)' : pct >= 40 ? 'var(--accessible-partial)' : 'var(--accessible-none)';
    return `
      <div class="city-bar">
        <div style="width:24px;text-align:center;font-size:14px;">${medals[i] || (i + 1)}</div>
        <div class="city-bar-name" title="${city.city}">${city.city}</div>
        <div class="city-bar-track">
          <div class="city-bar-fill" style="width:${pct}%;background:${color};"></div>
        </div>
        <div class="city-bar-pct" style="color:${color};">${pct}%</div>
      </div>
    `;
  }).join('');

  document.getElementById('cityRankings').innerHTML = html + `
    <div style="margin-top:16px;padding:12px;background:var(--saffron-pale);border-radius:var(--radius-sm);font-size:13px;color:var(--text-secondary);">
      🎯 <strong>Target:</strong> All cities to reach 75%+ by 2030 under SAHAJ Abhiyan
    </div>
  `;
}

function renderTypeBreakdown(typeStats) {
  if (!typeStats || typeStats.length === 0) {
    document.getElementById('typeBreakdown').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No data yet</p>';
    return;
  }

  const maxCount = typeStats[0]?.count || 1;
  const html = typeStats.slice(0, 8).map(t => `
    <div class="type-item">
      <div class="type-emoji">${TYPE_EMOJIS[t._id] || '📍'}</div>
      <div class="type-info">
        <div class="name">${TYPE_LABELS[t._id] || t._id}</div>
        <div class="count">${t.count} locations</div>
      </div>
      <div>
        <div class="type-bar-mini">
          <div class="type-bar-mini-fill" style="width:${Math.round((t.count / maxCount) * 100)}%;"></div>
        </div>
      </div>
      <div style="width:36px;text-align:right;font-size:13px;font-weight:700;color:var(--saffron);">${t.count}</div>
    </div>
  `).join('');

  document.getElementById('typeBreakdown').innerHTML = html;
}

function renderRecentAdditions(locations) {
  if (!locations || locations.length === 0) {
    document.getElementById('recentAdditions').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No recent activity</p>';
    return;
  }

  const statusColors = {
    fully_accessible: 'var(--accessible-full)',
    partially_accessible: 'var(--accessible-partial)',
    not_accessible: 'var(--accessible-none)',
    unknown: 'var(--accessible-unknown)'
  };

  const html = locations.map(loc => `
    <div class="recent-item">
      <div class="recent-dot" style="background:${statusColors[loc.accessibilityStatus] || statusColors.unknown};"></div>
      <div style="flex:1;">
        <div style="font-size:14px;font-weight:700;">${loc.name}</div>
        <div style="font-size:12px;color:var(--text-secondary);">
          📍 ${loc.city || ''} • ${TYPE_LABELS[loc.accessibilityType] || loc.accessibilityType}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
          by ${loc.createdBy?.name || 'Anonymous'} • ${timeAgo(loc.createdAt)}
        </div>
      </div>
      <div style="font-size:10px;padding:2px 6px;border-radius:4px;background:${statusColors[loc.accessibilityStatus]}22;color:${statusColors[loc.accessibilityStatus]};font-weight:600;white-space:nowrap;">
        ${formatStatus(loc.accessibilityStatus)}
      </div>
    </div>
  `).join('');

  document.getElementById('recentAdditions').innerHTML = html;
}

function renderTopContributors(contributors) {
  if (!contributors || contributors.length === 0) {
    document.getElementById('topContributors').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No contributors yet</p>';
    return;
  }

  const ranks = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  const html = contributors.map((c, i) => {
    const initials = (c.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const roleBadge = c.role === 'admin' ? '<span class="badge badge-admin">Admin</span>'
      : c.role === 'contributor' ? '<span class="badge badge-contributor">Contributor</span>'
      : '<span class="badge badge-user">Member</span>';
    return `
      <div class="contributor-item">
        <div style="font-size:18px;width:24px;">${ranks[i] || ''}</div>
        <div class="contributor-avatar">${initials}</div>
        <div class="contributor-info">
          <div class="cname">${c.name}</div>
          <div class="cstats">${c.contributionsCount} reports • ${c.verificationsCount} verifications${c.city ? ' • ' + c.city : ''}</div>
        </div>
        ${roleBadge}
      </div>
    `;
  }).join('');

  document.getElementById('topContributors').innerHTML = html;
}

function renderProgressIndex(stats, cityStats) {
  const avgAccessibility = cityStats && cityStats.length > 0
    ? Math.round(cityStats.reduce((sum, c) => sum + (c.accessibilityPercent || 0), 0) / cityStats.length)
    : 0;

  const verRate = stats.verificationRate || 0;

  const items = [
    { label: 'Average City Accessibility', value: avgAccessibility, target: 75, color: 'var(--saffron)', unit: '%' },
    { label: 'Verification Rate', value: verRate, target: 80, color: 'var(--india-green)', unit: '%' },
    { label: 'Cities Covered', value: Math.min((cityStats || []).length, 100), target: 100, color: 'var(--blue-accent)', unit: '' },
    { label: 'Progress to 2047 Goal', value: Math.round(avgAccessibility * 0.8), target: 100, color: '#7B1FA2', unit: '%' }
  ];

  const html = items.map(item => `
    <div style="text-align:center;padding:12px;">
      <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">${item.label}</div>
      <div style="font-family:var(--font-display);font-size:40px;color:${item.color};line-height:1;">${item.value}${item.unit}</div>
      <div style="font-size:12px;color:var(--text-muted);margin:6px 0 12px;">Target: ${item.target}${item.unit}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${Math.min(Math.round((item.value / item.target) * 100), 100)}%;background:${item.color};"></div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:6px;">${Math.round((item.value / item.target) * 100)}% of target</div>
    </div>
  `).join('');

  document.getElementById('progressIndex').innerHTML = html;
}

// Helpers
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatStatus(status) {
  return { fully_accessible: '🟢 Full', partially_accessible: '🟡 Partial', not_accessible: '🔴 None', unknown: '❓ Unknown' }[status] || '❓';
}

document.addEventListener('DOMContentLoaded', loadDashboard);
