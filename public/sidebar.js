// Shared sidebar + layout injected on every page
// Usage: <script src="/sidebar.js"></script> + <body class="has-sidebar">

const ICONS = {
  'trending-up':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  'user-minus':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="22" x2="16" y1="11" y2="11"/></svg>',
  'eye':            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
  'trending-down':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>',
  'heart':          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  'sparkles':       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>',
  'search':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  'repeat-2':       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6"/><path d="m22 15-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/></svg>',
  'trophy':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  'film':           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>',
  'message-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
  'clock':          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  'lock':           '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  'zap':            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
};

const TOOLS = [
  { id: 'predictor',         icon: 'trending-up',    label: 'Growth Predictor',   href: '/',                  free: true,  soon: false, badge: 'Free' },
  { id: 'unfollow',          icon: 'user-minus',     label: 'Mass Unfollow',      href: '/unfollow',          free: false, soon: false },
  { id: 'unfollow-tracker',  icon: 'eye',            label: 'Unfollow Tracker',   href: '/unfollow-tracker',  free: false, soon: false },
  { id: 'inactive-follows',  icon: 'trending-down',  label: 'Inactive Follows',   href: '/inactive-follows',  free: false, soon: false },
  { id: 'loyal-fans',        icon: 'heart',          label: 'Your 20 Most Loyal', href: '/loyal-fans',        free: false, soon: false },
  { id: 'tweet-optimizer',   icon: 'sparkles',       label: 'AI Tweet Optimizer', href: '/tweet-optimizer',   free: false, soon: false },
  { id: 'competitor-spy',    icon: 'search',         label: 'Competitor Spy',     href: '/competitor-spy',    free: false, soon: false },
  { id: 'viral-reposter',    icon: 'repeat-2',       label: 'Tweet Recycler',     href: '/viral-reposter',    free: false, soon: false },
  { id: 'top5',              icon: 'trophy',         label: 'My Top 5',           href: '/top5',              free: false, soon: false },
  { id: 'tweet-reel',        icon: 'film',           label: 'Tweet To Video',     href: '/tweet-to-reel',     free: false, soon: false },
  { id: 'unreplied',         icon: 'message-circle', label: 'Unreplied Comments', href: '/unreplied',         free: false, soon: false },
  { id: 'best-time',         icon: 'clock',          label: 'Best Time to Post',  href: '/best-time',         free: false, soon: false },
];

function getCurrentTool() {
  const path = location.pathname;
  if (path === '/' || path === '/index.html') return 'predictor';
  return path.replace('/', '').replace('.html', '') || 'dashboard';
}

function buildSidebar(user) {
  const current = getCurrentTool();

  const navItems = TOOLS.map(t => {
    const isActive = t.id === current || (t.id === 'dashboard' && current === 'dashboard');
    const isLocked = !t.free && !user?.isPro;
    return `
      <a class="nav-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}"
         href="${t.href}"
         title="${t.label}">
        <span class="nav-icon">${ICONS[t.icon] || ''}</span>
        <span class="nav-label">${t.label}</span>
        ${t.badge ? `<span class="nav-badge free-badge">${t.badge}</span>` : ''}
        ${isLocked ? `<span class="nav-lock">${ICONS.lock}</span>` : ''}
      </a>
    `;
  }).join('');

  const userSection = user ? `
    <div class="sidebar-user">
      <img src="${user.avatar || ''}" onerror="this.style.display='none'" class="sidebar-avatar" />
      <div class="sidebar-user-info">
        <div class="sidebar-username">@${user.username}</div>
        ${!user.isPro ? `<a href="/pricing" class="upgrade-btn"><span class="upgrade-ico">${ICONS.zap}</span>Upgrade to Pro</a>` : `<span class="pro-badge">✦ Pro</span>`}
      </div>
    </div>
  ` : `
    <div class="sidebar-user">
      <a href="/api/auth/login" class="upgrade-btn">𝕏 Sign In</a>
    </div>
  `;

  return `
    <aside class="sidebar" id="appSidebar">
      <a class="sidebar-logo" href="/dashboard">
        <div class="sidebar-logo-icon"><svg viewBox="0 0 100 100" fill="none"><g stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14 L84 84"/><path d="M14 86 L78 22"/></g><path d="M94 6 L66 12 L88 34 Z" fill="currentColor"/></svg></div>
        <span class="sidebar-logo-text">Dash<span>Board</span></span>
      </a>
      <nav class="sidebar-nav">${navItems}</nav>
      ${userSection}
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>
  `;
}

function buildTopbar(user) {
  return `
    <header class="topbar" id="appTopbar">
      <button class="topbar-menu" onclick="toggleSidebar()" aria-label="Menu">☰</button>
      <a class="topbar-logo" href="/">
        <div class="topbar-logo-icon"><svg viewBox="0 0 100 100" fill="none"><g stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14 L84 84"/><path d="M14 86 L78 22"/></g><path d="M94 6 L66 12 L88 34 Z" fill="currentColor"/></svg></div>
        <span class="topbar-logo-text">X<span>Growth</span></span>
      </a>
      <div class="topbar-right">
        ${user ? `
          <img src="${user.avatar || ''}" onerror="this.style.display='none'" class="topbar-avatar" />
        ` : `
          <a href="/api/auth/login" class="btn btn-sm btn-secondary">Sign In</a>
        `}
      </div>
    </header>
  `;
}

function toggleSidebar() {
  document.getElementById('appSidebar')?.classList.toggle('open');
  document.getElementById('sidebarOverlay')?.classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('appSidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('show');
}

async function initLayout() {
  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    :root { --sidebar-w: 240px; }
    body.has-sidebar { display: flex; flex-direction: column; min-height: 100vh; }

    .topbar {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border);
      background: rgba(10,11,16,0.85); backdrop-filter: blur(12px);
      position: sticky; top: 0; z-index: 200; flex-shrink: 0;
    }
    .topbar-menu {
      background: none; border: none; color: var(--text);
      font-size: 20px; cursor: pointer; padding: 4px; display: none;
    }
    .topbar-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .topbar-logo-icon {
      width: 28px; height: 28px; border-radius: 8px;
      background: var(--card); border: 1px solid var(--border-hi);
      color: var(--accent);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700;
    }
    .topbar-logo-icon svg { width: 18px; height: 18px; display: block; }
    .topbar-logo-text {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 17px; font-weight: 700; letter-spacing: -0.02em; color: var(--text);
    }
    .topbar-logo-text span { color: var(--accent); }
    .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
    .topbar-avatar {
      width: 30px; height: 30px; border-radius: 50%; object-fit: cover;
      border: 2px solid var(--border-hi);
    }

    .app-body { display: flex; flex: 1; min-height: 0; }

    .sidebar {
      width: var(--sidebar-w);
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
      position: fixed; top: 53px; left: 0;
      height: calc(100vh - 53px); overflow-y: auto;
      z-index: 150; transition: transform 0.25s ease-out;
    }
    .sidebar-logo {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 20px 16px; text-decoration: none;
      border-bottom: 1px solid var(--border);
    }
    .sidebar-logo-icon {
      width: 30px; height: 30px; border-radius: 8px;
      background: var(--card); border: 1px solid var(--border-hi);
      color: var(--accent);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700;
    }
    .sidebar-logo-icon svg { width: 19px; height: 19px; display: block; }
    .sidebar-logo-text {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 17px; font-weight: 700; letter-spacing: -0.02em; color: var(--text);
    }
    .sidebar-logo-text span { color: var(--accent); }

    .sidebar-nav {
      flex: 1; padding: 12px 10px;
      display: flex; flex-direction: column; gap: 1px;
    }
    .nav-item {
      position: relative;
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px 9px 14px;
      border-radius: var(--radius);
      text-decoration: none;
      color: var(--text-mute); font-size: 14px; font-weight: 500;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item:hover { background: var(--card); color: var(--text); }
    .nav-item.active {
      background: var(--accent-soft);
      color: var(--text);
      font-weight: 600;
    }
    .nav-item.active::before {
      content: ""; position: absolute; left: 0; top: 8px; bottom: 8px;
      width: 3px; border-radius: 3px; background: var(--accent);
    }
    .nav-item.locked { opacity: 0.55; }
    .nav-icon {
      flex-shrink: 0; width: 20px; height: 20px;
      display: inline-flex; align-items: center; justify-content: center;
      color: currentColor;
    }
    .nav-icon svg { width: 18px; height: 18px; stroke-width: 1.75; }
    .nav-label { flex: 1; }
    .nav-badge { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px; }
    .free-badge { background: rgba(51,214,142,0.12); color: var(--success); border: 1px solid rgba(51,214,142,0.3); }
    .nav-lock {
      display: inline-flex; align-items: center; justify-content: center;
      width: 14px; height: 14px; opacity: 0.6; color: currentColor;
    }
    .nav-lock svg { width: 12px; height: 12px; stroke-width: 2; }
    .upgrade-ico {
      display: inline-flex; align-items: center; justify-content: center;
      width: 14px; height: 14px; color: var(--warning);
    }
    .upgrade-ico svg { width: 13px; height: 13px; stroke-width: 2; fill: currentColor; stroke: none; }

    .sidebar-user {
      padding: 14px; border-top: 1px solid var(--border);
      display: flex; align-items: center; gap: 10px;
    }
    .sidebar-avatar {
      width: 34px; height: 34px; border-radius: 50%; object-fit: cover;
      border: 2px solid var(--border-hi); flex-shrink: 0;
    }
    .sidebar-user-info { flex: 1; min-width: 0; }
    .sidebar-username {
      font-family: 'Geist Mono', monospace;
      font-size: 12px; color: var(--text-mute);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .upgrade-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      width: 100%; margin-top: 6px;
      padding: 7px 12px; font-size: 12px; font-weight: 600;
      border-radius: var(--radius);
      background: rgba(255,255,255,0.04); color: var(--text);
      border: 1px solid var(--border-hi);
      text-decoration: none; transition: background 0.15s, border-color 0.15s;
    }
    .upgrade-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.22); color: var(--text); }
    .pro-badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: 600; color: var(--warning);
      margin-top: 6px;
    }

    .sidebar-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.6); z-index: 149;
      backdrop-filter: blur(2px);
    }
    .sidebar-overlay.show { display: block; }

    .page-content { margin-left: var(--sidebar-w); flex: 1; min-width: 0; }

    @media (max-width: 768px) {
      .topbar-menu { display: block; }
      .sidebar { transform: translateX(-100%); top: 53px; }
      .sidebar.open { transform: translateX(0); }
      .page-content { margin-left: 0; }
    }
  `;
  document.head.appendChild(style);

  // Get user session
  let user = null;
  try {
    const r = await fetch('/api/auth/me');
    if (r.ok) { const d = await r.json(); user = d.user; }
  } catch {}

  // Inject topbar + sidebar before body content
  const topbar  = document.createElement('div');
  topbar.innerHTML = buildTopbar(user);
  document.body.insertBefore(topbar.firstElementChild, document.body.firstChild);

  const appBody = document.createElement('div');
  appBody.className = 'app-body';
  // Move remaining body children into page-content
  const pageContent = document.createElement('div');
  pageContent.className = 'page-content';
  while (document.body.children.length > 1) {
    pageContent.appendChild(document.body.children[1]);
  }
  appBody.innerHTML = buildSidebar(user);
  appBody.appendChild(pageContent);
  document.body.appendChild(appBody);

  return user;
}
