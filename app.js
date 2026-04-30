let BREACH_DATA = [];
const SECTOR_COLORS = {
  Healthcare: '#e63946', Education: '#f4a261', Government: '#2dd4a0',
  Technology: '#a78bfa', Financial: '#60a5fa', Manufacturing: '#facc15',
  Other: '#fbbf24', Retail: '#fb7185', Energy: '#34d399',
  Legal: '#c084fc', Media: '#7dd3fc', Telecom: '#86efac',
};

let selectedYear = 'all', selectedSector = 'all', selectedState = null;
let projection = null, topoFeatures = null, gStates, gDots;
let width, height, path, colorScale;

const svg = d3.select("#geomap");
const tooltip = document.getElementById("tooltip");

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
  KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
  MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',
  ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',
  RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',
  TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',DC:'District of Columbia'
};
const NAME_TO_ABBREV = Object.fromEntries(Object.entries(STATE_NAMES).map(([k,v])=>[v,k]));

function filteredData() {
  return BREACH_DATA.filter(d => {
    if (selectedYear !== 'all' && d.year !== selectedYear) return false;
    if (selectedSector !== 'all' && d.sector !== selectedSector) return false;
    return true;
  });
}

function stateCountMap(data) {
  const m = new Map();
  data.forEach(d => { if (d.state) m.set(d.state, (m.get(d.state) || 0) + 1); });
  return m;
}

function normalizeSector(raw) {
  if (!raw) return 'Other';
  const s = raw.toLowerCase();
  if (s.includes('health'))     return 'Healthcare';
  if (s.includes('education'))  return 'Education';
  if (s.includes('government')) return 'Government';
  if (s.includes('tech') || s.includes('cyber') || s.includes('gaming')) return 'Technology';
  if (s.includes('financial') || s.includes('insurance') || s.includes('banking')) return 'Financial';
  if (s.includes('manufactur') || s.includes('defense') || s.includes('energy') ||
      s.includes('food') || s.includes('automotive')) return 'Manufacturing';
  return 'Other';
}

function parseRow(row, year) {
  return {
    entity:      row['Entity Name'],
    lat:         row['Latitude'],
    lng:         row['Longitude'],
    city:        row['City'],
    state:       row['State'],
    sector:      normalizeSector(row['Sector']),
    demand:      parseFloat((row['Demand in USD'] || '').replace(/[$,]/g, '')) || 0,
    ransom_paid: row['Paid'],
    year:        String(year),
  };
}

function init() {
  const rect = document.getElementById("map-panel").getBoundingClientRect();
  width = rect.width; height = rect.height;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection = d3.geoAlbersUsa().scale(Math.min(width, height) * 1.18).translate([width/2, height/2]);
  path = d3.geoPath(projection);

  const files = [
  { file: 'rw2020.csv', year: 2020 },
  { file: 'rw21.csv',   year: 2021 },
  { file: 'rw22.csv',   year: 2022 },
  { file: 'rw23.csv',   year: 2023 },
  { file: 'rw24.csv',   year: 2024 },
  { file: 'rw25.csv',   year: 2025 },
];
const csvPromises = files.map(({ file, year }) =>
  d3.csv(file).then(rows => rows.map(r => parseRow(r, year)))
);

  const topoPromise = d3.json("./states-10m.json");

  Promise.all([topoPromise, ...csvPromises]).then(([topology, ...yearArrays]) => {
    BREACH_DATA = yearArrays.flat();
    topoFeatures = topojson.feature(topology, topology.objects.states).features;
    gStates = svg.append("g");
    gDots = svg.append("g");
    render();
  });
}

function render() {
  const data = filteredData();
  const countMap = stateCountMap(data);
  const maxCount = d3.max(countMap.values()) || 1;
  document.getElementById("legend-max").textContent = maxCount;

  colorScale = d3.scaleSequential().domain([0, maxCount]).interpolator(d3.interpolate("#111827", "#4a90d9"));

  const statesHit = new Set(data.map(d => d.state).filter(Boolean)).size;
  const paidCount = data.filter(d => d.ransom_paid === 'True').length;
  document.getElementById("stat-total").textContent = data.length;
  document.getElementById("stat-states").textContent = statesHit;
  document.getElementById("stat-paid").textContent = paidCount;

  gStates.selectAll("path").data(topoFeatures).join("path")
    .attr("class", d => "state-path" + (NAME_TO_ABBREV[d.properties.name] === selectedState ? " selected" : ""))
    .attr("d", path)
    .attr("fill", d => { const c = countMap.get(NAME_TO_ABBREV[d.properties.name]) || 0; return c === 0 ? "#111827" : colorScale(c); })
    .on("click", (event, d) => {
      const abbrev = NAME_TO_ABBREV[d.properties.name];
      if (abbrev) { selectedState = abbrev; render(); showPanel(abbrev, data.filter(r => r.state === abbrev)); }
    })
    .on("mousemove", (event, d) => {
      const abbrev = NAME_TO_ABBREV[d.properties.name];
      showTooltip(event, `<div class="tt-name">${d.properties.name}</div><div class="tt-row"><span>Attacks</span><span class="tt-val">${countMap.get(abbrev) || 0}</span></div>`);
    })
    .on("mouseleave", hideTooltip);

  gDots.selectAll("circle").data(data.filter(d => d.lat && d.lng)).join("circle")
    .attr("class", "breach-dot")
    .attr("cx", d => { const c = projection([+d.lng, +d.lat]); return c ? c[0] : -999; })
    .attr("cy", d => { const c = projection([+d.lng, +d.lat]); return c ? c[1] : -999; })
    .attr("r", 4)
    .attr("fill", d => SECTOR_COLORS[d.sector] || "#fbbf24")
    .attr("fill-opacity", 0.82)
    .attr("stroke", "#0a0c10").attr("stroke-width", 0.8)
    .on("mousemove", (event, d) => {
      const paid = d.ransom_paid === 'True' ? '✓ Paid' : d.ransom_paid === 'False' ? '✗ Not Paid' : 'Unknown';
      const demand = d.demand ? '$' + Number(d.demand).toLocaleString() : '—';
      showTooltip(event, `<div class="tt-name">${d.entity}</div>
        <div class="tt-row"><span>City</span><span class="tt-val">${d.city||'—'}, ${d.state}</span></div>
        <div class="tt-row"><span>Year</span><span class="tt-val">${d.year}</span></div>
        <div class="tt-row"><span>Demand</span><span class="tt-val">${demand}</span></div>
        <div class="tt-row"><span>Ransom</span><span class="tt-val">${paid}</span></div>
        <span class="tt-sector tag" style="background:${SECTOR_COLORS[d.sector]}22;color:${SECTOR_COLORS[d.sector]}">${d.sector}</span>`);
    })
    .on("mouseleave", hideTooltip);

  if (selectedState) showPanel(selectedState, data.filter(r => r.state === selectedState));
}

function showTooltip(event, html) {
  tooltip.style.display = 'block';
  tooltip.innerHTML = html;
  const rect = document.getElementById("map-panel").getBoundingClientRect();
  let x = event.clientX - rect.left + 14, y = event.clientY - rect.top - 10;
  if (x + 250 > rect.width) x = event.clientX - rect.left - 260;
  tooltip.style.left = x + 'px'; tooltip.style.top = y + 'px';
}

function hideTooltip() { tooltip.style.display = 'none'; }

function showPanel(abbrev, records) {
 document.getElementById("side-panel").classList.remove("hidden");
  const rect = document.getElementById("map-panel").getBoundingClientRect();
  width = rect.width; height = rect.height;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection.scale(Math.min(width, height) * 1.18).translate([width/2, height/2]);
  path = d3.geoPath(projection);
  document.getElementById("panel-state-name").textContent = STATE_NAMES[abbrev] || abbrev;
  document.getElementById("panel-subtitle").textContent = `${selectedYear === 'all' ? 'All Years' : selectedYear} · ${selectedSector === 'all' ? 'All Sectors' : selectedSector}`;
  document.getElementById("ps-count").textContent = records.length;
  document.getElementById("ps-paid").textContent = records.filter(r => r.ransom_paid === 'True').length;

  const sectorCounts = {};
  records.forEach(r => { sectorCounts[r.sector] = (sectorCounts[r.sector] || 0) + 1; });
  const sorted = Object.entries(sectorCounts).sort((a,b) => b[1]-a[1]);
  const maxS = sorted[0]?.[1] || 1;

  document.getElementById("sector-bars").innerHTML = sorted.map(([sec, cnt]) => `
    <div class="sector-bar-row">
      <div class="sector-bar-label"><span>${sec}</span><span>${cnt}</span></div>
      <div class="sector-bar-track"><div class="sector-bar-fill" style="width:${(cnt/maxS)*100}%;background:${SECTOR_COLORS[sec]||'#60a5fa'}"></div></div>
    </div>`).join('');

  document.getElementById("breach-list").innerHTML = [...records].sort((a,b) => b.year - a.year).map(r => {
    const demand = r.demand ? '$' + Number(r.demand).toLocaleString() : '';
    const paidTag = r.ransom_paid === 'True' ? `<span class="tag" style="background:#2dd4a022;color:#2dd4a0">Paid</span>`
      : r.ransom_paid === 'False' ? `<span class="tag" style="background:#e6394622;color:#e63946">Not Paid</span>` : '';
    return `<div class="breach-item">
      <div class="breach-item-name">${r.entity}</div>
      <div class="breach-item-meta"><span>${r.year}</span><span style="color:${SECTOR_COLORS[r.sector]||'#60a5fa'}">${r.sector}</span>${demand?`<span>${demand}</span>`:''}${paidTag}</div>
    </div>`;
  }).join('');
}

document.getElementById("close-panel").addEventListener("click", () => {
  document.getElementById("side-panel").classList.add("hidden");
  selectedState = null;
  const rect = document.getElementById("map-panel").getBoundingClientRect();
  width = rect.width; height = rect.height;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection.scale(Math.min(width, height) * 1.18).translate([width/2, height/2]);
  path = d3.geoPath(projection);
  render();
});
document.getElementById("year-select").addEventListener("change", e => { selectedYear = e.target.value; render(); });
document.getElementById("sector-select").addEventListener("change", e => { selectedSector = e.target.value; render(); });

window.addEventListener("load", init);
window.addEventListener("resize", () => {
  const rect = document.getElementById("map-panel").getBoundingClientRect();
  width = rect.width; height = rect.height;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection.scale(Math.min(width, height) * 1.18).translate([width/2, height/2]);
  path = d3.geoPath(projection);
  if (topoFeatures) render();
});
