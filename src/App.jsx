import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight, BadgeIndianRupee, BarChart3, BookOpen, Box, Building2, Check,
  ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Clock3, Code2, Globe2, Headphones,
  Instagram, Linkedin, LocateFixed, Mail, MapPin, Menu, PackageCheck, PackageSearch,
  Phone, Plane, PlugZap, RefreshCcw, Route, Ruler, Scale, Search, ShieldCheck,
  ShoppingBag, Sparkles, Store, Truck, Warehouse, X, Zap,
} from 'lucide-react'
import { Link, NavLink, Route as RouterRoute, Routes, useLocation } from 'react-router-dom'

const productMenuGroups = [
  {
    title: 'Shipping',
    icon: Truck,
    items: [
      ['Global Parcel Shipping', 'Domestic and international delivery lanes', '/rate-calculator', PackageCheck],
      ['Freight & Cargo', 'B2B air, road and ocean movement', '/integrations/courier-partners', Warehouse],
      ['Express', 'Priority routes for time-sensitive shipments', '/rate-calculator', Zap],
      ['Fulfillment', 'Warehousing, packing and export-ready dispatch', '/integrations', Store],
    ],
  },
  {
    title: 'Cross-Border',
    icon: Globe2,
    items: [
      ['ShipX', 'Shipping to 220+ countries and territories', '/integrations/courier-partners', Plane],
      ['CargoX', 'Cross-border B2B and bulk shipping', '/integrations/courier-partners', Box],
      ['Duty Calculator', 'Estimate duties for global shipments', '/rate-calculator', BadgeIndianRupee],
    ],
  },
  {
    title: 'Growth & Marketing',
    icon: BarChart3,
    items: [
      ['PunjabShip AI Suite', 'AI-native tools for pre-order growth', '/blogs', Sparkles],
      ['Promise', 'EDD and trust signals for ecommerce', '/tracking', CircleCheck],
      ['ONDC', 'Wider digital visibility through ONDC', '/integrations/sales-channels', ShoppingBag],
    ],
  },
  {
    title: 'Financial Services',
    icon: BadgeIndianRupee,
    items: [
      ['Capital', 'Financial support for business growth', '/rate-calculator', Building2],
      ['Credit Score', 'Understand business credit readiness', '/blogs', ShieldCheck],
    ],
  },
  {
    title: 'AI Enabled Products',
    icon: Sparkles,
    items: [
      ['Sense', 'Turn logistics data into useful actions', '/blogs', BarChart3],
      ['Voice AI', 'Add intelligent voice to workflows', '/blogs', Phone],
      ['Trends', 'Commerce behaviour and shipping analytics', '/blogs', Route],
    ],
  },
]

const valueAddedItems = [
  ['Delivery Boost', '/tracking', Zap],
  ['Dark Stores', '/integrations', Store],
  ['Delight Tracking', '/tracking', LocateFixed],
  ['Payment Collection', '/rate-calculator', BadgeIndianRupee],
  ['Pickup Scheduling', '/rate-calculator', PackageSearch],
  ['PunjabShip Prime', '/', Sparkles],
  ['Omuni', '/integrations', PlugZap],
  ['Packaging', '/weight-calculator', Box],
  ['Co-Pilot', '/blogs', Headphones],
  ['Returns Management', '/tracking', RefreshCcw],
]

const platformFeatureItems = [
  ['Cash on Delivery', 'Flexible payment collection workflows', '/rate-calculator', BadgeIndianRupee],
  ['Global Coverage', 'Check lane reach before every booking', '/rate-calculator', MapPin],
  ['API Integration', 'Connect orders and shipment events', '/integrations', Code2],
  ['Multiple Pickup Locations', 'Dispatch from every active warehouse', '/integrations', Warehouse],
  ['Print Shipping Labels', 'Prepare courier-ready documentation', '/weight-calculator', PackageCheck],
  ['Email & SMS Notification', 'Keep customers informed automatically', '/tracking', Mail],
  ['Marketplace Shipping', 'Manage marketplace orders your way', '/integrations/sales-channels', ShoppingBag],
  ['All Features', 'Explore the complete PunjabShip platform', '/integrations', Sparkles],
]

const partnerMenuGroups = [
  {
    title: 'Integrations',
    items: [
      ['Carrier Integration', 'Connect global carriers and automate shipping', '/integrations/courier-partners', Truck],
      ['Channel Integration', 'Connect your store and order channels', '/integrations/sales-channels', ShoppingBag],
    ],
  },
  {
    title: 'Partner Program',
    items: [
      ['Become a Partner', 'Collaborate with PunjabShip and unlock growth opportunities', '/integrations', Building2],
    ],
  },
]

const resourceMenuGroups = [
  {
    title: 'Product Help',
    items: [
      ['Shipping Rate Calculator', 'Estimate domestic and international shipping costs', '/rate-calculator', BadgeIndianRupee],
      ['Volumetric Weight Calculator', 'Find the chargeable parcel weight', '/weight-calculator', Scale],
      ['Global Shipping Tools', 'Practical tools for international shippers', '/weight-calculator', Ruler],
      ['Knowledge Base', 'Answers for everyday shipping questions', '/blogs', BookOpen],
      ['Developers', 'Connect with PunjabShip workflows and APIs', '/integrations', Code2],
    ],
  },
  {
    title: 'Learn',
    items: [
      ['Blog', 'Shipping guides, ideas and insights', '/blogs', BookOpen],
      ['Ebook', 'Long-form ecommerce playbooks', '/blogs', PackageSearch],
      ['Encyclopedia', 'Simple logistics terms and concepts', '/blogs', Globe2],
      ['Videos & Podcast', 'Learn from operators and experts', '/blogs', Headphones],
      ['FAQs', 'Quick answers about PunjabShip', '/blogs', CircleCheck],
    ],
  },
]

const products = [
  {
    kicker: '1/4 · SHIPPING',
    title: 'Unified global shipping',
    copy: 'Ship to every customer through one powerful workflow. Compare carrier performance, automate dispatch and keep every parcel visible across borders.',
    metric: '220+',
    metricLabel: 'global destinations',
    cta: 'Explore shipping',
    to: '/rate-calculator',
    icon: Truck,
    gradient: 'from-[#d9f7ff] via-[#48d4dc] to-[#0877c9]',
    accent: '#0877c9',
    mockup: 'orders',
  },
  {
    kicker: '2/4 · CROSS-BORDER',
    title: 'Full-stack global enablement',
    copy: 'Take products worldwide with supported documentation, international carrier selection and milestone-level visibility.',
    metric: '220+',
    metricLabel: 'countries & territories',
    cta: 'Go global',
    to: '/rate-calculator',
    icon: Globe2,
    gradient: 'from-[#ccf7ff] via-[#27e4c1] to-[#0f8f7f]',
    accent: '#0f8f7f',
    mockup: 'globe',
  },
  {
    kicker: '3/4 · INTELLIGENCE',
    title: 'AI-powered tools for logistics growth',
    copy: 'Turn lane, cost and delivery signals into faster carrier decisions. Spot exceptions before they become customer problems.',
    metric: '99.2%',
    metricLabel: 'platform uptime',
    cta: 'See the platform',
    to: '/tracking',
    icon: Sparkles,
    gradient: 'from-[#fff0bd] via-[#f3cf62] to-[#38c6d5]',
    accent: '#8a6700',
    mockup: 'analytics',
  },
  {
    kicker: '4/4 · BUSINESS SUPPORT',
    title: 'Flexible solutions that scale with you',
    copy: 'From the first hundred parcels to complex multi-country movement, use a carrier and support model built around your growth.',
    metric: '100+',
    metricLabel: 'carrier options',
    cta: 'Talk to a trade expert',
    to: '/weight-calculator',
    icon: BadgeIndianRupee,
    gradient: 'from-[#0b7dd0] via-[#2fd0ca] to-[#f3cf62]',
    accent: '#045a9b',
    mockup: 'capital',
  },
]

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function MegaMenuItem({ item }) {
  const [label, copy, to, Icon] = item
  return (
    <NavLink className="mega-link" to={to}>
      <span className="mega-link-icon"><Icon /></span>
      <span><strong>{label}</strong>{copy && <small>{copy}</small>}</span>
      <ChevronRight className="mega-link-arrow" />
    </NavLink>
  )
}

function MegaMenuSection({ group }) {
  const GroupIcon = group.icon
  return (
    <section className="mega-section">
      <div className="mega-section-title">
        {GroupIcon && <span><GroupIcon /></span>}
        <strong>{group.title}</strong>
      </div>
      <div className="mega-section-links">
        {group.items.map(item => <MegaMenuItem item={item} key={item[0]} />)}
      </div>
    </section>
  )
}

function MobileNavGroups({ groups }) {
  return groups.map(group => (
    <div className="mobile-nav-section" key={group.title}>
      <span className="mobile-submenu-title">{group.title}</span>
      {group.items.map(([label, , to, Icon]) => (
        <NavLink key={label} to={to}><Icon /> {label}</NavLink>
      ))}
    </div>
  ))
}

function Header() {
  const [open, setOpen] = useState(false)
  const [desktopMenu, setDesktopMenu] = useState(null)
  const [mobileGroup, setMobileGroup] = useState(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const headerRef = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => {
    let frameId = null

    const updateHeader = () => {
      setIsScrolled(window.scrollY > 24)
      frameId = null
    }

    const handleScroll = () => {
      if (frameId === null) frameId = window.requestAnimationFrame(updateHeader)
    }

    updateHeader()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frameId !== null) window.cancelAnimationFrame(frameId)
    }
  }, [])

  useEffect(() => {
    setOpen(false)
    setDesktopMenu(null)
    setMobileGroup(null)
  }, [pathname])

  useEffect(() => {
    const closeMenus = (event) => {
      if (!headerRef.current?.contains(event.target)) setDesktopMenu(null)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setDesktopMenu(null)
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeMenus)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeMenus)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const toggleMobileGroup = (group) => {
    setMobileGroup(current => current === group ? null : group)
  }

  const toggleDesktopMenu = (menu) => {
    setDesktopMenu(current => current === menu ? null : menu)
  }

  return (
    <header className={`site-nav ${isScrolled ? 'is-scrolled' : ''}`} ref={headerRef}>
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="PunjabShip home">
          <img src="/assets/punjabship-logo.png" alt="PunjabShip Logistics" />
        </Link>
        <nav className="desktop-links" aria-label="Main navigation">
          <div
            className={`nav-dropdown-wrap ${desktopMenu === 'products' ? 'menu-open' : ''}`}
            onMouseEnter={() => setDesktopMenu('products')}
            onMouseLeave={() => setDesktopMenu(null)}
          >
            <button
              className={`nav-trigger ${['/weight-calculator', '/rate-calculator'].includes(pathname) ? 'active' : ''}`}
              type="button"
              aria-expanded={desktopMenu === 'products'}
              aria-controls="products-menu"
              onClick={() => toggleDesktopMenu('products')}
            >
              Products <ChevronDown />
            </button>
            <div
              id="products-menu"
              className={`mega-menu mega-products ${desktopMenu === 'products' ? 'open' : ''}`}
            >
              <div className="mega-menu-head">
                <div><small>PUNJABSHIP PRODUCTS</small><strong>Everything your commerce journey needs</strong></div>
                <Link to="/integrations">Explore all products <ArrowRight /></Link>
              </div>
              <div className="mega-products-grid">
                {productMenuGroups.map(group => <MegaMenuSection group={group} key={group.title} />)}
              </div>
              <div className="mega-value-row">
                <strong>Value Added Services</strong>
                <div>
                  {valueAddedItems.map(([label, to, Icon]) => (
                    <NavLink to={to} key={label}><Icon /> {label}</NavLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div
            className={`nav-dropdown-wrap ${desktopMenu === 'platform' ? 'menu-open' : ''}`}
            onMouseEnter={() => setDesktopMenu('platform')}
            onMouseLeave={() => setDesktopMenu(null)}
          >
            <button
              className={`nav-trigger ${pathname.startsWith('/integrations') ? 'active' : ''}`}
              type="button"
              aria-expanded={desktopMenu === 'platform'}
              aria-controls="platform-menu"
              onClick={() => toggleDesktopMenu('platform')}
            >
              Platform <ChevronDown />
            </button>
            <div
              id="platform-menu"
              className={`mega-menu mega-platform ${desktopMenu === 'platform' ? 'open' : ''}`}
            >
              <div className="mega-feature-panel">
                <div className="mega-menu-head">
                  <div><small>PLATFORM</small><strong>Features that power every shipment</strong></div>
                  <Link to="/integrations">All features <ArrowRight /></Link>
                </div>
                <div className="mega-feature-grid">
                  {platformFeatureItems.map(item => <MegaMenuItem item={item} key={item[0]} />)}
                </div>
              </div>
              <Link className="mega-promo" to="/integrations">
                <span className="mega-promo-icon"><Building2 /></span>
                <small>REFER &amp; GROW</small>
                <strong>Build the network with PunjabShip</strong>
                <p>Connect brands, sales channels and carrier partners in one global ecosystem.</p>
                <span className="mega-promo-action">Know more <ArrowRight /></span>
              </Link>
              </div>
          </div>
          <NavLink to="/rate-calculator">Pricing</NavLink>
          <div
            className={`nav-dropdown-wrap ${desktopMenu === 'partners' ? 'menu-open' : ''}`}
            onMouseEnter={() => setDesktopMenu('partners')}
            onMouseLeave={() => setDesktopMenu(null)}
          >
            <button
              className={`nav-trigger ${pathname === '/integrations/courier-partners' ? 'active' : ''}`}
              type="button"
              aria-expanded={desktopMenu === 'partners'}
              aria-controls="partners-menu"
              onClick={() => toggleDesktopMenu('partners')}
            >
              Partners <ChevronDown />
            </button>
            <div
              id="partners-menu"
              className={`mega-menu mega-partners ${desktopMenu === 'partners' ? 'open' : ''}`}
            >
              <div className="mega-menu-head">
                <div><small>PARTNERS</small><strong>Grow with the PunjabShip ecosystem</strong></div>
              </div>
              <div className="mega-partner-grid">
                {partnerMenuGroups.map(group => <MegaMenuSection group={group} key={group.title} />)}
              </div>
            </div>
          </div>
          <NavLink to="/tracking">Track Order</NavLink>
          <div
            className={`nav-dropdown-wrap ${desktopMenu === 'resources' ? 'menu-open' : ''}`}
            onMouseEnter={() => setDesktopMenu('resources')}
            onMouseLeave={() => setDesktopMenu(null)}
          >
            <button
              className={`nav-trigger ${pathname === '/blogs' ? 'active' : ''}`}
              type="button"
              aria-expanded={desktopMenu === 'resources'}
              aria-controls="resources-menu"
              onClick={() => toggleDesktopMenu('resources')}
            >
              Resources <ChevronDown />
            </button>
            <div
              id="resources-menu"
              className={`mega-menu mega-resources ${desktopMenu === 'resources' ? 'open' : ''}`}
            >
              <div className="mega-resource-columns">
                {resourceMenuGroups.map(group => <MegaMenuSection group={group} key={group.title} />)}
              </div>
              <Link className="mega-promo resource-promo" to="/blogs">
                <span className="mega-promo-icon"><BookOpen /></span>
                <small>CUSTOMER STORIES</small>
                <strong>See how global brands scale with PunjabShip</strong>
                <p>Practical stories from teams simplifying logistics and scaling commerce.</p>
                <span className="mega-promo-action">Read stories <ArrowRight /></span>
              </Link>
            </div>
          </div>
        </nav>
        <div className="nav-actions">
          <Link className="login-button" to="/login">Sign In</Link>
          <Link className="try-button" to="/rate-calculator">Try for Free</Link>
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mobile-menu">
          <button className="mobile-group-trigger" type="button" onClick={() => toggleMobileGroup('products')} aria-expanded={mobileGroup === 'products'}>
            Products <ChevronDown />
          </button>
          {mobileGroup === 'products' && (
            <div className="mobile-submenu mobile-mega-submenu">
              <MobileNavGroups groups={productMenuGroups} />
              <div className="mobile-nav-section">
                <span className="mobile-submenu-title">Value Added Services</span>
                {valueAddedItems.map(([label, to, Icon]) => <NavLink key={label} to={to}><Icon /> {label}</NavLink>)}
              </div>
            </div>
          )}
          <button className="mobile-group-trigger" type="button" onClick={() => toggleMobileGroup('platform')} aria-expanded={mobileGroup === 'platform'}>
            Platform <ChevronDown />
          </button>
          {mobileGroup === 'platform' && (
            <div className="mobile-submenu mobile-mega-submenu">
              <MobileNavGroups groups={[{ title: 'Features', items: platformFeatureItems }]} />
            </div>
          )}
          <NavLink to="/rate-calculator">Pricing</NavLink>
          <button className="mobile-group-trigger" type="button" onClick={() => toggleMobileGroup('partners')} aria-expanded={mobileGroup === 'partners'}>
            Partners <ChevronDown />
          </button>
          {mobileGroup === 'partners' && (
            <div className="mobile-submenu mobile-mega-submenu">
              <MobileNavGroups groups={partnerMenuGroups} />
            </div>
          )}
          <NavLink to="/tracking">Track Order</NavLink>
          <button className="mobile-group-trigger" type="button" onClick={() => toggleMobileGroup('resources')} aria-expanded={mobileGroup === 'resources'}>
            Resources <ChevronDown />
          </button>
          {mobileGroup === 'resources' && (
            <div className="mobile-submenu mobile-mega-submenu">
              <MobileNavGroups groups={resourceMenuGroups} />
              <div className="mobile-nav-section">
                <span className="mobile-submenu-title">Stories</span>
                <NavLink to="/blogs"><BookOpen /> Customer Stories</NavLink>
              </div>
            </div>
          )}
          <div className="mobile-auth-actions">
            <Link className="login-button mobile-login" to="/login">Sign In</Link>
            <Link className="try-button" to="/rate-calculator">Try for Free</Link>
          </div>
        </div>
      )}
    </header>
  )
}

const heroSlides = [
  {
    id: 'smart-shipping',
    eyebrow: 'Built for ambitious businesses',
    title: 'Ship smarter.',
    highlight: 'Grow without limits.',
    copy: 'One reliable platform to compare global carriers, move parcels across borders, and keep every shipment visible from pickup to final mile.',
    primary: 'Calculate global rate',
    primaryTo: '/rate-calculator',
    secondary: 'Track a shipment',
    secondaryTo: '/tracking',
    secondaryIcon: LocateFixed,
    note: 'Global-ready workflows · No minimum commitment',
    image: '/assets/punjabship-network-studio.jpg',
    imageAlt: 'PunjabShip connected logistics network',
    kind: 'network',
    tone: 'violet',
    firstCard: { icon: PackageCheck, label: 'Global pickups', value: '128 ready', badge: '+18%' },
    secondCard: { icon: Truck, label: 'Delivery score', value: 'Excellent', badge: '96' },
  },
  {
    id: 'domestic-reach',
    eyebrow: 'Global delivery, one workflow',
    title: 'Reach every country.',
    highlight: 'Keep every route clear.',
    copy: 'Plan domestic and international shipments with air, sea, road and courier choices in one clear booking workflow.',
    primary: 'Plan a shipment',
    primaryTo: '/rate-calculator',
    secondary: 'Explore carriers',
    secondaryTo: '/integrations/courier-partners',
    secondaryIcon: Route,
    note: 'Air, sea, road and courier choice · Clear coverage',
    image: '/assets/punjabship-india-reach.jpg',
    imageAlt: 'Connected international parcel routes across global markets',
    kind: 'illustration',
    tone: 'amber',
    firstCard: { icon: MapPin, label: 'Global reach', value: '220+ countries', badge: 'Live' },
    secondCard: { icon: Route, label: 'Route planning', value: 'Courier matched', badge: 'Fast' },
  },
  {
    id: 'live-tracking',
    eyebrow: 'Readable milestones for every parcel',
    title: 'Every shipment.',
    highlight: 'Clearly visible.',
    copy: 'Follow the latest carrier scan, spot delivery exceptions earlier and give customers useful progress without switching tools.',
    primary: 'Track a shipment',
    primaryTo: '/tracking',
    secondary: 'See integrations',
    secondaryTo: '/integrations',
    secondaryIcon: Search,
    note: 'Live global milestones · Customer-ready updates',
    image: '/assets/punjabship-tracking-mobile.jpg',
    imageAlt: 'Mobile shipment timeline connected to a parcel and delivery route',
    kind: 'ui',
    tone: 'cyan',
    firstCard: { icon: LocateFixed, label: 'Latest milestone', value: 'Out for delivery', badge: 'Live' },
    secondCard: { icon: CircleCheck, label: 'Shipment health', value: 'On schedule', badge: '98' },
  },
  {
    id: 'rate-confidence',
    eyebrow: 'Make every global shipping decision count',
    title: 'Know the cost.',
    highlight: 'Choose with confidence.',
    copy: 'Estimate parcel, freight and cross-border costs before booking, compare the details that matter and protect margins as you scale worldwide.',
    primary: 'Estimate landed cost',
    primaryTo: '/rate-calculator',
    secondary: 'Check weight',
    secondaryTo: '/weight-calculator',
    secondaryIcon: Scale,
    note: 'Duties-aware estimates · Practical weight guidance',
    image: '/assets/punjabship-rate-studio.jpg',
    imageAlt: 'Shipping rate comparison dashboard with parcels and route markers',
    kind: 'ui',
    tone: 'pink',
    firstCard: { icon: BadgeIndianRupee, label: 'Rate estimate', value: 'Ready to compare', badge: 'New' },
    secondCard: { icon: Scale, label: 'Chargeable weight', value: 'Checked', badge: '100' },
  },
]

function ProfessionalHeroVisual({ slide }) {
  return (
    <div className="hero-motion-panel">
      <img src={slide.image} alt={slide.imageAlt} loading="eager" fetchPriority="high" decoding="sync" />
      <div className="motion-shade" />
      <div className="motion-grid" />
      <div className="motion-route route-a"><span /></div>
      <div className="motion-route route-b"><span /></div>
      <div className="motion-route route-c"><span /></div>
      <div className="motion-plane"><Plane size={22} /></div>
      <div className="motion-chip chip-origin"><MapPin size={13} /> Origin hub</div>
      <div className="motion-chip chip-destination"><Globe2 size={13} /> Global lane</div>
    </div>
  )
}

function Hero() {
  const [activeSlide, setActiveSlide] = useState(0)
  const slide = heroSlides[activeSlide]
  const SecondaryIcon = slide.secondaryIcon
  const FirstCardIcon = slide.firstCard.icon
  const SecondCardIcon = slide.secondCard.icon

  useEffect(() => {
    heroSlides.forEach(({ image }) => {
      const preload = new Image()
      preload.src = image
    })
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = window.setInterval(() => {
      setActiveSlide(current => (current + 1) % heroSlides.length)
    }, 3400)
    return () => window.clearInterval(timer)
  }, [])

  const moveSlide = (direction) => {
    setActiveSlide(current => (current + direction + heroSlides.length) % heroSlides.length)
  }

  return (
    <section className={`hero hero-tone-${slide.tone}`}>
      <div className="hero-glow one" />
      <div className="hero-glow two" />
      <div className="shell hero-grid hero-slide" key={slide.id}>
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={16} /> {slide.eyebrow}</div>
          <h1>{slide.title}<br /><span>{slide.highlight}</span></h1>
          <p>{slide.copy}</p>
          <div className="hero-actions">
            <Link className="button primary" to={slide.primaryTo}>{slide.primary} <ArrowRight size={17} /></Link>
            <Link className="button ghost" to={slide.secondaryTo}><SecondaryIcon size={17} /> {slide.secondary}</Link>
          </div>
          <div className="hero-note"><CircleCheck size={18} /> {slide.note}</div>
        </div>
        <div className={`hero-art hero-art-${slide.kind}`}>
          <div className="hero-orbit" />
          <ProfessionalHeroVisual slide={slide} />
          <div className="float-card pickup">
            <span className="mini-icon"><FirstCardIcon size={20} /></span>
            <div><small>{slide.firstCard.label}</small><strong>{slide.firstCard.value}</strong></div>
            <span className="positive">{slide.firstCard.badge}</span>
          </div>
          <div className="float-card delivery">
            <span className="mini-icon lime"><SecondCardIcon size={20} /></span>
            <div><small>{slide.secondCard.label}</small><strong>{slide.secondCard.value}</strong></div>
            <span className="score">{slide.secondCard.badge}</span>
          </div>
        </div>
      </div>
      <div className="shell hero-pager" aria-label="Hero slides">
        <button className="hero-arrow" type="button" onClick={() => moveSlide(-1)} aria-label="Previous slide"><ChevronLeft /></button>
        {heroSlides.map((item, index) => (
          <button
            className={`hero-progress ${activeSlide === index ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveSlide(index)}
            aria-label={`Show ${item.title} ${item.highlight}`}
            aria-current={activeSlide === index ? 'true' : undefined}
            key={item.id}
          />
        ))}
        <button className="hero-arrow" type="button" onClick={() => moveSlide(1)} aria-label="Next slide"><ChevronRight /></button>
      </div>
    </section>
  )
}

function TrustRail() {
  return (
    <section className="trust-rail">
      <div className="shell">
        <p>Trusted by <strong>50,000+ global shippers</strong></p>
        <div className="logo-row">
          {['Atlas Retail', 'NorthSea Trade', 'Urban Cargo', 'Astra Commerce', 'Pacific & Co.', 'Meridian Supply', 'Verde Global'].map(x => <span key={x}>{x}</span>)}
        </div>
      </div>
    </section>
  )
}

function CardMockup({ type }) {
  if (type === 'globe') return (
    <div className="mockup centered">
      <div className="globe"><Plane /><span className="route-line a" /><span className="route-line b" /></div>
      <div className="route-pill"><MapPin size={16} /> Delhi <ArrowRight size={14} /> Dubai</div>
    </div>
  )
  if (type === 'analytics') return (
    <div className="mockup analytics">
      <div className="analytics-top"><span>Carrier intelligence</span><span className="live-dot">Live</span></div>
      <div className="bars">{[45, 68, 52, 82, 74, 94].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
      <div className="insight"><Sparkles size={18} /> <div><b>Best route found</b><small>12% faster than last week</small></div></div>
    </div>
  )
  if (type === 'capital') return (
    <div className="mockup capital">
      <div className="capital-card"><small>Monthly freight saved</small><strong>₹42,680</strong><div className="progress"><i /></div><span>Great performance</span></div>
      <div className="capital-mini"><ShieldCheck /><span>Secure payments</span></div>
    </div>
  )
  return (
    <div className="mockup orders">
      <div className="mockup-head"><span>Global orders</span><strong>View all</strong></div>
      {[
        ['#SR29481', 'Out for delivery', 'violet'],
        ['#SR29480', 'In transit', 'blue'],
        ['#SR29479', 'Delivered', 'green'],
      ].map(([id, status, color]) => (
        <div className="order-row" key={id}><span className={`parcel ${color}`}><Box size={18} /></span><div><b>{id}</b><small>Delhi to Dubai</small></div><em>{status}</em></div>
      ))}
    </div>
  )
}

function RollingCards() {
  return (
    <section className="stack-section">
      <div className="shell section-intro">
        <span className="section-label">ONE PLATFORM. EVERY POSSIBILITY.</span>
        <h2>Why growing businesses<br />choose PunjabShip</h2>
        <p>Purpose-built tools that simplify logistics, remove operational friction and create room for your business to grow.</p>
      </div>
      <div className="shell stack-wrap">
        {products.map((product, index) => {
          const Icon = product.icon
          return (
            <article
              className={`stack-card bg-gradient-to-br ${product.gradient}`}
              style={{
                '--stack-offset': `${120 + index * 12}px`,
                '--mobile-stack-offset': `${80 + index * 7}px`,
                '--stack-layer': index + 1,
              }}
              key={product.title}
            >
              <div className="stack-copy">
                <span className="card-kicker">{product.kicker}</span>
                <span className="feature-icon"><Icon /></span>
                <h3>{product.title}</h3>
                <p>{product.copy}</p>
                <Link to={product.to}> {product.cta} <ArrowRight size={16} /></Link>
              </div>
              <div className="stack-visual">
                <div className="big-metric"><strong>{product.metric}</strong><span>{product.metricLabel}</span></div>
                <CardMockup type={product.mockup} />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const solutionCards = [
  ['Global shipping', 'Reach customers worldwide with the right carrier for every lane.', Truck],
  ['International cargo', 'Move heavier consignments with dependable road, air and ocean freight options.', Warehouse],
  ['Global delivery', 'Ship beyond borders with a supported documentation and tracking workflow.', Globe2],
  ['Returns made simple', 'Turn reverse logistics into an easy, visible customer experience.', RefreshCcw],
  ['Live tracking', 'Give teams and customers consistent milestones across courier networks.', LocateFixed],
  ['Smart rate engine', 'Compare lane, weight, SLA, duties and payment-mode rates in moments.', BadgeIndianRupee],
]

function Solutions() {
  return (
    <section className="solutions">
      <div className="shell">
        <div className="section-heading">
          <div><span className="section-label">PunjabShip SOLUTIONS</span><h2>Everything you need to<br />move business worldwide</h2></div>
          <Link to="/rate-calculator">Calculate a rate <ArrowRight /></Link>
        </div>
        <div className="solution-grid">
          {solutionCards.map(([title, copy, Icon], i) => (
            <article key={title} className={`solution-card tone-${i + 1}`}>
              <span><Icon /></span><h3>{title}</h3><p>{copy}</p><Link to="/rate-calculator">Calculate now <ArrowRight size={15} /></Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stats() {
  const sectionRef = useRef(null)
  const [countProgress, setCountProgress] = useState(0)
  const [shouldCount, setShouldCount] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCountProgress(1)
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setShouldCount(true)
      observer.disconnect()
    }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' })

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!shouldCount) return undefined

    const duration = 650
    let frameId = null
    let startedAt = null

    const animate = (timestamp) => {
      if (startedAt === null) startedAt = timestamp
      const elapsed = Math.min((timestamp - startedAt) / duration, 1)
      const eased = 1 - ((1 - elapsed) ** 3)
      setCountProgress(eased)

      if (elapsed < 1) frameId = window.requestAnimationFrame(animate)
    }

    frameId = window.requestAnimationFrame(animate)
    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId)
    }
  }, [shouldCount])

  const stats = [
    { value: 50, suffix: 'K+', label: 'businesses shipping globally' },
    { value: 220, suffix: '+', label: 'countries and territories' },
    { value: 100, suffix: '+', label: 'carrier options' },
    { value: 99.2, suffix: '%', decimals: 1, label: 'platform uptime' },
  ]

  return (
    <section className="stats-section" ref={sectionRef}>
      <div className="shell stats-grid">
        {stats.map(({ value, suffix, decimals = 0, label }) => {
          const currentValue = value * countProgress
          const displayValue = decimals
            ? currentValue.toFixed(decimals).replace(/\.0$/, '')
            : Math.round(currentValue)

          return (
            <div key={label}>
              <strong aria-label={`${value}${suffix}`}>{displayValue}{suffix}</strong>
              <span>{label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function BusinessTypes() {
  return (
    <section className="business-section">
      <div className="shell">
        <div className="center-heading"><span className="section-label">BUILT AROUND YOU</span><h2>One platform. Every market you serve.</h2><p>Whether you ship ten parcels or full international consignments, PunjabShip fits the way you work.</p></div>
        <div className="business-grid">
          {[
            ['Global brands', 'Create an international delivery experience customers trust.', ShoppingBag, 'Explore global shipping'],
            ['Export teams', 'Open new lanes, control freight spend and scale without operational rework.', Store, 'Solutions for exporters'],
            ['Enterprise', 'Coordinate multi-country, high-volume logistics with clarity.', Building2, 'Enterprise logistics'],
          ].map(([title, copy, Icon, cta]) => (
            <article key={title}><span><Icon /></span><h3>{title}</h3><p>{copy}</p><Link to="/rate-calculator">{cta} <ArrowRight size={15} /></Link></article>
          ))}
        </div>
      </div>
    </section>
  )
}

function DeveloperBand() {
  return (
    <section className="developer-band">
      <div className="shell developer-grid">
        <div><span className="section-label light">SMART SHIPPING TOOLS</span><h2>Know the weight.<br />Know the cost.</h2><p>Calculate chargeable weight, compare domestic and international rates, and follow every delivery from one focused PunjabShip experience.</p><Link className="button lime" to="/weight-calculator">Calculate weight <Scale size={17} /></Link></div>
        <div className="code-window"><div><i /><i /><i /><span>create-shipment.js</span></div><pre>{`const shipment = await punjabship.orders.create({
  pickup: "Delhi Hub",
  delivery: "Dubai Port",
  weight: 1.4,
  payment: "prepaid"
});

// Best carrier lane matched
console.log(shipment.awb);`}</pre></div>
      </div>
    </section>
  )
}

const demoProducts = [
  {
    tab: 'Smart Booking',
    title: 'Book the right global route in minutes',
    copy: 'Enter pickup, destination, parcel and export details once. PunjabShip compares suitable courier and freight options while keeping the booking workflow clear.',
    image: '/assets/punjabship-smart-booking.jpg',
    imageAlt: 'International booking workspace with parcels, freight and route planning',
    to: '/rate-calculator',
    cta: 'Try global rate calculator',
    tone: 'violet',
  },
  {
    tab: 'Shipping',
    title: 'Ship every market from one workspace',
    copy: 'Move parcels and cargo through a consistent process with chargeable-weight guidance, lane-level estimates and organised international milestones.',
    image: '/assets/punjabship-automated-shipping.jpg',
    imageAlt: 'Automated global parcel and freight sorting workspace',
    to: '/weight-calculator',
    cta: 'Estimate weight',
    tone: 'amber',
  },
  {
    tab: 'Live Tracking',
    title: 'See delivery progress without the guesswork',
    copy: 'Follow shipment events in one readable timeline and identify the latest carrier scan before customers need to ask for an update.',
    image: '/assets/punjabship-control-tower.jpg',
    imageAlt: 'Live logistics control tower with a global shipment map',
    to: '/tracking',
    cta: 'Track shipment',
    tone: 'cyan',
  },
]

function LiveDemos() {
  const [activeDemo, setActiveDemo] = useState(1)
  const demo = demoProducts[activeDemo]
  return (
    <section className="live-demos">
      <div className="demo-ambient" />
      <div className="shell">
        <div className="demo-heading">
          <span>PunjabShip PRODUCT EXPERIENCE</span>
          <h2>Experience smarter global shipping<br />through live tools</h2>
        </div>
        <div className="demo-tabs" role="tablist" aria-label="PunjabShip product demos">
          {demoProducts.map((item, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeDemo === index}
              className={activeDemo === index ? 'active' : ''}
              onClick={() => setActiveDemo(index)}
              key={item.tab}
            >
              {item.tab}
            </button>
          ))}
        </div>
        <article className={`demo-stage demo-${demo.tone}`} key={demo.tab}>
          <div className="demo-copy">
            <span className="demo-index">0{activeDemo + 1} / 03</span>
            <h3>{demo.title}</h3>
            <p>{demo.copy}</p>
            <Link className="button primary" to={demo.to}>{demo.cta} <ArrowRight size={17} /></Link>
          </div>
          <div className="demo-media">
            <img src={demo.image} alt={demo.imageAlt} loading="lazy" decoding="async" />
            <div className="demo-status">
              <CircleCheck />
              <span><small>PunjabShip workflow</small><strong>Ready to use</strong></span>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

const coreStrengths = [
  {
    metric: '50K+',
    title: 'growing businesses',
    copy: 'Global shipping with clearer operations',
    image: '/assets/punjabship-strength-businesses.jpg',
    alt: 'Connected ecommerce businesses growing through international shipping',
  },
  {
    metric: '220+',
    title: 'global destinations',
    copy: 'Regional and cross-border reach',
    image: '/assets/punjabship-strength-india.jpg',
    alt: 'International parcel and freight network connecting global destinations',
  },
  {
    metric: '220+',
    title: 'countries and territories',
    copy: 'International trade lanes connected',
    image: '/assets/punjabship-strength-global.jpg',
    alt: 'Global air and sea logistics routes surrounding a connected globe',
  },
  {
    metric: '100+',
    title: 'carrier options',
    copy: 'Flexible carriers for every lane',
    image: '/assets/punjabship-strength-couriers.jpg',
    alt: 'Multiple delivery vehicle options compared through one dashboard',
  },
  {
    metric: '99.2%',
    title: 'platform uptime',
    copy: 'Reliable tools when teams need them',
    image: '/assets/punjabship-strength-uptime.jpg',
    alt: 'Always-on logistics monitoring dashboard with healthy server status',
  },
]

function CoreStrengths() {
  const trackRef = useRef(null)
  const move = (direction) => {
    const card = trackRef.current?.querySelector('.strength-card')
    if (!trackRef.current || !card) return
    trackRef.current.scrollBy({ left: direction * (card.getBoundingClientRect().width + 28), behavior: 'smooth' })
  }
  return (
    <section className="core-strengths">
      <div className="strength-head">
        <h2>Our Core Strengths</h2>
        <div className="strength-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous strength"><ChevronLeft /></button>
          <button type="button" onClick={() => move(1)} aria-label="Next strength"><ChevronRight /></button>
        </div>
      </div>
      <div className="strength-track" ref={trackRef}>
        {coreStrengths.map((item) => (
          <article className="strength-card" key={item.metric}>
            <h3><strong>{item.metric}</strong> {item.title}</h3>
            <p>{item.copy}</p>
            <div className="strength-media">
              <img src={item.image} alt={item.alt} loading="lazy" decoding="async" />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

const courierPartners = [
  { name: 'AeroBridge', tone: 'blue' },
  { name: 'OceanLane', tone: 'navy' },
  { name: 'SkyPort', tone: 'electric' },
  { name: 'CargoWave', tone: 'teal' },
  { name: 'GlobeFreight', tone: 'indigo' },
  { name: 'TransContinental', tone: 'black' },
  { name: 'HarborLink', tone: 'royal' },
  { name: 'ExpressAxis', tone: 'coral' },
  { name: 'ParcelNova', tone: 'plum' },
  { name: 'RoadJet', tone: 'orange' },
  { name: 'AirRoute', tone: 'steel' },
  { name: 'CrossDock', tone: 'red' },
  { name: 'WorldMile', tone: 'amazon' },
]

const sellerStories = [
  {
    brand: 'Nordic Atlas',
    mark: 'ATLAS',
    quote: '“We now manage export bookings, freight handoffs and delivery updates from one command center.”',
    copy: 'PunjabShip helped this global lifestyle brand replace scattered carrier portals with one cross-border operating flow. Teams now move orders from warehouse to overseas delivery with fewer manual checks.',
    metric: '31%',
    metricLabel: 'faster export dispatch',
    visual: 'dispatch',
    icon: PackageCheck,
    tone: 'violet',
  },
  {
    brand: 'Meridian Supply',
    mark: 'MERIDIAN',
    quote: '“Lane-level choices made our air, road and ocean costs easier to forecast.”',
    copy: 'With chargeable-weight guidance and carrier comparisons, Meridian Supply plans every shipment around speed, customs readiness and landed cost without slowing fulfilment.',
    metric: '24%',
    metricLabel: 'lower lane exceptions',
    visual: 'routes',
    icon: Route,
    tone: 'amber',
  },
  {
    brand: 'Pacific & Co.',
    mark: 'PACIFIC',
    quote: '“Customers receive clearer international updates, even when multiple carriers are involved.”',
    copy: 'A single milestone view gives support teams the latest shipment context across countries, time zones and delivery partners before customers need to ask.',
    metric: '42%',
    metricLabel: 'fewer tracking tickets',
    visual: 'updates',
    icon: LocateFixed,
    tone: 'cyan',
  },
  {
    brand: 'Verde Global',
    mark: 'VERDE',
    quote: '“We can open new international lanes without rebuilding our fulfilment process.”',
    copy: 'PunjabShip gives Verde Global a repeatable booking flow for new regions while keeping parcel checks, documentation and route decisions easy for the operations team.',
    metric: '18K+',
    metricLabel: 'markets explored',
    visual: 'reach',
    icon: Globe2,
    tone: 'lime',
  },
  {
    brand: 'Astra Commerce',
    mark: 'ASTRA',
    quote: '“The same operations team now handles more international orders with far better visibility.”',
    copy: 'Organised milestones and fast landed-cost estimates let Astra Commerce spend less time reconciling systems and more time improving the global customer experience.',
    metric: '2.3x',
    metricLabel: 'shipments handled daily',
    visual: 'scale',
    icon: BarChart3,
    tone: 'pink',
  },
]

function SellerStories() {
  const [activeStory, setActiveStory] = useState(0)
  const story = sellerStories[activeStory]
  const StoryIcon = story.icon
  const marqueePartners = [...courierPartners, ...courierPartners]
  const reversePartners = [...courierPartners.slice(6), ...courierPartners.slice(0, 6), ...courierPartners]

  return (
    <section className="seller-stories">
      <div className="partner-cloud" aria-label="Global carrier network available through PunjabShip">
        <div className="partner-row">
          {marqueePartners.map((partner, index) => (
            <div className={`partner-logo partner-${partner.tone}`} key={`top-${partner.name}-${index}`}>
              <span>{partner.name}</span>
            </div>
          ))}
        </div>
        <div className="partner-row partner-row-reverse">
          {reversePartners.map((partner, index) => (
            <div className={`partner-logo partner-${partner.tone}`} key={`bottom-${partner.name}-${index}`}>
              <span>{partner.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="shell seller-shell">
        <h2>Global Shipping Case Studies</h2>
        <div className="seller-tabs" role="tablist" aria-label="Global shipping case studies">
          {sellerStories.map((item, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeStory === index}
              className={activeStory === index ? 'active' : ''}
              onClick={() => setActiveStory(index)}
              key={item.brand}
            >
              {item.brand}
            </button>
          ))}
        </div>

        <article className={`seller-story-card story-${story.tone}`} key={story.brand}>
          <div className="seller-story-copy">
            <span className="seller-mark">{story.mark}</span>
            <blockquote>{story.quote}</blockquote>
            <p>{story.copy}</p>
            <div className="seller-result">
              <strong>{story.metric}</strong>
              <span>{story.metricLabel}</span>
            </div>
          </div>
          <div className={`seller-story-visual story-product-art story-product-${story.visual}`} aria-label={`${story.brand} shipping workflow illustration`}>
            <div className="story-art-grid" />
            <div className="story-art-orbit orbit-a" />
            <div className="story-art-orbit orbit-b" />
            <span className="story-art-main"><StoryIcon /></span>
            <span className="story-art-brand">{story.mark}</span>
            <span className="story-art-node node-a"><PackageCheck /></span>
            <span className="story-art-node node-b"><Truck /></span>
            <span className="story-art-node node-c"><CircleCheck /></span>
            <div className="story-art-route"><i /><i /><i /><i /></div>
            <div className="story-status">
              <CircleCheck />
              <span><small>PunjabShip impact</small><strong>Global operations aligned</strong></span>
            </div>
            <div className="story-order-card">
              <small>Export dispatch</small>
              <strong>Ready for handoff</strong>
              <span><i /> 148 shipments processed</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

const servicesPortfolio = [
  {
    title: 'Worldwide Delivery',
    copy: 'Reach customers across regions and countries through one organised shipping flow. Compare courier, air, road and ocean options while keeping tracking updates easy to understand.',
    image: '/assets/punjabship-3d-logistics-hero.png',
    alt: 'Connected worldwide delivery network with air, sea and road movement',
    metric: '220+',
    metricLabel: 'global destinations',
    to: '/rate-calculator',
    cta: 'Plan a global shipment',
    icon: Truck,
    kind: 'illustration',
  },
  {
    title: 'Fulfilment Network',
    copy: 'Keep inventory, packing, documentation and dispatch moving as one connected operation. PunjabShip gives growing teams a clearer path from order confirmation to international handover.',
    image: '/assets/punjabship-fulfilment-network.jpg',
    alt: 'Automated fulfilment network with inventory and dispatch stations',
    metric: 'One flow',
    metricLabel: 'from shelf to border',
    to: '/integrations',
    cta: 'Explore fulfilment tools',
    icon: Warehouse,
    kind: 'illustration',
  },
  {
    title: 'Express Regional Movement',
    copy: 'Handle urgent regional and cross-border deliveries with a focused booking experience. Enter parcel details once, review the estimate and keep every handoff visible.',
    image: '/assets/punjabship-local-delivery.jpg',
    alt: 'Express regional delivery route with international handoff',
    metric: 'Priority',
    metricLabel: 'regional route planning',
    to: '/rate-calculator',
    cta: 'Estimate a priority route',
    icon: LocateFixed,
    kind: 'illustration',
  },
  {
    title: 'Cross-Border Growth',
    copy: 'Build a repeatable export workflow with customs-ready documentation, route guidance and shipment visibility. Move from the first overseas order to wider global reach with confidence.',
    image: '/assets/punjabship-cross-border.jpg',
    alt: 'Cross-border delivery network by air, sea and road',
    metric: '220+',
    metricLabel: 'countries and territories',
    to: '/integrations/courier-partners',
    cta: 'Explore international shipping',
    icon: Globe2,
    kind: 'illustration',
  },
  {
    title: 'Smooth Checkout',
    copy: 'Give global shoppers a faster path from cart to confirmed delivery. Clear shipping choices, duties context and fewer steps help brands build a dependable buying experience.',
    art: 'checkout',
    metric: 'Fewer steps',
    metricLabel: 'from cart to delivery',
    to: '/rate-calculator',
    cta: 'Try the rate experience',
    icon: ShoppingBag,
    kind: 'ui',
  },
  {
    title: 'Seller Connect',
    copy: 'Keep customers informed with useful shipment context across countries, carriers and time zones. A readable tracking journey helps support teams answer questions quickly after checkout.',
    art: 'connect',
    metric: 'Live status',
    metricLabel: 'across every border',
    to: '/tracking',
    cta: 'See live tracking',
    icon: Mail,
    kind: 'ui',
  },
]

function ServicesPortfolio() {
  return (
    <section className="services-portfolio">
      <div className="shell">
        <div className="portfolio-heading">
          <span className="section-label">THE PunjabShip PORTFOLIO</span>
          <h2>Our Services<br /><span>&amp; Solutions Portfolio</span></h2>
          <p>International logistics capabilities for every stage of a growing commerce journey.</p>
        </div>

        <div className="portfolio-list">
          {servicesPortfolio.map((service, index) => {
            const Icon = service.icon
            return (
              <article className={`portfolio-row ${index % 2 ? 'portfolio-reverse' : ''}`} key={service.title}>
                <div className="portfolio-copy">
                  <span className="portfolio-index">0{index + 1}</span>
                  <span className="portfolio-icon"><Icon /></span>
                  <h3>{service.title}</h3>
                  <p>{service.copy}</p>
                  <Link to={service.to}>{service.cta} <ArrowRight /></Link>
                </div>
                <div className={`portfolio-visual visual-${service.kind}`}>
                  <div className="portfolio-grid-lines" />
                  {service.image ? (
                    <img src={service.image} alt={service.alt} loading="lazy" decoding="async" />
                  ) : (
                    <div className={`portfolio-product-art product-art-${service.art}`} aria-hidden="true">
                      <div className="product-device">
                        <div className="product-device-head"><i /><i /><i /></div>
                        <span className="product-device-title" />
                        <div className="product-device-row"><i /><b /></div>
                        <div className="product-device-row"><i /><b /></div>
                        <div className="product-device-row"><i /><b /></div>
                        <span className="product-device-action" />
                      </div>
                      <span className="product-art-icon"><Icon /></span>
                      <span className="product-art-parcel"><Box /></span>
                      <div className="product-art-path"><i /><i /><i /></div>
                    </div>
                  )}
                  <div className="portfolio-metric">
                    <small>PunjabShip advantage</small>
                    <strong>{service.metric}</strong>
                    <span>{service.metricLabel}</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Home() {
  return <><Hero /><TrustRail /><RollingCards /><LiveDemos /><CoreStrengths /><SellerStories /><ServicesPortfolio /><Solutions /><Stats /><BusinessTypes /><DeveloperBand /><FinalCta /></>
}

const pageData = {
  services: {
    eyebrow: 'SHIPPING SOLUTIONS',
    title: 'Services for every global shipment',
    copy: 'From a regional parcel to international cargo, PunjabShip brings courier, freight, rates and tracking into one dependable platform.',
    icon: Truck,
    cards: solutionCards,
  },
  partners: {
    eyebrow: 'COURIER ECOSYSTEM',
    title: 'The right partner for every global route',
    copy: 'Choose on performance, coverage, speed, customs readiness and cost — without managing a different portal for every carrier.',
    icon: Route,
    cards: [
      ['Intelligent matching', 'Compare lane-level carrier fit before each booking.', Sparkles],
      ['Broad serviceability', 'Reach customers across metros, regions, ports and international destinations.', MapPin],
      ['SLA visibility', 'See delivery expectations and shipment milestones in one format.', Clock3],
      ['Exception support', 'Know what needs attention and move to the next action faster.', Headphones],
      ['Multi-mode global movement', 'Balance express, road, air cargo, ocean freight and last-mile options.', Plane],
      ['Secure operations', 'Consistent processes protect shipment and customer information.', ShieldCheck],
    ],
  },
  about: {
    eyebrow: 'ABOUT PunjabShip',
    title: 'Logistics built around growth',
    copy: 'We believe shipping should feel like momentum — not administration. PunjabShip makes every delivery decision clearer for brands shipping across India and the world.',
    icon: Building2,
    cards: [
      ['Clarity first', 'Simple rates, readable milestones and practical next actions.', LocateFixed],
      ['Built for reliability', 'Dependable workflows that keep operating as volume grows.', ShieldCheck],
      ['Human when it matters', 'Real support for the exceptions software cannot resolve alone.', Headphones],
      ['Always improving', 'Smarter decisions informed by route and performance data.', BarChart3],
      ['Customer obsessed', 'Every shipment is part of someone’s brand experience.', ShoppingBag],
      ['Growth minded', 'Tools and partnerships designed to remove the next constraint.', Zap],
    ],
  },
}

function InnerHero({ data }) {
  const Icon = data.icon
  return (
    <section className="inner-hero">
      <div className="inner-glow" />
      <div className="shell inner-grid">
        <div><span className="eyebrow"><Icon size={17} /> {data.eyebrow}</span><h1>{data.title}</h1><p>{data.copy}</p><div className="hero-actions"><Link className="button primary" to="/pricing">Get started <ArrowRight size={17} /></Link><Link className="button ghost" to="/contact">Talk to our team</Link></div></div>
        <div className="inner-art inner-product-art" aria-hidden="true"><span className="inner-product-core"><PackageCheck /></span><span className="inner-product-node node-a"><Truck /></span><span className="inner-product-node node-b"><Route /></span><span className="inner-product-node node-c"><CircleCheck /></span><div className="inner-status"><CircleCheck /><div><small>PunjabShip network</small><strong>Ready to deliver</strong></div></div></div>
      </div>
    </section>
  )
}

function StandardPage({ type }) {
  const data = pageData[type]
  return (
    <>
      <InnerHero data={data} />
      <section className="page-content"><div className="shell solution-grid">{data.cards.map(([title, copy, Icon], i) => <article className={`solution-card tone-${(i % 6) + 1}`} key={title}><span><Icon /></span><h3>{title}</h3><p>{copy}</p><Link to="/contact">Learn more <ArrowRight size={15} /></Link></article>)}</div></section>
      <Stats /><FinalCta />
    </>
  )
}

const explorePages = {
  integrations: {
    eyebrow: 'PunjabShip PLATFORM',
    title: 'Connect your commerce stack to one global shipping workflow.',
    copy: 'Sync orders from the places you sell and fulfil them through the carrier network that fits each domestic or international shipment.',
    icon: PlugZap,
    cards: [
      ['Sales Channels', 'Bring storefront and marketplace orders into one organised dispatch queue.', ShoppingBag, '/integrations/sales-channels', 'Explore channels'],
      ['Carrier Network', 'Compare coverage, speed, customs readiness and pricing across a flexible carrier network.', Truck, '/integrations/courier-partners', 'Explore carriers'],
    ],
  },
  salesChannels: {
    eyebrow: 'SALES CHANNEL INTEGRATIONS',
    title: 'All your orders. One place to ship.',
    copy: 'Connect the channels your customers already use, reduce repetitive order entry and keep fulfilment status aligned.',
    icon: ShoppingBag,
    cards: [
      ['Online storefronts', 'Connect popular hosted storefronts and pull ready-to-ship orders into PunjabShip.', Store],
      ['Marketplaces', 'Organise multi-market orders without switching between separate sales panels.', ShoppingBag],
      ['Social commerce', 'Turn social and conversational orders into a consistent shipping workflow.', Globe2],
      ['Custom websites', 'Connect a custom checkout or order system through secure APIs and webhooks.', Code2],
      ['OMS and ERP', 'Keep order, inventory and shipment events aligned with your operations stack.', Warehouse],
      ['Status synchronisation', 'Send AWB, pickup and delivery milestones back to the originating channel.', RefreshCcw],
    ],
  },
  courierPartners: {
    eyebrow: 'COURIER PARTNER NETWORK',
    title: 'Choose the right carrier partner for every parcel and lane.',
    copy: 'Use lane, shipment and service-level signals to select a carrier without being locked into a single network.',
    icon: Truck,
    cards: [
      ['Express delivery', 'Prioritise faster movement for time-sensitive business and customer orders.', Zap],
      ['Road freight', 'Balance cost and transit time for regional and cross-border road movement.', Truck],
      ['Air cargo', 'Move urgent and long-distance shipments through air-enabled services.', Plane],
      ['Worldwide coverage', 'Reach metros, regional hubs, ports and international destinations.', MapPin],
      ['Shipment security', 'Use scan-led milestones and consistent handover processes for better control.', ShieldCheck],
      ['Exception visibility', 'Identify stuck pickups and delayed movement while there is still time to act.', PackageSearch],
    ],
  },
  blogs: {
    eyebrow: 'PunjabShip RESOURCES',
    title: 'Practical ideas for faster, clearer global shipping.',
    copy: 'Guides for ecommerce teams that want to control shipping costs, choose carriers confidently and improve global customer experience.',
    icon: BookOpen,
    cards: [
      ['How to calculate volumetric weight correctly', 'Understand why parcel dimensions affect shipping charges and avoid billing surprises.', Scale, null, '6 min read'],
      ['A better way to compare carrier partners', 'Evaluate coverage, delivery speed, support, customs readiness and total cost before choosing a carrier.', Truck, null, '8 min read'],
      ['International rate calculation for growing stores', 'Learn which shipment details matter when estimating domestic and international charges.', BadgeIndianRupee, null, '7 min read'],
      ['Reduce failed deliveries with clearer tracking', 'Use useful milestone updates to keep customers informed before delivery day.', LocateFixed, null, '5 min read'],
      ['Preparing ecommerce orders for dispatch', 'Build a repeatable packing and handover checklist for busy fulfilment teams.', Box, null, '6 min read'],
      ['When to use road freight, air cargo or ocean freight', 'Compare cost, lane, distance and urgency to select the right transport mode.', Plane, null, '7 min read'],
    ],
  },
}

function ExplorePage({ type }) {
  const data = explorePages[type]
  const Icon = data.icon
  return (
    <>
      <section className="explore-hero">
        <div className="explore-glow" />
        <div className="shell explore-hero-grid">
          <div>
            <span className="eyebrow"><Icon size={17} /> {data.eyebrow}</span>
            <h1>{data.title}</h1>
            <p>{data.copy}</p>
            <div className="hero-actions">
              <Link className="button primary" to="/rate-calculator">Calculate global rate <ArrowRight size={17} /></Link>
              <Link className="button ghost" to="/tracking">Track a shipment</Link>
            </div>
          </div>
          <div className="explore-visual" aria-hidden="true">
            <div className="integration-orbit orbit-one" />
            <div className="integration-orbit orbit-two" />
            <span className="integration-core"><Icon /></span>
            <span className="integration-node node-store"><Store /></span>
            <span className="integration-node node-truck"><Truck /></span>
            <span className="integration-node node-box"><Box /></span>
            <span className="integration-node node-route"><Route /></span>
          </div>
        </div>
      </section>
      <section className={`explore-content ${type === 'integrations' ? 'compact-catalogue' : ''}`}>
        <div className="shell">
          <div className="explore-section-head">
            <span>{type === 'blogs' ? 'LATEST GUIDES' : 'BUILT FOR CONNECTED COMMERCE'}</span>
            <h2>{type === 'blogs' ? 'Make every global shipping decision count.' : 'Everything stays connected as you grow.'}</h2>
          </div>
          <div className="explore-card-grid">
            {data.cards.map(([title, copy, CardIcon, to, meta]) => {
              const cardContent = (
                <>
                  <span className="explore-card-icon"><CardIcon /></span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <span className="explore-card-action">{meta || (to ? 'Explore' : 'PunjabShip capability')} {to && <ArrowRight size={15} />}</span>
                </>
              )
              return to
                ? <Link className="explore-card" key={title} to={to}>{cardContent}</Link>
                : <article className="explore-card" key={title}>{cardContent}</article>
            })}
          </div>
        </div>
      </section>
      <FinalCta />
    </>
  )
}

function ToolIntro({ eyebrow, icon: Icon, title, copy, image, imageAlt, bullets }) {
  return (
    <div className="tool-intro">
      <span className="eyebrow"><Icon size={17} /> {eyebrow}</span>
      <h1>{title}</h1>
      <p>{copy}</p>
      <ul className="feature-list">
        {bullets.map(item => <li key={item}><Check /> {item}</li>)}
      </ul>
      <div className="tool-image"><img src={image} alt={imageAlt} decoding="async" /></div>
    </div>
  )
}

function WeightCalculator() {
  const [shipmentType, setShipmentType] = useState('domestic')
  const [result, setResult] = useState(null)
  const calculate = (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const length = Number(data.get('length'))
    const width = Number(data.get('width'))
    const height = Number(data.get('height'))
    const actual = Number(data.get('actual'))
    const divisor = shipmentType === 'domestic' ? 5000 : 6000
    const volumetric = (length * width * height) / divisor
    setResult({
      actual,
      volumetric,
      chargeable: Math.max(actual, volumetric),
      basis: volumetric > actual ? 'Volumetric weight' : 'Actual weight',
    })
  }
  return (
    <section className="tool-page weight-tool">
      <div className="tool-glow violet" />
      <div className="shell tool-layout">
        <ToolIntro
          eyebrow="WEIGHT CALCULATOR"
          icon={Scale}
          title="Find your chargeable weight."
          copy="Carriers compare a parcel’s actual weight with its volumetric weight. Enter the packed dimensions to know which value your shipment will be billed on."
          image="/assets/punjabship-weight-calculator.png"
          imageAlt="Parcel on a digital weighing scale with dimensional guides"
          bullets={['Domestic and international divisors', 'Volumetric weight calculated instantly', 'Clear chargeable-weight breakdown']}
        />
        <form className="calculator-card tool-card" onSubmit={calculate}>
          <div className="calc-head"><div><span>Package details</span><small>Use final packed dimensions in centimetres</small></div><Ruler /></div>
          <div className="mode-switch"><button type="button" className={shipmentType === 'domestic' ? 'active' : ''} onClick={() => setShipmentType('domestic')}>Domestic</button><button type="button" className={shipmentType === 'international' ? 'active' : ''} onClick={() => setShipmentType('international')}>International</button></div>
          <div className="dimension-grid">
            <label>Length (cm)<input name="length" required type="number" min="1" step=".1" placeholder="30" /></label>
            <label>Width (cm)<input name="width" required type="number" min="1" step=".1" placeholder="20" /></label>
            <label>Height (cm)<input name="height" required type="number" min="1" step=".1" placeholder="15" /></label>
          </div>
          <label>Actual weight (kg)<input name="actual" required type="number" min=".01" step=".01" placeholder="1.20" /></label>
          <div className="formula-note"><Scale /><span>Formula: L × W × H ÷ {shipmentType === 'domestic' ? '5,000' : '6,000'}</span></div>
          <button className="button primary full" type="submit">Calculate chargeable weight <ArrowRight size={17} /></button>
          {result && (
            <div className="weight-result result-panel">
              <div><span>Actual</span><strong>{result.actual.toFixed(2)} kg</strong></div>
              <div><span>Volumetric</span><strong>{result.volumetric.toFixed(2)} kg</strong></div>
              <div className="result-primary"><span>Chargeable · {result.basis}</span><strong>{result.chargeable.toFixed(2)} kg</strong></div>
            </div>
          )}
        </form>
      </div>
      <ToolSteps items={[['1', 'Measure the box', 'Use the longest point on each packed side.'], ['2', 'Enter actual weight', 'Include packaging, fillers and labels.'], ['3', 'Use the higher value', 'That becomes the chargeable weight.']]} />
    </section>
  )
}

function RateCalculator() {
  const [paymentMode, setPaymentMode] = useState('prepaid')
  const [serviceMode, setServiceMode] = useState('surface')
  const [result, setResult] = useState(null)
  const calculate = (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const pickup = String(data.get('pickup'))
    const delivery = String(data.get('delivery'))
    const weight = Math.max(.5, Number(data.get('weight')))
    const zone = pickup.slice(0, 2) === delivery.slice(0, 2) ? 1 : pickup[0] === delivery[0] ? 1.18 : 1.42
    const base = serviceMode === 'express' ? 62 : 42
    const perKg = serviceMode === 'express' ? 34 : 22
    const cod = paymentMode === 'cod' ? 35 : 0
    const rate = Math.round((base + Math.max(0, weight - .5) * perKg) * zone + cod)
    setResult({ rate, days: serviceMode === 'express' ? '1–3 days' : '3–6 days', zone: zone === 1 ? 'Local' : zone === 1.18 ? 'Regional' : 'National' })
  }
  return (
    <section className="tool-page rate-tool">
      <div className="tool-glow cyan" />
      <div className="shell tool-layout">
        <ToolIntro
          eyebrow="RATE CALCULATOR"
          icon={BadgeIndianRupee}
          title="Estimate your shipping rate."
          copy="Compare an indicative cost by route, chargeable weight, delivery speed and payment mode before you book."
          image="/assets/punjabship-rate-calculator.png"
          imageAlt="Delivery van, parcels and route markers representing a shipping rate"
          bullets={['Route-aware indicative pricing', 'Surface and express estimates', 'Prepaid and COD calculations']}
        />
        <form className="calculator-card tool-card" onSubmit={calculate}>
          <div className="calc-head"><div><span>Shipment route</span><small>Get an instant indicative quote</small></div><BadgeIndianRupee /></div>
          <div className="route-grid">
            <label>Pickup pincode<input name="pickup" required pattern="\d{6}" inputMode="numeric" placeholder="380015" /></label>
            <label>Delivery pincode<input name="delivery" required pattern="\d{6}" inputMode="numeric" placeholder="110001" /></label>
          </div>
          <label>Chargeable weight (kg)<input name="weight" required type="number" min=".1" step=".1" placeholder="0.5" /></label>
          <span className="field-caption">Delivery speed</span>
          <div className="mode-switch"><button type="button" className={serviceMode === 'surface' ? 'active' : ''} onClick={() => setServiceMode('surface')}>Surface</button><button type="button" className={serviceMode === 'express' ? 'active' : ''} onClick={() => setServiceMode('express')}>Express</button></div>
          <span className="field-caption">Payment mode</span>
          <div className="mode-switch"><button type="button" className={paymentMode === 'prepaid' ? 'active' : ''} onClick={() => setPaymentMode('prepaid')}>Prepaid</button><button type="button" className={paymentMode === 'cod' ? 'active' : ''} onClick={() => setPaymentMode('cod')}>Cash on delivery</button></div>
          <button className="button primary full" type="submit">Calculate global rate <ArrowRight size={17} /></button>
          {result && <div className="rate-result enhanced"><div><span>Estimated from</span><strong>₹{result.rate}</strong><small>+ applicable taxes</small></div><div><b>{result.days}</b><small>{result.zone} route · {serviceMode}</small></div></div>}
        </form>
      </div>
      <ToolSteps items={[['01', 'Add the route', 'Enter pickup and delivery postal codes for the lane.'], ['02', 'Choose the service', 'Balance economy movement with express speed.'], ['03', 'Review the estimate', 'Use the quote to plan shipment cost.']]} />
    </section>
  )
}

function ToolSteps({ items }) {
  return (
    <div className="shell tool-steps">
      {items.map(([number, title, copy]) => <article key={title}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}
    </div>
  )
}

function Tracking() {
  const [awb, setAwb] = useState('')
  const [searched, setSearched] = useState(false)
  const milestones = ['Order placed', 'Picked up', 'In transit', 'Out for delivery', 'Delivered']
  return (
    <section className="tool-page tracking-tool">
      <div className="tool-glow pink" />
      <div className="shell tracking-hero-grid">
        <div className="tracking-copy">
          <span className="eyebrow"><LocateFixed size={17} /> LIVE SHIPMENT VISIBILITY</span>
          <h1>Track every move, from pickup to doorstep.</h1>
          <p>Enter an AWB or order ID for a clear milestone view of your shipment’s latest journey.</p>
          <form className="tracking-search" onSubmit={(e) => { e.preventDefault(); if (awb.trim().length >= 6) setSearched(true) }}>
            <Search /><input value={awb} onChange={e => { setAwb(e.target.value); setSearched(false) }} minLength={6} required placeholder="Enter AWB or Order ID" /><button className="button primary">Track order <ArrowRight size={17} /></button>
          </form>
          <div className="tracking-assurance"><span><CircleCheck /> One clear timeline</span><span><CircleCheck /> Courier-wide visibility</span></div>
        </div>
        <div className="tracking-art"><img src="/assets/punjabship-tracking.png" alt="Smartphone, parcel and delivery van showing a shipment journey" decoding="async" /></div>
      </div>
      {searched && <div className="shell tracking-result live-result"><div className="track-head"><div><small>Shipment ID</small><strong>{awb.trim().toUpperCase()}</strong></div><span><Truck /> In transit</span></div><div className="shipment-meta"><div><small>Current location</small><b>Delhi sorting facility</b></div><div><small>Expected delivery</small><b>Tomorrow, by 8 PM</b></div><div><small>Service</small><b>PunjabShip Express</b></div></div><div className="timeline">{milestones.map((item, index) => <div className={index < 3 ? 'done' : ''} key={item}><i>{index < 3 ? <Check /> : index + 1}</i><span>{item}</span></div>)}</div><p>Preview status shown for this demo. Connect the live tracking API to display real courier events.</p></div>}
      <ToolSteps items={[['01', 'Enter your ID', 'Use the AWB or order ID shared at dispatch.'], ['02', 'Read the milestone', 'See the latest scan in a consistent timeline.'], ['03', 'Plan the next step', 'Know when to wait and when a shipment needs attention.']]} />
    </section>
  )
}

function Contact() {
  const [sent, setSent] = useState(false)
  return (
    <section className="form-page contact-page"><div className="shell form-grid">
      <div><span className="eyebrow"><Headphones size={17} /> LET’S TALK LOGISTICS</span><h1>Tell us what you need to move</h1><p>Share your shipment volume, routes or operational challenge. Our team will help map the right way forward.</p><div className="contact-lines"><a href="tel:+918487881121"><Phone /> +91 84878 81121</a><a href="mailto:info@punjabshiplogistics.com"><Mail /> info@punjabshiplogistics.com</a><span><MapPin /> SODHI ONLINE SERVICES, Near Verka Plant, Barnala Raikot Road, Mahal Kalan, Barnala, Punjab 148104</span></div></div>
      <form className="calculator-card" onSubmit={e => { e.preventDefault(); e.currentTarget.reset(); setSent(true) }}>
        <div className="calc-head"><div><span>Speak with an expert</span><small>We usually respond within one business day</small></div><Headphones /></div>
        <label>Your name<input required name="name" placeholder="Full name" /></label>
        <label>Work email<input required type="email" name="email" placeholder="you@company.com" /></label>
        <label>Phone number<input required name="phone" pattern="[0-9]{10}" placeholder="10-digit mobile number" /></label>
        <label>How can we help?<textarea name="message" rows="4" placeholder="Tell us about your shipping needs" /></label>
        <button className="button primary full" type="submit">Send enquiry <ArrowRight size={17} /></button>
        {sent && <div className="success-message"><CircleCheck /> Thanks — our team will contact you shortly.</div>}
      </form>
    </div></section>
  )
}

function FinalCta() {
  return (
    <section className="final-cta"><div className="shell"><div><span>READY WHEN YOU ARE</span><h2>Start shipping worldwide with more confidence.</h2><p>Know your chargeable weight, estimate global rates and track every delivery.</p></div><Link className="button dark-button" to="/rate-calculator">Calculate a rate <ArrowRight size={17} /></Link></div></section>
  )
}

function Footer() {
  return (
    <footer><div className="shell footer-grid compact"><div className="footer-brand"><img src="/assets/punjabship-logo.png" alt="PunjabShip Logistics" /><p>One focused logistics toolkit for every shipment — from packed weight to final delivery.</p><div className="socials"><a href="#" aria-label="LinkedIn"><Linkedin /></a><a href="#" aria-label="Instagram"><Instagram /></a></div></div><div><h4>Calculators</h4><Link to="/weight-calculator">Weight calculator</Link><Link to="/rate-calculator">Rate calculator</Link></div><div><h4>Shipment tools</h4><Link to="/tracking">Track a shipment</Link><Link to="/">Home</Link></div><div><h4>Contact</h4><a href="tel:+918487881121">+91 84878 81121</a><a href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</a><span>SODHI ONLINE SERVICES, Near Verka Plant, Barnala Raikot Road, Mahal Kalan, Barnala, Punjab 148104</span></div></div><div className="shell footer-bottom"><span>© 2026 PunjabShip Logistics Pvt. Ltd.</span><span>Privacy · Terms · Security</span></div></footer>
  )
}

export default function App() {
  return (
    <>
      <ScrollTop /><Header />
      <main>
        <Routes>
          <RouterRoute path="/" element={<Home />} />
          <RouterRoute path="/integrations" element={<ExplorePage type="integrations" />} />
          <RouterRoute path="/integrations/sales-channels" element={<ExplorePage type="salesChannels" />} />
          <RouterRoute path="/integrations/courier-partners" element={<ExplorePage type="courierPartners" />} />
          <RouterRoute path="/weight-calculator" element={<WeightCalculator />} />
          <RouterRoute path="/rate-calculator" element={<RateCalculator />} />
          <RouterRoute path="/blogs" element={<ExplorePage type="blogs" />} />
          <RouterRoute path="/tracking" element={<Tracking />} />
          <RouterRoute path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
