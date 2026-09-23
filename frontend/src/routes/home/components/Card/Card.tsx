import styled from '@emotion/styled';

export interface CardProps {
  imageUrl: string;
  name: string;
}

export default function Card(props: CardProps) {
  return (
    <Wrapper>
      <Thumbnail src={props.imageUrl} alt="" />
      <Name>{props.name}</Name>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  max-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Thumbnail = styled.img`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  object-fit: cover;
  background: #faf7f8;
`;

const Name = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #2b2528;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
