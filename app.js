<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>US Ransomware Attacks Dashboard</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0c10;
    --surface: #111318;
    --surface2: #181c24;
    --border: #252a35;
    --accent: #e63946;
    --accent2: #f4a261;
    --text: #e8eaf0;
    --text-dim: #6b7280;
    --text-mid: #9ca3af;
    --blue-lo: #1a2a4a;
    --blue-hi: #4a90d9;
    --green: #2dd4a0;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    padding: 20px 32px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .header-title { flex: 1; }

  .header-title h1 {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--text);
  }

  .header-title p {
    font-size: 12px;
    color: var(--text-dim);
    margin-top: 2px;
  }

  .controls {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .control-group label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-dim);
    font-family: 'Space Mono', monospace;
  }

  select {
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 6px 28px 6px 10px;
    border-radius: 6px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  select:focus { outline: none; border-color: var(--accent); }

  .stat-pills { display: flex; gap: 8px; margin-left: auto; }

  .pill {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 5px 14px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pill-val {
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    color: var(--accent);
    font-size: 13px;
  }

  .pill-val.green { color: var(--green); }
  .pill-val.orange { color: var(--accent2); }

  main { display: flex; flex: 1; overflow: hidden; }

  #map-panel { flex: 1; position: relative; overflow: hidden; }

  #geomap { width: 100%; height: 100%; }

  .state-path {
    stroke: #2a3040;
    stroke-width: 0.8px;
    cursor: pointer;
    transition: stroke 0.15s, stroke-width 0.15s;
  }
  .state-path:hover { stroke: #fff; stroke-width: 1.5px; }
  .state-path.selected { stroke: #fff; stroke-width: 2px; }

  .breach-dot { cursor: pointer; transition: r 0.15s; }
  .breach-dot:hover { r: 7; }

  #legend {
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: rgba(17,19,24,0.92);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 11px;
    backdrop-filter: blur(8px);
  }

  #legend h4 {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 10px;
  }

  .legend-gradient {
    width: 140px;
    height: 10px;
    border-radius: 5px;
    background: linear-gradient(to right, #1a2a4a, #4a90d9);
    margin-bottom: 4px;
  }

  .legend-labels {
    display: flex;
    justify-content: space-between;
    color: var(--text-mid);
    font-size: 10px;
  }

  .legend-dots { margin-top: 10px; display: flex; flex-direction: column; gap: 5px; }

  .legend-dot-row { display: flex; align-items: center; gap: 7px; color: var(--text-mid); }

  .ldot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  #tooltip {
    position: absolute;
    display: none;
    background: rgba(10,12,16,0.97);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 12px;
    max-width: 240px;
    pointer-events: none;
    z-index: 100;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }

  #tooltip .tt-name { font-weight: 600; font-size: 13px; margin-bottom: 6px; color: var(--text); }

  #tooltip .tt-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: var(--text-dim);
    margin-bottom: 3px;
    font-size: 11px;
  }

  #tooltip .tt-val { color: var(--text-mid); font-family: 'Space Mono', monospace; font-size: 10px; }

  #tooltip .tt-sector {
    display: inline-block;
    margin-top: 6px;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 500;
  }

  #side-panel {
    width: 300px;
    border-left: 1px solid var(--border);
    background: var(--surface);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width 0.3s;
  }

  #side-panel.hidden { width: 0; }

  .panel-header {
    padding: 16px 20px 12px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .panel-header h2 { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; }

  .panel-header .state-name { font-size: 11px; color: var(--text-dim); margin-top: 2px; }

  #close-panel {
    background: none;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 18px;
    padding: 2px 6px;
    border-radius: 4px;
    transition: color 0.15s;
  }
  #close-panel:hover { color: var(--text); }

  .panel-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--border);
    border-bottom: 1px solid var(--border);
  }

  .pstat { background: var(--surface); padding: 12px 16px; display: flex; flex-direction: column; gap: 3px; }

  .pstat-label {
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-family: 'Space Mono', monospace;
  }

  .pstat-val { font-size: 20px; font-weight: 600; font-family: 'Space Mono', monospace; color: var(--accent); }
  .pstat-val.blue { color: var(--blue-hi); }

  #sector-chart-wrap { padding: 16px; border-bottom: 1px solid var(--border); }

  #sector-chart-wrap h3 {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 12px;
  }

  .sector-bar-row { margin-bottom: 8px; }

  .sector-bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-mid);
    margin-bottom: 4px;
  }

  .sector-bar-track { height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; }

  .sector-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }

  #breach-list-wrap { flex: 1; overflow-y: auto; padding: 12px 16px; }

  #breach-list-wrap h3 {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 10px;
  }

  .breach-item {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    background: var(--surface2);
  }

  .breach-item:hover { border-color: var(--accent); background: #1a1e28; }

  .breach-item-name { font-size: 12px; font-weight: 500; color: var(--text); margin-bottom: 4px; }

  .breach-item-meta { display: flex; gap: 8px; font-size: 10px; color: var(--text-dim); flex-wrap: wrap; }

  .tag { padding: 1px 6px; border-radius: 4px; font-size: 10px; }

  .footer-note {
    padding: 8px 16px;
    font-size: 10px;
    color: var(--text-dim);
    border-top: 1px solid var(--border);
    text-align: center;
  }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  .info-hint {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(17,19,24,0.9);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 11px;
    color: var(--text-dim);
    backdrop-filter: blur(8px);
    pointer-events: none;
  }

  .info-hint span { color: var(--text-mid); }
</style>
</head>
<body>

<header>
  <div class="header-title">
    <h1>⚠ US RANSOMWARE ATTACK TRACKER</h1>
    <p>Geographic distribution of major ransomware incidents, 2020–2025</p>
  </div>
  <div class="controls">
    <div class="control-group">
      <label>Year</label>
      <select id="year-select">
        <option value="all">All Years</option>
        <option value="2020">2020</option>
        <option value="2021">2021</option>
        <option value="2022">2022</option>
        <option value="2023">2023</option>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
      </select>
    </div>
    <div class="control-group">
      <label>Sector</label>
      <select id="sector-select">
        <option value="all">All Sectors</option>
        <option value="Healthcare">Healthcare</option>
        <option value="Education">Education</option>
        <option value="Government">Government</option>
        <option value="Technology">Technology</option>
        <option value="Financial">Financial</option>
        <option value="Manufacturing">Manufacturing</option>
        <option value="Other">Other</option>
      </select>
    </div>
  </div>
  <div class="stat-pills">
    <div class="pill"><span class="pill-val" id="stat-total">—</span> <span>attacks</span></div>
    <div class="pill"><span class="pill-val orange" id="stat-states">—</span> <span>states</span></div>
    <div class="pill"><span class="pill-val green" id="stat-paid">—</span> <span>paid ransom</span></div>
  </div>
</header>

<main>
  <div id="map-panel">
    <svg id="geomap"></svg>
    <div class="info-hint">Click a state for details &nbsp;·&nbsp; <span>hover dots for breach info</span></div>
    <div id="legend">
      <h4>Breach Count</h4>
      <div class="legend-gradient"></div>
      <div class="legend-labels"><span>0</span><span id="legend-max">—</span></div>
      <div class="legend-dots">
        <div class="legend-dot-row"><div class="ldot" style="background:#e63946"></div> Healthcare</div>
        <div class="legend-dot-row"><div class="ldot" style="background:#f4a261"></div> Education</div>
        <div class="legend-dot-row"><div class="ldot" style="background:#2dd4a0"></div> Government</div>
        <div class="legend-dot-row"><div class="ldot" style="background:#a78bfa"></div> Technology</div>
        <div class="legend-dot-row"><div class="ldot" style="background:#60a5fa"></div> Financial</div>
        <div class="legend-dot-row"><div class="ldot" style="background:#fbbf24"></div> Other</div>
      </div>
    </div>
    <div id="tooltip"></div>
  </div>
  <div id="side-panel" class="hidden">
    <div class="panel-header">
      <div>
        <h2 id="panel-state-name">—</h2>
        <div class="panel-header state-name" id="panel-subtitle">Select a state</div>
      </div>
      <button id="close-panel">✕</button>
    </div>
    <div class="panel-stats">
      <div class="pstat">
        <div class="pstat-label">Attacks</div>
        <div class="pstat-val" id="ps-count">—</div>
      </div>
      <div class="pstat">
        <div class="pstat-label">Paid Ransom</div>
        <div class="pstat-val blue" id="ps-paid">—</div>
      </div>
    </div>
    <div id="sector-chart-wrap">
      <h3>By Sector</h3>
      <div id="sector-bars"></div>
    </div>
    <div id="breach-list-wrap">
      <h3>Incidents</h3>
      <div id="breach-list"></div>
    </div>
    <div class="footer-note">Source: Ransomwatch / Public Breach Records</div>
  </div>
</main>

<script>
const BREACH_DATA = [{"year":"2020","entity":"Communications & Power Industries (CPI)","state":"CA","city":"Palo Alto","sector":"Other","lat":"37.4419","lng":"-122.1430","paid":"500000","ransom_paid":"True"},{"year":"2020","entity":"Richmond Community Schools","state":"MI","city":"Richmond","sector":"Education","lat":"42.8084","lng":"-82.7574","demand":"10000","ransom_paid":"False"},{"year":"2020","entity":"Pittsburg Unified School District","state":"CA","city":"Pittsburg","sector":"Education","lat":"37.9483","lng":"-121.8844","ransom_paid":"False"},{"year":"2020","entity":"Town of Colonie","state":"NY","city":"Colonie","sector":"Government","lat":"42.7173","lng":"-73.8237","demand":"400000","ransom_paid":"False"},{"year":"2020","entity":"Electronic Warfare Associates (EWA)","state":"VA","city":"Herndon","sector":"Other","lat":"38.9585","lng":"-77.3583","ransom_paid":"False"},{"year":"2020","entity":"Panama-Buena Vista School District","state":"CA","city":"Bakersfield","sector":"Education","lat":"35.3733","lng":"-119.0187","ransom_paid":"False"},{"year":"2020","entity":"Tillamook County Government","state":"OR","city":"Tillamook","sector":"Government","lat":"45.4554","lng":"-123.8457","paid":"300000","ransom_paid":"True"},{"year":"2020","entity":"ITI Technical College","state":"LA","city":"Baton Rouge","sector":"Education","lat":"30.4515","lng":"-91.1871","ransom_paid":"False"},{"year":"2020","entity":"North Miami Beach Police Department","state":"FL","city":"North Miami Beach","sector":"Government","lat":"25.9331","lng":"-80.1739","ransom_paid":"False"},{"year":"2020","entity":"Nacogdoches Independent School District","state":"TX","city":"Nacogdoches","sector":"Education","lat":"31.6035","lng":"-94.6552","ransom_paid":"False"},{"year":"2020","entity":"Gadsden Independent School District","state":"NM","city":"Anthony","sector":"Education","lat":"31.9690","lng":"-106.5861","ransom_paid":"False"},{"year":"2020","entity":"Jordan Health","state":"NY","city":"Rochester","sector":"Healthcare","lat":"43.1566","lng":"-77.6088","ransom_paid":"False"},{"year":"2020","entity":"Epiq Global","state":"MO","city":"Kansas City","sector":"Legal","lat":"38.8827","lng":"-94.6572","ransom_paid":"False"},{"year":"2020","entity":"La Salle County Government","state":"IL","city":"Ottawa","sector":"Government","lat":"41.3228","lng":"-88.8412","ransom_paid":"False"},{"year":"2020","entity":"Visser Precision Manufacturing","state":"CO","city":"Denver","sector":"Manufacturing","lat":"39.7392","lng":"-104.9903","ransom_paid":"False"},{"year":"2020","entity":"Durham City & County Government","state":"NC","city":"Durham","sector":"Government","lat":"35.9940","lng":"-78.8986","ransom_paid":"False"},{"year":"2020","entity":"Champaign-Urbana Public Health District","state":"IL","city":"Champaign","sector":"Government","lat":"40.1106","lng":"-88.2073","ransom_paid":"False"},{"year":"2020","entity":"Finastra","state":"NY","city":"New York","sector":"Financial","lat":"40.7589","lng":"-73.9851","ransom_paid":"False"},{"year":"2020","entity":"Bluffton Township Fire District","state":"SC","city":"Bluffton","sector":"Government","lat":"32.2371","lng":"-80.8604","ransom_paid":"False"},{"year":"2020","entity":"Magellan Health","state":"AZ","city":"Scottsdale","sector":"Healthcare","lat":"33.4255","lng":"-111.9400","ransom_paid":"False"},{"year":"2020","entity":"Boyce Technologies","state":"NY","city":"Long Island City","sector":"Manufacturing","lat":"40.7448","lng":"-73.9463","ransom_paid":"False"},{"year":"2020","entity":"Threadstone Advisors","state":"NY","city":"New York","sector":"Financial","lat":"40.7580","lng":"-73.9855","ransom_paid":"False"},{"year":"2020","entity":"City of Olean","state":"NY","city":"Olean","sector":"Government","lat":"42.0773","lng":"-78.4297","ransom_paid":"False"},{"year":"2020","entity":"Cognizant Technology Solutions","state":"NJ","city":"Teaneck","sector":"Technology","lat":"40.8948","lng":"-74.0268","ransom_paid":"False"},{"year":"2020","entity":"Parkview Medical Center","state":"CO","city":"Pueblo","sector":"Healthcare","lat":"38.2544","lng":"-104.6091","ransom_paid":"False"},{"year":"2020","entity":"Diebold Nixdorf","state":"OH","city":"North Canton","sector":"Financial","lat":"40.8756","lng":"-81.4104","ransom_paid":"False"},{"year":"2020","entity":"City of Torrance","state":"CA","city":"Torrance","sector":"Government","lat":"33.8358","lng":"-118.3406","demand":"689147","ransom_paid":"False"},{"year":"2020","entity":"CivicSmart","state":"WI","city":"Milwaukee","sector":"Technology","lat":"43.0389","lng":"-87.9065","ransom_paid":"False"},{"year":"2020","entity":"ExecuPharm","state":"PA","city":"Lansdale","sector":"Other","lat":"40.2732","lng":"-75.4324","ransom_paid":"False"},{"year":"2020","entity":"Blackbaud","state":"SC","city":"Columbia","sector":"Technology","lat":"34.0007","lng":"-81.0348","ransom_paid":"True"},{"year":"2020","entity":"Grubman Shire Meiselas & Sacks","state":"NY","city":"New York","sector":"Legal","lat":"40.7580","lng":"-73.9855","demand":"21000000","ransom_paid":"False"},{"year":"2020","entity":"Texas Department of Transportation","state":"TX","city":"Austin","sector":"Government","lat":"30.2672","lng":"-97.7431","ransom_paid":"False"},{"year":"2020","entity":"Pitney Bowes","state":"CT","city":"Stamford","sector":"Technology","lat":"41.0534","lng":"-73.5387","ransom_paid":"False"},{"year":"2020","entity":"Michigan State University","state":"MI","city":"East Lansing","sector":"Education","lat":"42.7018","lng":"-84.4822","ransom_paid":"False"},{"year":"2020","entity":"Texas Office of Court Administration","state":"TX","city":"Austin","sector":"Government","lat":"30.2672","lng":"-97.7431","ransom_paid":"False"},{"year":"2020","entity":"Fresenius SE (US Operations)","state":"MA","city":"Waltham","sector":"Healthcare","lat":"42.3751","lng":"-71.1056","ransom_paid":"False"},{"year":"2020","entity":"UC San Francisco (UCSF)","state":"CA","city":"San Francisco","sector":"Education","lat":"37.7632","lng":"-122.4581","demand":"3000000","paid":"1140000","ransom_paid":"True"},{"year":"2020","entity":"City of Florence","state":"AL","city":"Florence","sector":"Government","lat":"34.7990","lng":"-87.6772","demand":"378000","paid":"291000","ransom_paid":"True"},{"year":"2020","entity":"City of Keizer","state":"OR","city":"Keizer","sector":"Government","lat":"44.9901","lng":"-123.0151","demand":"48000","paid":"48000","ransom_paid":"True"},{"year":"2020","entity":"City of Knoxville","state":"TN","city":"Knoxville","sector":"Government","lat":"35.9606","lng":"-83.9207","ransom_paid":"False"},{"year":"2020","entity":"University of Utah","state":"UT","city":"Salt Lake City","sector":"Education","lat":"40.7649","lng":"-111.8421","demand":"457059","paid":"457059","ransom_paid":"True"},{"year":"2020","entity":"Digital Management Inc. (DMI)","state":"MD","city":"Rockville","sector":"Technology","lat":"39.0840","lng":"-77.1528","ransom_paid":"False"},{"year":"2020","entity":"Beaumont Health","state":"MI","city":"Southfield","sector":"Healthcare","lat":"42.4734","lng":"-83.1454","ransom_paid":"False"},{"year":"2020","entity":"Orange S.A. (US Business Division)","state":"NY","city":"New York","sector":"Telecom","lat":"40.7580","lng":"-73.9855","ransom_paid":"False"},{"year":"2020","entity":"Garmin","state":"KS","city":"Olathe","sector":"Technology","lat":"38.8814","lng":"-94.6832","demand":"10000000","ransom_paid":"True"},{"year":"2020","entity":"Tyler Technologies","state":"TX","city":"Plano","sector":"Technology","lat":"33.0198","lng":"-96.6989","ransom_paid":"False"},{"year":"2020","entity":"City of Lafayette","state":"CO","city":"Lafayette","sector":"Government","lat":"39.9936","lng":"-105.0897","demand":"45000","paid":"45000","ransom_paid":"True"},{"year":"2020","entity":"CWT Global (Carlson Wagonlit Travel)","state":"MN","city":"Minneapolis","sector":"Other","lat":"44.9778","lng":"-93.2650","demand":"10000000","paid":"4500000","ransom_paid":"True"},{"year":"2020","entity":"Canon USA","state":"NY","city":"New York","sector":"Technology","lat":"40.7580","lng":"-73.9855","ransom_paid":"False"},{"year":"2020","entity":"Athens Independent School District","state":"TX","city":"Athens","sector":"Education","lat":"32.2043","lng":"-95.8511","demand":"50000","ransom_paid":"False"},{"year":"2020","entity":"Employers Holdings Inc.","state":"NV","city":"Reno","sector":"Other","lat":"39.5296","lng":"-119.8138","ransom_paid":"False"},{"year":"2020","entity":"Haywood County Schools","state":"NC","city":"Waynesville","sector":"Education","lat":"35.5743","lng":"-82.9549","ransom_paid":"False"},{"year":"2020","entity":"SANS Institute","state":"MD","city":"Bethesda","sector":"Education","lat":"38.9897","lng":"-77.0279","ransom_paid":"False"},{"year":"2020","entity":"Carnival Corporation","state":"FL","city":"Miami","sector":"Other","lat":"25.7617","lng":"-80.1918","ransom_paid":"Unknown"},{"year":"2020","entity":"IPG Photonics","state":"MA","city":"Oxford","sector":"Manufacturing","lat":"42.1200","lng":"-71.8661","ransom_paid":"False"},{"year":"2020","entity":"Clark County School District","state":"NV","city":"Las Vegas","sector":"Education","lat":"36.1716","lng":"-115.1391","ransom_paid":"False"},{"year":"2020","entity":"Hartford Public Schools","state":"CT","city":"Hartford","sector":"Education","lat":"41.7658","lng":"-72.6851","ransom_paid":"False"},{"year":"2020","entity":"Galstan & Ward Family Dentistry","state":"GA","city":"Atlanta","sector":"Healthcare","lat":"33.7490","lng":"-84.3880","ransom_paid":"False"},{"year":"2020","entity":"University Hospital New Jersey (UHNJ)","state":"NJ","city":"Newark","sector":"Healthcare","lat":"40.7357","lng":"-74.1724","demand":"1700000","ransom_paid":"Unknown"},{"year":"2020","entity":"Fairfax County Public Schools","state":"VA","city":"Fairfax","sector":"Education","lat":"38.8462","lng":"-77.3064","ransom_paid":"False"},{"year":"2020","entity":"Newhall School District","state":"CA","city":"Valencia","sector":"Education","lat":"34.3917","lng":"-118.5426","ransom_paid":"False"},{"year":"2020","entity":"Toledo Public Schools","state":"OH","city":"Toledo","sector":"Education","lat":"41.6528","lng":"-83.5379","ransom_paid":"False"},{"year":"2020","entity":"Managed.com","state":"AZ","city":"Phoenix","sector":"Technology","lat":"33.4484","lng":"-112.0740","ransom_paid":"False"},{"year":"2020","entity":"St. Lawrence Health System","state":"NY","city":"Potsdam","sector":"Healthcare","lat":"44.6978","lng":"-75.0044","ransom_paid":"False"},{"year":"2020","entity":"Universal Health Services (UHS)","state":"PA","city":"King of Prussia","sector":"Healthcare","lat":"40.0855","lng":"-75.3824","ransom_paid":"False"},{"year":"2020","entity":"Ashtabula County Medical Center","state":"OH","city":"Ashtabula","sector":"Healthcare","lat":"41.8650","lng":"-80.7890","ransom_paid":"False"},{"year":"2020","entity":"Sonoma Valley Hospital","state":"CA","city":"Sonoma","sector":"Healthcare","lat":"38.2919","lng":"-122.4580","ransom_paid":"False"},{"year":"2020","entity":"Software AG (US Operations)","state":"DC","city":"Washington","sector":"Technology","lat":"38.9072","lng":"-77.0369","demand":"23000000","ransom_paid":"False"},{"year":"2020","entity":"Hall County Government","state":"GA","city":"Gainesville","sector":"Government","lat":"34.3165","lng":"-83.8166","ransom_paid":"False"},{"year":"2020","entity":"Seyfarth Shaw LLP","state":"IL","city":"Chicago","sector":"Legal","lat":"41.8827","lng":"-87.6233","ransom_paid":"False"},{"year":"2020","entity":"Barnes & Noble","state":"NY","city":"New York","sector":"Retail","lat":"40.7365","lng":"-74.0007","ransom_paid":"False"},{"year":"2020","entity":"Hendrick Health","state":"TX","city":"Abilene","sector":"Healthcare","lat":"32.4487","lng":"-99.7331","ransom_paid":"False"},{"year":"2020","entity":"Enel Group (US Operations)","state":"CA","city":"San Jose","sector":"Energy","lat":"37.3382","lng":"-121.8863","demand":"14000000","ransom_paid":"False"},{"year":"2020","entity":"Sopra Steria (US Operations)","state":"DC","city":"Washington","sector":"Technology","lat":"38.8951","lng":"-77.0364","ransom_paid":"False"},{"year":"2020","entity":"Nebraska Medicine","state":"NE","city":"Omaha","sector":"Healthcare","lat":"41.2565","lng":"-96.0098","ransom_paid":"False"},{"year":"2020","entity":"Sky Lakes Medical Center","state":"OR","city":"Klamath Falls","sector":"Healthcare","lat":"42.2249","lng":"-121.7817","ransom_paid":"False"},{"year":"2020","entity":"Wyckoff Heights Medical Center","state":"NY","city":"Brooklyn","sector":"Healthcare","lat":"40.7062","lng":"-73.9199","ransom_paid":"False"},{"year":"2020","entity":"University of Vermont Health Network","state":"VT","city":"Burlington","sector":"Healthcare","lat":"44.4759","lng":"-73.2121","ransom_paid":"False"},{"year":"2020","entity":"St. Lawrence Health System","state":"NY","city":"Potsdam","sector":"Healthcare","lat":"44.6978","lng":"-75.0044","ransom_paid":"False"},{"year":"2020","entity":"Americold Realty Trust","state":"GA","city":"Atlanta","sector":"Other","lat":"33.7490","lng":"-84.3880","ransom_paid":"False"},{"year":"2020","entity":"Steelcase Inc.","state":"MI","city":"Grand Rapids","sector":"Manufacturing","lat":"42.9634","lng":"-85.6681","ransom_paid":"False"},{"year":"2020","entity":"Netgain Technologies","state":"MN","city":"St. Cloud","sector":"Technology","lat":"45.5579","lng":"-94.1632","ransom_paid":"True"},{"year":"2020","entity":"K12 Inc. (Stride Inc.)","state":"VA","city":"Herndon","sector":"Education","lat":"38.9897","lng":"-77.4441","ransom_paid":"True"},{"year":"2020","entity":"Capcom USA","state":"CA","city":"San Jose","sector":"Other","lat":"37.3382","lng":"-121.8863","demand":"11000000","ransom_paid":"False"},{"year":"2020","entity":"Rand McNally","state":"IL","city":"Chicago","sector":"Technology","lat":"41.8827","lng":"-87.6233","ransom_paid":"False"},{"year":"2020","entity":"Baltimore County Public Schools","state":"MD","city":"Towson","sector":"Education","lat":"39.4143","lng":"-76.6413","ransom_paid":"False"},{"year":"2020","entity":"Delaware County Government","state":"PA","city":"Media","sector":"Government","lat":"39.9176","lng":"-75.3587","demand":"500000","paid":"500000","ransom_paid":"True"},{"year":"2020","entity":"Huntsville City Schools","state":"AL","city":"Huntsville","sector":"Education","lat":"34.7304","lng":"-86.5861","ransom_paid":"False"},{"year":"2020","entity":"Foxconn North America","state":"TX","city":"El Paso","sector":"Manufacturing","lat":"31.7619","lng":"-106.4850","demand":"34686000","ransom_paid":"Unknown"},{"year":"2020","entity":"GBMC HealthCare","state":"MD","city":"Towson","sector":"Healthcare","lat":"39.4143","lng":"-76.6413","ransom_paid":"False"},{"year":"2020","entity":"Kmart / Transformco","state":"IL","city":"Hoffman Estates","sector":"Retail","lat":"41.9028","lng":"-88.0434","ransom_paid":"False"},{"year":"2020","entity":"Adena Health System","state":"OH","city":"Chillicothe","sector":"Healthcare","lat":"39.3326","lng":"-82.9824","ransom_paid":"False"},{"year":"2020","entity":"Croton-Harmon School District","state":"NY","city":"Croton-on-Hudson","sector":"Education","lat":"41.2034","lng":"-73.8913","ransom_paid":"False"},{"year":"2020","entity":"Apex Laboratory","state":"NY","city":"Melville","sector":"Healthcare","lat":"40.7628","lng":"-73.4076","ransom_paid":"False"},{"year":"2020","entity":"Lehigh Valley Library System","state":"PA","city":"Allentown","sector":"Education","lat":"40.6023","lng":"-75.4714","ransom_paid":"False"},{"year":"2020","entity":"City of Independence","state":"MO","city":"Independence","sector":"Government","lat":"39.0911","lng":"-94.4155","ransom_paid":"False"},{"year":"2020","entity":"Yorktown Central School District","state":"NY","city":"Yorktown Heights","sector":"Education","lat":"41.2948","lng":"-73.7996","ransom_paid":"False"},{"year":"2021","entity":"Victor Central School District","state":"NY","city":"Victor","sector":"Education","lat":"42.9870","lng":"-77.4097","ransom_paid":"False"},{"year":"2021","entity":"Leon Medical Centers","state":"FL","city":"Hialeah","sector":"Healthcare","lat":"25.8576","lng":"-80.2781","ransom_paid":"Unknown"},{"year":"2021","entity":"Automatic Funds Transfer Services (AFTS)","state":"WA","city":"Seattle","sector":"Financial","lat":"47.6062","lng":"-122.3321","ransom_paid":"False"},{"year":"2021","entity":"Broward Health","state":"FL","city":"Fort Lauderdale","sector":"Healthcare","lat":"26.1224","lng":"-80.1373","ransom_paid":"False"},{"year":"2021","entity":"Rehoboth McKinley Christian Health Care","state":"NM","city":"Gallup","sector":"Healthcare","lat":"35.5281","lng":"-108.7426","ransom_paid":"Unknown"},{"year":"2021","entity":"PracticeFirst Medical Management Solutions","state":"NY","city":"Buffalo","sector":"Healthcare","lat":"42.8864","lng":"-78.8784","ransom_paid":"Unknown"},{"year":"2021","entity":"Advanced Urgent Care of Florida","state":"FL","city":"Miami","sector":"Healthcare","lat":"25.7617","lng":"-80.1918","ransom_paid":"Unknown"},{"year":"2021","entity":"Yuba City Unified School District","state":"CA","city":"Yuba City","sector":"Education","lat":"39.1404","lng":"-121.6169","ransom_paid":"False"},{"year":"2021","entity":"Kia Motors America","state":"CA","city":"Irvine","sector":"Other","lat":"33.6846","lng":"-117.8265","demand":"20000000","ransom_paid":"Unknown"},{"year":"2021","entity":"Sierra Wireless","state":"WA","city":"Seattle","sector":"Technology","lat":"47.6062","lng":"-122.3321","ransom_paid":"False"},{"year":"2021","entity":"Pima Community College","state":"AZ","city":"Tucson","sector":"Education","lat":"32.2226","lng":"-110.9747","ransom_paid":"False"},{"year":"2021","entity":"Steamfitters Local 420","state":"PA","city":"Philadelphia","sector":"Other","lat":"39.9526","lng":"-75.1652","ransom_paid":"False"},{"year":"2021","entity":"CompuCom","state":"TX","city":"Dallas","sector":"Technology","lat":"32.7767","lng":"-96.7970","ransom_paid":"False"},{"year":"2021","entity":"Acer Inc. (US Operations)","state":"CA","city":"San Jose","sector":"Technology","lat":"37.3382","lng":"-121.8863","demand":"50000000","ransom_paid":"Unknown"},{"year":"2021","entity":"Hillsborough County Public Schools","state":"FL","city":"Tampa","sector":"Education","lat":"27.9506","lng":"-82.4572","ransom_paid":"False"},{"year":"2021","entity":"Gulf Coast Regional Blood Center","state":"TX","city":"Houston","sector":"Healthcare","lat":"29.7041","lng":"-95.4085","ransom_paid":"False"},{"year":"2021","entity":"Berkshire Hills Bancorp","state":"MA","city":"Pittsfield","sector":"Financial","lat":"42.1015","lng":"-73.9496","ransom_paid":"False"},{"year":"2021","entity":"CNA Financial Corporation","state":"IL","city":"Chicago","sector":"Other","lat":"41.8827","lng":"-87.6233","demand":"60000000","paid":"40000000","ransom_paid":"True"},{"year":"2021","entity":"Sierra Pacific Industries","state":"CA","city":"Anderson","sector":"Manufacturing","lat":"40.5865","lng":"-122.3917","ransom_paid":"False"},{"year":"2021","entity":"Quanta Computer (Apple supplier)","state":"CA","city":"Cupertino","sector":"Technology","lat":"37.3861","lng":"-122.0839","demand":"50000000","ransom_paid":"False"},{"year":"2021","entity":"Houston Rockets (NBA)","state":"TX","city":"Houston","sector":"Other","lat":"29.7490","lng":"-95.3677","ransom_paid":"False"},{"year":"2021","entity":"Broward County Public Schools","state":"FL","city":"Fort Lauderdale","sector":"Education","lat":"26.1224","lng":"-80.1373","demand":"40000000","ransom_paid":"False"},{"year":"2021","entity":"Brenntag North America","state":"TX","city":"Austin","sector":"Other","lat":"30.3505","lng":"-97.7401","demand":"7500000","paid":"4400000","ransom_paid":"True"},{"year":"2021","entity":"DC Metropolitan Police Department","state":"DC","city":"Washington","sector":"Government","lat":"38.8951","lng":"-77.0364","demand":"4000000","ransom_paid":"False"},{"year":"2021","entity":"Scripps Health","state":"CA","city":"San Diego","sector":"Healthcare","lat":"32.7157","lng":"-117.1611","ransom_paid":"False"},{"year":"2021","entity":"Colonial Pipeline","state":"GA","city":"Alpharetta","sector":"Energy","lat":"34.0754","lng":"-84.2941","demand":"4400000","paid":"4400000","ransom_paid":"True"},{"year":"2021","entity":"Steamship Authority of Massachusetts","state":"MA","city":"Woods Hole","sector":"Transportation","lat":"41.5230","lng":"-70.6673","ransom_paid":"False"},{"year":"2021","entity":"ExaGrid","state":"MA","city":"Marlborough","sector":"Technology","lat":"42.3459","lng":"-71.5523","demand":"2500000","paid":"2600000","ransom_paid":"True"},{"year":"2021","entity":"University of Florida Health","state":"FL","city":"Gainesville","sector":"Healthcare","lat":"29.6516","lng":"-82.3490","ransom_paid":"False"},{"year":"2021","entity":"JBS USA Holdings","state":"CO","city":"Greeley","sector":"Other","lat":"40.4233","lng":"-104.7091","demand":"22500000","paid":"11000000","ransom_paid":"True"},{"year":"2021","entity":"Fujifilm (US Operations)","state":"NY","city":"New York","sector":"Technology","lat":"40.7128","lng":"-74.0060","ransom_paid":"False"},{"year":"2021","entity":"St. Clair County Government","state":"MI","city":"Port Huron","sector":"Government","lat":"42.8084","lng":"-82.4879","ransom_paid":"False"},{"year":"2021","entity":"US Foods","state":"IL","city":"Rosemont","sector":"Other","lat":"41.9706","lng":"-87.8631","ransom_paid":"False"},{"year":"2021","entity":"Vermont Agency of Transportation","state":"VT","city":"Montpelier","sector":"Government","lat":"44.2601","lng":"-72.5754","ransom_paid":"False"},{"year":"2021","entity":"Bose Corporation","state":"MA","city":"Framingham","sector":"Technology","lat":"42.2793","lng":"-71.4162","ransom_paid":"False"},{"year":"2021","entity":"Saint Joseph's/Candler Health System","state":"GA","city":"Savannah","sector":"Healthcare","lat":"32.0809","lng":"-81.0912","ransom_paid":"False"},{"year":"2021","entity":"Forefront Dermatology","state":"WI","city":"Green Bay","sector":"Healthcare","lat":"44.5192","lng":"-88.0198","ransom_paid":"False"},{"year":"2021","entity":"Rockwood School District","state":"MO","city":"Eureka","sector":"Education","lat":"38.5219","lng":"-90.5271","ransom_paid":"False"},{"year":"2021","entity":"Judson Independent School District","state":"TX","city":"San Antonio","sector":"Education","lat":"29.5869","lng":"-98.3219","paid":"547045","ransom_paid":"True"},{"year":"2021","entity":"Coos County Family Health Services","state":"NH","city":"Berlin","sector":"Healthcare","lat":"44.4673","lng":"-71.5572","ransom_paid":"False"},{"year":"2021","entity":"Wolfe Eye Clinic","state":"IA","city":"Cedar Rapids","sector":"Healthcare","lat":"41.9779","lng":"-91.6656","ransom_paid":"False"},{"year":"2021","entity":"Kaseya VSA","state":"FL","city":"Miami","sector":"Technology","lat":"25.7617","lng":"-80.1918","demand":"70000000","ransom_paid":"False"},{"year":"2021","entity":"Famous Smoke Shop","state":"PA","city":"Easton","sector":"Retail","lat":"40.6884","lng":"-75.2207","ransom_paid":"False"},{"year":"2021","entity":"Morgan County Schools","state":"TN","city":"Wartburg","sector":"Education","lat":"36.1343","lng":"-84.7963","ransom_paid":"False"},{"year":"2021","entity":"DuPage Medical Group","state":"IL","city":"Downers Grove","sector":"Healthcare","lat":"41.8120","lng":"-88.1070","ransom_paid":"False"},{"year":"2021","entity":"Directions for Living","state":"FL","city":"Clearwater","sector":"Healthcare","lat":"27.9659","lng":"-82.7951","ransom_paid":"False"},{"year":"2021","entity":"Revere Health","state":"UT","city":"Provo","sector":"Healthcare","lat":"40.2338","lng":"-111.6585","ransom_paid":"False"},{"year":"2021","entity":"Memorial Health System","state":"OH","city":"Marietta","sector":"Healthcare","lat":"38.9048","lng":"-82.0021","ransom_paid":"False"},{"year":"2021","entity":"Eskenazi Health","state":"IN","city":"Indianapolis","sector":"Healthcare","lat":"39.7684","lng":"-86.1581","ransom_paid":"False"},{"year":"2021","entity":"Sanford Health","state":"SD","city":"Sioux Falls","sector":"Healthcare","lat":"43.5460","lng":"-96.7313","ransom_paid":"False"},{"year":"2021","entity":"Accenture","state":"NY","city":"New York","sector":"Technology","lat":"40.7128","lng":"-74.0060","demand":"50000000","ransom_paid":"False"},{"year":"2021","entity":"Invenergy LLC","state":"IL","city":"Chicago","sector":"Energy","lat":"41.8827","lng":"-87.6233","ransom_paid":"False"},{"year":"2021","entity":"Marymount Manhattan College","state":"NY","city":"New York","sector":"Education","lat":"40.7736","lng":"-73.9566","ransom_paid":"False"},{"year":"2021","entity":"Howard University","state":"DC","city":"Washington","sector":"Education","lat":"38.9218","lng":"-77.0177","ransom_paid":"False"},{"year":"2021","entity":"NEW Cooperative Inc.","state":"IA","city":"Fort Dodge","sector":"Other","lat":"42.4975","lng":"-94.1680","demand":"5900000","ransom_paid":"False"},{"year":"2021","entity":"TTEC Holdings","state":"CO","city":"Englewood","sector":"Technology","lat":"39.6469","lng":"-104.9876","ransom_paid":"Unknown"},{"year":"2021","entity":"Crystal Valley Cooperative","state":"MN","city":"Mankato","sector":"Other","lat":"44.1636","lng":"-93.9994","ransom_paid":"False"},{"year":"2021","entity":"Pottawatomie County Government","state":"KS","city":"Westmoreland","sector":"Government","lat":"39.3942","lng":"-96.3453","ransom_paid":"True"},{"year":"2021","entity":"Sandhills Publishing","state":"NE","city":"Columbus","sector":"Media","lat":"41.4292","lng":"-97.3687","ransom_paid":"False"},{"year":"2021","entity":"Medsurant Health","state":"NJ","city":"Parsippany","sector":"Healthcare","lat":"40.8459","lng":"-74.4201","ransom_paid":"False"},{"year":"2021","entity":"Olympus Americas","state":"PA","city":"Center Valley","sector":"Technology","lat":"40.5185","lng":"-75.3766","ransom_paid":"False"},{"year":"2021","entity":"Broward Health","state":"FL","city":"Fort Lauderdale","sector":"Healthcare","lat":"26.1224","lng":"-80.1373","ransom_paid":"False"},{"year":"2021","entity":"Sinclair Broadcast Group","state":"MD","city":"Hunt Valley","sector":"Media","lat":"39.4903","lng":"-76.6063","ransom_paid":"Unknown"},{"year":"2021","entity":"Bandwidth Inc.","state":"NC","city":"Raleigh","sector":"Technology","lat":"35.7796","lng":"-78.6382","ransom_paid":"False"},{"year":"2021","entity":"Marketron","state":"ID","city":"Boise","sector":"Technology","lat":"43.6150","lng":"-116.2023","ransom_paid":"False"},{"year":"2021","entity":"Align Technology","state":"AZ","city":"Tempe","sector":"Healthcare","lat":"33.4255","lng":"-111.9400","ransom_paid":"False"},{"year":"2021","entity":"Planned Parenthood Los Angeles","state":"CA","city":"Los Angeles","sector":"Healthcare","lat":"34.0522","lng":"-118.2437","ransom_paid":"False"},{"year":"2021","entity":"Ultimate Kronos Group (UKG)","state":"MA","city":"Weston","sector":"Technology","lat":"42.3667","lng":"-71.3023","ransom_paid":"Unknown"},{"year":"2021","entity":"Shutterfly","state":"CA","city":"Redwood City","sector":"Technology","lat":"37.4770","lng":"-122.2040","ransom_paid":"Unknown"},{"year":"2022","entity":"South Denver Cardiology Associates","state":"CO","city":"Littleton","sector":"Healthcare","lat":"39.6133","lng":"-104.9883","ransom_paid":"False"},{"year":"2022","entity":"Bernalillo County Government","state":"NM","city":"Albuquerque","sector":"Government","lat":"35.0844","lng":"-106.6504","ransom_paid":"False"},{"year":"2022","entity":"Lutheran Social Services of Illinois","state":"IL","city":"Chicago","sector":"Other","lat":"41.8827","lng":"-87.6233","ransom_paid":"False"},{"year":"2022","entity":"Florida International University","state":"FL","city":"Miami","sector":"Education","lat":"25.7572","lng":"-80.3733","ransom_paid":"False"},{"year":"2022","entity":"Albuquerque Public Schools","state":"NM","city":"Albuquerque","sector":"Education","lat":"35.0844","lng":"-106.6504","ransom_paid":"False"},{"year":"2022","entity":"New Mexico State University","state":"NM","city":"Las Cruces","sector":"Education","lat":"32.2840","lng":"-106.7428","ransom_paid":"False"},{"year":"2022","entity":"Broward Health","state":"FL","city":"Fort Lauderdale","sector":"Healthcare","lat":"26.1224","lng":"-80.1373","ransom_paid":"False"},{"year":"2022","entity":"Morley Companies Inc.","state":"MI","city":"Saginaw","sector":"Other","lat":"43.5978","lng":"-83.8891","ransom_paid":"False"},{"year":"2022","entity":"Phillips Community College","state":"AR","city":"Helena","sector":"Education","lat":"34.4715","lng":"-91.0579","ransom_paid":"False"},{"year":"2022","entity":"Hennepin Healthcare","state":"MN","city":"Minneapolis","sector":"Healthcare","lat":"44.9754","lng":"-93.2631","ransom_paid":"False"},{"year":"2022","entity":"Neenah Joint School District","state":"WI","city":"Neenah","sector":"Education","lat":"44.1858","lng":"-88.4626","ransom_paid":"False"},{"year":"2022","entity":"San Francisco 49ers","state":"CA","city":"Santa Clara","sector":"Other","lat":"37.7134","lng":"-122.3860","ransom_paid":"Unknown"},{"year":"2022","entity":"Fitzgibbon Hospital","state":"MO","city":"Marshall","sector":"Healthcare","lat":"39.4200","lng":"-93.3855","ransom_paid":"False"},{"year":"2022","entity":"Professional Finance Company (PFC)","state":"CO","city":"Greeley","sector":"Financial","lat":"40.4233","lng":"-104.7091","ransom_paid":"False"},{"year":"2022","entity":"Kojima Industries (Toyota supplier)","state":"NM","city":"Santa Fe","sector":"Manufacturing","lat":"35.6762","lng":"-105.9669","ransom_paid":"False"},{"year":"2022","entity":"Memorial Hospital of Carbon County","state":"WY","city":"Rawlins","sector":"Healthcare","lat":"41.7919","lng":"-107.2386","ransom_paid":"False"},{"year":"2022","entity":"University of Detroit Mercy","state":"MI","city":"Detroit","sector":"Education","lat":"42.4254","lng":"-83.0016","ransom_paid":"False"},{"year":"2022","entity":"Denso Corporation (US Operations)","state":"MI","city":"Battle Creek","sector":"Manufacturing","lat":"42.3223","lng":"-85.2001","ransom_paid":"False"},{"year":"2022","entity":"Nvidia Corporation","state":"CA","city":"Santa Clara","sector":"Technology","lat":"37.3688","lng":"-121.9653","ransom_paid":"False"},{"year":"2022","entity":"Samsung Electronics (US Operations)","state":"CA","city":"San Jose","sector":"Technology","lat":"37.5630","lng":"-121.9760","ransom_paid":"False"},{"year":"2022","entity":"Mercyhurst University","state":"PA","city":"Erie","sector":"Education","lat":"42.0953","lng":"-80.1528","ransom_paid":"False"},{"year":"2022","entity":"Bridgestone Americas","state":"TN","city":"Nashville","sector":"Manufacturing","lat":"36.1627","lng":"-86.7816","ransom_paid":"False"},{"year":"2022","entity":"Plainfield Township","state":"IN","city":"Plainfield","sector":"Government","lat":"39.7044","lng":"-86.3997","demand":"199000","ransom_paid":"False"},{"year":"2022","entity":"East Tennessee Children's Hospital","state":"TN","city":"Knoxville","sector":"Healthcare","lat":"35.9606","lng":"-83.9207","ransom_paid":"False"},{"year":"2022","entity":"Parker Hannifin Corporation","state":"OH","city":"Cleveland","sector":"Manufacturing","lat":"41.4993","lng":"-81.6944","ransom_paid":"False"},{"year":"2022","entity":"Massapequa School District","state":"NY","city":"Massapequa","sector":"Education","lat":"40.6815","lng":"-73.4693","ransom_paid":"False"},{"year":"2022","entity":"Partnership HealthPlan of California","state":"CA","city":"Redding","sector":"Healthcare","lat":"40.5897","lng":"-122.3917","ransom_paid":"False"},{"year":"2022","entity":"Onondaga County Government","state":"NY","city":"Syracuse","sector":"Government","lat":"43.0481","lng":"-76.1474","ransom_paid":"False"},{"year":"2022","entity":"Washington Local Schools","state":"OH","city":"Toledo","sector":"Education","lat":"41.6964","lng":"-83.6291","ransom_paid":"False"},{"year":"2022","entity":"Snap-on Tools","state":"WI","city":"Kenosha","sector":"Manufacturing","lat":"42.5834","lng":"-87.8212","ransom_paid":"False"},{"year":"2022","entity":"TransUnion (US Operations)","state":"IL","city":"Chicago","sector":"Financial","lat":"41.8827","lng":"-87.6233","ransom_paid":"Unknown"},{"year":"2022","entity":"Spring Independent School District","state":"TX","city":"Houston","sector":"Education","lat":"30.0799","lng":"-95.4172","ransom_paid":"False"},{"year":"2022","entity":"American Dental Association","state":"IL","city":"Chicago","sector":"Healthcare","lat":"41.8827","lng":"-87.6233","ransom_paid":"False"},{"year":"2022","entity":"HP Hood Dairy","state":"MA","city":"Lynnfield","sector":"Other","lat":"42.4787","lng":"-71.0048","ransom_paid":"False"},{"year":"2022","entity":"Napa Valley College","state":"CA","city":"Napa","sector":"Education","lat":"38.2975","lng":"-122.2869","ransom_paid":"False"},{"year":"2022","entity":"Taylor Regional Hospital","state":"GA","city":"Hawkinsville","sector":"Healthcare","lat":"32.7454","lng":"-83.7296","ransom_paid":"False"},{"year":"2022","entity":"SpringHill Medical Center","state":"AL","city":"Mobile","sector":"Healthcare","lat":"30.6954","lng":"-88.0399","ransom_paid":"Unknown"},{"year":"2022","entity":"Fort Sumner Municipal Schools","state":"NM","city":"Fort Sumner","sector":"Education","lat":"34.4709","lng":"-104.2460","ransom_paid":"False"},{"year":"2022","entity":"Oklahoma City Indian Clinic","state":"OK","city":"Oklahoma City","sector":"Healthcare","lat":"35.4676","lng":"-97.5164","ransom_paid":"False"},{"year":"2022","entity":"Peoria Unified School District","state":"AZ","city":"Peoria","sector":"Education","lat":"33.5806","lng":"-112.2374","ransom_paid":"False"},{"year":"2022","entity":"Converse County Government","state":"WY","city":"Douglas","sector":"Government","lat":"42.8405","lng":"-105.3655","ransom_paid":"False"},{"year":"2022","entity":"Mooresville Schools","state":"IN","city":"Mooresville","sector":"Education","lat":"39.6131","lng":"-86.3716","ransom_paid":"False"},{"year":"2022","entity":"Greenville County Schools","state":"SC","city":"Greenville","sector":"Education","lat":"34.8526","lng":"-82.3940","ransom_paid":"False"},{"year":"2022","entity":"Maternal & Family Health Services","state":"PA","city":"Wilkes-Barre","sector":"Healthcare","lat":"41.4090","lng":"-75.6624","ransom_paid":"False"},{"year":"2022","entity":"Somerset County Government","state":"NJ","city":"Somerville","sector":"Government","lat":"40.5623","lng":"-74.6146","ransom_paid":"False"},{"year":"2022","entity":"Trib Total Media","state":"PA","city":"Pittsburgh","sector":"Media","lat":"40.4406","lng":"-79.9959","ransom_paid":"False"},{"year":"2022","entity":"Glenn County Office of Education","state":"CA","city":"Willows","sector":"Education","lat":"39.5171","lng":"-122.3883","paid":"400000","ransom_paid":"True"},{"year":"2022","entity":"City of Quincy","state":"IL","city":"Quincy","sector":"Government","lat":"39.9356","lng":"-91.4099","paid":"500000","ransom_paid":"True"},{"year":"2022","entity":"Kellogg Community College","state":"MI","city":"Battle Creek","sector":"Education","lat":"42.3314","lng":"-85.2749","ransom_paid":"False"},{"year":"2022","entity":"Lincoln College","state":"IL","city":"Lincoln","sector":"Education","lat":"40.1489","lng":"-89.3648","ransom_paid":"Unknown"},{"year":"2022","entity":"Consulate Health Care","state":"FL","city":"Jacksonville","sector":"Healthcare","lat":"30.3322","lng":"-81.6557","ransom_paid":"False"},{"year":"2022","entity":"New Bedford Police Department","state":"MA","city":"New Bedford","sector":"Government","lat":"41.6362","lng":"-70.9342","ransom_paid":"False"},{"year":"2022","entity":"Cincinnati State Technical & Community College","state":"OH","city":"Cincinnati","sector":"Education","lat":"39.1031","lng":"-84.5120","ransom_paid":"False"},{"year":"2022","entity":"Spectrum Health (Corewell Health)","state":"MI","city":"Grand Rapids","sector":"Healthcare","lat":"42.9634","lng":"-85.6681","ransom_paid":"False"},{"year":"2022","entity":"Crawford County Government","state":"PA","city":"Meadville","sector":"Government","lat":"41.0275","lng":"-80.3526","ransom_paid":"False"},{"year":"2022","entity":"Palomar Health","state":"CA","city":"Escondido","sector":"Healthcare","lat":"33.1434","lng":"-117.0552","ransom_paid":"False"},{"year":"2022","entity":"Texas Department of Transportation","state":"TX","city":"Austin","sector":"Government","lat":"30.2672","lng":"-97.7431","ransom_paid":"False"},{"year":"2022","entity":"Shields Health Care Group","state":"MA","city":"Braintree","sector":"Healthcare","lat":"42.2096","lng":"-71.0023","ransom_paid":"False"},{"year":"2022","entity":"Yuma Regional Medical Center","state":"AZ","city":"Yuma","sector":"Healthcare","lat":"32.7254","lng":"-114.6244","ransom_paid":"False"},{"year":"2022","entity":"Macmillan Publishers (US Operations)","state":"NY","city":"New York","sector":"Media","lat":"40.7128","lng":"-74.0060","ransom_paid":"False"},{"year":"2022","entity":"NUC University","state":"PR","city":"Bayamon","sector":"Education","lat":"18.4655","lng":"-66.1057","ransom_paid":"False"},{"year":"2022","entity":"Methodist McKinney Hospital","state":"TX","city":"McKinney","sector":"Healthcare","lat":"33.1972","lng":"-96.6397","ransom_paid":"False"},{"year":"2022","entity":"Flagstar Bank","state":"MI","city":"Troy","sector":"Financial","lat":"42.5803","lng":"-83.1521","ransom_paid":"False"},{"year":"2022","entity":"Christus Health","state":"TX","city":"Irving","sector":"Healthcare","lat":"32.8574","lng":"-97.0572","ransom_paid":"False"},{"year":"2022","entity":"College of the Desert","state":"CA","city":"Palm Desert","sector":"Education","lat":"33.7636","lng":"-116.3192","ransom_paid":"False"},{"year":"2022","entity":"Entrust Corporation","state":"MN","city":"Minneapolis","sector":"Technology","lat":"44.9778","lng":"-93.2650","ransom_paid":"False"},{"year":"2022","entity":"North Carolina A&T State University","state":"NC","city":"Greensboro","sector":"Education","lat":"36.0726","lng":"-79.7920","ransom_paid":"False"},{"year":"2022","entity":"MultiCare Health System","state":"WA","city":"Tacoma","sector":"Healthcare","lat":"47.2529","lng":"-122.4443","ransom_paid":"False"},{"year":"2022","entity":"Wheat Ridge City Government","state":"CO","city":"Wheat Ridge","sector":"Government","lat":"39.7661","lng":"-105.0772","demand":"5000000","ransom_paid":"False"},{"year":"2022","entity":"Davenport Community School District","state":"IA","city":"Davenport","sector":"Education","lat":"41.5236","lng":"-90.5776","ransom_paid":"False"},{"year":"2022","entity":"Marion County Government","state":"IN","city":"Indianapolis","sector":"Government","lat":"39.7684","lng":"-86.1581","ransom_paid":"False"},{"year":"2022","entity":"Enzo Biochem","state":"NY","city":"New York","sector":"Healthcare","lat":"40.7589","lng":"-73.9851","ransom_paid":"False"},{"year":"2022","entity":"Goodman Campbell Brain & Spine","state":"IN","city":"Indianapolis","sector":"Healthcare","lat":"39.9784","lng":"-86.1581","ransom_paid":"False"},{"year":"2022","entity":"Bryan County Schools","state":"GA","city":"Pembroke","sector":"Education","lat":"31.9977","lng":"-81.4384","ransom_paid":"False"},{"year":"2022","entity":"Grand Rapids Public Schools","state":"MI","city":"Grand Rapids","sector":"Education","lat":"42.9634","lng":"-85.6681","ransom_paid":"False"},{"year":"2022","entity":"Solano Community College","state":"CA","city":"Fairfield","sector":"Education","lat":"38.2518","lng":"-122.0258","ransom_paid":"False"},{"year":"2022","entity":"Cisco Systems","state":"CA","city":"San Jose","sector":"Technology","lat":"37.3382","lng":"-121.8863","ransom_paid":"False"},{"year":"2022","entity":"Bluefield University","state":"VA","city":"Bluefield","sector":"Education","lat":"37.2598","lng":"-81.2779","ransom_paid":"False"},{"year":"2022","entity":"Kearney Public Schools","state":"NE","city":"Kearney","sector":"Education","lat":"40.6996","lng":"-99.0817","ransom_paid":"False"},{"year":"2022","entity":"Lakeview Hospital System","state":"MN","city":"Stillwater","sector":"Healthcare","lat":"45.0564","lng":"-92.8138","ransom_paid":"False"},{"year":"2022","entity":"Los Angeles Unified School District","state":"CA","city":"Los Angeles","sector":"Education","lat":"34.0522","lng":"-118.2437","ransom_paid":"False"},{"year":"2022","entity":"Mars Area School District","state":"PA","city":"Mars","sector":"Education","lat":"40.6964","lng":"-80.0108","ransom_paid":"False"},{"year":"2022","entity":"Suffolk County Government","state":"NY","city":"Riverhead","sector":"Government","lat":"40.9176","lng":"-72.6718","demand":"2500000","ransom_paid":"False"},{"year":"2022","entity":"Tucson Unified School District","state":"AZ","city":"Tucson","sector":"Education","lat":"32.2226","lng":"-110.9747","ransom_paid":"False"},{"year":"2022","entity":"CommonSpirit Health","state":"IL","city":"Chicago","sector":"Healthcare","lat":"41.8827","lng":"-87.6233","ransom_paid":"False"},{"year":"2022","entity":"LoanCare","state":"VA","city":"Virginia Beach","sector":"Financial","lat":"36.8529","lng":"-75.9780","ransom_paid":"False"},{"year":"2022","entity":"Lockwood School District","state":"MT","city":"Billings","sector":"Education","lat":"45.7833","lng":"-108.4596","ransom_paid":"False"},{"year":"2022","entity":"Johnson Controls International","state":"WI","city":"Milwaukee","sector":"Manufacturing","lat":"43.0389","lng":"-87.9065","ransom_paid":"Unknown"},{"year":"2022","entity":"OakBend Medical Center","state":"TX","city":"Richmond","sector":"Healthcare","lat":"29.5580","lng":"-95.7613","ransom_paid":"False"},{"year":"2022","entity":"SuperCare Health","state":"CA","city":"Downey","sector":"Healthcare","lat":"33.8369","lng":"-118.0413","ransom_paid":"False"},{"year":"2022","entity":"Town of Islip","state":"NY","city":"Islip","sector":"Government","lat":"40.7282","lng":"-73.2107","ransom_paid":"False"},{"year":"2022","entity":"Ada School District","state":"MI","city":"Ada","sector":"Education","lat":"42.9634","lng":"-85.4989","ransom_paid":"False"},{"year":"2022","entity":"Tift Regional Health System","state":"GA","city":"Tifton","sector":"Healthcare","lat":"31.4488","lng":"-83.5224","ransom_paid":"False"},{"year":"2022","entity":"Munster Town Government","state":"IN","city":"Munster","sector":"Government","lat":"41.5653","lng":"-87.5120","ransom_paid":"False"},{"year":"2022","entity":"Rackspace Technology","state":"TX","city":"San Antonio","sector":"Technology","lat":"29.4241","lng":"-98.4936","ransom_paid":"Unknown"},{"year":"2022","entity":"Mount St. Mary's College","state":"NY","city":"Newburgh","sector":"Education","lat":"41.5100","lng":"-74.0176","ransom_paid":"False"},{"year":"2022","entity":"Shasta Regional Medical Center","state":"CA","city":"Redding","sector":"Healthcare","lat":"40.5865","lng":"-122.3917","ransom_paid":"False"},{"year":"2022","entity":"Los Angeles Housing Authority (HACLA)","state":"CA","city":"Los Angeles","sector":"Government","lat":"34.0522","lng":"-118.2437","ransom_paid":"False"},{"year":"2022","entity":"Injury Care Medical Center","state":"ID","city":"Boise","sector":"Healthcare","lat":"43.6150","lng":"-116.2023","ransom_paid":"False"},{"year":"2022","entity":"California Department of Finance","state":"CA","city":"Sacramento","sector":"Government","lat":"38.5816","lng":"-121.4944","ransom_paid":"False"},{"year":"2022","entity":"Knox College","state":"IL","city":"Galesburg","sector":"Education","lat":"40.9476","lng":"-90.3706","ransom_paid":"False"},{"year":"2022","entity":"New York City Bar Association","state":"NY","city":"New York","sector":"Legal","lat":"40.7589","lng":"-73.9851","ransom_paid":"False"},{"year":"2022","entity":"Empress EMS","state":"NY","city":"Yonkers","sector":"Healthcare","lat":"40.9176","lng":"-73.8988","ransom_paid":"False"},{"year":"2022","entity":"Bristol Community College","state":"MA","city":"Attleboro","sector":"Education","lat":"41.9423","lng":"-71.3301","ransom_paid":"False"},{"year":"2023","entity":"Atlantic General Hospital","state":"MD","city":"Berlin","sector":"Healthcare","lat":"38.3218","lng":"-75.2171","ransom_paid":"False"},{"year":"2023","entity":"Southeastern Louisiana University","state":"LA","city":"Hammond","sector":"Education","lat":"30.3213","lng":"-90.2148","ransom_paid":"False"},{"year":"2023","entity":"Yum! Brands (KFC/Pizza Hut/Taco Bell)","state":"KY","city":"Louisville","sector":"Other","lat":"38.2527","lng":"-85.7585","ransom_paid":"False"},{"year":"2023","entity":"Swansea Public Schools","state":"MA","city":"Swansea","sector":"Education","lat":"41.7510","lng":"-71.2200","ransom_paid":"False"},{"year":"2023","entity":"Tucson Unified School District","state":"AZ","city":"Tucson","sector":"Education","lat":"32.2226","lng":"-110.9747","ransom_paid":"False"},{"year":"2023","entity":"NextGen Healthcare","state":"GA","city":"Atlanta","sector":"Technology","lat":"33.7490","lng":"-84.3880","ransom_paid":"False"},{"year":"2023","entity":"ION Cleared Derivatives","state":"NY","city":"New York","sector":"Financial","lat":"40.7128","lng":"-74.0060","ransom_paid":"Unknown"},{"year":"2023","entity":"Dish Network","state":"CO","city":"Englewood","sector":"Technology","lat":"39.7392","lng":"-104.9903","ransom_paid":"True"},{"year":"2023","entity":"NationsBenefits Holdings","state":"FL","city":"Fort Lauderdale","sector":"Healthcare","lat":"26.1224","lng":"-80.1373","ransom_paid":"False"},{"year":"2023","entity":"Tallahassee Memorial HealthCare","state":"FL","city":"Tallahassee","sector":"Healthcare","lat":"30.4383","lng":"-84.2807","ransom_paid":"False"},{"year":"2023","entity":"Lehigh Valley Health Network","state":"PA","city":"Allentown","sector":"Healthcare","lat":"40.6023","lng":"-75.4714","ransom_paid":"False"},{"year":"2023","entity":"City of Oakland","state":"CA","city":"Oakland","sector":"Government","lat":"37.8044","lng":"-122.2712","ransom_paid":"False"},{"year":"2023","entity":"Transformative Healthcare","state":"MA","city":"Framingham","sector":"Healthcare","lat":"42.3601","lng":"-71.0589","ransom_paid":"False"},{"year":"2023","entity":"Montgomery General Hospital","state":"VA","city":"Blacksburg","sector":"Healthcare","lat":"37.4082","lng":"-80.5607","demand":"750000","ransom_paid":"False"},{"year":"2023","entity":"Minneapolis Public Schools","state":"MN","city":"Minneapolis","sector":"Education","lat":"44.9778","lng":"-93.2650","demand":"1000000","ransom_paid":"False"},{"year":"2023","entity":"US Marshals Service","state":"DC","city":"Washington","sector":"Government","lat":"38.8951","lng":"-77.0364","ransom_paid":"False"},{"year":"2023","entity":"MCNA Dental","state":"GA","city":"Atlanta","sector":"Healthcare","lat":"33.7490","lng":"-84.3880","demand":"10000000","ransom_paid":"False"},{"year":"2023","entity":"City of Modesto","state":"CA","city":"Modesto","sector":"Government","lat":"37.6391","lng":"-120.9969","ransom_paid":"False"},{"year":"2023","entity":"Hatch Bank","state":"CA","city":"San Jose","sector":"Financial","lat":"37.3382","lng":"-121.8863","ransom_paid":"False"},{"year":"2023","entity":"Lumen Technologies","state":"LA","city":"Monroe","sector":"Technology","lat":"32.5186","lng":"-92.1193","ransom_paid":"False"},{"year":"2023","entity":"Jefferson County Schools","state":"CO","city":"Golden","sector":"Education","lat":"39.7392","lng":"-104.9903","ransom_paid":"False"},{"year":"2023","entity":"PharMerica","state":"KY","city":"Louisville","sector":"Healthcare","lat":"38.1785","lng":"-85.6813","ransom_paid":"False"},{"year":"2023","entity":"Penncrest School District","state":"PA","city":"Saegertown","sector":"Education","lat":"41.3828","lng":"-80.3626","ransom_paid":"False"},{"year":"2023","entity":"Western Digital","state":"CA","city":"San Jose","sector":"Technology","lat":"37.3382","lng":"-121.8863","ransom_paid":"False"},{"year":"2023","entity":"Wawasee Community School Corporation","state":"IN","city":"Syracuse","sector":"Education","lat":"41.4336","lng":"-85.7280","ransom_paid":"False"},{"year":"2023","entity":"San Bernardino County Sheriff's Dept","state":"CA","city":"San Bernardino","sector":"Government","lat":"34.1083","lng":"-117.2898","paid":"1100000","ransom_paid":"True"},{"year":"2023","entity":"NCR Corporation (Aloha POS)","state":"GA","city":"Atlanta","sector":"Technology","lat":"33.7490","lng":"-84.3880","ransom_paid":"Unknown"},{"year":"2023","entity":"Uniondale Union Free School District","state":"NY","city":"Uniondale","sector":"Education","lat":"40.7005","lng":"-73.5924","demand":"1000000","ransom_paid":"False"},{"year":"2023","entity":"City of Augusta","state":"GA","city":"Augusta","sector":"Government","lat":"33.4735","lng":"-82.0105","ransom_paid":"False"},{"year":"2023","entity":"Stanford University","state":"CA","city":"Palo Alto","sector":"Education","lat":"37.4275","lng":"-122.1697","ransom_paid":"False"},{"year":"2023","entity":"Yellow Pages / Hibu","state":"NY","city":"New York","sector":"Media","lat":"40.7128","lng":"-74.0060","ransom_paid":"False"},{"year":"2023","entity":"Danbury Public Schools","state":"CT","city":"Danbury","sector":"Education","lat":"41.3948","lng":"-73.4540","ransom_paid":"False"},{"year":"2023","entity":"City of Dallas","state":"TX","city":"Dallas","sector":"Government","lat":"32.7767","lng":"-96.7970","ransom_paid":"False"},{"year":"2023","entity":"Harvard Pilgrim Health Care","state":"MA","city":"Canton","sector":"Healthcare","lat":"42.2529","lng":"-71.0023","ransom_paid":"False"},{"year":"2023","entity":"Dragos Inc.","state":"MD","city":"Hanover","sector":"Technology","lat":"39.0917","lng":"-76.7497","ransom_paid":"False"},{"year":"2023","entity":"City of Lowell","state":"MA","city":"Lowell","sector":"Government","lat":"42.6334","lng":"-71.3162","ransom_paid":"Unknown"},{"year":"2023","entity":"Southern Arkansas University","state":"AR","city":"Magnolia","sector":"Education","lat":"33.6025","lng":"-93.0925","ransom_paid":"False"},{"year":"2023","entity":"Progress Software / MOVEit","state":"MA","city":"Burlington","sector":"Technology","lat":"42.4073","lng":"-71.0603","ransom_paid":"False"},{"year":"2023","entity":"New York City Department of Education","state":"NY","city":"New York","sector":"Education","lat":"40.7128","lng":"-74.0060","ransom_paid":"False"},{"year":"2023","entity":"Johns Hopkins University & Medicine","state":"MD","city":"Baltimore","sector":"Education","lat":"39.2904","lng":"-76.6122","ransom_paid":"False"},{"year":"2023","entity":"University of Georgia","state":"GA","city":"Athens","sector":"Education","lat":"33.9480","lng":"-83.3774","ransom_paid":"False"},{"year":"2023","entity":"Hawaiian Community College","state":"HI","city":"Hilo","sector":"Education","lat":"19.7074","lng":"-155.0847","ransom_paid":"True"},{"year":"2023","entity":"Maximus Inc.","state":"VA","city":"Reston","sector":"Government","lat":"38.9605","lng":"-77.3561","ransom_paid":"False"},{"year":"2023","entity":"Genworth Financial","state":"VA","city":"Richmond","sector":"Financial","lat":"37.5407","lng":"-77.4360","ransom_paid":"False"},{"year":"2023","entity":"American Airlines (MOVEit)","state":"TX","city":"Fort Worth","sector":"Transportation","lat":"32.8998","lng":"-97.0403","ransom_paid":"False"},{"year":"2023","entity":"Illinois Dept of Innovation & Technology","state":"IL","city":"Springfield","sector":"Government","lat":"39.7980","lng":"-89.6540","ransom_paid":"False"},{"year":"2023","entity":"US Department of Energy (MOVEit)","state":"DC","city":"Washington","sector":"Government","lat":"38.8951","lng":"-77.0364","ransom_paid":"False"},{"year":"2023","entity":"Casepoint","state":"VA","city":"Tysons","sector":"Technology","lat":"38.9094","lng":"-77.2405","ransom_paid":"Unknown"},{"year":"2023","entity":"State of Maine (MOVEit)","state":"ME","city":"Augusta","sector":"Government","lat":"44.3106","lng":"-69.7795","ransom_paid":"False"},{"year":"2023","entity":"HCA Healthcare","state":"TN","city":"Nashville","sector":"Healthcare","lat":"36.1627","lng":"-86.7816","ransom_paid":"False"},{"year":"2023","entity":"Prospect Medical Holdings","state":"CA","city":"Los Angeles","sector":"Healthcare","lat":"33.9425","lng":"-118.4081","ransom_paid":"False"},{"year":"2023","entity":"Clorox Company","state":"CA","city":"Oakland","sector":"Manufacturing","lat":"37.8044","lng":"-122.2712","ransom_paid":"False"},{"year":"2023","entity":"University of Michigan","state":"MI","city":"Ann Arbor","sector":"Education","lat":"42.2808","lng":"-83.7430","ransom_paid":"False"},{"year":"2023","entity":"Mom's Meals (PurFoods LLC)","state":"IA","city":"Des Moines","sector":"Healthcare","lat":"41.5868","lng":"-93.6250","ransom_paid":"False"},{"year":"2023","entity":"Caesars Entertainment","state":"NV","city":"Las Vegas","sector":"Other","lat":"36.1147","lng":"-115.1728","demand":"30000000","paid":"15000000","ransom_paid":"True"},{"year":"2023","entity":"MGM Resorts International","state":"NV","city":"Las Vegas","sector":"Other","lat":"36.1147","lng":"-115.1728","ransom_paid":"False"},{"year":"2023","entity":"Merced City School District","state":"CA","city":"Merced","sector":"Education","lat":"37.3022","lng":"-120.4830","ransom_paid":"False"},{"year":"2023","entity":"Johnson Controls International","state":"WI","city":"Milwaukee","sector":"Manufacturing","lat":"43.0389","lng":"-87.9065","demand":"51000000","ransom_paid":"Unknown"},{"year":"2023","entity":"ESO Solutions Inc.","state":"TX","city":"Austin","sector":"Technology","lat":"30.2672","lng":"-97.7431","ransom_paid":"Unknown"},{"year":"2023","entity":"McLaren Health Care","state":"MI","city":"Grand Blanc","sector":"Healthcare","lat":"42.9270","lng":"-83.6886","ransom_paid":"False"},{"year":"2023","entity":"Henry Schein Inc.","state":"NY","city":"Melville","sector":"Healthcare","lat":"40.7900","lng":"-73.5340","ransom_paid":"Unknown"},{"year":"2023","entity":"CDW Corporation","state":"IL","city":"Vernon Hills","sector":"Technology","lat":"42.2259","lng":"-87.9401","demand":"80000000","ransom_paid":"False"},{"year":"2023","entity":"Boeing","state":"VA","city":"Arlington","sector":"Manufacturing","lat":"47.4442","lng":"-122.3016","ransom_paid":"False"},{"year":"2023","entity":"Mr. Cooper Group","state":"TX","city":"Coppell","sector":"Financial","lat":"32.9546","lng":"-97.0641","ransom_paid":"False"},{"year":"2023","entity":"Ardent Health Services","state":"TN","city":"Brentwood","sector":"Healthcare","lat":"36.0154","lng":"-86.6816","ransom_paid":"False"},{"year":"2023","entity":"Fred Hutchinson Cancer Center","state":"WA","city":"Seattle","sector":"Healthcare","lat":"47.6097","lng":"-122.3331","ransom_paid":"False"},{"year":"2023","entity":"Henry Schein Inc. (2nd attack)","state":"NY","city":"Melville","sector":"Healthcare","lat":"40.7900","lng":"-73.5340","ransom_paid":"Unknown"},{"year":"2023","entity":"Fidelity National Financial","state":"FL","city":"Jacksonville","sector":"Financial","lat":"30.3322","lng":"-81.6557","ransom_paid":"Unknown"},{"year":"2023","entity":"North Texas Municipal Water District","state":"TX","city":"Wylie","sector":"Government","lat":"33.1584","lng":"-96.8172","ransom_paid":"False"},{"year":"2023","entity":"Integris Health","state":"OK","city":"Oklahoma City","sector":"Healthcare","lat":"35.4676","lng":"-97.5164","ransom_paid":"False"},{"year":"2023","entity":"VF Corporation","state":"CO","city":"Denver","sector":"Retail","lat":"39.7392","lng":"-104.9903","ransom_paid":"Unknown"},{"year":"2023","entity":"Liberty Hospital","state":"MO","city":"Liberty","sector":"Healthcare","lat":"39.2453","lng":"-94.4192","ransom_paid":"Unknown"},{"year":"2023","entity":"Anna Jaques Hospital","state":"MA","city":"Newburyport","sector":"Healthcare","lat":"42.7557","lng":"-70.8673","ransom_paid":"False"},{"year":"2024","entity":"LoanDepot","state":"CA","city":"Irvine","sector":"Financial","lat":"33.6846","lng":"-117.8265","ransom_paid":"Unknown"},{"year":"2024","entity":"Muscatine Power and Water","state":"IA","city":"Muscatine","sector":"Government","lat":"41.4245","lng":"-91.0432","ransom_paid":"False"},{"year":"2024","entity":"Schneider Electric (US Operations)","state":"MA","city":"Andover","sector":"Technology","lat":"42.6584","lng":"-71.3673","ransom_paid":"False"},{"year":"2024","entity":"Fulton County Government","state":"GA","city":"Atlanta","sector":"Government","lat":"33.7490","lng":"-84.3880","ransom_paid":"False"},{"year":"2024","entity":"Jackson County Government","state":"MO","city":"Kansas City","sector":"Government","lat":"39.0997","lng":"-94.5786","ransom_paid":"True"},{"year":"2024","entity":"Lurie Children's Hospital","state":"IL","city":"Chicago","sector":"Healthcare","lat":"41.9234","lng":"-87.6742","demand":"3700000","ransom_paid":"False"},{"year":"2024","entity":"Prudential Financial","state":"NJ","city":"Newark","sector":"Financial","lat":"40.7489","lng":"-74.1724","ransom_paid":"False"},{"year":"2024","entity":"Germantown City Government","state":"TN","city":"Germantown","sector":"Government","lat":"35.0870","lng":"-89.8101","ransom_paid":"Unknown"},{"year":"2024","entity":"Nissan North America","state":"TN","city":"Franklin","sector":"Other","lat":"36.0665","lng":"-86.4438","ransom_paid":"False"},{"year":"2024","entity":"Bank of America (via Infosys McCamish)","state":"NC","city":"Charlotte","sector":"Financial","lat":"35.2271","lng":"-80.8431","ransom_paid":"False"},{"year":"2024","entity":"Skokie Village Government","state":"IL","city":"Skokie","sector":"Government","lat":"42.0334","lng":"-87.7332","ransom_paid":"Unknown"},{"year":"2024","entity":"Change Healthcare","state":"TN","city":"Nashville","sector":"Healthcare","lat":"36.1627","lng":"-86.7816","demand":"22000000","paid":"22000000","ransom_paid":"True"},{"year":"2024","entity":"Integris Health (extortion phase)","state":"OK","city":"Oklahoma City","sector":"Healthcare","lat":"35.4676","lng":"-97.5164","ransom_paid":"False"},{"year":"2024","entity":"Panera Bread","state":"MO","city":"St. Louis","sector":"Other","lat":"38.6270","lng":"-90.1994","ransom_paid":"True"},{"year":"2024","entity":"Duvel Moortgat USA (Firestone Walker)","state":"CA","city":"Paso Robles","sector":"Other","lat":"35.3733","lng":"-119.0187","ransom_paid":"False"},{"year":"2024","entity":"Omni Hotels & Resorts","state":"TX","city":"Dallas","sector":"Other","lat":"32.7767","lng":"-96.7970","ransom_paid":"False"},{"year":"2024","entity":"AT&T (Snowflake breach)","state":"TX","city":"Dallas","sector":"Telecom","lat":"32.7767","lng":"-96.7970","demand":"373000","paid":"373000","ransom_paid":"True"},{"year":"2024","entity":"Hoya Corporation (US Operations)","state":"CA","city":"San Jose","sector":"Manufacturing","lat":"37.3382","lng":"-121.8863","demand":"10000000","ransom_paid":"False"},{"year":"2024","entity":"Tipton Wastewater Treatment Plant","state":"IN","city":"Tipton","sector":"Government","lat":"40.2836","lng":"-86.0422","ransom_paid":"False"},{"year":"2024","entity":"City of Tarrant","state":"AL","city":"Tarrant","sector":"Government","lat":"33.5837","lng":"-86.7714","ransom_paid":"False"},{"year":"2024","entity":"Frontier Communications","state":"TX","city":"Dallas","sector":"Telecom","lat":"32.7767","lng":"-96.7970","ransom_paid":"False"},{"year":"2024","entity":"City of Wichita","state":"KS","city":"Wichita","sector":"Government","lat":"37.6872","lng":"-97.3301","ransom_paid":"False"},{"year":"2024","entity":"Keytronic Corporation","state":"WA","city":"Spokane","sector":"Manufacturing","lat":"47.6793","lng":"-117.4044","ransom_paid":"False"},{"year":"2024","entity":"Ascension Health","state":"MO","city":"St. Louis","sector":"Healthcare","lat":"38.6270","lng":"-90.1994","ransom_paid":"Unknown"},{"year":"2024","entity":"MedStar Health","state":"MD","city":"Columbia","sector":"Healthcare","lat":"39.2165","lng":"-76.8608","ransom_paid":"False"},{"year":"2024","entity":"Singing River Health System","state":"MS","city":"Pascagoula","sector":"Healthcare","lat":"30.3688","lng":"-88.5561","ransom_paid":"False"},{"year":"2024","entity":"Dropbox Sign","state":"CA","city":"San Francisco","sector":"Technology","lat":"37.7749","lng":"-122.4194","ransom_paid":"False"},{"year":"2024","entity":"Ticketmaster / Live Nation (Snowflake)","state":"CA","city":"Beverly Hills","sector":"Other","lat":"34.0195","lng":"-118.4912","demand":"500000","ransom_paid":"False"},{"year":"2024","entity":"Wayne Memorial Hospital","state":"GA","city":"Jesup","sector":"Healthcare","lat":"31.5655","lng":"-82.0115","ransom_paid":"False"},{"year":"2024","entity":"City of Cleveland","state":"OH","city":"Cleveland","sector":"Government","lat":"41.4993","lng":"-81.6944","ransom_paid":"False"},{"year":"2024","entity":"CDK Global","state":"IL","city":"Hoffman Estates","sector":"Technology","lat":"41.9028","lng":"-88.0434","demand":"25000000","paid":"25000000","ransom_paid":"True"},{"year":"2024","entity":"Advance Auto Parts (Snowflake)","state":"NC","city":"Raleigh","sector":"Retail","lat":"35.7796","lng":"-78.6382","ransom_paid":"False"},{"year":"2024","entity":"Patelco Credit Union","state":"CA","city":"Dublin","sector":"Financial","lat":"37.7023","lng":"-121.9358","ransom_paid":"False"},{"year":"2024","entity":"Rite Aid Corporation","state":"PA","city":"Philadelphia","sector":"Retail","lat":"39.9526","lng":"-75.1652","ransom_paid":"False"},{"year":"2024","entity":"City of Columbus","state":"OH","city":"Columbus","sector":"Government","lat":"39.9612","lng":"-82.9988","ransom_paid":"False"},{"year":"2024","entity":"McLaren Health Care","state":"MI","city":"Grand Blanc","sector":"Healthcare","lat":"42.9270","lng":"-83.6886","ransom_paid":"False"},{"year":"2024","entity":"Los Angeles County Superior Court","state":"CA","city":"Los Angeles","sector":"Government","lat":"34.0522","lng":"-118.2437","ransom_paid":"Unknown"},{"year":"2024","entity":"Columbus Regional Healthcare","state":"NC","city":"Whiteville","sector":"Healthcare","lat":"34.9987","lng":"-79.9103","ransom_paid":"False"},{"year":"2024","entity":"Port of Seattle / Sea-Tac Airport","state":"WA","city":"Seattle","sector":"Government","lat":"47.4502","lng":"-122.3088","ransom_paid":"False"},{"year":"2024","entity":"Planned Parenthood of Montana","state":"MT","city":"Helena","sector":"Healthcare","lat":"46.5958","lng":"-112.0270","ransom_paid":"False"},{"year":"2024","entity":"NorthBay Vacaville Hospital","state":"CA","city":"Vacaville","sector":"Healthcare","lat":"38.3566","lng":"-121.9877","ransom_paid":"Unknown"},{"year":"2024","entity":"Seattle Public Library","state":"WA","city":"Seattle","sector":"Government","lat":"47.6062","lng":"-122.3321","ransom_paid":"False"},{"year":"2024","entity":"Kawasaki Motors USA","state":"CA","city":"Irvine","sector":"Manufacturing","lat":"33.8669","lng":"-117.9981","ransom_paid":"False"},{"year":"2024","entity":"American Water Works","state":"NJ","city":"Camden","sector":"Government","lat":"39.9208","lng":"-75.1185","ransom_paid":"False"},{"year":"2024","entity":"Arkansas Children's Hospital","state":"AR","city":"Little Rock","sector":"Healthcare","lat":"34.7465","lng":"-92.3370","ransom_paid":"False"},{"year":"2024","entity":"Arkansas City Water Treatment Plant","state":"KS","city":"Arkansas City","sector":"Government","lat":"37.0618","lng":"-97.0376","ransom_paid":"False"},{"year":"2024","entity":"Highline Public Schools","state":"WA","city":"Burien","sector":"Education","lat":"47.4266","lng":"-122.2820","ransom_paid":"False"},{"year":"2024","entity":"Comcast (via FBCS breach)","state":"PA","city":"Philadelphia","sector":"Telecom","lat":"39.9526","lng":"-75.1652","ransom_paid":"False"},{"year":"2024","entity":"Casio Computer (US Operations)","state":"CA","city":"San Jose","sector":"Technology","lat":"37.3382","lng":"-121.8863","ransom_paid":"False"},{"year":"2024","entity":"Henry County Schools","state":"GA","city":"McDonough","sector":"Education","lat":"33.4551","lng":"-84.2041","ransom_paid":"False"},{"year":"2024","entity":"Kootenai Health","state":"ID","city":"Coeur d'Alene","sector":"Healthcare","lat":"47.6740","lng":"-116.7800","ransom_paid":"False"},{"year":"2024","entity":"OnePoint Patient Care","state":"CO","city":"Denver","sector":"Healthcare","lat":"39.7392","lng":"-104.9903","ransom_paid":"False"},{"year":"2024","entity":"Memorial Hospital and Manor","state":"GA","city":"Bainbridge","sector":"Healthcare","lat":"30.8941","lng":"-84.5752","ransom_paid":"Unknown"},{"year":"2024","entity":"Weiser Memorial Hospital","state":"ID","city":"Weiser","sector":"Healthcare","lat":"44.2524","lng":"-116.9718","ransom_paid":"Unknown"},{"year":"2024","entity":"Blue Yonder (supply chain platform)","state":"AZ","city":"Scottsdale","sector":"Technology","lat":"33.4484","lng":"-111.9740","ransom_paid":"Unknown"},{"year":"2024","entity":"Starbucks (Blue Yonder downstream)","state":"WA","city":"Seattle","sector":"Other","lat":"47.6062","lng":"-122.3321","ransom_paid":"False"},{"year":"2024","entity":"Artivion Inc.","state":"GA","city":"Atlanta","sector":"Healthcare","lat":"33.7490","lng":"-84.3880","ransom_paid":"Unknown"},{"year":"2024","entity":"Texas Tech University Health Sciences","state":"TX","city":"Lubbock","sector":"Education","lat":"33.5779","lng":"-101.8552","ransom_paid":"False"},{"year":"2024","entity":"Rhode Island RIBridges","state":"RI","city":"Providence","sector":"Government","lat":"41.8240","lng":"-71.4128","ransom_paid":"False"},{"year":"2024","entity":"Pittsburgh Regional Transit","state":"PA","city":"Pittsburgh","sector":"Government","lat":"40.4406","lng":"-79.9959","ransom_paid":"False"},{"year":"2025","entity":"Community Health Center (CT)","state":"CT","city":"Middletown","sector":"Healthcare","lat":"41.5623","lng":"-72.6509","ransom_paid":"False"},{"year":"2025","entity":"Conduent Business Services","state":"NJ","city":"Florham Park","sector":"Technology","lat":"40.7958","lng":"-74.3812","ransom_paid":"True"},{"year":"2025","entity":"Mundelein Park & Recreation District","state":"IL","city":"Mundelein","sector":"Government","lat":"42.2645","lng":"-88.0062","demand":"400000","ransom_paid":"Unknown"},{"year":"2025","entity":"SimonMed Imaging","state":"AZ","city":"Scottsdale","sector":"Healthcare","lat":"33.4942","lng":"-111.9261","demand":"1000000","ransom_paid":"True"},{"year":"2025","entity":"Anthony Hospital","state":"IL","city":"Effingham","sector":"Healthcare","lat":"39.1200","lng":"-88.5434","ransom_paid":"False"},{"year":"2025","entity":"New York Blood Center Enterprises","state":"NY","city":"New York","sector":"Healthcare","lat":"40.7128","lng":"-74.0060","ransom_paid":"False"},{"year":"2025","entity":"Frederick Health","state":"MD","city":"Frederick","sector":"Healthcare","lat":"39.4143","lng":"-77.4105","ransom_paid":"False"},{"year":"2025","entity":"Sunflower Medical Group","state":"KS","city":"Olathe","sector":"Healthcare","lat":"38.9717","lng":"-95.2353","demand":"970000","ransom_paid":"False"},{"year":"2025","entity":"Sault Tribe of Chippewa Indians","state":"MI","city":"Sault Ste. Marie","sector":"Government","lat":"46.4953","lng":"-84.3453","demand":"5000000","ransom_paid":"Unknown"},{"year":"2025","entity":"PowerSchool (secondary extortion)","state":"CA","city":"Sunnyvale","sector":"Technology","lat":"37.4419","lng":"-122.1430","paid":"2850000","ransom_paid":"True"},{"year":"2025","entity":"Bell Ambulance","state":"WI","city":"Milwaukee","sector":"Healthcare","lat":"43.0389","lng":"-87.9065","ransom_paid":"False"},{"year":"2025","entity":"NASCAR","state":"FL","city":"Daytona Beach","sector":"Other","lat":"28.3772","lng":"-80.7075","demand":"4000000","ransom_paid":"False"},{"year":"2025","entity":"Highlands Oncology Group PA","state":"AR","city":"Springdale","sector":"Healthcare","lat":"36.3729","lng":"-94.2088","demand":"700000","ransom_paid":"False"},{"year":"2025","entity":"WK Kellogg Co (via Cleo exploit)","state":"MI","city":"Battle Creek","sector":"Other","lat":"42.3314","lng":"-85.5636","ransom_paid":"False"},{"year":"2025","entity":"Maryland Transit Administration","state":"MD","city":"Baltimore","sector":"Government","lat":"39.2904","lng":"-76.6122","demand":"3400000","ransom_paid":"False"},{"year":"2025","entity":"Anne Arundel Dermatology","state":"MD","city":"Linthicum","sector":"Healthcare","lat":"39.0840","lng":"-76.4341","ransom_paid":"Unknown"},{"year":"2025","entity":"Hoboken City Government","state":"NJ","city":"Hoboken","sector":"Government","lat":"40.7440","lng":"-74.0324","ransom_paid":"False"},{"year":"2025","entity":"Comcast Corporation (Medusa claim)","state":"PA","city":"Philadelphia","sector":"Telecom","lat":"39.9526","lng":"-75.1652","demand":"1200000","ransom_paid":"Unknown"},{"year":"2025","entity":"Hyundai AutoEver America","state":"CA","city":"Fountain Valley","sector":"Technology","lat":"33.7183","lng":"-117.9794","ransom_paid":"False"},{"year":"2025","entity":"West Hills Medical Center","state":"CA","city":"West Hills","sector":"Healthcare","lat":"34.2025","lng":"-118.6361","ransom_paid":"False"},{"year":"2025","entity":"North Providence City Government","state":"RI","city":"North Providence","sector":"Government","lat":"41.8501","lng":"-71.4637","demand":"100000","ransom_paid":"Unknown"},{"year":"2025","entity":"Yale New Haven Health System","state":"CT","city":"New Haven","sector":"Healthcare","lat":"41.3083","lng":"-72.9279","ransom_paid":"False"},{"year":"2025","entity":"Mid Michigan Medical Billing Service","state":"MI","city":"Saginaw","sector":"Healthcare","lat":"43.5978","lng":"-83.8891","ransom_paid":"False"},{"year":"2025","entity":"Henry County Government (IL)","state":"IL","city":"Cambridge","sector":"Government","lat":"41.3609","lng":"-90.0040","demand":"500000","ransom_paid":"Unknown"},{"year":"2025","entity":"DaVita Inc.","state":"CO","city":"Denver","sector":"Healthcare","lat":"39.7392","lng":"-104.9903","ransom_paid":"Unknown"},{"year":"2025","entity":"Penn-Harris-Madison Schools","state":"IN","city":"Mishawaka","sector":"Education","lat":"41.6820","lng":"-86.1180","ransom_paid":"False"},{"year":"2025","entity":"Missouri Department of Conservation","state":"MO","city":"Jefferson City","sector":"Government","lat":"38.5767","lng":"-92.1735","ransom_paid":"False"},{"year":"2025","entity":"NAHGA Claims Servicers","state":"TN","city":"Nashville","sector":"Financial","lat":"36.1627","lng":"-86.7816","ransom_paid":"False"},{"year":"2025","entity":"Cookeville Regional Medical Center","state":"TN","city":"Cookeville","sector":"Healthcare","lat":"36.1628","lng":"-85.5016","demand":"1150000","ransom_paid":"False"},{"year":"2025","entity":"Family Health West","state":"CO","city":"Fruita","sector":"Healthcare","lat":"39.0756","lng":"-108.5506","demand":"700000","ransom_paid":"False"},{"year":"2025","entity":"City of Hope Cancer Center","state":"CA","city":"Duarte","sector":"Healthcare","lat":"34.1339","lng":"-117.9821","ransom_paid":"False"},{"year":"2025","entity":"Iowa County Government","state":"IA","city":"Marengo","sector":"Government","lat":"42.8375","lng":"-91.9807","ransom_paid":"False"},{"year":"2025","entity":"Covenant Health (TN)","state":"TN","city":"Knoxville","sector":"Healthcare","lat":"35.9606","lng":"-83.9207","ransom_paid":"False"},{"year":"2025","entity":"Washington State Admin Office of Courts","state":"WA","city":"Olympia","sector":"Government","lat":"47.0379","lng":"-122.9007","ransom_paid":"False"},{"year":"2025","entity":"DuPage County Government","state":"IL","city":"Wheaton","sector":"Government","lat":"41.8120","lng":"-88.1070","ransom_paid":"False"},{"year":"2025","entity":"Kettering Health","state":"OH","city":"Dayton","sector":"Healthcare","lat":"39.7648","lng":"-84.2108","ransom_paid":"False"},{"year":"2025","entity":"Surmodics Inc.","state":"MN","city":"Eden Prairie","sector":"Healthcare","lat":"44.9778","lng":"-93.2650","ransom_paid":"False"},{"year":"2025","entity":"Ingram Micro","state":"CA","city":"Irvine","sector":"Technology","lat":"33.6846","lng":"-117.8265","ransom_paid":"Unknown"},{"year":"2025","entity":"Central Maine Healthcare","state":"ME","city":"Lewiston","sector":"Healthcare","lat":"44.0951","lng":"-70.2187","ransom_paid":"False"},{"year":"2025","entity":"Oregon Anesthesiology Group","state":"OR","city":"Portland","sector":"Healthcare","lat":"45.5051","lng":"-122.6750","ransom_paid":"False"},{"year":"2025","entity":"St. Joseph's College of Maine","state":"ME","city":"Standish","sector":"Education","lat":"43.7248","lng":"-70.4117","ransom_paid":"False"},{"year":"2025","entity":"Providence Public Schools","state":"RI","city":"Providence","sector":"Education","lat":"41.8240","lng":"-71.4128","ransom_paid":"False"},{"year":"2025","entity":"Aflac (US Operations)","state":"GA","city":"Columbus","sector":"Financial","lat":"32.4609","lng":"-84.9877","ransom_paid":"Unknown"},{"year":"2025","entity":"Avosina Healthcare Solutions","state":"NY","city":"New York","sector":"Healthcare","lat":"40.7128","lng":"-74.0060","ransom_paid":"False"},{"year":"2025","entity":"Marysville Exempted Village Schools","state":"OH","city":"Marysville","sector":"Education","lat":"40.2363","lng":"-83.3675","ransom_paid":"False"},{"year":"2025","entity":"Hawaiian Airlines","state":"HI","city":"Honolulu","sector":"Transportation","lat":"21.3069","lng":"-157.8583","ransom_paid":"False"},{"year":"2025","entity":"GlobalLogic (via Oracle EBS / Clop)","state":"CA","city":"San Jose","sector":"Technology","lat":"37.3382","lng":"-121.8863","ransom_paid":"False"},{"year":"2025","entity":"LKQ Corporation (via Oracle EBS / Clop)","state":"IL","city":"Chicago","sector":"Other","lat":"41.8827","lng":"-87.6233","ransom_paid":"Unknown"},{"year":"2025","entity":"Accu Reference Medical Laboratory","state":"NJ","city":"Linden","sector":"Healthcare","lat":"40.6220","lng":"-74.2146","ransom_paid":"False"},{"year":"2025","entity":"Manpower Group","state":"WI","city":"Milwaukee","sector":"Other","lat":"43.0389","lng":"-87.9065","ransom_paid":"False"},{"year":"2025","entity":"Nevada State Government Systems","state":"NV","city":"Carson City","sector":"Government","lat":"39.1638","lng":"-119.7674","ransom_paid":"False"},{"year":"2025","entity":"Allianz Life Insurance (US)","state":"MN","city":"Minneapolis","sector":"Financial","lat":"44.9778","lng":"-93.2650","ransom_paid":"Unknown"},{"year":"2025","entity":"Washington Post (via Oracle EBS / Clop)","state":"DC","city":"Washington","sector":"Media","lat":"38.9072","lng":"-77.0369","ransom_paid":"Unknown"},{"year":"2025","entity":"Delta County Memorial Hospital","state":"CO","city":"Delta","sector":"Healthcare","lat":"38.7583","lng":"-108.0727","ransom_paid":"False"},{"year":"2025","entity":"Spindletop Center","state":"TX","city":"Beaumont","sector":"Healthcare","lat":"30.0799","lng":"-94.1313","demand":"1650000","ransom_paid":"False"},{"year":"2025","entity":"Cache Valley ENT","state":"UT","city":"Logan","sector":"Healthcare","lat":"41.7370","lng":"-111.8338","demand":"150000","ransom_paid":"False"},{"year":"2025","entity":"Central Texas Pediatric Orthopedics","state":"TX","city":"Round Rock","sector":"Healthcare","lat":"30.5082","lng":"-97.6789","ransom_paid":"False"},{"year":"2025","entity":"Trumbull County Government","state":"OH","city":"Warren","sector":"Government","lat":"41.2342","lng":"-80.8184","ransom_paid":"False"},{"year":"2025","entity":"Valley View Independent School District","state":"TX","city":"Pharr","sector":"Education","lat":"26.9243","lng":"-99.1301","ransom_paid":"False"},{"year":"2025","entity":"Kelly Legal Group","state":"TX","city":"Dallas","sector":"Legal","lat":"32.7767","lng":"-96.7970","ransom_paid":"Unknown"},{"year":"2025","entity":"Richmond Behavioral Health Authority","state":"VA","city":"Richmond","sector":"Healthcare","lat":"37.5407","lng":"-77.4360","ransom_paid":"False"},{"year":"2025","entity":"Kaufman County Government","state":"TX","city":"Kaufman","sector":"Government","lat":"32.5893","lng":"-96.3086","ransom_paid":"False"},{"year":"2025","entity":"Evergreen Printing Co.","state":"NJ","city":"Bellmawr","sector":"Manufacturing","lat":"39.8762","lng":"-75.0596","ransom_paid":"Unknown"}];

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
    demand:      row['Demand in USD'],
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

  const years = [2020, 2021, 2022, 2023, 2024, 2025];
  const csvPromises = years.map(y =>
    d3.csv(`ransomware_${y}_usa.csv`).then(rows => rows.map(r => parseRow(r, y)))
  );

  const topoPromise = d3.json("./states-10m.json");

  Promise.all([topoPromise, ...csvPromises]).then(([topology, ...yearArrays]) => {
    window.BREACH_DATA = yearArrays.flat();
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
  selectedState = null; render();
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
</script>
</body>
</html>
