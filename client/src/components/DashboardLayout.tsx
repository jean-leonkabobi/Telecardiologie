import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useColorScheme, useTheme } from '@mui/material/styles';

import BarChartIcon from '@mui/icons-material/BarChart';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import EventAvailableIcon from '@mui/icons-material/EventAvailableOutlined';
import FactCheckIcon from '@mui/icons-material/FactCheckOutlined';
import HistoryIcon from '@mui/icons-material/History';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import NotificationsIcon from '@mui/icons-material/NotificationsNoneOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import PostAddIcon from '@mui/icons-material/PostAddOutlined';

import { useState, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { useNotifications } from '@/api/hooks';
import { Logo } from '@/components/common/Logo';

const DRAWER_WIDTH = 248;
const DRAWER_WIDTH_COLLAPSED = 72;

/**
 * L'entrée de menu à laquelle appartient l'écran courant.
 *
 * L'adresse exacte d'abord, les écrans rattachés ensuite : `/admin` ne doit pas
 * s'allumer sur `/admin/users`, alors que `/my-requests` doit s'allumer sur
 * `/request/42`. Comparer les préfixes sans ce garde-fou allumerait deux entrées
 * à la fois dans le menu administrateur.
 */
function entreeActive(items: NavItem[], location: string): NavItem | undefined {
  return (
    items.find((item) => item.href === location) ??
    items.find((item) => item.owns?.some((prefixe) => location.startsWith(prefixe)))
  );
}

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  /**
   * Préfixes des écrans rattachés à cette entrée.
   *
   * Sans cela, l'égalité stricte sur l'adresse laissait **aucune entrée
   * éclairée** dès qu'on ouvrait un détail : sur `/analyze/42`, le cardiologue
   * perdait tout repère de sa position dans l'application. Le détail appartient
   * bien à une section, il doit la montrer.
   */
  owns?: string[];
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  healthcare_professional: [
    { label: 'Tableau de bord', href: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Nouvelle demande', href: '/new-request', icon: <PostAddIcon /> },
    { label: 'Mes demandes', href: '/my-requests', icon: <DescriptionIcon />, owns: ['/request/'] },
    { label: 'Notifications', href: '/notifications', icon: <NotificationsIcon /> },
  ],
  cardiologist: [
    { label: 'Tableau de bord', href: '/dashboard', icon: <DashboardIcon /> },
    // `/analyze/:id` n'est atteignable que par un cardiologue, et vient de la
    // file dans la quasi-totalité des cas — l'historique y mène aussi, à la marge.
    { label: "File d'attente", href: '/queue', icon: <PlaylistAddCheckIcon />, owns: ['/analyze/'] },
    { label: 'Disponibilité', href: '/availability', icon: <EventAvailableIcon /> },
    { label: 'Historique', href: '/history', icon: <HistoryIcon /> },
    { label: 'Notifications', href: '/notifications', icon: <NotificationsIcon /> },
  ],
  admin: [
    { label: 'Tableau de bord', href: '/admin', icon: <DashboardIcon /> },
    { label: 'Demandes', href: '/admin/requests', icon: <DescriptionIcon /> },
    { label: 'Utilisateurs', href: '/admin/users', icon: <PeopleIcon /> },
    { label: 'Statistiques', href: '/admin/statistics', icon: <BarChartIcon /> },
    { label: 'Audit', href: '/admin/audit', icon: <FactCheckIcon /> },
    { label: 'Notifications', href: '/notifications', icon: <NotificationsIcon /> },
  ],
};

/**
 * Cloche de notifications avec compteur de non-lues.
 *
 * Le compteur vient du même cache TanStack Query que la page Notifications :
 * marquer une notification comme lue met la pastille à jour immédiatement,
 * sans requête supplémentaire.
 */
function NotificationBell() {
  const [, navigate] = useLocation();
  const { data } = useNotifications();
  const unread = data?.unreadCount ?? 0;

  return (
    <Tooltip title={unread > 0 ? `${unread} notification(s) non lue(s)` : 'Notifications'}>
      <IconButton color="inherit" onClick={() => navigate('/notifications')}>
        <Badge badgeContent={unread} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}

/** Bascule clair/sombre. `mode` est indéfini au premier rendu côté client. */
function ColorModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const resolved = mode === 'system' ? systemMode : mode;

  if (!mode) {
    // Réserve la place pour éviter un saut de mise en page.
    return <Box sx={{ width: 40, height: 40 }} />;
  }

  const isDark = resolved === 'dark';

  return (
    <Tooltip title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}>
      <IconButton onClick={() => setMode(isDark ? 'light' : 'dark')} color="inherit">
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Les pages publiques (connexion, 404 hors session) s'affichent sans coquille.
  if (!user) {
    return <>{children}</>;
  }

  const navItems = NAV_ITEMS[user.role];
  const active = entreeActive(navItems, location);
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const expanded = isMobile ? true : desktopOpen;
  const drawerWidth = expanded ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED;

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await logout();
    navigate('/login');
  };

  const handleNavigate = (href: string) => {
    navigate(href);
    if (isMobile) setMobileOpen(false);
  };

  const drawerContent = (
    <>
      <Toolbar sx={{ px: 2 }}>
        <Logo size={32} showWordmark={expanded} />
      </Toolbar>
      <Divider />

      <List sx={{ flexGrow: 1, px: 1, py: 2 }}>
        {navItems.map((item) => {
          const selected = item === active;
          return (
            <ListItem key={item.href} disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <Tooltip title={expanded ? '' : item.label} placement="right">
                <ListItemButton
                  selected={selected}
                  // Lu par les lecteurs d'écran : « page actuelle ». La couleur
                  // seule ne transmet pas cette information.
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => handleNavigate(item.href)}
                  sx={{
                    minHeight: 44,
                    justifyContent: expanded ? 'initial' : 'center',
                    px: 2,
                    // Filet vertical sur l'entrée active : un repère de forme, qui
                    // reste visible pour un daltonien comme en impression.
                    '&.Mui-selected': {
                      boxShadow: (t) => `inset 3px 0 0 ${t.palette.primary.main}`,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: expanded ? 2 : 'auto',
                      justifyContent: 'center',
                      color: selected ? 'primary.main' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {expanded && (
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { variant: 'body2', sx: { fontWeight: selected ? 600 : 400 } } }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider />
      <Box sx={{ p: 2 }}>
        {expanded ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block' }}>
                {user.roleLabel}
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Avatar sx={{ width: 36, height: 36, mx: 'auto', bgcolor: 'primary.main', fontSize: '0.875rem' }}>
            {initials}
          </Avatar>
        )}
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/**
        * Lien d'évitement, invisible jusqu'à ce qu'il reçoive le focus.
        *
        * Sans lui, un utilisateur au clavier traverse les cinq à six entrées du
        * menu, la cloche, la bascule de thème et le compte **à chaque changement
        * de page** avant d'atteindre le contenu.
        */}
      <Box
        component="a"
        href="#contenu-principal"
        sx={{
          position: 'absolute',
          left: 8,
          top: -48,
          zIndex: (t) => t.zIndex.tooltip + 1,
          px: 2,
          py: 1,
          borderRadius: 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          fontSize: '0.875rem',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'top 0.15s ease',
          '&:focus-visible': { top: 8 },
        }}
      >
        Aller au contenu
      </Box>

      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: (t) => t.zIndex.drawer + 1,
          // Même transition que le tiroir. Sans elle, replier le menu faisait
          // sauter la barre d'un coup pendant que le tiroir glissait — deux
          // mouvements désaccordés sur le même geste.
          transition: (t) =>
            t.transitions.create(['width', 'margin-left'], {
              easing: t.transitions.easing.sharp,
              duration: t.transitions.duration.enteringScreen,
            }),
        }}
      >
        <Toolbar sx={{ gap: { xs: 0.5, sm: 2 } }}>
          <Tooltip
            title={
              isMobile
                ? 'Afficher le menu'
                : desktopOpen
                  ? 'Réduire le menu'
                  : 'Déployer le menu'
            }
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label={isMobile ? 'Afficher le menu' : 'Réduire ou déployer le menu'}
              aria-expanded={isMobile ? mobileOpen : desktopOpen}
              onClick={() => (isMobile ? setMobileOpen((v) => !v) : setDesktopOpen((v) => !v))}
            >
              {/* Sur ordinateur l'icône reflète l'état : un chevron rentrant dit
                  « je vais replier », là où trois barres identiques dans les deux
                  sens n'annoncent rien. */}
              {!isMobile && desktopOpen ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
          </Tooltip>

          {/* Titre de la section courante.
              Sur mobile le menu est masqué : sans ce titre, plus rien n'indique
              où l'on se trouve avant que le contenu de la page ne s'affiche. */}
          <Typography variant="h3" component="h1" noWrap sx={{ minWidth: 0 }}>
            {active?.label ?? ''}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', display: { xs: 'none', lg: 'block' } }}
          >
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Typography>

          <NotificationBell />

          <ColorModeToggle />

          <Tooltip title="Compte">
            <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8125rem' }}>
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <Stack sx={{ py: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {user.email}
                </Typography>
              </Stack>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => void handleLogout()}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: isMobile ? 'block' : 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: isMobile ? DRAWER_WIDTH : drawerWidth,
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Toolbar />
        {/* `tabIndex={-1}` rend la cible du lien d'évitement focalisable : sans
            lui, le saut déplace la vue mais pas le focus clavier. */}
        <Container
          id="contenu-principal"
          tabIndex={-1}
          maxWidth="xl"
          sx={{ py: 3, flexGrow: 1, outline: 'none' }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}

export default DashboardLayout;
