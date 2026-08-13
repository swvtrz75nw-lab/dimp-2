// NavbarNew.jsx — the updated chat top bar. Same behaviour and API as Navbar,
// but renders the "navbar-new" chrome variant (translucent glass bar + hairline,
// styled in NavbarNew.css). This is the version the Chat page uses by default.
import React from 'react';
import Navbar from './Navbar.jsx';
import './NavbarNew.css';

export default function NavbarNew(props) {
  return <Navbar {...props} variant="navbar-new" />;
}
