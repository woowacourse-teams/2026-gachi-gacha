import gachiGachaLogo from '@/assets/gachi-gacha-logo-display.png';

import {
  Brand,
  BrandLogo,
  Document,
  DraftNotice,
  EffectiveDate,
  ExternalLink,
  Header,
  HeaderContent,
  Introduction,
  Main,
  Page,
  SearchLink,
  Section,
  SectionTitle,
  SubsectionTitle,
  Table,
  TableScroll,
  Title,
} from './route.styles';

export function PrivacyRoute() {
  return (
    <Page>
      <Header>
        <HeaderContent>
          <Brand href="/search" aria-label="GachiGacha 지도 검색으로 이동">
            <BrandLogo src={gachiGachaLogo} alt="" aria-hidden="true" />
            <span>GachiGacha</span>
          </Brand>
          <SearchLink href="/search">지도 검색으로 이동</SearchLink>
        </HeaderContent>
      </Header>

      <Main>
        <Document>
          <Title>가치가챠 개인정보처리방침</Title>
          <Introduction>
            가치가챠 운영팀(이하 “운영팀”)은 이용자의 개인정보를 중요하게
            생각하며, 개인정보 보호법 등 관계 법령을 준수하기 위해 다음과 같이
            개인정보처리방침을 공개합니다.
          </Introduction>
          <EffectiveDate>최초 제정일 및 시행일: 2026년 9월 25일</EffectiveDate>

          {__APP_ENV__ !== 'production' && (
            <DraftNotice>
              현재 개발 환경에서 검토 중인 방침입니다. 정식 운영 전 전용 문의
              이메일, 회원 탈퇴 절차, 로그·분석 데이터 보유기간과 수탁업체
              설정을 운영팀이 최종 확인해야 합니다.
            </DraftNotice>
          )}

          <Section>
            <SectionTitle>1. 처리하는 개인정보</SectionTitle>
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>처리 항목</th>
                    <th>수집 방법</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>카카오 로그인</th>
                    <td>카카오 회원 식별값, 닉네임, 프로필 이미지</td>
                    <td>카카오 OAuth 로그인 과정</td>
                  </tr>
                  <tr>
                    <th>네이버 로그인</th>
                    <td>네이버 회원 식별값, 이름, 닉네임, 프로필 이미지</td>
                    <td>네이버 OAuth 로그인 과정</td>
                  </tr>
                  <tr>
                    <th>회원 설정</th>
                    <td>닉네임, 프로필 이미지, 선호 거래 지역</td>
                    <td>회원이 직접 입력하거나 수정</td>
                  </tr>
                  <tr>
                    <th>교환 및 채팅</th>
                    <td>
                      교환글 제목·설명·희망 상품·구매처·거래 장소·가능
                      시간·사진, 채팅 내용·이미지·파일과 전송 시각
                    </td>
                    <td>해당 기능 이용 시 회원이 직접 입력</td>
                  </tr>
                  <tr>
                    <th>자동 생성 정보</th>
                    <td>
                      접속 기록, IP 주소, 브라우저·기기 정보, 페이지 방문·클릭,
                      오류 및 기능 이용 기록, PostHog 익명 식별값과 세션
                      리플레이
                    </td>
                    <td>서비스 이용 과정에서 자동 생성</td>
                  </tr>
                  <tr>
                    <th>인증 정보</th>
                    <td>서버 세션 쿠키, GachiGacha access token</td>
                    <td>로그인 과정에서 생성</td>
                  </tr>
                </tbody>
              </Table>
            </TableScroll>
            <p>
              현재 소셜 로그인에서 이메일과 비밀번호를 직접 요청하거나 저장하지
              않습니다. 소셜 제공자의 토큰은 로그인 처리에 사용하며 회원 프로필
              정보로 별도 노출하지 않습니다.
            </p>
          </Section>

          <Section>
            <SectionTitle>2. 개인정보 이용 목적</SectionTitle>
            <ul>
              <li>회원 식별과 카카오·네이버 소셜 로그인 제공</li>
              <li>회원 프로필과 선호 거래 지역 관리</li>
              <li>가챠 매장·상품 검색과 맞춤형 서비스 제공</li>
              <li>교환글, 이미지 업로드, 채팅 등 회원 기능 제공</li>
              <li>부정 이용 방지, 보안 유지, 오류 확인과 서비스 개선</li>
              <li>이용 현황 분석과 사용자 경험 개선</li>
              <li>개인정보 관련 문의 및 이용자 권리 요청 처리</li>
            </ul>
          </Section>

          <Section>
            <SectionTitle>3. 개인정보 보유 및 이용기간</SectionTitle>
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>정보</th>
                    <th>보유기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>회원정보</th>
                    <td>회원 탈퇴 처리 시까지</td>
                  </tr>
                  <tr>
                    <th>교환글·사진</th>
                    <td>회원이 삭제하거나 회원 탈퇴를 처리할 때까지</td>
                  </tr>
                  <tr>
                    <th>채팅 내용·파일</th>
                    <td>
                      채팅 서비스 제공 기간 또는 회원의 삭제·탈퇴 요청을 처리할
                      때까지. 분쟁 대응이 필요한 경우 해당 목적 달성 시까지
                    </td>
                  </tr>
                  <tr>
                    <th>브라우저 access token</th>
                    <td>토큰 만료, 로그아웃 또는 브라우저 탭 종료 시까지</td>
                  </tr>
                  <tr>
                    <th>접속·오류 기록</th>
                    <td>수집일로부터 최대 3개월</td>
                  </tr>
                  <tr>
                    <th>PostHog 분석 정보</th>
                    <td>수집일로부터 최대 12개월</td>
                  </tr>
                </tbody>
              </Table>
            </TableScroll>
            <p>
              관계 법령에 따라 보존해야 하는 정보가 있거나 분쟁 처리가 진행 중인
              경우에는 필요한 범위에서 해당 기간 동안 분리하여 보관할 수
              있습니다.
            </p>
          </Section>

          <Section>
            <SectionTitle>4. 개인정보의 제3자 제공</SectionTitle>
            <p>
              운영팀은 이용자의 개인정보를 원칙적으로 제3자에게 제공하지
              않습니다. 법령에 근거가 있거나 이용자가 별도로 동의한 경우에만
              필요한 범위에서 제공합니다.
            </p>
          </Section>

          <Section>
            <SectionTitle>5. 개인정보 처리 위탁</SectionTitle>
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <th>수탁업체</th>
                    <th>위탁 업무</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Amazon Web Services, Inc.</th>
                    <td>교환글 및 채팅 파일·이미지 저장(S3)</td>
                  </tr>
                  <tr>
                    <th>PostHog, Inc.</th>
                    <td>서비스 이용 분석, 오류 확인 및 세션 리플레이</td>
                  </tr>
                </tbody>
              </Table>
            </TableScroll>
            <p>
              운영팀은 수탁업체가 개인정보를 안전하게 처리하도록 필요한 사항을
              확인하고 관리합니다.
            </p>
          </Section>

          <Section>
            <SectionTitle>6. 개인정보의 국외 이전</SectionTitle>
            <p>
              PostHog를 통한 서비스 분석 과정에서 정보가 국외로 이전될 수
              있습니다.
            </p>
            <TableScroll>
              <Table>
                <tbody>
                  <tr>
                    <th>이전받는 자</th>
                    <td>PostHog, Inc.</td>
                  </tr>
                  <tr>
                    <th>이전 항목</th>
                    <td>
                      익명 식별값, 이용 이벤트, 접속 기록, 기기·브라우저 정보,
                      마스킹된 세션 리플레이
                    </td>
                  </tr>
                  <tr>
                    <th>목적</th>
                    <td>서비스 이용 분석, 오류 확인 및 품질 개선</td>
                  </tr>
                  <tr>
                    <th>국가·시기·방법</th>
                    <td>미국, 서비스 이용 중 암호화된 통신을 통한 수시 전송</td>
                  </tr>
                  <tr>
                    <th>보유기간</th>
                    <td>수집일로부터 최대 12개월</td>
                  </tr>
                </tbody>
              </Table>
            </TableScroll>
            <p>
              이용자는 아래 문의 창구를 통해 분석 정보 처리정지를 요청할 수
              있습니다. 처리를 거부하더라도 지도 검색 등 핵심 기능은 이용할 수
              있습니다.
            </p>
          </Section>

          <Section>
            <SectionTitle>7. 개인정보 파기</SectionTitle>
            <p>
              보유기간이 끝나거나 처리 목적이 달성되면 관계 법령에 따라 보관해야
              하는 경우를 제외하고 지체 없이 삭제합니다. 전자 파일은 복구하기
              어려운 방법으로 삭제하고, 출력물이 있는 경우 분쇄하거나
              소각합니다.
            </p>
          </Section>

          <Section>
            <SectionTitle>8. 쿠키와 브라우저 저장소</SectionTitle>
            <ul>
              <li>
                OAuth 로그인 요청 검증을 위해 서버 세션 쿠키를 사용할 수
                있습니다.
              </li>
              <li>
                현재 access token은 탭 단위 sessionStorage에 저장되며 로그아웃
                또는 탭 종료 시 삭제됩니다.
              </li>
              <li>
                PostHog는 방문·클릭 이벤트와 세션 리플레이를 위해 쿠키 및
                브라우저 저장소를 사용할 수 있습니다. 모든 입력값은
                마스킹합니다.
              </li>
            </ul>
            <p>
              이용자는 브라우저 설정에서 쿠키와 저장소를 삭제하거나 차단할 수
              있습니다. 필수 쿠키를 차단하면 로그인 등 일부 기능이 제한될 수
              있습니다.
            </p>
          </Section>

          <Section>
            <SectionTitle>9. 이용자의 권리와 행사 방법</SectionTitle>
            <p>
              이용자는 개인정보의 열람·정정·삭제·처리정지 및 동의 철회를 요청할
              수 있습니다. 현재 개발 단계의 요청은 가치가챠 GitHub 문의 창구를
              통해 접수하며, 운영팀은 본인 여부를 확인한 뒤 관계 법령에 따라
              처리합니다.
            </p>
            <p>
              문의 및 요청:{' '}
              <ExternalLink
                href="https://github.com/woowacourse-teams/2026-gachi-gacha/issues"
                target="_blank"
                rel="noreferrer"
              >
                가치가챠 GitHub Issues
              </ExternalLink>
            </p>
          </Section>

          <Section>
            <SectionTitle>10. 만 14세 미만 이용자</SectionTitle>
            <p>
              현재 가치가챠는 이용자의 연령을 별도로 수집하거나 확인하는 기능을
              제공하지 않습니다. 만 14세 미만 이용자는 법정대리인의 동의 없이
              회원 기능을 이용하지 않아야 하며, 운영팀이 만 14세 미만 이용자의
              개인정보가 수집된 사실을 알게 되면 확인 후 지체 없이 필요한 조치를
              합니다.
            </p>
          </Section>

          <Section>
            <SectionTitle>11. 안전성 확보조치</SectionTitle>
            <ul>
              <li>HTTPS를 통한 암호화 통신</li>
              <li>접근 권한 최소화와 인증 정보 보호</li>
              <li>입력값 마스킹 등 세션 리플레이 개인정보 보호 설정</li>
              <li>오류·접속 기록 점검과 보안 취약점 개선</li>
              <li>업로드 파일 접근과 저장소 권한 관리</li>
            </ul>
          </Section>

          <Section>
            <SectionTitle>12. 개인정보 보호 문의</SectionTitle>
            <p>담당: 가치가챠 운영팀</p>
            <p>
              문의:{' '}
              <ExternalLink
                href="https://github.com/woowacourse-teams/2026-gachi-gacha/issues"
                target="_blank"
                rel="noreferrer"
              >
                가치가챠 GitHub Issues
              </ExternalLink>
            </p>
            <p>
              정식 서비스 공개 전 별도의 개인정보 문의 이메일을 확정하여 이
              방침에 추가합니다.
            </p>
          </Section>

          <Section>
            <SectionTitle>13. 권익침해 구제</SectionTitle>
            <ul>
              <li>
                개인정보침해신고센터: 국번 없이 118,{' '}
                <ExternalLink
                  href="https://privacy.kisa.or.kr"
                  target="_blank"
                  rel="noreferrer"
                >
                  privacy.kisa.or.kr
                </ExternalLink>
              </li>
              <li>
                개인정보분쟁조정위원회: 1833-6972,{' '}
                <ExternalLink
                  href="https://www.kopico.go.kr"
                  target="_blank"
                  rel="noreferrer"
                >
                  kopico.go.kr
                </ExternalLink>
              </li>
              <li>
                경찰청: 국번 없이 182,{' '}
                <ExternalLink
                  href="https://ecrm.police.go.kr"
                  target="_blank"
                  rel="noreferrer"
                >
                  ecrm.police.go.kr
                </ExternalLink>
              </li>
            </ul>
          </Section>

          <Section>
            <SectionTitle>14. 처리방침 변경</SectionTitle>
            <p>
              처리방침을 변경할 때에는 시행 전에 서비스 공지 또는 이 페이지를
              통해 변경 내용과 시행일을 안내합니다.
            </p>
            <SubsectionTitle>변경 이력</SubsectionTitle>
            <ul>
              <li>2026년 9월 25일: 최초 제정</li>
            </ul>
          </Section>
        </Document>
      </Main>
    </Page>
  );
}
