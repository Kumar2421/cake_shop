/** Content shapes for the bakingo.com homepage clone. */

export interface HeroSlide {
  image: string;
  alt: string;
  href: string;
}

export interface CategoryTile {
  label: string;
  href: string;
  image: string;
  alt: string;
}

export interface ProductCard {
  name: string;
  href: string;
  image: string;
  alt: string;
  /** Formatted with the rupee sign, e.g. "₹549". */
  price: string;
  /** e.g. "4.9" */
  rating: string;
  /** e.g. "8.8K" */
  reviews: string;
  /** Renders the green square veg/eggless mark on the image. */
  eggless: boolean;
}

/** The two-line heading every homepage section shares (`.heading-section`). */
export interface SectionHeading {
  /** Small red script line, e.g. "india loves". */
  eyebrow: string;
  subtitle: string;
}

export interface PromiseItem {
  image: string;
  alt: string;
  title: string;
  body: string;
}

export interface CtaContent {
  image: string;
  alt: string;
  texts: string[];
  href: string;
}

export interface SocialTile {
  image: string;
  alt: string;
  width: number;
  height: number;
}

export interface NavLink {
  label: string;
  href: string | null;
}

export interface NavColumn {
  heading: string;
  links: NavLink[];
}

export interface NavItem {
  label: string;
  href: string | null;
  /** Raw class list of the submenu list — "has-sub-submenu" | "no-sub-menu" | "". */
  submenuKind: string;
  columns: NavColumn[];
  /** Flattened links of the whole dropdown, in DOM order. */
  links: NavLink[];
}

export interface HeaderAction {
  label: string;
  href: string;
  icon: string;
  dropdown: NavLink[];
}

export interface HeaderContent {
  logo: string;
  locationLabel: string;
  searchPlaceholder: string;
  searchIcon: string;
  actions: HeaderAction[];
}

export interface FooterSocial {
  href: string;
  icon: string;
  /** facebook | instagram | twitter | linkedIn | youtube */
  name: string;
}

/** A weight option on a product detail page, e.g. "0.5 Kg" / "4 - 5 People". */
export interface WeightOption {
  label: string;
  serving: string;
}

/** A listing row joined with its detail page — the unit the dynamic routes render. */
export interface CatalogProduct {
  slug: string;
  /** URL segment between /p/ and the slug, e.g. "cake" or "theme-cake". */
  category: string;
  /** Route in this app, e.g. "/p/cake/choco-truffle-cake0005choc". */
  href: string;
  /** Path on the original site. */
  sourceHref: string;
  name: string;
  image: string;
  alt: string;
  gallery: string[];
  /** Formatted with the rupee sign, e.g. "₹649". */
  price: string;
  /** e.g. "(Inclusive of GST)". */
  priceNote: string;
  rating: string;
  reviews: string;
  eggless: boolean;
  /** Ribbon on the listing card, e.g. "Best Seller". */
  tag: string;
  sku: string;
  description: string;
  chefTitle: string;
  chefWord: string;
  weights: WeightOption[];
  servingInfoLabel: string;
  breadcrumbs: NavLink[];
  /** Slugs of the "You may also like" rail. */
  alsoLike: string[];
}

export interface ListingChip {
  label: string;
}

export interface QuickLinkGroup {
  heading: string;
  links: NavLink[];
}

export interface FooterColumn {
  heading: string;
  links: NavLink[];
}

export interface SeoLink {
  label: string;
  href: string | null;
}
