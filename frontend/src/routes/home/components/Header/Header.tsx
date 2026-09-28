import styled from '@emotion/styled';

import Logo from '../Logo';

const NAV_ITEMS = ['찾기', '지도', '중고거래'] as const;

export type HeaderNavItem = (typeof NAV_ITEMS)[number];

interface HeaderProps {
  activeItem?: HeaderNavItem;
}

export default function Header({ activeItem = '찾기' }: HeaderProps) {
  return (
    <Wrapper>
      <Logo />

      <Nav aria-label="주요 메뉴">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item} type="button" data-active={item === activeItem}>
            {item}
          </NavItem>
        ))}
      </Nav>

      <AuthGroup>
        <LoginButton type="button">로그인</LoginButton>
        <SignupButton type="button">회원가입</SignupButton>
      </AuthGroup>
    </Wrapper>
  );
}

const Wrapper = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px;
  border-bottom: 1px solid #eeeaec;
  background: #ffffff;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const NavItem = styled.button`
  padding: 8px 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  font-size: 15px;
  font-weight: 400;
  color: #6f6469;
  cursor: pointer;

  &[data-active='true'] {
    background: #ed174c;
    color: white;
    font-weight: 700;
  }
`;

const AuthGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LoginButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #eeeaec;
  border-radius: 999px;
  background: #ffffff;
  color: #2b2528;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
`;

const SignupButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 999px;
  background: #ed174c;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
`;
