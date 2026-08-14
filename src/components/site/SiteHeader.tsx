"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { headerContent, navItems } from "@/data/header";
import {
  BakingoLogo,
  SearchIcon,
  CartIcon,
  UserIcon,
  TrackOrderIcon,
} from "@/components/icons";
import { useCart } from "@/lib/cart";
import { AuthMenu } from "@/components/auth/AuthMenu";

/** Export header heights for page layout offset */
export const HEADER_HEIGHT_EXPANDED = 128;
export const HEADER_HEIGHT_COLLAPSED = 74;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { count: cartCount } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerHeight = scrolled
    ? `${HEADER_HEIGHT_COLLAPSED}px`
    : `${HEADER_HEIGHT_EXPANDED}px`;
  const menuHeight = scrolled ? "0px" : "54px";

  return (
    <header
      className="bk-header fixed top-0 z-[99] w-full bg-[#fc0015] flex flex-col transition-all duration-300"
      style={{ height: headerHeight }}
    >
      {/* Desktop Header Container */}
      <div className="header-container hidden md:flex mx-[72px] h-[74px] items-center">
        {/* Logo */}
        <div className="section-one w-[135px] h-[40px] flex items-center gap-[10px] relative">
          <Link href="/" className="flex items-center justify-center w-full h-full">
            <BakingoLogo width={135} height={40} />
          </Link>
        </div>

        {/* Location Container */}
        <div className="location-container-desktop ml-[33px] h-[26px] flex items-center cursor-pointer">
          <svg
            width="14"
            height="17"
            viewBox="0 0 14 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <path
              d="M7 0C4.239 0 2 2.239 2 5c0 2.761 5 12 5 12s5-9.239 5-12c0-2.761-2.239-5-5-5zm0 7.5c-.825 0-1.5-.675-1.5-1.5S6.175 3.5 7 3.5s1.5.675 1.5 1.5-.675 1.5-1.5 1.5z"
              fill="white"
            />
          </svg>
          <span className="location-text text-[18px] font-[600] text-white capitalize mx-[6px] ml-[8px] h-[26px] whitespace-nowrap overflow-hidden">
            {headerContent.locationLabel}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white mt-[3px]"
          >
            <path
              d="M1.5 4.5L6 9l4.5-4.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Right Section */}
        <div className="header-section-two ml-auto h-[49px] flex items-center gap-[46px]">
          {/* Search Bar */}
          <div className="desktop-search w-[410px] h-[42px] bg-white rounded-[6px] pr-[10px] flex items-center relative">
            <SearchIcon width={17} height={17} />
            <input
              type="text"
              className="search-input w-[344px] h-[36px] bg-white text-[14px] font-[600] text-[#070707] placeholder:text-[#070707] placeholder:capitalize outline-none ml-[20px] mr-[17px]"
              placeholder={headerContent.searchPlaceholder}
            />
          </div>

          {/* Profile Actions */}
          <div className="profile-container h-[49px] flex items-center justify-around gap-[26px]">
            {headerContent.actions.map((action, idx) => {
              // Skip Login/Signup — it's rendered by AuthMenu below
              if (action.label === "Login/Signup") {
                return null;
              }

              const wrapperClass =
                "flex flex-col items-center text-white h-[49px] group relative cursor-pointer";
              const body = (
                <>
                  {action.label === "Track Order" && (
                    <TrackOrderIcon width={26} height={28} />
                  )}
                  {action.label === "Cart" && (
                    <span className="relative">
                      <CartIcon width={30} height={28} />
                      {cartCount > 0 ? (
                        <span className="absolute -top-[6px] -right-[8px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-[4px] text-[11px] font-bold text-[#fc0015]">
                          {cartCount}
                        </span>
                      ) : null}
                    </span>
                  )}
                  <span className="profileTitle text-[12px] font-[600] leading-[17px] text-white text-center mt-[4px] h-[17px]">
                    {action.label}
                  </span>
                </>
              );

              // An action that owns a dropdown cannot be an <a>: the panel contains
              // links, and nested anchors are invalid HTML — the browser reparents
              // them, so the client tree stops matching the server tree.
              if (action.dropdown.length > 0) {
                return (
                  <div key={idx} className={wrapperClass}>
                    {body}
                    <div className="subnav-content absolute top-[calc(100%+8px)] left-1/2 transform -translate-x-1/2 bg-[#fff2e9] rounded-b-[7px] shadow-[rgba(0,0,0,0.25)_1px_6px_11px_2px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 z-[99999] py-[8px]">
                      <ul className="flex flex-col whitespace-nowrap">
                        {action.dropdown.map((item, i) => (
                          <li key={i}>
                            <Link
                              href={item.href || "#"}
                              className="block px-[16px] py-[8px] text-[13px] font-[600] text-[#070707] hover:text-[#ff7f7d] transition-colors duration-200"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              }

              return (
                <Link key={idx} href={action.href || "#"} className={wrapperClass}>
                  {body}
                </Link>
              );
            })}
            {/* Resolves its own session client-side so these pages stay static. */}
            <AuthMenu />
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden h-[56px] flex items-center justify-between px-[16px] bg-[#fc0015]">
        <Link href="/" className="flex items-center">
          <BakingoLogo width={100} height={30} />
        </Link>
        <div className="flex items-center gap-[16px]">
          <button className="p-[8px]">
            <SearchIcon width={20} height={20} />
          </button>
          <Link href="/cart" className="p-[8px]">
            <CartIcon width={20} height={20} />
          </Link>
          <Link href="#" className="p-[8px]">
            <UserIcon width={20} height={20} />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-[8px] flex flex-col gap-[4px]"
          >
            <span className="w-[20px] h-[2px] bg-white block"></span>
            <span className="w-[20px] h-[2px] bg-white block"></span>
            <span className="w-[20px] h-[2px] bg-white block"></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#f0f0f0] max-h-[calc(100vh-56px)] overflow-y-auto">
          {navItems.map((item, idx) => (
            <div key={idx} className="border-b border-[#f0f0f0]">
              {item.href ? (
                <Link
                  href={item.href}
                  className="block px-[16px] py-[12px] text-[14px] font-[600] text-[#070707]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <div className="px-[16px] py-[12px] text-[14px] font-[600] text-[#070707]">
                  {item.label}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Navigation Menu Container */}
      <nav
        className="menu-container w-full bg-white flex justify-center shadow-[rgba(0,0,0,0.25)_0px_4px_4px_0px] relative overflow-hidden transition-all duration-300 hidden md:flex"
        style={{ height: menuHeight }}
      >
        <div className="navbar-menu-container w-[1296px] h-[54px] flex justify-center items-center gap-[30px]">
          {navItems.map((item, idx) => (
            <div
              key={idx}
              className="subnav group h-[54px] flex justify-center items-center relative"
            >
              {/* Nav Button */}
              <div className="subnavbtn py-[8px] px-[2px] flex flex-col items-center cursor-pointer">
                <div className="category-title text-[18px] font-[600] text-[#070707] capitalize h-[26px] flex whitespace-nowrap group-hover:text-[#fc0015] transition-colors duration-300">
                  {item.label}
                </div>
                <div className="category-underline absolute bottom-[2px] h-[3px] w-full bg-[#fc0015] rounded-[12px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>

              {/* Dropdown Panel */}
              {item.columns && item.columns.length > 0 && (
                <div className="subnav-content absolute top-[calc(100%-1px)] left-1/2 transform -translate-x-1/2 bg-[#fff2e9] z-[99999] rounded-b-[7px] shadow-[rgba(0,0,0,0.25)_1px_6px_11px_2px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300 py-[16px] px-[24px]">
                  <ul className="submenu-list flex gap-[40px]">
                    {item.columns.map((column, colIdx) => (
                      <li key={colIdx} className="submenu-second-column flex flex-col gap-[12px]">
                        {/* Column Heading */}
                        <h4 className="text-[14px] font-[700] text-[#070707]">
                          {column.heading}
                        </h4>
                        {/* Column Links */}
                        <ul className="child-content flex flex-col gap-[8px]">
                          {column.links.map((link, linkIdx) => (
                            <li key={linkIdx}>
                              <Link
                                href={link.href || "#"}
                                className="text-[13px] font-[600] letter-spacing-[0.25px] text-[#070707] whitespace-nowrap hover:text-[#ff7f7d] transition-colors duration-200"
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
}
