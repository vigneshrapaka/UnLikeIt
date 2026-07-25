(function () {
    'use strict';

    const CONFIG = {
        virtualRoute: '/unlikeit',
        cleanerRoutes: ['/your_activity/interactions/likes', '/your_activity/interactions/comments'],
        savedRoutes: ['/saved/']
    };

    function getCookie(name) {
        const v = `; ${document.cookie}`;
        const parts = v.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function closeActiveCleaners() {
        const panel = document.getElementById('unlikeit-panel');
        if (panel) {
            panel.remove();
        }
        localStorage.setItem('unlikeit_running', 'false');
    }

    function checkFinalVerification() {
        const type = sessionStorage.getItem('unlikeit_final_check');
        if (!type) return;

        // We should wait for a moment to let React render the page content
        setTimeout(() => {
            let isWiped = false;
            if (type === 'interactions') {
                isWiped = Array.from(document.querySelectorAll('h2, span, p, div')).some(el => {
                    const t = el.textContent.trim();
                    return t === 'No results' || t === 'We couldn\'t find any activities' || t === 'No posts yet';
                });
            } else if (type === 'saved') {
                // If we reloaded on a post page, redirect back to saved page to verify/resume
                const isPostPage = window.location.pathname.includes('/p/') || window.location.pathname.includes('/reel/');
                if (isPostPage) {
                    const savedUrl = sessionStorage.getItem('unlikeit_saved_url');
                    if (savedUrl) {
                        window.location.href = savedUrl;
                        return;
                    }
                }
                isWiped = !document.querySelector('a[href*="/p/"], a[href*="/reel/"]');
            }

            if (isWiped) {
                sessionStorage.removeItem('unlikeit_final_check');
                showPanelCompletion(type);
            } else {
                // If not fully wiped, resume the cleaner!
                sessionStorage.removeItem('unlikeit_final_check');
                localStorage.setItem('unlikeit_running', 'true');
                if (type === 'interactions') {
                    InteractionCleaner.start();
                } else if (type === 'saved') {
                    SavedCleaner.start();
                }
            }
        }, 3000);
    }

    function showPanelCompletion(type) {
        const btn = document.getElementById('btn-main');
        const box = document.getElementById('ui-logs');
        
        if (btn) {
            btn.innerText = 'WIPE COMPLETE! 🎉';
            btn.style.background = 'rgba(48, 209, 88, 0.15)';
            btn.style.color = 'var(--ios-green)';
            btn.style.border = '1px solid rgba(48, 209, 88, 0.4)';
            btn.onclick = () => {
                btn.innerText = 'Start Cleaner';
                btn.style.background = '';
                btn.style.color = '';
                btn.style.border = '';
                window.location.reload();
            };
        }
        
        if (box) {
            const addLog = (msg, logType) => {
                const item = document.createElement('div');
                item.className = `ui-log-item log-${logType}`;
                const time = new Date().toLocaleTimeString().split(' ')[0];
                item.innerText = `[${time}] ${msg}`;
                box.prepend(item);
                if (box.children.length > 50) box.lastChild.remove();
            };
            
            let wipedCount = '0';
            if (type === 'interactions') {
                wipedCount = localStorage.getItem('unlikeit_total') || '0';
            } else {
                wipedCount = localStorage.getItem('unlikeit_saved_total') || '0';
            }
            
            addLog('🎉 WIPE COMPLETE!', 'success');
            addLog('All selected items successfully cleared.', 'success');
            addLog(`Lifetime Wiped: ${wipedCount}`, 'success');
        }
        
        Toast.show('Cleanup completed successfully!', 'success');
    }

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // ── Reusable Toast & Confirm System ──
    const Toast = {
        _container: null,
        _ensureContainer() {
            if (this._container && document.body.contains(this._container)) return;
            this._container = document.createElement('div');
            Object.assign(this._container.style, {
                position: 'fixed', top: '20px', right: '20px', zIndex: '2147483647',
                display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none'
            });
            document.body.appendChild(this._container);
        },
        _ensureStyles() {
            if (document.getElementById('unlikeit-toast-css')) return;
            const s = document.createElement('style');
            s.id = 'unlikeit-toast-css';
            s.textContent = `
                .uli-toast {
                    font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 600;
                    padding: 14px 20px; border-radius: 14px; color: #F5F5F7;
                    background: rgba(28, 28, 32, 0.92); backdrop-filter: blur(30px) saturate(180%);
                    -webkit-backdrop-filter: blur(30px) saturate(180%);
                    border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                    pointer-events: auto; transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: flex; align-items: center; gap: 10px; max-width: 340px;
                }
                .uli-toast.show { transform: translateX(0); }
                .uli-toast .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
                .uli-toast .dot.info { background: #5AC8FA; }
                .uli-toast .dot.success { background: #30D158; }
                .uli-toast .dot.warn { background: #FFD60A; }
                .uli-toast .dot.error { background: #FF453A; }
                .uli-confirm-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    z-index: 2147483647; display: flex; justify-content: center; align-items: center;
                    opacity: 0; transition: opacity 0.3s ease;
                }
                .uli-confirm-overlay.show { opacity: 1; }
                .uli-confirm-box {
                    font-family: 'Montserrat', sans-serif;
                    background: rgba(28, 28, 32, 0.95); backdrop-filter: blur(40px) saturate(180%);
                    -webkit-backdrop-filter: blur(40px) saturate(180%);
                    border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;
                    padding: 32px; max-width: 380px; width: 90%; text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .uli-confirm-overlay.show .uli-confirm-box { transform: scale(1); }
                .uli-confirm-box p { color: #F5F5F7; font-size: 15px; font-weight: 600; margin: 0 0 8px; }
                .uli-confirm-box .sub { color: #86868B; font-size: 13px; font-weight: 500; margin-bottom: 24px; }
                .uli-confirm-btns { display: flex; gap: 12px; }
                .uli-confirm-btns button {
                    flex: 1; padding: 12px; border: none; border-radius: 12px;
                    font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 700;
                    cursor: pointer; transition: all 0.2s;
                }
                .uli-confirm-btns button:active { transform: scale(0.97); }
                .uli-confirm-btns .cancel-btn { background: rgba(255,255,255,0.08); color: #86868B; }
                .uli-confirm-btns .cancel-btn:hover { background: rgba(255,255,255,0.12); color: #F5F5F7; }
                .uli-confirm-btns .confirm-btn { background: #FF453A; color: #fff; }
                .uli-confirm-btns .confirm-btn:hover { background: #ff5a50; }
                .uli-confirm-btns .confirm-btn.primary { background: #fff; color: #000; }
                .uli-confirm-btns .confirm-btn.primary:hover { background: #e8e8e8; }
            `;
            document.head.appendChild(s);
        },
        show(message, type = 'info', duration = 4000) {
            this._ensureStyles();
            this._ensureContainer();
            const toast = document.createElement('div');
            toast.className = 'uli-toast';
            toast.innerHTML = `<span class="dot ${type}"></span><span>${message}</span>`;
            this._container.appendChild(toast);
            requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, duration);
        },
        confirm(message, subtitle = '', confirmText = 'Confirm', isDanger = true) {
            this._ensureStyles();
            return new Promise(resolve => {
                const overlay = document.createElement('div');
                overlay.className = 'uli-confirm-overlay';
                overlay.innerHTML = `
                    <div class="uli-confirm-box">
                        <p>${message}</p>
                        ${subtitle ? `<div class="sub">${subtitle}</div>` : '<div style="margin-bottom:24px"></div>'}
                        <div class="uli-confirm-btns">
                            <button class="cancel-btn">Cancel</button>
                            <button class="confirm-btn ${isDanger ? '' : 'primary'}">${confirmText}</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);
                requestAnimationFrame(() => overlay.classList.add('show'));
                const close = (result) => {
                    overlay.classList.remove('show');
                    setTimeout(() => overlay.remove(), 300);
                    resolve(result);
                };
                overlay.querySelector('.cancel-btn').onclick = () => close(false);
                overlay.querySelector('.confirm-btn').onclick = () => close(true);
                overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
                const onKey = (e) => { if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', onKey); } };
                document.addEventListener('keydown', onKey);
            });
        }
    };

    // ── Shared Humanizer Utilities ──
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

    const RelationManager = {
        start: function() {
            document.title = "UnLikeIt Relation Manager";

            const toolCSS = `
                :root {
                    --app-font: 'Montserrat', sans-serif;
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
                * { box-sizing: border-box; font-family: var(--app-font); -webkit-font-smoothing: antialiased; }
                body {
                    margin: 0;
                    background-color: var(--bg-root);
                    background-image: var(--gradient-mesh);
                    color: var(--text-primary);
                }
                .layout {
                    display: flex; height: 100vh; width: 100vw;
                    position: fixed; top: 0; left: 0; z-index: 999999;
                    background-color: var(--bg-root);
                    background-image: var(--gradient-mesh);
                    overflow: hidden;
                }
                .sidebar {
                    width: 320px;
                    background: rgba(15, 15, 18, 0.65);
                    backdrop-filter: blur(40px) saturate(180%);
                    -webkit-backdrop-filter: blur(40px) saturate(180%);
                    border-right: 1px solid var(--glass-border);
                    padding: 32px 20px 24px 20px;
                    display: flex; flex-direction: column;
                    z-index: 20;
                    box-shadow: 5px 0 30px rgba(0,0,0,0.1);
                    overflow-y: auto;
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .sidebar::-webkit-scrollbar {
                    display: none;
                }
                .logo { margin-bottom: 24px; padding-left: 10px; }
                .logo-main {
                    font-size: 32px; font-weight: 700;
                    background: linear-gradient(90deg, #F5F5F7, #cfcfd1);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    letter-spacing: -0.03em; line-height: 1; margin-bottom: 4px;
                }
                .logo-sub { font-size: 14px; font-weight: 500; color: var(--text-secondary); letter-spacing: 0.01em; }
                .menu-item {
                    padding: 16px 18px; border-radius: 12px; cursor: pointer;
                    color: var(--text-secondary); margin-bottom: 6px;
                    font-size: 14px; font-weight: 500;
                    display: flex; justify-content: space-between; align-items: center;
                    transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
                }
                .menu-item:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
                .menu-item.active {
                    background: rgba(255,255,255,0.08); color: var(--text-primary); font-weight: 600;
                    box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset;
                }
                .count-badge {
                    background: rgba(255, 255, 255, 0.1); padding: 4px 10px; border-radius: 8px;
                    font-size: 12px; color: var(--text-secondary); font-weight: 600; transition: 0.2s;
                }
                .menu-item.active .count-badge { background: var(--text-primary); color: #000; font-weight: 700; }
                .btn {
                    background: var(--text-primary); color: #000; border: none;
                    padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 600;
                    cursor: pointer; transition: all 0.2s ease;
                    text-align: center; letter-spacing: -0.01em;
                }
                .btn:active { transform: scale(0.98); opacity: 0.9; }
                .btn:hover { box-shadow: 0 4px 12px rgba(255,255,255,0.15); }
                .btn-danger { background: rgba(255, 69, 58, 0.15); color: var(--accent-danger); border: 1px solid rgba(255, 69, 58, 0.3); box-shadow: none; }
                .btn-danger:hover { background: rgba(255, 69, 58, 0.25); border-color: var(--accent-danger); color: #fff; }
                .main-content { flex: 1; overflow-y: auto; position: relative; scroll-behavior: smooth; }
                .header-bar {
                    padding: 28px 48px; background: rgba(15, 15, 18, 0.6);
                    backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
                    border-bottom: 1px solid var(--glass-border);
                    position: sticky; top: 0; z-index: 10;
                    display: flex; justify-content: space-between; align-items: center;
                }
                h3 { font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.02em; color: var(--text-primary); }
                .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 28px; padding: 48px; }
                .user-card {
                    background: var(--glass-card); border: 1px solid var(--glass-border);
                    border-radius: 20px; padding: 28px; text-align: center;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                }
                .user-card:hover {
                    background: var(--glass-card-hover); transform: translateY(-4px);
                    border-color: var(--glass-highlight); box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                }
                .user-card.active { background: rgba(41, 151, 255, 0.08); border-color: rgba(41, 151, 255, 0.4); box-shadow: 0 0 0 1px rgba(41, 151, 255, 0.2); }
                .avatar { width: 84px; height: 84px; border-radius: 50%; margin-bottom: 18px; object-fit: cover; border: 1px solid rgba(255,255,255,0.05); }
                .avatar.status-danger { box-shadow: 0 0 0 3px var(--accent-danger); }
                .avatar.status-success { box-shadow: 0 0 0 3px var(--accent-success); }
                .action-btn {
                    padding: 8px 18px; font-size: 12px; font-weight: 600; border-radius: 100px;
                    margin: 0 6px; border: none; cursor: pointer; transition: 0.2s;
                }
                .btn-select { background: rgba(255,255,255,0.08); color: var(--text-primary); border: 1px solid transparent; }
                .btn-select:hover { background: rgba(255,255,255,0.15); }
                .btn-whitelist { background: transparent; color: var(--text-secondary); border: 1px solid rgba(255,255,255,0.05); }
                .btn-whitelist:hover { border-color: var(--text-secondary); color: var(--text-primary); }
                .overlay-center {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    display: flex; justify-content: center; align-items: center; flex-direction: column;
                    z-index: 5;
                    text-align: center;
                }
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
                .filter-tabs {
                    display: inline-flex;
                    background: rgba(255, 255, 255, 0.04);
                    padding: 4px;
                    border-radius: 10px;
                    border: 1px solid var(--glass-border);
                }
                .filter-tab {
                    padding: 6px 12px;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .filter-tab:hover {
                    color: var(--text-primary);
                }
                .filter-tab.active {
                    background: rgba(255, 255, 255, 0.08);
                    color: var(--text-primary);
                    box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset;
                }
                .ko-fi-btn {
                    display: inline-flex; align-items: center; gap: 8px;
                    background: rgba(255, 94, 91, 0.1); border: 1px solid rgba(255, 94, 91, 0.35);
                    padding: 10px 24px; border-radius: 100px;
                    color: #fff; text-decoration: none; font-size: 14px; font-weight: 600;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 15px rgba(255, 94, 91, 0.1);
                }
                .ko-fi-btn:hover {
                    background: rgba(255, 94, 91, 0.2) !important;
                    border-color: rgba(255, 94, 91, 0.6) !important;
                    transform: translateY(-2px) scale(1.03);
                    box-shadow: 0 8px 25px rgba(255, 94, 91, 0.25) !important;
                }
            `;
            const style = document.createElement('style');
            style.textContent = toolCSS;
            document.head.appendChild(style);

            const DEFAULTS = { whitelist: [] };
            let APP_CONFIG;
            try {
                APP_CONFIG = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem('ig_manager_config')) || {}) };
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
                            if (!response.ok) {
                                console.error(`UnLikeIt API Error: HTTP ${response.status}`);
                                if (response.status === 429) Toast.show('Rate limit hit while scanning. Try again later.', 'error');
                                hasNext = false;
                                break;
                            }
                            let json = await response.json();
                            let data = type === 'following' ? json?.data?.user?.edge_follow : json?.data?.user?.edge_followed_by;
                            if (!data) {
                                console.error('UnLikeIt API Error: Missing user data in response', json);
                                hasNext = false;
                                break;
                            }
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
                        let response = await fetch(`https://www.instagram.com/web/friendships/${id}/unfollow/`, {
                            method: 'POST', headers: { 'x-csrftoken': getCookie('csrftoken'), 'content-type': 'application/x-www-form-urlencoded' }
                        });
                        if (response.status === 429) Toast.show('Rate limit hit. Please wait a bit.', 'error');
                        return response.ok;
                    } catch { return false; }
                },
                async connect(id) {
                    try {
                        let response = await fetch(`https://www.instagram.com/web/friendships/${id}/follow/`, {
                            method: 'POST', headers: { 'x-csrftoken': getCookie('csrftoken'), 'content-type': 'application/x-www-form-urlencoded' }
                        });
                        if (response.status === 429) Toast.show('Rate limit hit. Please wait a bit.', 'error');
                        return response.ok;
                    } catch { return false; }
                }
            };

            const ToolManager = {
                state: { following: [], followers: [], nonFollowers: [], notFollowingBack: [], mutuals: [], selection: new Set() },
                init() {
                    closeActiveCleaners();
                    document.body.innerHTML = `
                        <div class="layout">
                            <div class="sidebar">
                                <div class="logo">
                                    <div class="logo-main">UnLikeIt</div>
                                    <div class="logo-sub">Relation Manager</div>
                                </div>
                                <div class="menu-item active" id="nav-scan"><span>Overview</span></div>
                                <div style="height:1px; background:var(--glass-border); margin:16px 0;"></div>
                                <div class="menu-item" id="nav-non"><span>Non-Followers</span> <span class="count-badge" id="badge-non">0</span></div>
                                <div class="menu-item" id="nav-mut"><span>Mutuals</span> <span class="count-badge" id="badge-mut">0</span></div>
                                <div class="menu-item" id="nav-wl"><span>Whitelist</span> <span class="count-badge" id="badge-wl">0</span></div>
                                <div style="height:1px; background:var(--glass-border); margin:16px 0;"></div>
                                <div id="sidebar-stats" style="padding:0 14px; margin-bottom:12px">
                                    <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:var(--text-tertiary); margin-bottom:8px"><span>Following</span><span id="stat-following" style="color:var(--text-secondary)">--</span></div>
                                    <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; color:var(--text-tertiary)"><span>Followers</span><span id="stat-followers" style="color:var(--text-secondary)">--</span></div>
                                </div>
                                <div style="margin-top:auto">
                                    <div style="font-size:14px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-align:center"><span id="lbl-selected">0</span> selected</div>
                                    <button id="btn-execute" class="btn btn-danger" style="width:100%; opacity:0.5; cursor:not-allowed; margin-bottom:12px">Unfollow Selected</button>
                                    <button id="btn-exit" class="btn" style="width:100%; background:rgba(255,255,255,0.05); color:var(--text-secondary)">Back to Instagram</button>
                                </div>
                            </div>
                            <div class="main-content">
                                <div class="header-bar">
                                    <div style="display:flex; align-items:center;">
                                        <h3 style="margin-right:16px;">Relation Manager</h3>
                                        <div id="non-followers-filters" style="display:none;">
                                            <div class="filter-tabs">
                                                <span class="filter-tab active" id="tab-unreciprocated">Don't Follow Me Back</span>
                                                <span class="filter-tab" id="tab-fans">I Don't Follow Back</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button class="btn" id="btn-toggle-all" style="padding:10px 20px; background:rgba(255,255,255,0.08); color:var(--text-primary); font-size:13px">Select All</button>
                                </div>
                                <div id="grid-container" class="grid-layout">
                                    <div class="overlay-center">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:24px; opacity:0.6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                        <h2 style="margin-bottom:12px; font-size:28px; font-weight:700; color:var(--text-primary); letter-spacing:-0.03em;">Ready to Analyze?</h2>
                                        <p style="margin-bottom:8px; font-size:14px; font-weight:500; color:var(--text-secondary); max-width:380px; line-height:1.5">Scans your following and followers lists to find non-followers, mutuals, and helps you bulk unfollow.</p>
                                        <p style="margin-bottom:32px; font-size:12px; font-weight:500; color:var(--text-tertiary)">No data leaves your browser. Everything is processed locally.</p>
                                        <button class="btn" id="btn-init-scan" style="padding:14px 32px; font-size:14px; font-weight:700; background:linear-gradient(135deg, #e0e0e0, #ffffff); color:#000; box-shadow:0 10px 30px rgba(255,255,255,0.1)">Start Scan</button>
                                    </div>
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
                    ['non', 'mut', 'wl'].forEach(k => document.getElementById('nav-' + k).onclick = () => {
                        if (k === 'non') {
                            this.subFilter = 'unreciprocated';
                            document.getElementById('tab-unreciprocated').classList.add('active');
                            document.getElementById('tab-fans').classList.remove('active');
                        }
                        this.switchView(k);
                    });
                    document.getElementById('tab-unreciprocated').onclick = () => {
                        this.subFilter = 'unreciprocated';
                        document.getElementById('tab-unreciprocated').classList.add('active');
                        document.getElementById('tab-fans').classList.remove('active');
                        this.switchView('non');
                    };
                    document.getElementById('tab-fans').onclick = () => {
                        this.subFilter = 'fans';
                        document.getElementById('tab-unreciprocated').classList.remove('active');
                        document.getElementById('tab-fans').classList.add('active');
                        this.switchView('non');
                    };
                },
                async performScan() {
                    const grid = document.getElementById('grid-container');
                    grid.innerHTML = `<div class="overlay-center"><h3 style="color:var(--text-primary); margin-bottom:8px; font-size:24px; font-weight:700;">Scanning Relations...</h3><p style="color:var(--text-secondary); font-size:14px; font-weight:500;">Fetched: <span id="progress-val" style="color:var(--accent-blue); font-variant-numeric:tabular-nums;">0</span></p></div>`;
                    const uid = getCookie('ds_user_id');
                    if (!uid) { Toast.show('Please log in to Instagram first', 'error'); return; }
                    const [following, followers] = await Promise.all([
                        API.fetch(uid, '3dec7e2c57367ef3da3d987d89f9dbc8', 'following', c => document.getElementById('progress-val').innerText = c),
                        API.fetch(uid, 'c76146de99bb02f6415203be841dd25a', 'followers', c => document.getElementById('progress-val').innerText = c)
                    ]);
                    this.state.following = following;
                    this.state.followers = followers;
                    const followerSet = new Set(followers.map(u => u.id));
                    const followingSet = new Set(following.map(u => u.id));
                    this.state.nonFollowers = following.filter(u => !followerSet.has(u.id));
                    this.state.notFollowingBack = followers.filter(u => !followingSet.has(u.id));
                    this.state.mutuals = following.filter(u => followerSet.has(u.id));
                    document.getElementById('badge-non').innerText = this.state.nonFollowers.length;
                    document.getElementById('badge-mut').innerText = this.state.mutuals.length;
                    document.getElementById('badge-wl').innerText = APP_CONFIG.whitelist.length;
                    document.getElementById('stat-following').innerText = following.length;
                    document.getElementById('stat-followers').innerText = followers.length;
                    this.subFilter = 'unreciprocated';
                    this.switchView('non');
                },
                switchView(type) {
                    this.currentView = type;
                    document.querySelectorAll('.menu-item').forEach(e => e.classList.remove('active'));
                    if (document.getElementById('nav-' + type)) document.getElementById('nav-' + type).classList.add('active');
                    
                    const filterEl = document.getElementById('non-followers-filters');
                    if (filterEl) filterEl.style.display = type === 'non' ? 'block' : 'none';
                    
                    const executeBtn = document.getElementById('btn-execute');
                    
                    let list = [];
                    if (type === 'non') {
                        if (this.subFilter === 'fans') {
                            list = this.state.notFollowingBack || [];
                            executeBtn.innerText = 'Follow Selected';
                            executeBtn.classList.remove('btn-danger');
                            executeBtn.style.background = 'var(--text-primary)';
                            executeBtn.style.color = '#000';
                            executeBtn.style.border = 'none';
                        } else {
                            list = this.state.nonFollowers || [];
                            executeBtn.innerText = 'Unfollow Selected';
                            executeBtn.classList.add('btn-danger');
                            executeBtn.style.background = '';
                            executeBtn.style.color = '';
                            executeBtn.style.border = '';
                        }
                    } else {
                        executeBtn.innerText = 'Unfollow Selected';
                        executeBtn.classList.add('btn-danger');
                        executeBtn.style.background = '';
                        executeBtn.style.color = '';
                        executeBtn.style.border = '';
                        
                        if (type === 'mut') list = this.state.mutuals;
                        if (type === 'wl') {
                            const all = [...this.state.following, ...this.state.followers];
                            list = all.filter(u => APP_CONFIG.whitelist.includes(u.username));
                            list = Array.from(new Map(list.map(item => [item['id'], item])).values());
                        }
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
                        grid.innerHTML = `<div class="overlay-center"><p style="color:var(--text-secondary); font-size:14px; font-weight:500;">No users found in this category.</p></div>`;
                        return;
                    }
                    this.currentList.forEach(u => {
                        const isWl = APP_CONFIG.whitelist.includes(u.username);
                        const card = document.createElement('div');
                        card.className = `user-card ${isWl ? 'wl' : ''}`;
                        card.innerHTML = `
                            <img src="${u.profile_pic_url}" class="avatar ${this.state.nonFollowers.some(x => x.id === u.id) ? 'status-danger' : 'status-success'}">
                            <div style="font-size:14px; font-weight:700; margin-bottom:4px; color:var(--text-primary)">${u.username}</div>
                            <div style="font-size:12px; font-weight:500; color:var(--text-secondary); margin-bottom:20px; height:18px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis">${u.full_name || ''}</div>
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
                    if (arr.length === 0) return;
                    
                    const isFollowMode = (this.currentView === 'non' && this.subFilter === 'fans');
                    const actionName = isFollowMode ? 'Follow' : 'Unfollow';
                    
                    const confirmed = await Toast.confirm(
                        `${actionName} ${arr.length} user${arr.length > 1 ? 's' : ''}?`,
                        isFollowMode
                            ? 'A random delay will be added between each follow for safety.'
                            : 'This action cannot be undone. A random delay is added between each unfollow for safety.',
                        actionName,
                        !isFollowMode
                    );
                    if (!confirmed) return;
                    
                    const btn = document.getElementById('btn-execute');
                    if (btn.disabled) return;
                    btn.disabled = true;
                    for (let i = 0; i < arr.length; i++) {
                        const u = arr[i];
                        btn.innerText = `${isFollowMode ? 'Following' : 'Unfollowing'} ${i + 1} / ${arr.length}`;
                        const ok = isFollowMode ? await API.connect(u.id) : await API.disconnect(u.id);
                        if (ok) { this.state.selection.delete(u); }
                        await new Promise(r => setTimeout(r, Math.random() * 2000 + 2000));
                    }
                    btn.innerText = isFollowMode ? 'Follow Selected' : 'Unfollow Selected';
                    btn.disabled = false;
                    Toast.show(`Successfully completed batch operation for ${arr.length} user${arr.length > 1 ? 's' : ''}`, 'success');
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
            try { APP_CONFIG = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem('unlikeit_config')) || {}) }; }
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
                    --ui-font: 'Montserrat', sans-serif;
                    --ui-glass: rgba(28, 28, 32, 0.9);
                    --ui-border: 1px solid rgba(255, 255, 255, 0.1);
                    --ui-highlight: rgba(255, 255, 255, 0.15);
                    --ios-blue: #2997FF;
                    --ios-green: #30D158;
                    --ios-red: #FF453A;
                    --ios-text: #F5F5F7;
                    --ios-text-muted: #86868B;
                }
                * { font-family: var(--ui-font); }
                #unlikeit-panel {
                    position: fixed; top: 30px; right: 30px; width: 340px;
                    background: var(--ui-glass);
                    backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%);
                    border: var(--ui-border); border-radius: 20px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.4);
                    z-index: 2147483647;
                    font-family: var(--ui-font); color: var(--ios-text);
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    font-size: 14px; font-weight: 400; overflow: hidden; letter-spacing: -0.01em;
                }
                .ui-head {
                    padding: 14px 20px; background: rgba(255,255,255,0.02);
                    display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .ui-title { font-weight: 700; font-size: 16px; letter-spacing: -0.01em; color: var(--ios-text); }
                .ui-badge {
                    background: rgba(41, 151, 255, 0.2); color: var(--ios-blue);
                    padding: 3px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; margin-left: 8px;
                }
                .ui-ctrls span {
                    cursor: pointer; width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.08); font-size: 14px; margin-left: 8px; transition: 0.2s; color: var(--ios-text-muted);
                }
                .ui-ctrls span:hover { background: rgba(255,255,255,0.2); color: #fff; }
                .ui-body { padding: 20px; }
                .ui-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
                .ui-card {
                    background: rgba(255,255,255,0.04); border-radius: 14px; padding: 14px;
                    text-align: center; border: var(--ui-border); box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }
                .ui-card-val { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 2px; }
                .ui-card-lbl { font-size: 12px; color: var(--ios-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
                .ui-log-box {
                    height: 100px; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px;
                    font-family: var(--ui-font); font-size: 12px; font-weight: 500; overflow-y: auto; color: #a0a0a0;
                    border: var(--ui-border); margin-bottom: 20px; display: flex; flex-direction: column-reverse;
                }
                .ui-log-item { margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid rgba(255,255,255,0.03); }
                .log-info { color: #5AC8FA; }
                .log-success { color: var(--ios-green); }
                .log-warn { color: #FFD60A; }
                .log-err { color: var(--ios-red); }
                .ui-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 14px; font-weight: 500; color: #d0d0d0; }
                #unlikeit-panel select, #unlikeit-panel input {
                    background: rgba(255,255,255,0.08) !important; border: 1px solid rgba(255,255,255,0.05); color: #ffffff !important;
                    padding: 6px 12px; border-radius: 8px; outline: none; width: 100px; text-align: right; font-weight: 500;
                    font-family: var(--ui-font); transition: 0.2s;
                }
                #unlikeit-panel select:hover, #unlikeit-panel input:hover { background: rgba(255,255,255,0.15) !important; }
                #unlikeit-panel option { background: #222; color: #fff; font-family: var(--ui-font); }
                button#btn-main {
                    width: 100%; padding: 14px; border: none; border-radius: 12px;
                    background: #fff; color: #000; font-weight: 700; cursor: pointer;
                    transition: all 0.2s; font-size: 14px; letter-spacing: -0.01em; font-family: var(--ui-font);
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
                            <div class="ui-ctrls"><span id="ui-min" title="Minimize panel"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span><span id="ui-close" title="Close panel"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></span></div>
                        </div>
                        <div class="ui-body" id="ui-body-content">
                            <div class="ui-grid">
                                <div class="ui-card"><div class="ui-card-val" id="val-session" style="color:#2997FF">0</div><div class="ui-card-lbl">Session</div></div>
                                <div class="ui-card"><div class="ui-card-val" id="val-total" style="color:#30D158">${state.lifetimeCount}</div><div class="ui-card-lbl">Lifetime</div></div>
                            </div>
                            <div style="height:4px; background:rgba(255,255,255,0.06); border-radius:2px; margin-bottom:16px; overflow:hidden"><div id="progress-bar" style="height:100%; width:0%; background:linear-gradient(90deg, #2997FF, #5AC8FA); border-radius:2px; transition:width 0.5s ease"></div></div>
                            <div class="ui-log-box" id="ui-logs" style="height:120px"><div class="ui-log-item log-info">Ready to clean interactions</div></div>
                            <div class="ui-row"><label>Safety Profile</label><select id="set-profile"><option value="human" title="Slowest, safest — mimics real browsing">Human</option><option value="stealth" title="Very slow with high variance">Stealth</option><option value="speed" title="Faster but less safe">Speed</option><option value="machine" title="Maximum speed — use at your own risk">Machine</option></select></div>
                            <div class="ui-row"><label>Action Limit</label><input id="set-limit" type="number" value="${APP_CONFIG.sessionLimit}"></div>
                            <button id="btn-main">Start Cleaner</button>
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
                    const bar = document.getElementById('progress-bar');
                    if (bar) bar.style.width = Math.min((count / APP_CONFIG.sessionLimit) * 100, 100) + '%';
                },
                save() { localStorage.setItem('unlikeit_config', JSON.stringify(APP_CONFIG)); }
            };

            const controller = {
                toggle() {
                    state.isActive = !state.isActive;
                    localStorage.setItem('unlikeit_running', state.isActive);
                    const btn = document.getElementById('btn-main');
                    if (state.isActive) {
                        btn.innerText = 'Stop Process'; btn.classList.add('active');
                        utils.log('Process started', 'success'); controller.start();
                    } else {
                        btn.innerText = 'Resume'; btn.classList.remove('active');
                        utils.log('Process paused', 'warn');
                    }
                },
                async start() {
                    try {
                        if (!state.startTime) state.startTime = Date.now();
                        await humanizer.sleep(1000, 2000);
                        await this.enforceSortOrder();
                        while (state.isActive && localStorage.getItem('unlikeit_running') === 'true') {
                            if (state.sessionCount >= APP_CONFIG.sessionLimit) {
                                utils.log('Session Limit Reached. Stopping.', 'success');
                                this.toggle(); break;
                            }

                            // Terminate if page indicates all items have been cleaned
                            const noResults = Array.from(document.querySelectorAll('h2, span, p, div')).some(el => {
                                const t = el.textContent.trim();
                                return t === 'No results' || t === 'We couldn\'t find any activities' || t === 'No posts yet';
                            });
                            if (noResults) {
                                utils.log('No more items found. Initiating final verification reload...', 'success');
                                state.consecutiveErrors = 0;
                                localStorage.setItem('unlikeit_running', 'false');
                                sessionStorage.setItem('unlikeit_final_check', 'interactions');
                                await humanizer.sleep(1500, 2500);
                                window.location.reload();
                                return;
                            }

                            if (!await this.enterSelectMode()) {
                                state.consecutiveErrors = (state.consecutiveErrors || 0) + 1;
                                if (state.consecutiveErrors >= 5) {
                                    utils.log('Cleaner seems stuck. Refreshing page...', 'warn');
                                    await humanizer.sleep(1500, 2500);
                                    window.location.reload();
                                    return;
                                }
                                utils.log(`Could not enter select mode (Try ${state.consecutiveErrors}/5). Retrying...`, 'warn');
                                await humanizer.sleep(2000, 3000); continue;
                            }

                            state.consecutiveErrors = 0; // Reset on success

                            const profile = ACTIVE_PROFILE();
                            const batchSize = humanizer.gaussian(profile.batch[0], profile.batch[1]);
                            const items = await this.gatherItems(batchSize);
                            if (items.length === 0) {
                                utils.log('No more items found. Initiating final verification reload...', 'success');
                                localStorage.setItem('unlikeit_running', 'false');
                                sessionStorage.setItem('unlikeit_final_check', 'interactions');
                                await humanizer.sleep(1500, 2500);
                                window.location.reload();
                                return;
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
                                utils.log(`Taking a micro-break (${Math.round(breakTime/1000)}s)...`, 'info');
                                await humanizer.sleep(breakTime, breakTime);
                            }
                        }
                    } catch (err) {
                        utils.log(`Critical Error: ${err.message}`, 'err');
                        console.error(err);
                        state.isActive = false;
                        document.getElementById('btn-main').innerText = 'Error — Check Console';
                    }
                },
                async enforceSortOrder() {
                    if (state.sortApplied) return;
                    window.scrollTo(0, 0); await humanizer.sleep(500, 1000);
                    utils.log('Checking sort order...', 'info');
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
                        utils.log('Refreshing list...', 'info');
                        await utils.activeWait(5000);
                    } else { document.body.click(); }
                },
                async enterSelectMode() {
                    if (document.querySelector('input[type="checkbox"], [aria-label="Toggle checkbox"]')) return true;
                    utils.log('Looking for Select button...', 'info');
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
                        return t.includes('remove') || t.includes('unlike') || t.includes('delete') || t.includes('gefällt mir nicht mehr');
                    });
                    if (!actionBtn) { utils.log('Action button missing', 'err'); return; }
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
                    } else { utils.log('Confirm dialog missing', 'err'); }
                }
            };

            const networkGuard = {
                init() {
                    if (window.fetch.isNetworkGuard) return;
                    const originalFetch = window.fetch;
                    window.fetch = async (...args) => {
                        try {
                            const response = await originalFetch(...args);
                            if (response.status === 429) {
                                utils.log('Rate limit detected — cooling down', 'err');
                                state.isActive = false;
                                document.getElementById('btn-main').innerText = 'Cooling Down...';
                                setTimeout(() => { utils.log('Resuming...', 'success'); controller.toggle(); }, 600000);
                            }
                            return response;
                        } catch (e) { return originalFetch(...args); }
                    };
                    window.fetch.isNetworkGuard = true;
                }
            };

            networkGuard.init();
            ui.init();
        }
    };

    const SavedCleaner = {
        start: function() {
            const DEFAULTS = { profile: 'human', sessionLimit: 1000 };
            let APP_CONFIG;
            try { APP_CONFIG = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem('unlikeit_saved_config')) || {}) }; }
            catch { APP_CONFIG = { ...DEFAULTS }; }

            // Store original saved page URL when starting
            const isSavedPage = CONFIG.savedRoutes.some(r => window.location.pathname.includes(r));
            if (isSavedPage) {
                sessionStorage.setItem('unlikeit_saved_url', window.location.href);
            }

            const state = {
                isActive: localStorage.getItem('unlikeit_running') === 'true',
                isMinimized: false,
                lifetimeCount: parseInt(localStorage.getItem('unlikeit_saved_total') || '0', 10),
                sessionCount: 0,
                startTime: null
            };

            const PROFILES = {
                human:   { delay: [1500, 2500], cooldown: 2000 },
                stealth: { delay: [2500, 4000], cooldown: 4000 },
                speed:   { delay: [800, 1500],  cooldown: 1000 },
                machine: { delay: [300, 600],   cooldown: 500 }
            };
            const ACTIVE_PROFILE = () => PROFILES[APP_CONFIG.profile] || PROFILES.human;

            const css = `
                :root {
                    --ui-font: 'Montserrat', sans-serif;
                    --ui-glass: rgba(28, 28, 32, 0.9);
                    --ui-border: 1px solid rgba(255, 255, 255, 0.1);
                    --ios-blue: #2997FF;
                    --ios-green: #30D158;
                    --ios-red: #FF453A;
                    --ios-text: #F5F5F7;
                    --ios-text-muted: #86868B;
                }
                * { font-family: var(--ui-font); }
                #unlikeit-panel {
                    position: fixed; top: 30px; right: 30px; width: 340px;
                    background: var(--ui-glass);
                    backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%);
                    border: var(--ui-border); border-radius: 20px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.4);
                    z-index: 2147483647;
                    font-family: var(--ui-font); color: var(--ios-text);
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    font-size: 14px; font-weight: 400; overflow: hidden; letter-spacing: -0.01em;
                }
                .ui-head {
                    padding: 14px 20px; background: rgba(255,255,255,0.02);
                    display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .ui-title { font-weight: 700; font-size: 16px; letter-spacing: -0.01em; color: var(--ios-text); }
                .ui-badge { background: rgba(255, 149, 0, 0.2); color: #FF9500; padding: 3px 8px; border-radius: 5px; font-size: 11px; font-weight: 700; margin-left: 8px; }
                .ui-ctrls span {
                    cursor: pointer; width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.08); font-size: 14px; margin-left: 8px; transition: 0.2s; color: var(--ios-text-muted);
                }
                .ui-ctrls span:hover { background: rgba(255,255,255,0.2); color: #fff; }
                .ui-body { padding: 20px; }
                .ui-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
                .ui-card { background: rgba(255,255,255,0.04); border-radius: 14px; padding: 14px; text-align: center; border: var(--ui-border); }
                .ui-card-val { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 2px; }
                .ui-card-lbl { font-size: 12px; color: var(--ios-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
                .ui-log-box {
                    height: 100px; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px;
                    font-family: var(--ui-font); font-size: 12px; font-weight: 500; overflow-y: auto; color: #a0a0a0;
                    border: var(--ui-border); margin-bottom: 20px; display: flex; flex-direction: column-reverse;
                }
                .ui-log-item { margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid rgba(255,255,255,0.03); }
                .log-info { color: #5AC8FA; } .log-success { color: var(--ios-green); } .log-warn { color: #FFD60A; } .log-err { color: var(--ios-red); }
                .ui-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 14px; font-weight: 500; color: #d0d0d0; }
                #unlikeit-panel select, #unlikeit-panel input {
                    background: rgba(255,255,255,0.08) !important; border: 1px solid rgba(255,255,255,0.05); color: #ffffff !important;
                    padding: 6px 12px; border-radius: 8px; outline: none; width: 100px; text-align: right; font-weight: 500;
                    font-family: var(--ui-font); transition: 0.2s;
                }
                #unlikeit-panel select:hover, #unlikeit-panel input:hover { background: rgba(255,255,255,0.15) !important; }
                #unlikeit-panel option { background: #222; color: #fff; font-family: var(--ui-font); }
                button#btn-main {
                    width: 100%; padding: 14px; border: none; border-radius: 12px; background: #fff; color: #000; font-weight: 700; cursor: pointer; transition: all 0.2s; font-size: 14px; letter-spacing: -0.01em; font-family: var(--ui-font);
                }
                button#btn-main:active { transform: scale(0.97); opacity: 0.9; }
                button#btn-main:hover { box-shadow: 0 0 20px rgba(255,255,255,0.15); }
                button#btn-main.active { background: rgba(255, 69, 58, 0.15); color: var(--ios-red); border: 1px solid rgba(255, 69, 58, 0.4); }
                button#btn-main.active:hover { background: rgba(255, 69, 58, 0.25); color: #fff; border-color: transparent; }
                .ui-log-box::-webkit-scrollbar { width: 4px; }
                .ui-log-box::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
            `;

            const ui = {
                init() {
                    if(document.getElementById('unlikeit-panel')) return;
                    const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
                    const div = document.createElement('div'); div.id = 'unlikeit-panel';
                    div.innerHTML = `
                        <div class="ui-head">
                            <div class="ui-title">Saved Cleaner <span class="ui-badge">BETA</span></div>
                            <div class="ui-ctrls"><span id="ui-min" title="Minimize panel"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span><span id="ui-close" title="Close panel"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></span></div>
                        </div>
                        <div class="ui-body" id="ui-body-content">
                            <div class="ui-grid">
                                <div class="ui-card"><div class="ui-card-val" id="val-session" style="color:#FF9500">0</div><div class="ui-card-lbl">Session</div></div>
                                <div class="ui-card"><div class="ui-card-val" id="val-total" style="color:#30D158">${state.lifetimeCount}</div><div class="ui-card-lbl">Lifetime</div></div>
                            </div>
                            <div style="height:4px; background:rgba(255,255,255,0.06); border-radius:2px; margin-bottom:16px; overflow:hidden"><div id="progress-bar" style="height:100%; width:0%; background:linear-gradient(90deg, #FF9500, #FFCC00); border-radius:2px; transition:width 0.5s ease"></div></div>
                            <div class="ui-log-box" id="ui-logs" style="height:120px"><div class="ui-log-item log-info">Ready to unsave posts</div></div>
                            <div class="ui-row"><label>Safety Profile</label><select id="set-profile"><option value="human" title="Slowest, safest">Human</option><option value="stealth" title="Very slow with high variance">Stealth</option><option value="speed" title="Faster but less safe">Speed</option><option value="machine" title="Maximum speed">Machine</option></select></div>
                            <div class="ui-row"><label>Action Limit</label><input id="set-limit" type="number" value="${APP_CONFIG.sessionLimit}"></div>
                            <button id="btn-main">Start Cleaner</button>
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
                    document.getElementById('set-profile').onchange = (e) => { APP_CONFIG.profile = e.target.value; localStorage.setItem('unlikeit_saved_config', JSON.stringify(APP_CONFIG)); };
                    document.getElementById('set-limit').onchange = (e) => { APP_CONFIG.sessionLimit = parseInt(e.target.value); localStorage.setItem('unlikeit_saved_config', JSON.stringify(APP_CONFIG)); };
                    if (state.isActive) {
                        document.getElementById('btn-main').innerText = 'Stop Process';
                        document.getElementById('btn-main').classList.add('active');
                        this.addLog('Recovering previous session...', 'warn');
                        controller.start();
                    }
                },
                addLog(msg, type) {
                    const box = document.getElementById('ui-logs'); if (!box) return;
                    const item = document.createElement('div'); item.className = `ui-log-item log-${type}`;
                    const time = new Date().toLocaleTimeString().split(' ')[0];
                    item.innerText = `[${time}] ${msg}`;
                    box.prepend(item);
                    if (box.children.length > 50) box.lastChild.remove();
                },
                updateStats(count) {
                    document.getElementById('val-session').innerText = count;
                    document.getElementById('val-total').innerText = state.lifetimeCount;
                    const bar = document.getElementById('progress-bar');
                    if (bar) bar.style.width = Math.min((count / APP_CONFIG.sessionLimit) * 100, 100) + '%';
                }
            };

            const controller = {
                toggle() {
                    state.isActive = !state.isActive;
                    localStorage.setItem('unlikeit_running', state.isActive);
                    const btn = document.getElementById('btn-main');
                    if (state.isActive) {
                        btn.innerText = 'Stop Process'; btn.classList.add('active');
                        ui.addLog('Process started', 'success'); controller.start();
                    } else {
                        btn.innerText = 'Resume'; btn.classList.remove('active');
                        ui.addLog('Process paused', 'warn');
                    }
                },
                start() {
                    if (!state.startTime) state.startTime = Date.now();

                    const goNext = () => {
                        if (!state.isActive || localStorage.getItem('unlikeit_running') !== 'true') return;
                        
                        const nextBtn = document.querySelector('[aria-label="Next"]');
                        if (nextBtn && nextBtn.parentElement) {
                            nextBtn.parentElement.click();
                            ui.addLog('Clicked Next', 'info');
                        } else {
                            ui.addLog('End of list reached. Initiating final verification reload...', 'info');
                            localStorage.setItem('unlikeit_running', 'false');
                            sessionStorage.setItem('unlikeit_final_check', 'saved');
                            setTimeout(() => {
                                const savedUrl = sessionStorage.getItem('unlikeit_saved_url');
                                if (savedUrl) {
                                    window.location.href = savedUrl;
                                } else {
                                    window.location.reload();
                                }
                            }, 1500);
                            return;
                        }
                        
                        setTimeout(unsave, 2000);
                    };

                    const unsave = () => {
                        if (!state.isActive || localStorage.getItem('unlikeit_running') !== 'true') return;
                        if (state.sessionCount >= APP_CONFIG.sessionLimit) {
                            ui.addLog('Session Limit Reached.', 'success');
                            controller.toggle();
                            return;
                        }

                        // Check for collection confirmation dialog
                        const dialogs = document.querySelectorAll('[role="dialog"]');
                        if (dialogs.length > 0) {
                            const topDialog = dialogs[dialogs.length - 1];
                            const removeDivs = Array.from(topDialog.querySelectorAll('*')).filter(el => el.children.length === 0 && el.textContent.trim() === 'Remove');
                            if (removeDivs.length > 0) {
                                const clickTarget = removeDivs[0].closest('button') || removeDivs[0].closest('[role="button"]') || removeDivs[0];
                                clickTarget.click();
                                ui.addLog('Confirmed Collection Removal', 'success');
                                setTimeout(goNext, 2000);
                                return;
                            }
                        }

                        const removeBtn = document.querySelector('[aria-label="Remove"]');
                        if (removeBtn && removeBtn.parentElement) {
                            removeBtn.parentElement.click();
                            ui.addLog('Clicked Remove', 'success');
                            state.sessionCount++;
                            state.lifetimeCount++;
                            localStorage.setItem('unlikeit_saved_total', state.lifetimeCount.toString());
                            ui.updateStats(state.sessionCount);
                        } else {
                            ui.addLog('Remove button not found.', 'warn');
                        }
                        
                        setTimeout(goNext, 2000);
                    };

                    // Auto-open if no modal is active
                    if (!document.querySelector('[aria-label="Remove"]') && !document.querySelector('[aria-label="Save"]') && !document.querySelector('[aria-label="Next"]')) {
                        const firstPostLink = document.querySelector('a[href*="/p/"], a[href*="/reel/"]');
                        if (firstPostLink) {
                            ui.addLog('Auto-opening first saved post...', 'info');
                            // Use dispatchEvent instead of .click() to ensure React intercepts the navigation properly
                            const clickEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
                            firstPostLink.dispatchEvent(clickEvent);
                            setTimeout(unsave, 3000); // Wait for modal to open
                        } else {
                            ui.addLog('No posts found. Initiating final verification reload...', 'info');
                            localStorage.setItem('unlikeit_running', 'false');
                            sessionStorage.setItem('unlikeit_final_check', 'saved');
                            setTimeout(() => {
                                const savedUrl = sessionStorage.getItem('unlikeit_saved_url');
                                if (savedUrl) {
                                    window.location.href = savedUrl;
                                } else {
                                    window.location.reload();
                                }
                            }, 1500);
                        }
                    } else {
                        // Modal is already open, start the cycle
                        setTimeout(unsave, 1000);
                    }
                }
            };
            
            ui.init();
        }
    };

    const MasterUI = {
        init() {
            if (window.location.pathname === CONFIG.virtualRoute) return;

            // Inject styles for MasterUI trigger and animation
            if (!document.getElementById('unlikeit-master-css')) {
                const s = document.createElement('style');
                s.id = 'unlikeit-master-css';
                s.textContent = `
                    @keyframes uli-pulse-btn {
                        0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
                        70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
                    }
                    @keyframes uli-card-stagger {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .uli-trigger-btn {
                        animation: uli-pulse-btn 2s infinite;
                    }
                    .uli-trigger-btn:hover {
                        animation: none !important;
                    }
                    .uli-dashboard-card {
                        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
                        border-radius: 24px; padding: 40px; width: 240px; text-align: center;
                        cursor: pointer; transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                        opacity: 0;
                        animation: uli-card-stagger 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
                    }
                `;
                document.head.appendChild(s);
            }

            const btn = document.createElement('div');
            btn.className = 'uli-trigger-btn';
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
            btn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                UnLikeIt
            `;
            btn.title = 'Take back your privacy with UnLikeIt';
            btn.onmouseover = () => { btn.style.transform = 'scale(1.04) translateY(-2px)'; btn.style.background = 'rgba(255,255,255,0.12)'; };
            btn.onmouseout = () => { btn.style.transform = 'scale(1) translateY(0)'; btn.style.background = 'rgba(255, 255, 255, 0.08)'; };
            btn.onclick = () => {
                btn.classList.remove('uli-trigger-btn');
                btn.style.animation = 'none';
                closeActiveCleaners();
                this.showDashboard();
            };
            document.body.appendChild(btn);

            // Auto-detect route changes in React SPA to hide cleaner panels
            setInterval(() => {
                if (localStorage.getItem('unlikeit_running') === 'true') return;
                
                const isCleanerPage = CONFIG.cleanerRoutes.some(r => window.location.pathname.includes(r));
                const isSavedPage = CONFIG.savedRoutes.some(r => window.location.pathname.includes(r));
                const isPostView = window.location.pathname.includes('/p/') || window.location.pathname.includes('/reel/');
                
                if (!isCleanerPage && !isSavedPage && !isPostView) {
                    closeActiveCleaners();
                }
            }, 1000);

            if (localStorage.getItem('unlikeit_running') === 'true' || sessionStorage.getItem('unlikeit_force_open') === 'true') {
                if (CONFIG.cleanerRoutes.some(r => window.location.pathname.includes(r))) {
                    sessionStorage.removeItem('unlikeit_force_open');
                    InteractionCleaner.start();
                } else if (CONFIG.savedRoutes.some(r => window.location.pathname.includes(r))) {
                    sessionStorage.removeItem('unlikeit_force_open');
                    SavedCleaner.start();
                }
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

            overlay.innerHTML = `
                <div style="text-align:center; color:#fff; font-family: 'Montserrat', sans-serif">
                    <div style="display:flex; gap:30px; flex-wrap:wrap; justify-content:center; padding-top:20px;">
                        <div id="card-rel" class="uli-dashboard-card" style="animation-delay: 0.05s">
                            <div style="margin-bottom:20px; background:linear-gradient(135deg, #2997FF, #007AFF); width:72px; height:72px; border-radius:20px; display:flex; align-items:center; justify-content:center; box-shadow:0 12px 30px rgba(41,151,255,0.3)">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <h3 style="margin:0; font-size:16px; font-weight:700; color:#F5F5F7">Follower Analysis</h3>
                            <p style="color:#86868B; font-size:14px; margin-top:8px; line-height:1.4">Manage relationships</p>
                            <span style="font-size:11px; color:#5AC8FA; font-weight:600; text-transform:uppercase; margin-top:16px; letter-spacing:0.05em">Find Unfollowers</span>
                        </div>
                        <div id="card-clean" class="uli-dashboard-card" style="animation-delay: 0.15s">
                            <div style="margin-bottom:20px; background:linear-gradient(135deg, #FF453A, #FF3B30); width:72px; height:72px; border-radius:20px; display:flex; align-items:center; justify-content:center; box-shadow:0 12px 30px rgba(255,69,58,0.3)">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </div>
                            <h3 style="margin:0; font-size:16px; font-weight:700; color:#F5F5F7">Bulk Likes Remover</h3>
                            <p style="color:#86868B; font-size:14px; margin-top:8px; line-height:1.4">Unlike posts & comments</p>
                            <span style="font-size:11px; color:#FF453A; font-weight:600; text-transform:uppercase; margin-top:16px; letter-spacing:0.05em">Clean Interaction History</span>
                        </div>
                        <div id="card-saved" class="uli-dashboard-card" style="animation-delay: 0.25s">
                            <div style="margin-bottom:20px; background:linear-gradient(135deg, #FF9500, #FFCC00); width:72px; height:72px; border-radius:20px; display:flex; align-items:center; justify-content:center; box-shadow:0 12px 30px rgba(255,149,0,0.3)">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
                            </div>
                            <h3 style="margin:0; font-size:16px; font-weight:700; color:#F5F5F7">Bulk Saved Remover</h3>
                            <p style="color:#86868B; font-size:14px; margin-top:8px; line-height:1.4">Unsave posts in bulk</p>
                            <span style="font-size:11px; color:#FF9500; font-weight:600; text-transform:uppercase; margin-top:16px; letter-spacing:0.05em">Wipe Saved Bookmarks</span>
                        </div>
                    </div>
                    <div style="margin-top:44px; margin-bottom:12px;">
                        <a href="https://ko-fi.com/vigneshrapaka" target="_blank" class="ko-fi-btn">
                           <span>Love the tool?</span>
                           <span style="color:#FF5E5B; font-weight:700;">Buy me a coffee on Ko-fi ☕</span>
                        </a>
                    </div>
                    <div style="margin-top:10px; color:rgba(255,255,255,0.3); font-size:14px; cursor:pointer; font-weight:500; letter-spacing:0.02em; display:flex; align-items:center; justify-content:center; gap:6px" id="close-dash">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        Close Menu <span style="opacity:0.5; font-size:12px; font-weight:400">(Esc)</span>
                    </div>
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
                closeOverlay(() => {
                    if (window.location.pathname !== CONFIG.virtualRoute) {
                        history.pushState({}, '', CONFIG.virtualRoute);
                        RelationManager.start();
                    } else {
                        RelationManager.start();
                    }
                });
            };

            const clean = document.getElementById('card-clean');
            clean.onmouseenter = e => hover(e, true); clean.onmouseleave = e => hover(e, false);
            clean.onclick = () => {
                const isCorrectPage = CONFIG.cleanerRoutes.some(r => window.location.pathname.startsWith(r));
                if (isCorrectPage) {
                    closeOverlay(() => InteractionCleaner.start());
                } else {
                    Toast.confirm(
                        "Redirect to Your Activity?",
                        "This tool requires the Instagram Likes page.",
                        "Redirect",
                        false
                    ).then(redirect => {
                        if (redirect) {
                            sessionStorage.setItem('unlikeit_force_open', 'true');
                            window.location.href = 'https://www.instagram.com/your_activity/interactions/likes';
                        }
                    });
                }
            };

            const saved = document.getElementById('card-saved');
            if (saved) {
                saved.onmouseenter = e => hover(e, true); saved.onmouseleave = e => hover(e, false);
                saved.onclick = () => {
                    const isCorrectPage = CONFIG.savedRoutes.some(r => window.location.pathname.includes(r));
                    if (isCorrectPage) {
                        closeOverlay(() => SavedCleaner.start());
                    } else {
                        Toast.confirm(
                            "Redirect to Saved Posts?",
                            "This tool requires your Saved Posts page.",
                            "Redirect",
                            false
                        ).then(redirect => {
                            if (redirect) {
                                sessionStorage.setItem('unlikeit_force_open', 'true');
                                const navLinks = Array.from(document.querySelectorAll('a[href]'));
                                let profileHref = null;
                                
                                const savedLink = navLinks.find(a => a.href.endsWith('/saved/'));
                                if (savedLink) {
                                    window.location.href = savedLink.href + 'all-posts/';
                                    return;
                                }

                                const profileImg = document.querySelector('img[alt$="profile picture"], img[alt*="profile"]');
                                if (profileImg && profileImg.closest('a')) {
                                    profileHref = profileImg.closest('a').href;
                                }
                                
                                if (!profileHref) {
                                    for (let a of navLinks) {
                                        try {
                                            const url = new URL(a.href, window.location.origin);
                                            const parts = url.pathname.split('/').filter(Boolean);
                                            if (parts.length === 1 && a.querySelector('img')) {
                                                profileHref = a.href;
                                                break;
                                            }
                                        } catch(e) {}
                                    }
                                }

                                if (profileHref) {
                                    const baseUrl = profileHref.endsWith('/') ? profileHref : profileHref + '/';
                                    window.location.href = baseUrl + 'saved/all-posts/';
                                } else {
                                    sessionStorage.removeItem('unlikeit_force_open');
                                    Toast.show("Please go to your Profile > Saved > All Posts first!", "error");
                                    closeOverlay();
                                }
                            }
                        });
                    }
                };
            }

            const closeOverlay = (callback) => {
                document.removeEventListener('keydown', handleEsc);
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                    if (callback) callback();
                }, 400);
            };

            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    closeOverlay();
                }
            };
            document.addEventListener('keydown', handleEsc);

            document.getElementById('close-dash').onclick = () => closeOverlay();
        }
    };

    if (window.location.pathname === CONFIG.virtualRoute) {
        RelationManager.start();
    } else {
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', () => {
                MasterUI.init();
                checkFinalVerification();
            });
        } else {
            MasterUI.init();
            checkFinalVerification();
        }
    }

})();