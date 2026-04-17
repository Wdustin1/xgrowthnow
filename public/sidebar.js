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
      <a href="/api/auth/login" class="upgrade-btn" style="width:100%;text-align:center;">𝕏 Sign In</a>
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
          <a href="/api/auth/login" style="font-size:13px;font-weight:700;color:var(--blue);text-decoration:none;">Sign In</a>
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
    :root {
      --sidebar-w: 240px;
    }
    body.has-sidebar {
      display: flex; flex-direction: column; min-height: 100vh;
    }
    .topbar {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 20px; border-bottom: 1px solid var(--border);
      background: rgba(0,0,0,0.92); backdrop-filter: blur(12px);
      position: sticky; top: 0; z-index: 200; flex-shrink: 0;
    }
    .topbar-menu { background: none; border: none; color: var(--text); font-size: 20px; cursor: pointer; padding: 4px; display: none; }
    .topbar-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
    .topbar-logo-icon { width: 28px; height: 28px; background: var(--blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; }
    .topbar-logo-text { font-size: 16px; font-weight: 800; color: var(--text); }
    .topbar-logo-text span { color: var(--blue); }
    .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
    .topbar-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); }

    .app-body { display: flex; flex: 1; min-height: 0; }

    .sidebar {
      width: var(--sidebar-w); background: var(--surface); border-right: 1px solid var(--border);
      display: flex; flex-direction: column; position: fixed; top: 53px; left: 0;
      height: calc(100vh - 53px); overflow-y: auto; z-index: 150; transition: transform 0.25s;
    }
    .sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 20px 20px 16px; text-decoration: none; border-bottom: 1px solid var(--border); }
    .sidebar-logo-icon { width: 30px; height: 30px; background: var(--blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; }
    .sidebar-logo-text { font-size: 16px; font-weight: 800; color: var(--text); }
    .sidebar-logo-text span { color: var(--blue); }

    .sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 10px; text-decoration: none;
      color: var(--muted); font-size: 14px; font-weight: 500;
      transition: all 0.15s; position: relative;
    }
    .nav-item:hover { background: var(--card); color: var(--text); }
    .nav-item.active { background: rgba(29,155,240,0.12); color: var(--blue); font-weight: 700; }
    .nav-item.locked { opacity: 0.6; }
    .nav-icon { font-size: 17px; flex-shrink: 0; width: 22px; text-align: center; }
    .nav-label { flex: 1; }
    .nav-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
    .free-badge { background: rgba(0,186,124,0.15); color: #00ba7c; border: 1px solid rgba(0,186,124,0.3); }
    .nav-lock { font-size: 12px; opacity: 0.6; }

    .sidebar-user {
      padding: 14px 14px 18px; border-top: 1px solid var(--border);
      display: flex; align-items: center; gap: 10px;
    }
    .sidebar-avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); flex-shrink: 0; }
    .sidebar-user-info { flex: 1; min-width: 0; }
    .sidebar-username { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .upgrade-btn { display: block; background: var(--blue); color: #fff; text-decoration: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 700; margin-top: 4px; text-align: center; }
    .upgrade-btn:hover { background: #1a8cd8; }
    .pro-badge { font-size: 11px; font-weight: 700; color: #ffd400; margin-top: 4px; display: block; }

    .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 149; }
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
