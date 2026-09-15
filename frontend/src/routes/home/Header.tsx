import styled from '@emotion/styled';

import Logo from './Logo';

export default function Header() {
  return (
    <Wrapper>
      <Logo />

      <Nav>
        <NavItem>찾기</NavItem>
        <NavItem>지도</NavItem>
        <NavItem>중고거래</NavItem>
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

const NavItem = styled.p`
  margin: 0;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 400;
  color: #6f6469;
  cursor: pointer;

  &:first-of-type {
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
