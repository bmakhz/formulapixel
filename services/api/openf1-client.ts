import axios from 'axios';

// ── OpenF1 API ─────────────────────────────────────────────────
const openF1Client = axios.create({
  baseURL: 'https://api.openf1.org/v1/',
  timeout: 15000,
});

export async function getDrivers(params?: Record<string, string | number | boolean>) {
  const response = await openF1Client.get('/drivers', { params });
  return response.data;
}

export async function getSessions(params?: Record<string, string | number | boolean>) {
  const response = await openF1Client.get('/sessions', { params });
  return response.data;
}

export async function getMeetings(params?: Record<string, string | number | boolean>) {
  const response = await openF1Client.get('/meetings', { params });
  return response.data;
}

export async function getPositions(params?: Record<string, string | number | boolean>) {
  const response = await openF1Client.get('/position', { params });
  return response.data;
}

export async function getLaps(params?: Record<string, string | number | boolean>) {
  const response = await openF1Client.get('/laps', { params });
  return response.data;
}

export async function getWeather(params?: Record<string, string | number | boolean>) {
  const response = await openF1Client.get('/weather', { params });
  return response.data;
}

export async function getStints(params?: Record<string, string | number | boolean>) {
  const response = await openF1Client.get('/stints', { params });
  return response.data;
}

export async function getIntervals(params?: Record<string, string | number | boolean>) {
  const response = await openF1Client.get('/intervals', { params });
  return response.data;
}

export async function getCarData(params?: Record<string, string | number | boolean>) {
  const response = await openF1Client.get('/car_data', { params });
  return response.data;
}

export async function getSessionResult(params?: Record<string, string | number | boolean>) {
  const response = await openF1Client.get('/session_result', { params });
  return response.data;
}

// ── Jolpica (Ergast) API — for season standings ────────────────
const jolpikaClient = axios.create({
  baseURL: 'https://api.jolpi.ca/ergast/f1/',
  timeout: 15000,
});

export async function getDriverChampionshipStandings(year: number) {
  const response = await jolpikaClient.get(`${year}/driverstandings.json`);
  return response.data;
}

export async function getConstructorChampionshipStandings(year: number) {
  const response = await jolpikaClient.get(`${year}/constructorstandings.json`);
  return response.data;
}

export async function getLastRaceResults(year: number) {
  const response = await jolpikaClient.get(`${year}/last/results.json`);
  return response.data;
}

export { openF1Client };