// ==UserScript==
// @name         UnLikeIt
// @version      1.0.0
// @description  Take back your privacy. The ultimate easy-to-use tool to wipe your Instagram history and manage followers. Beats platform restrictions without complex dev scripts.
// @match        https://www.instagram.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        virtualRoute: '/unlikeit',
        cleanerRoutes: ['/your_activity/interactions/likes', '/your_activity/interactions/comments']
    };

    function getCookie(name) {
        const v = `; ${document.cookie}`;
        const parts = v.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    const RelationManager = {
        start: function() {
            document.title = "UnLikeIt Relation Manager";

            const toolCSS = `
                :root {
                    --app-font: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    --bg-root: #0f0f12;
                    --glass-base: rgba(30, 30, 35, 0.65);
                    --glass-card: rgba(255, 255, 255, 0.03);
                    --glass-card-hover: rgba(255, 255, 255, 0.07);
                    --glass-border: rgba(255, 255, 255, 0.08);
                    --glass-highlight: rgba(255, 255, 255, 0.15);
                    --text-primary: #F5F5F7;
                    --text-secondary: #86868B;
                    --text-tertiary: #58585D;
                    --accent-blue: #2997FF;
                    --accent-lilac: #AF52DE;
                    --accent-cyan: #5AC8FA;
                    --accent-danger: #FF453A;
                    --accent-success: #30D158;
                    --gradient-mesh: radial-gradient(circle at 0% 0%, rgba(41, 151, 255, 0.08), transparent 40%),
                                     radial-gradient(circle at 100% 100%, rgba(175, 82, 222, 0.08), transparent 40%);
                }
                * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
                body {
                    background-color: var(--bg-root);
                    background-image: var(--gradient-mesh);
                    color: var(--text-primary);
                    font-family: var(--app-font);
                    margin: 0; height: 100vh; display: flex; overflow: hidden;
                    letter-spacing: -0.01em;
                }
                .sidebar {
                    width: 320px;
                    background: rgba(20, 20, 24, 0.75);
                    backdrop-filter: blur(40px) saturate(180%);
                    -webkit-backdrop-filter: blur(40px) saturate(180%);
                    border-right: 1px solid var(--glass-border);
                    padding: 48px 24px;
                    display: flex; flex-direction: column;
                    z-index: 20;
                    box-shadow: 5px 0 30px rgba(0,0,0,0.1);
                }
                .logo {
                    margin-bottom: 40px; padding-left: 14px;
                }
                .logo-main {
                    font-size: 34px;
                    font-weight: 800;
                    background: linear-gradient(90deg, #F5F5F7, #cfcfd1);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    letter-spacing: -0.03em;
                    line-height: 1;
                    margin-bottom: 4px;
                }
                .logo-sub {
                    font-size: 15px;
                    font-weight: 500;
                    color: var(--text-secondary);
                    letter-spacing: 0.01em;
                }
                .menu-item {
                    padding: 16px 18px;
                    border-radius: 12px; cursor: pointer;
                    color: var(--text-secondary); margin-bottom: 6px;
                    font-weight: 400; font-size: 15px;
                    display: flex; justify-content: space-between; align-items: center;
                    transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
                }
                .menu-item:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
                .menu-item.active {
                    background: rgba(255,255,255,0.08);
                    color: var(--text-primary);
                    font-weight: 600;
                    box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset;
                }
                .count-badge {
                    background: rgba(255, 255, 255, 0.1); padding: 4px 10px; border-radius: 8px;
                    font-size: 12px; color: var(--text-secondary); font-weight: 500;
                    transition: 0.2s;
                }
                .menu-item.active .count-badge { background: var(--text-primary); color: #000; font-weight: 700; }
                .btn {
                    background: var(--text-primary); color: #000; border: none;
                    padding: 14px; border-radius: 12px;
                    font-weight: 600; cursor: pointer; font-size: 14px;
                    transition: all 0.2s ease;
                    text-align: center; letter-spacing: -0.01em;
                }
                .btn:active { transform: scale(0.98); opacity: 0.9; }
                .btn:hover { box-shadow: 0 4px 12px rgba(255,255,255,0.15); }
                .btn-danger {
                    background: rgba(255, 69, 58, 0.15);
                    color: var(--accent-danger);
                    border: 1px solid rgba(255, 69, 58, 0.3);
                    box-shadow: none;
                }
                .btn-danger:hover { background: rgba(255, 69, 58, 0.25); border-color: var(--accent-danger); color: #fff; }
                .main-content { flex: 1; overflow-y: auto; position: relative; scroll-behavior: smooth; }
                .header-bar {
                    padding: 28px 48px;
                    background: rgba(15, 15, 18, 0.6);
                    backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
                    border-bottom: 1px solid var(--glass-border);
                    position: sticky; top: 0; z-index: 10;
                    display: flex; justify-content: space-between; align-items: center;
                }
                h3 { font-weight: 600; margin: 0; font-size: 26px; letter-spacing: -0.02em; color: var(--text-primary); }
                .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 28px; padding: 48px; }
                .user-card {
                    background: var(--glass-card);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    padding: 28px;
                    text-align: center;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    position: relative;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                }
                .user-card:hover {
                    background: var(--glass-card-hover);
                    transform: translateY(-4px);
                    border-color: var(--glass-highlight);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                }
                .user-card.active {
                    background: rgba(41, 151, 255, 0.08);
                    border-color: rgba(41, 151, 255, 0.4);
                    box-shadow: 0 0 0 1px rgba(41, 151, 255, 0.2);
                }
                .avatar {
                    width: 84px; height: 84px; border-radius: 50%; margin-bottom: 18px;
                    object-fit: cover;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .avatar.status-danger { box-shadow: 0 0 0 3px var(--accent-danger); }
                .avatar.status-success { box-shadow: 0 0 0 3px var(--accent-success); }
                .action-btn {
                    padding: 8px 18px; font-size: 12px; border-radius: 100px; font-weight: 600;
                    margin: 0 6px; border: none; cursor: pointer; transition: 0.2s;
                    font-family: var(--app-font);
                }
                .btn-select { background: rgba(255,255,255,0.08); color: var(--text-primary); border: 1px solid transparent; }
                .btn-select:hover { background: rgba(255,255,255,0.15); }
                .btn-whitelist { background: transparent; color: var(--text-secondary); border: 1px solid rgba(255,255,255,0.05); }
                .btn-whitelist:hover { border-color: var(--text-secondary); color: var(--text-primary); }
                .overlay-center {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    display: flex; justify-content: center; align-items: center; flex-direction: column;
                    z-index: 5;
                }
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
            `;
            const style = document.createElement('style');
            style.textContent = toolCSS;
            document.head.appendChild(style);

            const DEFAULTS = { whitelist: [] };
            let APP_CONFIG;
            try {
                APP_CONFIG = JSON.parse(localStorage.getItem('ig_manager_config')) || { ...DEFAULTS };
                if (!Array.isArray(APP_CONFIG.whitelist)) APP_CONFIG.whitelist = [];
            } catch { APP_CONFIG = { ...DEFAULTS }; }
            const saveConfig = () => localStorage.setItem('ig_manager_config', JSON.stringify(APP_CONFIG));

            const API = {
                async fetch(id, hash, type, progressCallback) {
                    let edges = [], hasNext = true, cursor = null;
                    while (hasNext) {
                        const variables = { id, include_reel: true, fetch_mutual: false, first: 50, after: cursor };
                        try {
                            let response = await fetch(`https://www.instagram.com/graphql/query/?query_hash=${hash}&variables=${encodeURIComponent(JSON.stringify(variables))}`, {
                                headers: { 'x-csrftoken': getCookie('csrftoken') }
                            });
                            let json = await response.json();
                            let data = type === 'following' ? json.data.user.edge_follow : json.data.user.edge_followed_by;
                            data.edges.forEach(e => edges.push(e.node));
                            hasNext = data.page_info.has_next_page;
                            cursor = data.page_info.end_cursor;
                            if (progressCallback) progressCallback(edges.length);
                            await new Promise(r => setTimeout(r, Math.random() * 500 + 500));
                        } catch (e) { console.error(e); hasNext = false; }
                    }
                    return edges;
                },
                async disconnect(id) {
                    try {
                        await fetch(`https://www.instagram.com/web/friendships/${id}/unfollow/`, {
                            method: 'POST', headers: { 'x-csrftoken': getCookie('csrftoken'), 'content-type': 'application/x-www-form-urlencoded' }
                        });
                        return true;
                    } catch { return false; }
                }
            };

            const ToolManager = {
                state: { following: [], followers: [], nonFollowers: [], mutuals: [], selection: new Set() },
                init() {
                    document.body.innerHTML = `
                        <div class="sidebar">
                            <div class="logo">
                                <div class="logo-main">UnLikeIt</div>
                            </div>
                            <div class="menu-item active" id="nav-scan"><span>Overview</span></div>
                            <div style="height:1px; background:var(--glass-border); margin:24px 0;"></div>
                            <div class="menu-item" id="nav-non"><span>Non-Followers</span> <span class="count-badge" id="badge-non">0</span></div>
                            <div class="menu-item" id="nav-mut"><span>Mutuals</span> <span class="count-badge" id="badge-mut">0</span></div>
                            <div class="menu-item" id="nav-wl"><span>Whitelist</span> <span class="count-badge" id="badge-wl">0</span></div>
                            <div style="margin-top:auto">
                                <div style="font-size:14px; color:var(--text-secondary); margin-bottom:14px; font-weight:500; text-align:center"><span id="lbl-selected">0</span> selected</div>
                                <button id="btn-execute" class="btn btn-danger" style="width:100%; opacity:0.5; cursor:not-allowed; margin-bottom:12px">Unfollow Selected</button>
                                <button id="btn-exit" class="btn" style="width:100%; background:rgba(255,255,255,0.05); color:var(--text-secondary)">Exit Dashboard</button>
                            </div>
                        </div>
                        <div class="main-content">
                            <div class="header-bar">
                                <h3>Relation Manager</h3>
                                <button class="btn" id="btn-toggle-all" style="padding:10px 20px; background:rgba(255,255,255,0.08); color:var(--text-primary); font-size:13px">Select All</button>
                            </div>
                            <div id="grid-container" class="grid-layout">
                                <div class="overlay-center">
                                    <h2 style="margin-bottom:16px; font-weight:700; color:var(--text-primary); font-size: 32px; letter-spacing: -0.03em;">Ready to Analyze?</h2>
                                    <p style="color:var(--text-secondary); margin-bottom:36px; font-weight:300; font-size:18px">We will secure-fetch your complete relationship graph.</p>
                                    <button class="btn" id="btn-init-scan" style="padding:16px 36px; font-size:16px; background:linear-gradient(135deg, #e0e0e0, #ffffff); color:#000; box-shadow: 0 10px 30px rgba(255,255,255,0.1)">Start Scan</button>
                                </div>
                            </div>
                        </div>
                    `;
                    this.bindEvents();
                },
                bindEvents() {
                    document.getElementById('btn-init-scan').onclick = this.performScan.bind(this);
                    document.getElementById('nav-scan').onclick = this.performScan.bind(this);
                    document.getElementById('btn-execute').onclick = this.executeBatch.bind(this);
                    document.getElementById('btn-toggle-all').onclick = this.toggleSelection.bind(this);
                    document.getElementById('btn-exit').onclick = () => window.location.href = '/';
                    ['non', 'mut', 'wl'].forEach(k => document.getElementById('nav-' + k).onclick = () => this.switchView(k));
                },
                async performScan() {
                    const grid = document.getElementById('grid-container');
                    grid.innerHTML = `<div class="overlay-center"><h3 style="color:var(--text-primary); margin-bottom:8px; font-size:24px">Scanning Relations...</h3><p style="color:var(--text-secondary); font-size:15px">Fetched: <span id="progress-val" style="color:var(--accent-blue); font-variant-numeric: tabular-nums;">0</span></p></div>`;
                    const uid = getCookie('ds_user_id');
                    if (!uid) return alert('Login required');
                    const [following, followers] = await Promise.all([
                        API.fetch(uid, '3dec7e2c57367ef3da3d987d89f9dbc8', 'following', c => document.getElementById('progress-val').innerText = c),
                        API.fetch(uid, 'c76146de99bb02f6415203be841dd25a', 'followers', c => document.getElementById('progress-val').innerText = c)
                    ]);
                    this.state.following = following;
                    this.state.followers = followers;
                    const followerSet = new Set(followers.map(u => u.id));
                    this.state.nonFollowers = following.filter(u => !followerSet.has(u.id));
                    this.state.mutuals = following.filter(u => followerSet.has(u.id));
                    document.getElementById('badge-non').innerText = this.state.nonFollowers.length;
                    document.getElementById('badge-mut').innerText = this.state.mutuals.length;
                    document.getElementById('badge-wl').innerText = APP_CONFIG.whitelist.length;
                    this.switchView('non');
                },
                switchView(type) {
                    document.querySelectorAll('.menu-item').forEach(e => e.classList.remove('active'));
                    if (document.getElementById('nav-' + type)) document.getElementById('nav-' + type).classList.add('active');
                    let list = [];
                    if (type === 'non') list = this.state.nonFollowers;
                    if (type === 'mut') list = this.state.mutuals;
                    if (type === 'wl') {
                        const all = [...this.state.following];
                        list = all.filter(u => APP_CONFIG.whitelist.includes(u.username));
                        list = Array.from(new Map(list.map(item => [item['id'], item])).values());
                    }
                    this.currentList = list;
                    this.state.selection.clear();
                    this.renderGrid();
                },
                renderGrid() {
                    const grid = document.getElementById('grid-container');
                    grid.innerHTML = '';
                    document.getElementById('lbl-selected').innerText = '0';
                    document.getElementById('btn-execute').style.opacity = '0.5';
                    if (this.currentList.length === 0) {
                        grid.innerHTML = `<div class="overlay-center"><p style="color:var(--text-secondary); font-size:16px">No users found in this category.</p></div>`;
                        return;
                    }
                    this.currentList.forEach(u => {
                        const isWl = APP_CONFIG.whitelist.includes(u.username);
                        const card = document.createElement('div');
                        card.className = `user-card ${isWl ? 'wl' : ''}`;
                        card.innerHTML = `
                            <img src="${u.profile_pic_url}" class="avatar ${this.state.nonFollowers.includes(u) ? 'status-danger' : 'status-success'}">
                            <div style="font-weight:700; font-size:16px; margin-bottom:4px; color:var(--text-primary)">${u.username}</div>
                            <div style="font-size:13px; color:var(--text-secondary); margin-bottom:20px; height:18px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis">${u.full_name || ''}</div>
                            <div style="display:flex; justify-content:center; gap:8px">
                                <button class="action-btn btn-select">Select</button>
                                <button class="action-btn btn-whitelist" style="color:${isWl ? 'var(--accent-success)' : 'var(--text-secondary)'}">${isWl ? 'Safe' : 'Whitelist'}</button>
                            </div>
                        `;
                        const btnSel = card.querySelector('.btn-select');
                        const btnWl = card.querySelector('.btn-whitelist');
                        btnSel.onclick = () => {
                            if (this.state.selection.has(u)) {
                                this.state.selection.delete(u);
                                card.classList.remove('active');
                                btnSel.style.background = 'rgba(255,255,255,0.08)';
                                btnSel.style.color = 'var(--text-primary)';
                                btnSel.style.borderColor = 'transparent';
                                btnSel.innerText = 'Select';
                            } else {
                                this.state.selection.add(u);
                                card.classList.add('active');
                                btnSel.style.background = 'var(--accent-blue)';
                                btnSel.style.color = '#fff';
                                btnSel.innerText = 'Selected';
                            }
                            this.updateControls();
                        };
                        btnWl.onclick = () => {
                            if (APP_CONFIG.whitelist.includes(u.username)) {
                                APP_CONFIG.whitelist = APP_CONFIG.whitelist.filter(x => x !== u.username);
                                btnWl.innerText = 'Whitelist'; btnWl.style.color = 'var(--text-secondary)';
                            } else {
                                APP_CONFIG.whitelist.push(u.username);
                                btnWl.innerText = 'Safe'; btnWl.style.color = 'var(--accent-success)';
                            }
                            saveConfig();
                            document.getElementById('badge-wl').innerText = APP_CONFIG.whitelist.length;
                        };
                        grid.appendChild(card);
                    });
                },
                toggleSelection() {
                    const allSelected = this.state.selection.size === this.currentList.length;
                    this.state.selection.clear();
                    const cards = document.querySelectorAll('.user-card');
                    if (!allSelected) {
                        this.currentList.forEach(u => {
                            if (!APP_CONFIG.whitelist.includes(u.username)) this.state.selection.add(u);
                        });
                        cards.forEach(c => {
                            if (!c.classList.contains('wl')) {
                                c.classList.add('active');
                                const btn = c.querySelector('.btn-select');
                                btn.style.background = 'var(--accent-blue)';
                                btn.style.color = '#fff';
                                btn.innerText = "Selected";
                            }
                        });
                    } else {
                        cards.forEach(c => {
                            c.classList.remove('active');
                            const btn = c.querySelector('.btn-select');
                            btn.style.background = 'rgba(255,255,255,0.08)';
                            btn.style.color = 'var(--text-primary)';
                            btn.innerText = "Select";
                        });
                    }
                    this.updateControls();
                },
                updateControls() {
                    const c = this.state.selection.size;
                    document.getElementById('lbl-selected').innerText = c;
                    const btn = document.getElementById('btn-execute');
                    if (c > 0) { btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
                    else { btn.style.opacity = '0.5'; btn.style.cursor = 'not-allowed'; }
                },
                async executeBatch() {
                    const arr = Array.from(this.state.selection);
                    if (arr.length === 0 || !confirm(`Unfollow ${arr.length} users?`)) return;
                    const btn = document.getElementById('btn-execute');
                    for (let i = 0; i < arr.length; i++) {
                        const u = arr[i];
                        btn.innerText = `... ${i + 1}/${arr.length}`;
                        const ok = await API.disconnect(u.id);
                        if (ok) { this.state.selection.delete(u); }
                        await new Promise(r => setTimeout(r, Math.random() * 2000 + 2000));
                    }
                    btn.innerText = 'Done';
                    alert('Batch operation completed');
                    this.performScan();
                }
            };
            ToolManager.init();
        }
    };

    const InteractionCleaner = {
        start: function() {
            const DEFAULTS = { profile: 'human', sessionLimit: 1000, enableSounds: false };
            let APP_CONFIG;
            try { APP_CONFIG = JSON.parse(localStorage.getItem('unlikeit_config')) || { ...DEFAULTS }; }
            catch { APP_CONFIG = { ...DEFAULTS }; }

            const state = {
                isActive: localStorage.getItem('unlikeit_running') === 'true',
                isMinimized: false,
                lifetimeCount: parseInt(localStorage.getItem('unlikeit_total') || '0', 10),
                sessionCount: 0,
                startTime: null,
                consecutiveErrors: 0,
                isPaused: false,
                sortApplied: false
            };

            const PROFILES = {
                human:   { batch: [20, 35],  delay: [600, 1100], cooldown: 4000, variance: 0.2 },
                stealth: { batch: [10, 20],  delay: [900, 1800], cooldown: 7000, variance: 0.4 },
                speed:   { batch: [40, 60],  delay: [300, 600],  cooldown: 2500, variance: 0.1 },
                machine: { batch: [80, 100], delay: [150, 300],  cooldown: 5000, variance: 0.05 }
            };
            const ACTIVE_PROFILE = () => PROFILES[APP_CONFIG.profile] || PROFILES.human;

            const css = `
                :root {
                    --ui-font: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    --ui-glass: rgba(28, 28, 32, 0.9);
                    --ui-border: 1px solid rgba(255, 255, 255, 0.1);
                    --ui-highlight: rgba(255, 255, 255, 0.15);
                    --ios-blue: #2997FF;
                    --ios-green: #30D158;
                    --ios-red: #FF453A;
                    --ios-text: #F5F5F7;
                    --ios-text-muted: #86868B;
                }
                #unlikeit-panel {
                    position: fixed; top: 30px; right: 30px; width: 340px;
                    background: var(--ui-glass);
                    backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%);
                    border: var(--ui-border); border-radius: 20px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.4);
                    z-index: 2147483647;
                    font-family: var(--ui-font); color: var(--ios-text);
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    font-size: 13px; overflow: hidden; letter-spacing: -0.01em;
                }
                .ui-head {
                    padding: 14px 20px; background: rgba(255,255,255,0.02);
                    display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .ui-title { font-weight: 600; font-size: 14px; letter-spacing: -0.01em; color: var(--ios-text); }
                .ui-badge {
                    background: rgba(41, 151, 255, 0.2); color: var(--ios-blue);
                    padding: 3px 8px; border-radius: 5px; font-size: 10px; font-weight: 600; margin-left: 8px;
                }
                .ui-ctrls span {
                    cursor: pointer; width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.08); font-size: 12px; margin-left: 8px; transition: 0.2s; color: var(--ios-text-muted);
                }
                .ui-ctrls span:hover { background: rgba(255,255,255,0.2); color: #fff; }
                .ui-body { padding: 20px; }
                .ui-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
                .ui-card {
                    background: rgba(255,255,255,0.04); border-radius: 14px; padding: 14px;
                    text-align: center; border: var(--ui-border); box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }
                .ui-card-val { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 2px; }
                .ui-card-lbl { font-size: 11px; color: var(--ios-text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
                .ui-log-box {
                    height: 100px; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px;
                    font-family: 'SF Mono', Menlo, monospace; font-size: 11px; overflow-y: auto; color: #a0a0a0;
                    border: var(--ui-border); margin-bottom: 20px; display: flex; flex-direction: column-reverse;
                }
                .ui-log-item { margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid rgba(255,255,255,0.03); }
                .log-info { color: #5AC8FA; }
                .log-success { color: var(--ios-green); }
                .log-warn { color: #FFD60A; }
                .log-err { color: var(--ios-red); }
                .ui-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 13px; font-weight: 500; color: #d0d0d0; }
                #unlikeit-panel select, #unlikeit-panel input {
                    background: rgba(255,255,255,0.08) !important; border: 1px solid rgba(255,255,255,0.05); color: #ffffff !important;
                    padding: 6px 12px; border-radius: 8px; outline: none; width: 100px; text-align: right; font-weight: 500;
                    font-family: var(--ui-font); transition: 0.2s;
                }
                #unlikeit-panel select:hover, #unlikeit-panel input:hover { background: rgba(255,255,255,0.15) !important; }
                #unlikeit-panel option { background: #222; color: #fff; }
                button#btn-main {
                    width: 100%; padding: 14px; border: none; border-radius: 12px;
                    background: #fff; color: #000; font-weight: 600; cursor: pointer;
                    transition: all 0.2s; font-size: 13px; letter-spacing: -0.01em;
                }
                button#btn-main:active { transform: scale(0.97); opacity: 0.9; }
                button#btn-main:hover { box-shadow: 0 0 20px rgba(255,255,255,0.15); }
                button#btn-main.active {
                    background: rgba(255, 69, 58, 0.15); color: var(--ios-red);
                    border: 1px solid rgba(255, 69, 58, 0.4);
                }
                button#btn-main.active:hover { background: rgba(255, 69, 58, 0.25); color: #fff; border-color: transparent; }
                .ui-log-box::-webkit-scrollbar { width: 4px; }
                .ui-log-box::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
            `;

            const humanizer = {
                gaussian(min, max, skew = 1) {
                    let u = 0, v = 0;
                    while(u === 0) u = Math.random();
                    while(v === 0) v = Math.random();
                    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
                    num = num / 10.0 + 0.5;
                    if (num > 1 || num < 0) num = this.gaussian(min, max, skew);
                    else {
                        num = Math.pow(num, skew);
                        num *= max - min;
                        num += min;
                    }
                    return Math.floor(num);
                },
                async sleep(min, max) { return new Promise(r => setTimeout(r, this.gaussian(min, max))); },
                async realisticClick(element) {
                    if (!element) return;
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await this.sleep(50, 150);
                    const mouseOpts = { bubbles: true, cancelable: true, view: window };
                    element.dispatchEvent(new MouseEvent('mousedown', mouseOpts));
                    await this.sleep(20, 80);
                    element.dispatchEvent(new MouseEvent('mouseup', mouseOpts));
                    element.dispatchEvent(new MouseEvent('click', mouseOpts));
                }
            };

            const utils = {
                log(msg, type = 'info') { console.log(`[UnLikeIt] ${msg}`); ui.addLog(msg, type); },
                normalize(text) { return (text || '').replace(/\s+/g, ' ').trim().toLowerCase(); },
                findNode(text, { exact = false } = {}) {
                    if (!text) return null;
                    const target = this.normalize(text);
                    const candidates = document.querySelectorAll('div[role="button"], button, a, span, li, [role="menuitem"], [role="option"], h2, h3, label, svg');
                    for (const el of candidates) {
                        let content = this.normalize(el.textContent);
                        const aria = this.normalize(el.getAttribute('aria-label'));
                        if (!content && aria) content = aria;
                        if (!content) continue;
                        if (exact ? content === target : content.includes(target)) return el;
                    }
                    return null;
                },
                async waitForNode(text, timeoutMs = 15000) {
                    const start = Date.now();
                    while (Date.now() - start < timeoutMs) {
                        if (!state.isActive) return null;
                        const el = this.findNode(text);
                        if (el) return el;
                        await humanizer.sleep(350, 600);
                    }
                    return null;
                },
                async waitForAriaLabel(label, timeoutMs = 5000) {
                    const start = Date.now();
                    while (Date.now() - start < timeoutMs) {
                        if (!state.isActive) return null;
                        const el = document.querySelector(`[aria-label="${label}"]`);
                        if (el) return el;
                        await humanizer.sleep(350, 600);
                    }
                    return null;
                },
                getScrollContainer() {
                    const main = document.querySelector('main[role="main"]');
                    if (main && main.scrollHeight > window.innerHeight) return main;
                    return window;
                },
                async deepScroll() {
                    const container = this.getScrollContainer();
                    const target = container === window ? document.body : container;
                    target.dispatchEvent(new WheelEvent('wheel', { deltaY: 800, bubbles: true }));
                    if (container.scrollTo) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                    else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                },
                async activeWait(durationMs) {
                    const start = Date.now();
                    const container = this.getScrollContainer();
                    while (Date.now() - start < durationMs) {
                        if (!state.isActive) return;
                        if (container.scrollBy) container.scrollBy(0, -200); else window.scrollBy(0, -200);
                        await humanizer.sleep(300, 500);
                        if (container.scrollBy) container.scrollBy(0, 400); else window.scrollBy(0, 400);
                        await humanizer.sleep(300, 500);
                    }
                },
                interactDirect(el) {
                    if (!el) return;
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => el.click(), 100);
                }
            };

            const ui = {
                init() {
                    if(document.getElementById('unlikeit-panel')) return;
                    const style = document.createElement('style');
                    style.textContent = css;
                    document.head.appendChild(style);
                    const div = document.createElement('div');
                    div.id = 'unlikeit-panel';
                    div.innerHTML = `
                        <div class="ui-head">
                            <div class="ui-title">Interaction Cleaner <span class="ui-badge">BETA</span></div>
                            <div class="ui-ctrls"><span id="ui-min">−</span><span id="ui-close">×</span></div>
                        </div>
                        <div class="ui-body" id="ui-body-content">
                            <div class="ui-grid">
                                <div class="ui-card"><div class="ui-card-val" id="val-session" style="color:#2997FF">0</div><div class="ui-card-lbl">Current</div></div>
                                <div class="ui-card"><div class="ui-card-val" id="val-total" style="color:#30D158">${state.lifetimeCount}</div><div class="ui-card-lbl">Total</div></div>
                            </div>
                            <div class="ui-log-box" id="ui-logs"><div class="ui-log-item log-info">> Ready to clean</div></div>
                            <div class="ui-row"><label>Safety Profile</label><select id="set-profile"><option value="human">Human</option><option value="stealth">Stealth</option><option value="speed">Speed</option><option value="machine">Machine</option></select></div>
                            <div class="ui-row"><label>Action Limit</label><input id="set-limit" type="number" value="${APP_CONFIG.sessionLimit}"></div>
                            <button id="btn-main">INITIALIZE CLEANER</button>
                        </div>
                    `;
                    document.body.appendChild(div);
                    document.getElementById('btn-main').onclick = controller.toggle;
                    document.getElementById('ui-close').onclick = () => { div.remove(); state.isActive = false; localStorage.setItem('unlikeit_running', 'false'); };
                    document.getElementById('ui-min').onclick = () => {
                        const body = document.getElementById('ui-body-content');
                        state.isMinimized = !state.isMinimized;
                        body.style.display = state.isMinimized ? 'none' : 'block';
                    };
                    document.getElementById('set-profile').value = APP_CONFIG.profile;
                    document.getElementById('set-profile').onchange = (e) => { APP_CONFIG.profile = e.target.value; this.save(); };
                    document.getElementById('set-limit').onchange = (e) => { APP_CONFIG.sessionLimit = parseInt(e.target.value); this.save(); };
                    if (state.isActive) {
                        document.getElementById('btn-main').innerText = 'STOP PROCESS';
                        document.getElementById('btn-main').classList.add('active');
                        this.addLog('Recovering previous session...', 'warn');
                        controller.start();
                    }
                },
                addLog(msg, type) {
                    const box = document.getElementById('ui-logs');
                    if (!box) return;
                    const item = document.createElement('div');
                    item.className = `ui-log-item log-${type}`;
                    const time = new Date().toLocaleTimeString().split(' ')[0];
                    item.innerText = `[${time}] ${msg}`;
                    box.prepend(item);
                    if (box.children.length > 50) box.lastChild.remove();
                },
                updateStats(count) {
                    document.getElementById('val-session').innerText = count;
                    document.getElementById('val-total').innerText = state.lifetimeCount;
                },
                save() { localStorage.setItem('unlikeit_config', JSON.stringify(APP_CONFIG)); }
            };

            const controller = {
                toggle() {
                    state.isActive = !state.isActive;
                    localStorage.setItem('unlikeit_running', state.isActive);
                    const btn = document.getElementById('btn-main');
                    if (state.isActive) {
                        btn.innerText = 'STOP PROCESS'; btn.classList.add('active');
                        utils.log('Process Started', 'success'); controller.start();
                    } else {
                        btn.innerText = 'RESUME'; btn.classList.remove('active');
                        utils.log('Process Paused', 'warn');
                    }
                },
                async start() {
                    try {
                        if (!state.startTime) state.startTime = Date.now();
                        await humanizer.sleep(1000, 2000);
                        await this.enforceSortOrder();
                        while (state.isActive) {
                            if (state.sessionCount >= APP_CONFIG.sessionLimit) {
                                utils.log('Session Limit Reached. Stopping.', 'success');
                                this.toggle(); break;
                            }
                            if (!await this.enterSelectMode()) {
                                utils.log('Could not enter select mode. Retrying...', 'warn');
                                await humanizer.sleep(2000, 3000); continue;
                            }
                            const profile = ACTIVE_PROFILE();
                            const batchSize = humanizer.gaussian(profile.batch[0], profile.batch[1]);
                            const items = await this.gatherItems(batchSize);
                            if (items.length === 0) {
                                utils.log('No more items found. Finished.', 'success');
                                this.toggle(); break;
                            }
                            utils.log(`Selecting ${items.length} items...`, 'info');
                            for (const item of items) {
                                if (!state.isActive) break;
                                await humanizer.realisticClick(item);
                                await humanizer.sleep(profile.delay[0] * 0.2, profile.delay[1] * 0.5);
                            }
                            if (state.isActive) await this.executeDelete(profile, items.length);
                            if (Math.random() < 0.10) {
                                const breakTime = humanizer.gaussian(15000, 30000);
                                utils.log(`☕ Taking a micro-break (${Math.round(breakTime/1000)}s)...`, 'info');
                                await humanizer.sleep(breakTime, breakTime);
                            }
                        }
                    } catch (err) {
                        utils.log(`Critical Error: ${err.message}`, 'err');
                        console.error(err);
                        state.isActive = false;
                        document.getElementById('btn-main').innerText = 'ERROR (Check Console)';
                    }
                },
                async enforceSortOrder() {
                    if (state.sortApplied) return;
                    window.scrollTo(0, 0); await humanizer.sleep(500, 1000);
                    utils.log('🔄 Checking Sort Order...', 'info');
                    let sortBtn = await utils.waitForNode('Sort & Filter', 8000);
                    if (!sortBtn) sortBtn = await utils.waitForNode('Sort &', 2000);
                    if (!sortBtn) { utils.log('Sort button missing. Proceeding anyway.', 'warn'); return; }
                    await humanizer.realisticClick(sortBtn);
                    await humanizer.sleep(1200, 1800);
                    let oldestBtn = await utils.waitForAriaLabel('Oldest to Newest', 5000);
                    if (!oldestBtn) { utils.log('Sort Option not found.', 'warn'); document.body.click(); return; }
                    await humanizer.realisticClick(oldestBtn);
                    await humanizer.sleep(800, 1200);
                    const applyBtn = await utils.waitForAriaLabel('Apply', 5000);
                    if (applyBtn) {
                        await humanizer.realisticClick(applyBtn);
                        state.sortApplied = true;
                        utils.log('Sort applied: Oldest to Newest', 'success');
                        utils.log('⏳ Refreshing list...', 'info');
                        await utils.activeWait(5000);
                    } else { document.body.click(); }
                },
                async enterSelectMode() {
                    if (document.querySelector('input[type="checkbox"], [aria-label="Toggle checkbox"]')) return true;
                    utils.log('🔍 Looking for Select button...', 'info');
                    await utils.activeWait(2000);
                    const selectBtn = await utils.waitForNode('Select', 3000);
                    if (selectBtn) {
                        await humanizer.realisticClick(selectBtn);
                        const success = await utils.waitForAriaLabel('Toggle checkbox', 4000);
                        return !!success;
                    }
                    return false;
                },
                async gatherItems(target) {
                    let boxes = [], attempts = 0; const maxAttempts = 6;
                    while (boxes.length < target && attempts < maxAttempts) {
                        if (!state.isActive) break;
                        boxes = Array.from(document.querySelectorAll('[aria-label="Toggle checkbox"]'));
                        const count = boxes.length;
                        utils.log(`Gathering: ${count} / ${target} (Try ${attempts+1})`, 'info');
                        if (count >= target) break;
                        await utils.deepScroll();
                        await humanizer.sleep(2000 + (attempts * 500), 3000 + (attempts * 500));
                        const newCount = document.querySelectorAll('[aria-label="Toggle checkbox"]').length;
                        if (newCount === count) attempts++; else attempts = 0;
                    }
                    return boxes.slice(0, target);
                },
                async executeDelete(profile, count) {
                    let actionBtn = Array.from(document.querySelectorAll('span, button')).find(el => {
                        const t = utils.normalize(el.textContent);
                        return t.includes('remove') || t.includes('unlike') || t.includes('gefällt mir nicht mehr');
                    });
                    if (!actionBtn) { utils.log('❌ Action button missing!', 'err'); return; }
                    await humanizer.sleep(profile.delay[0], profile.delay[1]);
                    utils.interactDirect(actionBtn);
                    await humanizer.sleep(800, 1200);
                    const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => {
                        const t = utils.normalize(b.textContent);
                        const tab = b.getAttribute('tabindex');
                        return (t === 'unlike' || t === 'remove' || t === 'delete') && tab === '0';
                    });
                    if (confirmBtn) {
                        utils.interactDirect(confirmBtn);
                        if (count > 0) {
                            state.sessionCount += count; state.lifetimeCount += count;
                            localStorage.setItem('unlikeit_total', state.lifetimeCount.toString());
                            ui.updateStats(state.sessionCount);
                        }
                        utils.log(`Cooldown active...`, 'success');
                        await humanizer.sleep(profile.cooldown, profile.cooldown + 2000);
                    } else { utils.log('❌ Confirm dialog missing?', 'err'); }
                }
            };

            const networkGuard = {
                init() {
                    const originalFetch = window.fetch;
                    window.fetch = async (...args) => {
                        try {
                            const response = await originalFetch(...args);
                            if (response.status === 429) {
                                utils.log('🛑 RATE LIMIT DETECTED', 'err');
                                state.isActive = false;
                                document.getElementById('btn-main').innerText = 'Cooling Down...';
                                setTimeout(() => { utils.log('Resuming...', 'success'); controller.toggle(); }, 600000);
                            }
                            return response;
                        } catch (e) { return originalFetch(...args); }
                    };
                }
            };

            networkGuard.init();
            ui.init();
        }
    };

    const MasterUI = {
        init() {
            if (window.location.pathname === CONFIG.virtualRoute) return;

            const btn = document.createElement('div');
            Object.assign(btn.style, {
                position: 'fixed', bottom: '24px', right: '24px',
                width: 'auto', height: '48px', borderRadius: '24px', padding: '0 24px',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(30px) saturate(180%)',
                webkitBackdropFilter: 'blur(30px) saturate(180%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer', zIndex: '999999',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', color: '#fff', fontWeight: '600', letterSpacing: '-0.01em',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            });
            btn.innerHTML = 'UnLikeIt';
            btn.title = 'UnLikeIt Tools';
            btn.onmouseover = () => { btn.style.transform = 'scale(1.04) translateY(-2px)'; btn.style.background = 'rgba(255,255,255,0.12)'; };
            btn.onmouseout = () => { btn.style.transform = 'scale(1) translateY(0)'; btn.style.background = 'rgba(255, 255, 255, 0.08)'; };
            btn.onclick = this.showDashboard;
            document.body.appendChild(btn);

            if ((localStorage.getItem('unlikeit_running') === 'true' || sessionStorage.getItem('unlikeit_force_open') === 'true') && CONFIG.cleanerRoutes.some(r => window.location.pathname.startsWith(r))) {
                sessionStorage.removeItem('unlikeit_force_open');
                InteractionCleaner.start();
            }
        },

        showDashboard() {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                background: 'rgba(5, 5, 8, 0.6)', backdropFilter: 'blur(50px) saturate(150%)',
                webkitBackdropFilter: 'blur(50px) saturate(150%)',
                zIndex: '1000000', display: 'flex', justifyContent: 'center', alignItems: 'center',
                opacity: '0', transition: 'opacity 0.4s ease'
            });

            const cardStyle = `
                background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
                border-radius: 24px; padding: 40px; width: 240px; text-align: center;
                cursor: pointer; transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            `;

            overlay.innerHTML = `
                <div style="text-align:center; color:#fff; font-family: 'Helvetica Neue', Helvetica, sans-serif">
                    <h1 style="margin-bottom:50px; font-weight:700; font-size: 32px; letter-spacing:-0.03em; background:linear-gradient(135deg, #fff, #888); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.4; padding-bottom: 10px;">UnLikeIt</h1>
                    <div style="display:flex; gap:30px; flex-wrap:wrap; justify-content:center">
                        <div id="card-rel" style="${cardStyle}">
                            <div style="font-size:36px; margin-bottom:20px; background:linear-gradient(135deg, #2997FF, #007AFF); width:72px; height:72px; border-radius:20px; display:flex; align-items:center; justify-content:center; box-shadow:0 12px 30px rgba(41,151,255,0.3)">👥</div>
                            <h3 style="margin:0; font-size:17px; font-weight:600; color:#F5F5F7">Relations</h3>
                            <p style="color:#86868B; font-size:14px; margin-top:8px; line-height:1.4">Follower Analysis</p>
                        </div>
                        <div id="card-clean" style="${cardStyle}">
                            <div style="font-size:36px; margin-bottom:20px; background:linear-gradient(135deg, #FF453A, #FF3B30); width:72px; height:72px; border-radius:20px; display:flex; align-items:center; justify-content:center; box-shadow:0 12px 30px rgba(255,69,58,0.3)">🗑️</div>
                            <h3 style="margin:0; font-size:17px; font-weight:600; color:#F5F5F7">Cleaner</h3>
                            <p style="color:#86868B; font-size:14px; margin-top:8px; line-height:1.4">Bulk Interaction Removal</p>
                        </div>
                    </div>
                    <div style="margin-top:40px; margin-bottom:10px;">
                        <a href="https://ko-fi.com/vigneshrapaka" target="_blank" style="color:rgba(255,255,255,0.6); text-decoration:none; font-size:13px; font-weight:500; transition:0.2s;">
                           Love the tool? <span style="color:#FF5E5B">Buy me a coffee on Ko-fi ☕</span>
                        </a>
                    </div>
                    <div style="margin-top:10px; color:rgba(255,255,255,0.3); font-size:14px; cursor:pointer; font-weight:400; letter-spacing:0.02em" id="close-dash">Close Menu</div>
                </div>
            `;

            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.style.opacity = '1');

            const hover = (e, on) => {
                e.currentTarget.style.transform = on ? 'translateY(-8px)' : 'translateY(0)';
                e.currentTarget.style.background = on ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)';
            };

            const rel = document.getElementById('card-rel');
            rel.onmouseenter = e => hover(e, true); rel.onmouseleave = e => hover(e, false);
            rel.onclick = () => {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                    if (window.location.pathname !== CONFIG.virtualRoute) {
                        history.pushState({}, '', CONFIG.virtualRoute);
                        RelationManager.start();
                    } else {
                        RelationManager.start();
                    }
                }, 300);
            };

            const clean = document.getElementById('card-clean');
            clean.onmouseenter = e => hover(e, true); clean.onmouseleave = e => hover(e, false);
            clean.onclick = () => {
                const isCorrectPage = CONFIG.cleanerRoutes.some(r => window.location.pathname.startsWith(r));
                if (isCorrectPage) {
                    overlay.style.opacity = '0';
                    setTimeout(() => { overlay.remove(); InteractionCleaner.start(); }, 300);
                } else {
                    if(confirm("This tool requires the 'Your Activity' page. Redirect now?")) {
                        sessionStorage.setItem('unlikeit_force_open', 'true');
                        window.location.href = 'https://www.instagram.com/your_activity/interactions/likes';
                    }
                }
            };

            document.getElementById('close-dash').onclick = () => {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 400);
            };
        }
    };

    if (window.location.pathname === CONFIG.virtualRoute) {
        RelationManager.start();
    } else {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', MasterUI.init.bind(MasterUI));
        } else {
            MasterUI.init();
        }
    }

})();