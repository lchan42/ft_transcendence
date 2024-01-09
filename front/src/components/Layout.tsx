import React, { ReactNode } from 'react';
import NavBar from './NavBar';
import Footer from './Footer';

type LayoutProps = {
  children: ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div id="mainContainer">
      <NavBar />
      <div id="pageContent">
        {children}
      </div>
      <Footer />
    </div>
  );
};


export default Layout;
