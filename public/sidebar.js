// Shared sidebar + layout injected on every page
// Usage: <script src="/sidebar.js"></script> + <body class="has-sidebar">

const TOOLS = [
  { id: 'predictor',   icon: '✈',  label: 'Growth Predictor',    href: '/',               free: true,  soon: false, badge: 'Free' },
  { id: 'unfollow',          icon: '🧹', label: 'Mass Unfollow',        href: '/unfollow',          free: false, soon: false },
  { id: 'unfollow-tracker',  icon: '👀', label: 'Unfollow Tracker',     href: '/unfollow-tracker',  free: false, soon: false },
  { id: 'inactive-follows',  icon: '📉', label: 'Inactive Follows',  href: '/inactive-follows',  free: false, soon: false },
  { id: 'loyal-fans',      icon: '💎', label: 'Your 20 Most Loyal',  href: '/loyal-fans',      free: false, soon: false },
  { id: 'tweet-optimizer', icon: '✍️',  label: 'AI Tweet Optimizer',  href: '/tweet-optimizer', free: false, soon: false },
  { id: 'competitor-spy',  icon: '🔍', label: 'Competitor Spy',       href: '/competitor-spy',  free: false, soon: false },
  { id: 'viral-reposter',  icon: '🔁', label: 'Tweet Recycler',       href: '/viral-reposter',  free: false, soon: false },
  { id: 'top5',              icon: '🏆', label: 'My Top 5',             href: '/top5',              free: false, soon: false },
  { id: 'tweet-reel',  icon: '🎬', label: 'Tweet To Video',        href: '/tweet-to-reel',  free: false, soon: false },
  { id: 'unreplied',   icon: '💬', label: 'Unreplied Comments',   href: '/unreplied',      free: false, soon: false },
  { id: 'best-time',   icon: '⏰', label: 'Best Time to Post',    href: '/best-time',      free: false, soon: false },
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
        <span class="nav-icon">${t.icon}</span>
        <span class="nav-label">${t.label}</span>
        ${t.badge ? `<span class="nav-badge free-badge">${t.badge}</span>` : ''}
        ${isLocked ? '<span class="nav-lock">🔒</span>' : ''}
      </a>
    `;
  }).join('');

  const userSection = user ? `
    <div class="sidebar-user">
      <img src="${user.avatar || ''}" onerror="this.style.display='none'" class="sidebar-avatar" />
      <div class="sidebar-user-info">
        <div class="sidebar-username">@${user.username}</div>
        ${!user.isPro ? `<a href="/pricing" class="upgrade-btn">⚡ Upgrade to Pro</a>` : `<span class="pro-badge">✦ Pro</span>`}
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
        <div class="sidebar-logo-icon">✈</div>
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
        <div class="topbar-logo-icon">✈</div>
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
    .nav-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }
    .nav-label { flex: 1; }
    .nav-badge { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px; }
    .free-badge { background: rgba(51,214,142,0.12); color: var(--success); border: 1px solid rgba(51,214,142,0.3); }
    .nav-lock { font-size: 11px; opacity: 0.6; }

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
