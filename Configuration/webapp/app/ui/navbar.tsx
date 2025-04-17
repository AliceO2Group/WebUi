import {NavLink} from "react-router";
import type {NavLinkProps} from "react-router";

const StyledNavLink = ({children, className: _, ...props}: NavLinkProps) => {
    return <NavLink
        {...props}
        className={({isActive}) => `btn btn-tab ${isActive ? 'selected' : ''}`}
    >{children}</NavLink>
}

export const Navbar = () => {
    return <nav className={'flex-row justify-between items-center p2 shadow-level2 level2 bg-gray-light'}>
        <span className={'f4 gray-darker'}>Bookkeeping light</span>
        <div className={'btn-group'}>
            <StyledNavLink to={'/'}>Home</StyledNavLink>
            <StyledNavLink className={'btnStyledNav btn-tab'} to={'/runs'}>Runs</StyledNavLink>
        </div>
        <div>
        </div>
    </nav>
}
