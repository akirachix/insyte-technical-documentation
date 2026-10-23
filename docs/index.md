---
title: Insyte Documentation
description: Technical documentation for Insyte, the night-light alert dashboard and offline patrol app for Lake Kariba.
hide:
  - navigation
  - toc
---

<div class="custom-home">
<div class="hero-section">
<div class="hero-content">
<div class="insyte-eyebrow">TECHNICAL DOCUMENTATION</div>
<h1 class="hero-title">Pointing patrols to where the lake needs checking<span class="accent-dot">.</span></h1>
<p class="hero-subtitle">Technical documentation for Insyte. Explore how nightly satellite light data becomes zone alerts for patrol coordinators, and how patrol officers record inspections, violations and catch checks on an offline phone app.</p>
<div class="insyte-actions">
<a href="overview/" class="btn-primary">Read the overview &rarr;</a>
<a href="architecture/" class="btn-text">Explore architecture &rarr;</a>
</div>
</div>
<div class="hero-image">
<svg viewBox="0 0 320 240" role="img" aria-label="Lake zones with highlighted night-light activity" xmlns="http://www.w3.org/2000/svg">
<rect x="4" y="4" width="312" height="232" rx="20" fill="#0B3A82"/>
<g fill="none" stroke="#2F5FA8" stroke-width="1">
<path d="M24 60h272M24 110h272M24 160h272M24 210h272"/>
<path d="M60 24v192M120 24v192M180 24v192M240 24v192"/>
</g>
<path d="M40 150c30-60 70-90 120-80s90 40 110 20c10 40-20 90-90 100s-120-10-140-40z" fill="#173F85" stroke="#6F96D1" stroke-width="1.5"/>
<g fill="#FFC857">
<circle cx="120" cy="118" r="4"/><circle cx="132" cy="128" r="3"/><circle cx="112" cy="132" r="3"/><circle cx="125" cy="140" r="2.5"/>
</g>
<circle cx="124" cy="128" r="22" fill="none" stroke="#FFC857" stroke-opacity=".7" stroke-width="1.5"/>
<g fill="#FFC857" fill-opacity=".55">
<circle cx="214" cy="146" r="2.5"/><circle cx="224" cy="156" r="2.5"/>
</g>
<g fill="#E9EFF8"><circle cx="248" cy="52" r="14"/></g>
<circle cx="254" cy="48" r="12" fill="#0B3A82"/>
</svg>
</div>
</div>
<div class="section-divider">
<span>START HERE</span>
</div>
<div class="card-grid">
<a href="architecture/" class="insyte-card">
<div class="card-icon">
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
</div>
<h3>Architecture</h3>
<p>Understand the system structure, its components and how data flows between them.</p>
<span class="card-link">View architecture &rarr;</span>
</a>
<a href="alert-engine/" class="insyte-card">
<div class="card-icon">
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.7 21a2 2 0 0 1-3.4 0"></path></svg>
</div>
<h3>Alert engine</h3>
<p>See how VIIRS night-light data is turned into zone alerts with a confidence level and reason.</p>
<span class="card-link">View alert engine &rarr;</span>
</a>
<a href="frontend-mobile/" class="insyte-card">
<div class="card-icon">
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="4" ry="4"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
</div>
<h3>Patrol officer app</h3>
<p>Learn how officers claim alerts, record field reports and sync when the signal returns.</p>
<span class="card-link">View mobile app &rarr;</span>
</a>
<a href="security/" class="insyte-card">
<div class="card-icon">
<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
</div>
<h3>Security</h3>
<p>See how roles, location data and sensitive field records are protected.</p>
<span class="card-link">View security &rarr;</span>
</a>
</div>
</div>