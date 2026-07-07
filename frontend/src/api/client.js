const API = import.meta.env.VITE_API_URL || '/api';

let _userId = null;

export function setApiUserId(email) {
  _userId = email || null;
}

function headers(json = true) {
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  if (_userId) h['X-User-Id'] = _userId;
  return h;
}

async function parse(res) {
  const json = await res.json();
  if (!res.ok) {
    const detail = json.detail;
    throw new Error(typeof detail === 'string' ? detail : detail?.[0]?.msg || 'Request failed');
  }
  return json;
}

export async function apiHealth() {
  const json = await parse(await fetch(`${API}/health`));
  return json;
}

export async function apiUserData() {
  const json = await parse(await fetch(`${API}/user/data`, { headers: headers(false) }));
  return json.data;
}

export async function apiTriage(symptoms) {
  const json = await parse(await fetch(`${API}/triage`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ symptoms }),
  }));
  return json.data;
}

export async function apiChat(message) {
  const json = await parse(await fetch(`${API}/assistant/chat`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ message }),
  }));
  return json.data;
}

export async function apiScanPrescription(file, text) {
  const form = new FormData();
  if (file) form.append('file', file);
  if (text) form.append('text', text);
  const res = await fetch(`${API}/ocr/scan`, { method: 'POST', headers: headers(false), body: form });
  const json = await parse(res);
  return json.data;
}

export async function apiQueueStatus(hospitalId) {
  const json = await parse(await fetch(`${API}/queue/${hospitalId}`));
  return json.data;
}

export async function apiJoinQueue(hospitalId, patientName, reason) {
  const json = await parse(await fetch(`${API}/queue/join`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ hospital_id: hospitalId, patient_name: patientName, reason }),
  }));
  return json.data;
}

export async function apiFacilities(city, urgency) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (urgency) params.set('urgency', urgency);
  const json = await parse(await fetch(`${API}/facilities?${params}`));
  return json.data;
}

export async function apiAddMedication(med) {
  const json = await parse(await fetch(`${API}/medications`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(med),
  }));
  return json.data;
}

export async function apiToggleMedication(id) {
  const json = await parse(await fetch(`${API}/medications/${id}/toggle`, {
    method: 'PATCH',
    headers: headers(false),
  }));
  return json.data;
}

export async function apiDeleteMedication(id) {
  await parse(await fetch(`${API}/medications/${id}`, { method: 'DELETE', headers: headers(false) }));
}

export async function apiAddAppointment(appt) {
  const json = await parse(await fetch(`${API}/appointments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(appt),
  }));
  return json.data;
}

export async function apiDeleteAppointment(id) {
  await parse(await fetch(`${API}/appointments/${id}`, { method: 'DELETE', headers: headers(false) }));
}

export async function apiSaveEmergencyProfile(profile) {
  await parse(await fetch(`${API}/emergency-profile`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(profile),
  }));
}

export async function apiRegisterDonor(donor) {
  const json = await parse(await fetch(`${API}/blood/donors`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(donor),
  }));
  return json.data;
}

export async function apiRequestBlood(req) {
  const json = await parse(await fetch(`${API}/blood/requests`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(req),
  }));
  return json.data;
}

export async function apiNotificationStatus() {
  const json = await parse(await fetch(`${API}/notifications/status`, { headers: headers(false) }));
  return json.data;
}

export async function apiTestNotification(delaySeconds = 10) {
  const json = await parse(await fetch(`${API}/notifications/test`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ delay_seconds: delaySeconds }),
  }));
  return json.data;
}

export async function apiLeaveQueue() {
  const json = await parse(await fetch(`${API}/queue/my`, { method: 'DELETE', headers: headers(false) }));
  return json.data;
}

export async function apiMyQueue() {
  const json = await parse(await fetch(`${API}/queue/my/active`, { headers: headers(false) }));
  return json.data;
}

export async function apiAppointmentHospitals() {
  const json = await parse(await fetch(`${API}/appointments/hospitals`));
  return json.data;
}

export async function apiAppointmentSlots(hospitalId, date) {
  const json = await parse(await fetch(`${API}/appointments/slots?hospital_id=${hospitalId}&date=${date}`));
  return json.data;
}

export async function apiCancelAppointment(id) {
  await parse(await fetch(`${API}/appointments/${id}/status`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status: 'cancelled' }),
  }));
}

export async function apiBloodCommunity(bloodGroup, area) {
  const params = new URLSearchParams();
  if (bloodGroup) params.set('blood_group', bloodGroup);
  if (area) params.set('area', area);
  const json = await parse(await fetch(`${API}/blood/community?${params}`));
  return json.data;
}

export async function apiOfferBlood(offer) {
  const json = await parse(await fetch(`${API}/blood/offers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(offer),
  }));
  return json.data;
}

export async function apiFulfillBloodRequest(id) {
  const json = await parse(await fetch(`${API}/blood/requests/${id}/fulfill`, {
    method: 'PATCH',
    headers: headers(false),
  }));
  return json.data;
}

export async function apiSendNotificationNow() {
  const json = await parse(await fetch(`${API}/notifications/send-now`, {
    method: 'POST',
    headers: headers(false),
  }));
  return json.data;
}
